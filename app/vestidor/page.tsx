'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ShieldCheck, Users, LayoutDashboard, ChevronRight } from 'lucide-react'

export default function VestidorPage() {
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
        setPerfil(pData); 
        setEquipo(pData.equipos)
        
        const { data: jugs } = await supabase.from('jugadores').select('*').eq('id_equipo', pData.equipo_id).order('nombre')
        setJugadores(jugs || [])
        
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
    if (!proximoPartido) return alert('No hay partidos próximos.')
    if (Object.values(formacion).some(v => v === '')) return alert('¡Completa el cuadro titular!')
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

    if (error) alert(error.code === '23505' ? '¡Ya enviaste tu alineación!' : 'Error: ' + error.message)
    else alert(`¡Alineación blindada para la Jornada ${proximoPartido.jornada}!`)
    setEnviando(false)
  }

  if (!perfil) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-black tracking-[0.5em] text-[#fcc200] animate-pulse">
      SINCRONIZANDO VESTIDOR...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans">
      
      {/* NAVBAR MOBILE-READY */}
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <img src="/LOGO_PNG.png" className="w-8 h-8 object-contain" alt="Logo" />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <img src={equipo.escudo_url} className="w-6 h-6 object-contain" alt="" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#fcc200] hidden sm:block">{equipo.nombre}</span>
          </div>
        </div>
        
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
        >
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12">
        
        {/* HEADER RESPONSIVO */}
        <header className="mb-8 bg-linear-to-b from-[#141414] to-transparent border border-white/5 p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={equipo.escudo_url} className="w-20 h-20 object-contain drop-shadow-2xl" alt="" />
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2">
                Manager <span className="text-[#fcc200]">{perfil.nombre_presidente.split(' ')[0]}</span>
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Próximo Rival:</span>
                <span className="text-xs font-black text-white uppercase italic">{rival || 'TBD'}</span>
                {proximoPartido && <span className="px-2 py-0.5 bg-[#fcc200]/10 text-[#fcc200] text-[8px] font-black rounded-full">JORNADA {proximoPartido.jornada}</span>}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PIZARRA TÁCTICA */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-[#141414] rounded-[3rem] border border-white/5 p-6 md:p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2">
                  <LayoutDashboard size={14} className="text-[#fcc200]" /> Pizarra Táctica
                </h3>
                <span className="text-[10px] font-bold uppercase italic text-zinc-700">Formación 4-1</span>
              </div>

              {/* CANCHA ADAPTATIVA */}
              <div className="relative w-full aspect-4/5 md:aspect-video bg-black rounded-[2.5rem] border border-white/5 p-6 md:p-12 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none border-2 border-white/20 m-4 rounded-4xl" />
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/5" />
                
                {/* ATAQUE/CAMPO */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="group">
                      <div className="w-full aspect-square bg-zinc-900/50 rounded-2xl border border-white/5 group-hover:border-[#fcc200]/40 transition-all flex items-center justify-center p-2">
                        <select 
                          className="w-full bg-transparent text-[10px] md:text-xs font-black uppercase text-center outline-none cursor-pointer appearance-none"
                          onChange={(e) => setFormacion({...formacion, [`j${n}`]: e.target.value})}
                          value={formacion[`j${n}` as keyof typeof formacion]}
                        >
                          <option value="" className="bg-black text-zinc-500">+</option>
                          {jugadores.map(j => <option key={j.id} value={j.id} className="bg-black text-white">{j.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PORTERÍA */}
                <div className="flex justify-center relative z-10">
                  <div className="w-1/2 md:w-1/4">
                    <div className="w-full aspect-square bg-[#fcc200]/5 rounded-2xl border-2 border-[#fcc200]/20 hover:border-[#fcc200] transition-all flex items-center justify-center p-2">
                      <select 
                        className="w-full bg-transparent text-[10px] md:text-xs font-black uppercase text-center outline-none cursor-pointer appearance-none text-[#fcc200]"
                        onChange={(e) => setFormacion({...formacion, po: e.target.value})}
                        value={formacion.po}
                      >
                        <option value="" className="bg-black text-[#fcc200]">GK</option>
                        {jugadores.map(j => <option key={j.id} value={j.id} className="bg-black text-white">{j.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleConfirm}
                disabled={enviando || !proximoPartido}
                className="mt-8 w-full py-5 bg-[#fcc200] text-black rounded-2xl font-black uppercase italic tracking-[0.2em] transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 shadow-xl shadow-[#fcc200]/10 flex items-center justify-center gap-3"
              >
                <ShieldCheck size={20} />
                {enviando ? 'ENVIANDO...' : 'CONFIRMAR TITULARES'}
              </button>
            </div>
          </div>

          {/* LISTA DE JUGADORES - SIDEBAR */}
          <div className="lg:col-span-4">
            <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users size={18} className="text-zinc-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Plantilla Disponible</h4>
              </div>
              <div className="space-y-2 max-h-100 md:max-h-150 overflow-y-auto pr-2 custom-scrollbar">
                {jugadores.map(j => (
                  <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 group hover:border-[#fcc200]/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[8px] font-black text-zinc-600 group-hover:text-[#fcc200]">{j.posicion}</div>
                      <span className="text-[11px] font-bold uppercase tracking-tight text-zinc-300">{j.nombre}</span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fcc20020; border-radius: 10px; }
      `}</style>
    </div>
  )
}