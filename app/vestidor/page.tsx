'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VestidorFinalCleanPage() {
  const [perfil, setPerfil] = useState<any>(null)
  const [equipo, setEquipo] = useState<any>(null)
  const [jugadores, setJugadores] = useState<any[]>([])
  const [rival, setRival] = useState<string>('')
  const [proximoPartido, setProximoPartido] = useState<any>(null)
  const [formacion, setFormacion] = useState({ j1: '', j2: '', j3: '', j4: '', po: '' })
  const [enviando, setEnviando] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return; }

      const { data: pData } = await supabase.from('perfiles_presidentes').select('*, equipos(*)').eq('id', user.id).single()
      if (pData) {
        setPerfil(pData); setEquipo(pData.equipos)
        
        const { data: jugs } = await supabase.from('jugadores').select('*').eq('id_equipo', pData.equipo_id).order('nombre')
        setJugadores(jugs || [])
        
        // BÚSQUEDA DINÁMICA DEL PRÓXIMO PARTIDO (Ya no está hardcoded en la J5)
        const { data: partido } = await supabase
          .from('partidos')
          .select('*, local:equipo_local_id(nombre), visita:equipo_visita_id(nombre)')
          .or(`equipo_local_id.eq.${pData.equipo_id},equipo_visita_id.eq.${pData.equipo_id}`)
          .eq('jugado', false)
          .order('jornada', { ascending: true })
          .limit(1)
          .single()

        if (partido) {
            setProximoPartido(partido)
            setRival(partido.equipo_local_id === pData.equipo_id ? partido.visita.nombre : partido.local.nombre)
        }
      }
    }
    fetchData()
  }, [router])

  const handleConfirm = async () => {
    if (!proximoPartido) return alert('No hay partidos próximos programados.')
    if (Object.values(formacion).some(v => v === '')) return alert('¡Completa el cuadro titular, cawn!')
    setEnviando(true)
    
    const { error } = await supabase.from('alineaciones').upsert({
      partido_id: proximoPartido.id,
      equipo_id: equipo.id,
      jugador_1_id: formacion.j1,
      jugador_2_id: formacion.j2,
      jugador_3_id: formacion.j3,
      jugador_4_id: formacion.j4,
      portero_id: formacion.po,
      enviada: true
    })

    if (error) {
      if (error.code === '23505') {
        alert('¡Ya enviaste tu alineación para este partido! No puedes repetirla.')
      } else {
        alert('Error al enviar: ' + error.message)
      }
    } else {
      alert(`¡Alineación blindada para la Jornada ${proximoPartido.jornada}!`)
    }
    setEnviando(false)
  }

  if (!perfil) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-bold tracking-widest text-[#fcc200]">
      SINCRONIZANDO...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      {/* NAVBAR ELITE DEL VESTIDOR */}
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-6 md:px-8 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-6 md:gap-8">
          {/* LOGO Y TEXTO DE LA LIGA */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
              <img 
                src="/LOGO_PNG.png" 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(252,194,0,0.3)]" 
                alt="Logo Plebeians League" 
              />
            </div>
            <div className="hidden lg:block text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#fcc200] transition-colors">
              Plebeians <span className="text-[#fcc200]">League</span>
            </div>
          </Link>

          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

          {/* IDENTIFICADOR DEL CLUB */}
          <div className="flex items-center gap-3">
            <img src={equipo.escudo_url} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-xl" alt="Logo Club" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#fcc200]">
              {equipo.nombre}
            </span>
          </div>
        </div>

        {/* ACCIONES Y CERRAR SESIÓN */}
        <div className="flex items-center gap-4">
          <Link href="/" className="hidden sm:flex group items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all mr-4">
            Volver al Inicio
          </Link>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
            className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 md:p-12">
        
        {/* HEADER LIMPIO */}
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#141414] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-10">
            <img src={equipo.escudo_url} className="w-24 h-24 object-contain brightness-125 drop-shadow-2xl" alt="Club Escudo" />
            <div className="h-16 w-px bg-white/10 hidden md:block"></div>
            <div>
              <h1 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-2">Gestión de Alineaciones: {equipo.nombre}</h1>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none mb-4">
                <span className="text-white">Hola, </span>
                <span className="text-[#fcc200]">{perfil.nombre_presidente.split(' ')[0]}</span>.
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <p className="text-sm text-zinc-400 font-medium uppercase tracking-tight">Presidencia: <b className="text-white">{equipo.presidente || '-'}</b></p>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-px bg-[#fcc200]"></span>
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      vs <b className="text-white">{rival || 'TBD'}</b> {proximoPartido ? `(Jornada ${proximoPartido.jornada})` : ''}
                    </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
             <div className="flex items-center gap-2 justify-end mb-1">
                 <div className="w-2 h-2 rounded-full bg-[#fcc200] animate-pulse"></div>
                 <span className="text-[10px] font-bold text-[#fcc200] uppercase tracking-widest italic">Live Mode</span>
             </div>
             <div className="text-5xl font-black text-white italic tracking-tighter opacity-20">RUSH</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* PIZARRA */}
          <div className="lg:col-span-8">
            <div className="bg-[#141414] rounded-[3rem] p-1 border border-white/5 shadow-inner">
              <div className="p-10 md:p-14">
                <div className="flex justify-between items-center mb-10 text-zinc-600">
                  <h3 className="text-sm font-bold uppercase tracking-[0.4em]">Estrategia Táctica</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest italic text-[#fcc200]/50">Formación 4-1</span>
                </div>

                <div className="relative w-full aspect-video bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-12 flex flex-col justify-between overflow-hidden shadow-2xl">
                  {/* FONDO DE CANCHA MINIMALISTA */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                     <div className="w-px h-full bg-white absolute left-1/2"></div>
                     <div className="w-48 h-48 border-2 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                  </div>

                  {/* ATAQUE */}
                  <div className="grid grid-cols-4 gap-6 relative z-10">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="flex flex-col gap-3 group">
                        <div className="w-full aspect-square bg-[#1a1a1a] rounded-3xl border border-white/5 group-hover:border-[#fcc200]/40 flex items-center justify-center transition-all">
                          <select 
                            className="w-full h-full bg-transparent text-center text-xs font-black uppercase p-2 focus:outline-none appearance-none cursor-pointer"
                            onChange={(e) => setFormacion({...formacion, [`j${n}`]: e.target.value})}
                          >
                            <option value="" className="bg-[#1a1a1a]">+</option>
                            {jugadores.map(j => <option key={j.id} value={j.id} className="bg-[#1a1a1a]">{j.nombre}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PORTERO */}
                  <div className="flex justify-center relative z-10">
                    <div className="w-1/4">
                      <div className="w-full aspect-square bg-[#1a1a1a] rounded-3xl border-2 border-[#fcc200]/20 hover:border-[#fcc200] transition-colors flex items-center justify-center">
                        <select 
                          className="w-full h-full bg-transparent text-center text-xs font-black uppercase p-2 focus:outline-none appearance-none cursor-pointer text-[#fcc200]"
                          onChange={(e) => setFormacion({...formacion, po: e.target.value})}
                        >
                          <option value="" className="bg-[#1a1a1a]">GK</option>
                          {jugadores.map(j => <option key={j.id} value={j.id} className="bg-[#1a1a1a]">{j.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleConfirm}
                  disabled={enviando || !proximoPartido}
                  className="mt-14 w-full py-5 bg-[#fcc200] text-black rounded-2xl font-black uppercase italic tracking-[0.3em] transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-[#fcc200]/10 disabled:opacity-50"
                >
                  {enviando ? 'PROCESANDO...' : proximoPartido ? 'CONFIRMAR ALINEACIÓN' : 'SIN PARTIDOS PENDIENTES'}
                </button>
              </div>
            </div>
          </div>

          {/* LISTA COMPLETA */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 bg-[#141414] border border-white/5 rounded-[2.5rem] p-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-8 border-b border-white/5 pb-4">Plantilla</h4>
              <div className="space-y-1 overflow-y-auto max-h-125 pr-4 custom-scrollbar">
                {jugadores.map(j => (
                  <div key={j.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500 group-hover:text-[#fcc200] transition-colors uppercase">
                        {j.posicion}
                      </div>
                      <span className="text-sm font-bold uppercase tracking-tight">{j.nombre}</span>
                    </div>
                    <span className="text-[10px] font-black text-zinc-700">{j.valoracion || '--'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fcc20020; border-radius: 10px; }
      `}</style>
    </div>
  )
}