'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Save, ChevronRight, Loader2, Shield, Activity } from 'lucide-react'

export default function AdminResultadosPage() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [jornadas, setJornadas] = useState<number[]>([])
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number>(1)
  
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any>(null)
  const [jugadoresLocal, setJugadoresLocal] = useState<any[]>([])
  const [jugadoresVisita, setJugadoresVisita] = useState<any[]>([])
  
  const [golesLocal, setGolesLocal] = useState(0)
  const [golesVisita, setGolesVisita] = useState(0)
  const [golesShootoutLocal, setGolesShootoutLocal] = useState(0)
  const [golesShootoutVisita, setGolesShootoutVisita] = useState(0)

  const [porteroLocalId, setPorteroLocalId] = useState<string>('')
  const [porteroVisitaId, setPorteroVisitaId] = useState<string>('')

  const [stats, setStats] = useState<Record<string, any>>({})
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email !== 'garcca29@gmail.com') router.push('/')
      else fetchPartidosPendientes()
    }
    checkAdmin()
  }, [router])

  const fetchPartidosPendientes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('partidos')
      .select('*, local:equipo_local_id(id, nombre, escudo_url), visita:equipo_visita_id(id, nombre, escudo_url)')
      .eq('jugado', false)
      .order('jornada', { ascending: true })
    
    if (data && data.length > 0) {
      setPartidos(data)
      const jorUnicas = Array.from(new Set(data.map(p => p.jornada))).sort((a, b) => a - b)
      setJornadas(jorUnicas)
      if (!jorUnicas.includes(jornadaSeleccionada)) setJornadaSeleccionada(jorUnicas[0])
    } else {
      setPartidos([])
      setJornadas([])
    }
    setLoading(false)
  }

  const seleccionarPartido = async (p: any) => {
    setPartidoSeleccionado(p)
    setGolesLocal(0)
    setGolesVisita(0)
    setGolesShootoutLocal(0)
    setGolesShootoutVisita(0)
    setStats({})

    const { data: jLocal } = await supabase.from('jugadores').select('*').eq('id_equipo', p.local.id).order('nombre')
    const { data: jVisita } = await supabase.from('jugadores').select('*').eq('id_equipo', p.visita.id).order('nombre')
    
    setJugadoresLocal(jLocal || [])
    setJugadoresVisita(jVisita || [])

    const { data: alLocal } = await supabase.from('alineaciones').select('portero_id').eq('partido_id', p.id).eq('equipo_id', p.local.id).maybeSingle()
    const { data: alVisita } = await supabase.from('alineaciones').select('portero_id').eq('partido_id', p.id).eq('equipo_id', p.visita.id).maybeSingle()

    const gkLocalDefault = alLocal?.portero_id || jLocal?.find(j => j.posicion?.toUpperCase().includes('POR') || j.posicion?.toUpperCase().includes('GK'))?.id || ''
    const gkVisitaDefault = alVisita?.portero_id || jVisita?.find(j => j.posicion?.toUpperCase().includes('POR') || j.posicion?.toUpperCase().includes('GK'))?.id || ''

    setPorteroLocalId(gkLocalDefault)
    setPorteroVisitaId(gkVisitaDefault)
  }

  const handleStatChange = (jugadorId: string, campo: string, valor: string) => {
    setStats(prev => ({ ...prev, [jugadorId]: { ...prev[jugadorId], [campo]: parseFloat(valor) || 0 } }))
  }

  const handleGuardar = async () => {
    if (golesLocal === golesVisita && golesShootoutLocal === golesShootoutVisita) {
      alert('⚠️ Empate en regular. ¡Define los Shootouts!')
      return
    }
    if (!confirm('¿Cerrar partido? Se aplicarán Goles, Apuestas y SANCIONES automáticamente.')) return
    
    setGuardando(true)

    try {
      // 1. GUARDAR MARCADOR
      await supabase.from('partidos').update({
        jugado: true,
        goles_local: golesLocal,
        goles_visita: golesVisita,
        goles_shootout_local: golesLocal === golesVisita ? golesShootoutLocal : 0,
        goles_shootout_visita: golesLocal === golesVisita ? golesShootoutVisita : 0
      }).eq('id', partidoSeleccionado.id)

      // 2. PROCESAR ESTADÍSTICAS Y SANCIONES (TRIBUNAL)
      const todasLasStats: any[] = []
      const todosLosJugadores = [...jugadoresLocal, ...jugadoresVisita]

      for (const j of todosLosJugadores) {
        const jStat = stats[j.id] || {}
        const amarillasHoy = jStat.amarillas || 0
        const azulesHoy = jStat.azules || 0
        
        let recibidos = 0
        if (j.id === porteroLocalId) recibidos = golesVisita 
        if (j.id === porteroVisitaId) recibidos = golesLocal 

        // Si hizo algo, lo metemos a la tabla de stats
        if (jStat.goles > 0 || jStat.asistencias > 0 || amarillasHoy > 0 || azulesHoy > 0 || jStat.calificacion > 0 || recibidos > 0) {
          todasLasStats.push({
            partido_id: partidoSeleccionado.id,
            jugador_id: j.id,
            equipo_id: j.id_equipo,
            goles: jStat.goles || 0,
            asistencias: jStat.asistencias || 0,
            amarillas: amarillasHoy,
            azules: azulesHoy,
            calificacion: jStat.calificacion || 0.00,
            goles_recibidos: recibidos
          })

          // --- LÓGICA DE SANCIONES ---
          let acumAmarillas = (j.amarillas_acumuladas || 0) + amarillasHoy
          let suspension = j.partidos_suspension || 0

          // Regla: Azul o Doble Amarilla = +1 partido
          if (azulesHoy > 0 || amarillasHoy >= 2) {
            suspension += 1
          }

          // Regla: Acumulación de 3 amarillas = +1 partido y reset
          if (acumAmarillas >= 3) {
            suspension += 1
            acumAmarillas = 0
          }

          // Actualizamos al jugador con su nuevo estado disciplinario
          await supabase.from('jugadores').update({
            amarillas_acumuladas: acumAmarillas,
            partidos_suspension: suspension
          }).eq('id', j.id)
        } else {
          // Si NO jugó (no tiene stats) pero tenía una suspensión pendiente, le descontamos un partido
          if (j.partidos_suspension > 0) {
            await supabase.from('jugadores').update({
              partidos_suspension: j.partidos_suspension - 1
            }).eq('id', j.id)
          }
        }
      }

      if (todasLasStats.length > 0) {
        await supabase.from('estadisticas_jugadores').insert(todasLasStats)
      }

      // 3. MOTOR DE APUESTAS (Simplificado para el ejemplo)
      let resultadoReal = 'EMPATE'
      if (golesLocal > golesVisita) resultadoReal = 'LOCAL'
      else if (golesVisita > golesLocal) resultadoReal = 'VISITA'

      const { data: apuestas } = await supabase.from('apuestas').select('*').eq('partido_id', partidoSeleccionado.id).eq('estado', 'pendiente')
      if (apuestas) {
        for (const apuesta of apuestas) {
          const gano = apuesta.seleccion === resultadoReal
          await supabase.from('apuestas').update({ estado: gano ? 'ganada' : 'perdida' }).eq('id', apuesta.id)
          if (gano && !apuesta.es_parlay) {
            const { data: p } = await supabase.from('perfiles_presidentes').select('saldo_bet').eq('id', apuesta.user_id).single()
            if (p) await supabase.from('perfiles_presidentes').update({ saldo_bet: p.saldo_bet + (apuesta.monto * apuesta.momio) }).eq('id', apuesta.user_id)
          }
        }
      }

      alert('¡Partido procesado y sanciones aplicadas! ⚖️')
      setPartidoSeleccionado(null)
      fetchPartidosPendientes()

    } catch (error: any) {
      alert('Error: ' + error.message)
    }
    setGuardando(false)
  }

  const partidosFiltrados = partidos.filter(p => p.jornada === jornadaSeleccionada)

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#fcc200]"><Loader2 className="animate-spin" size={40} /></div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
            Resultados <span className="text-[#fcc200]">Globales</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Match Settlement Console</p>
        </header>

        {!partidoSeleccionado ? (
          <div className="animate-in fade-in duration-300">
            <div className="flex gap-2 overflow-x-auto mb-8 custom-scrollbar pb-2">
              {jornadas.map(j => (
                <button 
                  key={j} 
                  onClick={() => setJornadaSeleccionada(j)}
                  className={`px-6 py-3 rounded-2xl font-black uppercase italic tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                    jornadaSeleccionada === j 
                    ? 'bg-[#fcc200] text-black shadow-[0_0_20px_rgba(252,194,0,0.3)]' 
                    : 'bg-[#141414] text-zinc-600 hover:text-white border border-white/5 hover:border-white/20'
                  }`}
                >
                  Jornada {j}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partidosFiltrados.map(p => (
                <div key={p.id} onClick={() => seleccionarPartido(p)} className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-6 hover:border-[#fcc200]/30 transition-all cursor-pointer group shadow-xl flex flex-col items-center">
                  <div className="flex items-center justify-between w-full gap-4 mt-2">
                    <div className="text-center w-1/3"><img src={p.local.escudo_url} className="w-14 h-14 mx-auto mb-3 drop-shadow-lg group-hover:scale-110 transition-transform" alt="" /><p className="text-[9px] font-black uppercase text-zinc-400 truncate">{p.local.nombre}</p></div>
                    <span className="text-xl font-black italic text-zinc-700">VS</span>
                    <div className="text-center w-1/3"><img src={p.visita.escudo_url} className="w-14 h-14 mx-auto mb-3 drop-shadow-lg group-hover:scale-110 transition-transform" alt="" /><p className="text-[9px] font-black uppercase text-zinc-400 truncate">{p.visita.nombre}</p></div>
                  </div>
                  <div className="w-full mt-6 flex justify-center"><ChevronRight size={20} className="text-zinc-600 group-hover:text-[#fcc200] group-hover:translate-x-1 transition-transform" /></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* CABECERA Y MARCADOR */}
            <div className="bg-[#141414] border-2 border-[#fcc200]/20 rounded-[3rem] p-8 md:p-12 shadow-2xl">
              <div className="flex flex-col items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fcc200] mb-2 bg-[#fcc200]/10 px-4 py-1 rounded-full border border-[#fcc200]/20">Jornada {partidoSeleccionado.jornada}</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
                  <img src={partidoSeleccionado.local.escudo_url} className="w-20 h-20 md:w-24 md:h-24 object-contain" alt="" />
                  <input type="number" min="0" value={golesLocal} onChange={e => setGolesLocal(parseInt(e.target.value) || 0)} className="w-24 h-28 bg-black border border-white/10 rounded-3xl text-6xl font-black text-center text-white outline-none focus:border-[#fcc200] shadow-inner" />
                  <div className="w-full mt-4">
                    <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 justify-center"><Shield size={12}/> Portero Local</label>
                    <select value={porteroLocalId} onChange={e => setPorteroLocalId(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200] text-center cursor-pointer">
                      <option value="">Ninguno</option>
                      {jugadoresLocal.map(j => <option key={j.id} value={j.id}>{j.nombre} ({j.posicion})</option>)}
                    </select>
                  </div>
                </div>

                <span className="text-3xl md:text-5xl font-black italic text-zinc-800">VS</span>

                <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
                  <img src={partidoSeleccionado.visita.escudo_url} className="w-20 h-20 md:w-24 md:h-24 object-contain" alt="" />
                  <input type="number" min="0" value={golesVisita} onChange={e => setGolesVisita(parseInt(e.target.value) || 0)} className="w-24 h-28 bg-black border border-white/10 rounded-3xl text-6xl font-black text-center text-white outline-none focus:border-[#fcc200] shadow-inner" />
                  <div className="w-full mt-4">
                    <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 justify-center"><Shield size={12}/> Portero Visita</label>
                    <select value={porteroVisitaId} onChange={e => setPorteroVisitaId(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200] text-center cursor-pointer">
                      <option value="">Ninguno</option>
                      {jugadoresVisita.map(j => <option key={j.id} value={j.id}>{j.nombre} ({j.posicion})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* SHOOTOUTS PANEL */}
              {golesLocal === golesVisita && (
                <div className="w-full mt-10 pt-8 border-t border-white/5 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#fcc200] mb-6 flex items-center gap-2">
                    <Activity size={14} /> Resolución por Shootouts
                  </span>
                  <div className="flex items-center gap-8 bg-black/50 p-6 rounded-4xl border border-[#fcc200]/20">
                    <input type="number" min="0" value={golesShootoutLocal} onChange={e => setGolesShootoutLocal(parseInt(e.target.value) || 0)} className="w-16 h-16 bg-black border border-[#fcc200]/40 rounded-2xl text-2xl font-black text-center text-[#fcc200] outline-none focus:border-[#fcc200]" />
                    <span className="text-xs font-black italic tracking-widest text-zinc-500">PENALES</span>
                    <input type="number" min="0" value={golesShootoutVisita} onChange={e => setGolesShootoutVisita(parseInt(e.target.value) || 0)} className="w-16 h-16 bg-black border border-[#fcc200]/40 rounded-2xl text-2xl font-black text-center text-[#fcc200] outline-none focus:border-[#fcc200]" />
                  </div>
                </div>
              )}
            </div>

            {/* TABLAS DE JUGADORES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[ { titulo: partidoSeleccionado.local.nombre, escudo: partidoSeleccionado.local.escudo_url, jugadores: jugadoresLocal },
                 { titulo: partidoSeleccionado.visita.nombre, escudo: partidoSeleccionado.visita.escudo_url, jugadores: jugadoresVisita } ].map((equipo, idx) => (
                <div key={idx} className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-6 shadow-xl overflow-x-auto">
                  <div className="flex items-center gap-3 mb-6 px-2 min-w-125">
                    <img src={equipo.escudo} className="w-8 h-8" alt="" />
                    <h3 className="text-lg font-black uppercase italic text-white">{equipo.titulo}</h3>
                  </div>

                  <div className="grid grid-cols-12 gap-2 mb-4 px-2 text-[8px] font-black text-zinc-500 uppercase tracking-widest min-w-125">
                    <div className="col-span-4">Jugador</div>
                    <div className="col-span-2 text-center">Gol</div>
                    <div className="col-span-2 text-center">Ast</div>
                    <div className="col-span-1 text-center text-amber-500">Am</div>
                    <div className="col-span-1 text-center text-blue-500">Az</div>
                    <div className="col-span-2 text-center">Rtg</div>
                  </div>

                  <div className="space-y-2 min-w-125">
                    {equipo.jugadores.map((j) => (
                      <div key={j.id} className="grid grid-cols-12 gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5 hover:border-[#fcc200]/20 transition-colors">
                        <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                          <span className="text-[8px] font-black text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">{j.posicion}</span>
                          <span className="text-[10px] font-bold text-white truncate">{j.nombre}</span>
                        </div>
                        <input type="number" min="0" placeholder="0" onChange={(e) => handleStatChange(j.id, 'goles', e.target.value)} className="col-span-2 bg-black border border-white/10 rounded-lg text-xs text-center font-bold text-white py-1.5 focus:border-[#fcc200] outline-none" />
                        <input type="number" min="0" placeholder="0" onChange={(e) => handleStatChange(j.id, 'asistencias', e.target.value)} className="col-span-2 bg-black border border-white/10 rounded-lg text-xs text-center font-bold text-white py-1.5 focus:border-[#fcc200] outline-none" />
                        <input type="number" min="0" max="2" placeholder="0" onChange={(e) => handleStatChange(j.id, 'amarillas', e.target.value)} className="col-span-1 bg-black border border-amber-500/20 rounded-lg text-xs text-center font-bold text-amber-500 py-1.5 focus:border-amber-500 outline-none" />
                        <input type="number" min="0" max="1" placeholder="0" onChange={(e) => handleStatChange(j.id, 'azules', e.target.value)} className="col-span-1 bg-black border border-blue-500/20 rounded-lg text-xs text-center font-bold text-blue-500 py-1.5 focus:border-blue-500 outline-none" />
                        <input type="number" min="0" max="10" step="0.1" placeholder="0.0" onChange={(e) => handleStatChange(j.id, 'calificacion', e.target.value)} className="col-span-2 bg-[#fcc200]/10 border border-[#fcc200]/20 rounded-lg text-xs text-center font-black text-[#fcc200] py-1.5 focus:border-[#fcc200] outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 mt-8 pb-10">
              <button onClick={() => setPartidoSeleccionado(null)} className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando} className="px-10 py-5 bg-[#fcc200] text-black rounded-2xl font-black uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(252,194,0,0.3)] cursor-pointer disabled:opacity-50">
                <Save size={20} />
                {guardando ? 'GUARDANDO...' : 'CERRAR PARTIDO Y PAGAR APUESTAS'}
              </button>
            </div>
          </div>
        )}
      </main>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fcc20040; border-radius: 10px; }
      `}</style>
    </div>
  )
}