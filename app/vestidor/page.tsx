'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ShieldCheck, Users, LayoutDashboard, ChevronRight, Clock } from 'lucide-react'

export default function VestidorPage() {
  const [perfil, setPerfil] = useState<any>(null)
  const [equipo, setEquipo] = useState<any>(null)
  const [jugadores, setJugadores] = useState<any[]>([])
  const [rival, setRival] = useState<string>('')
  const [proximoPartido, setProximoPartido] = useState<any>(null)
  const [tiempoRestante, setTiempoRestante] = useState<string>('')
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

  // LÓGICA DEL CONTADOR HACIA EL MIÉRCOLES
  useEffect(() => {
    if (proximoPartido?.fecha) {
      const interval = setInterval(() => {
        const fechaPartido = new Date(proximoPartido.fecha);
        const limite = new Date(fechaPartido);
        const diaSemana = fechaPartido.getDay(); 
        
        // Calcular el miércoles de esa semana (23:59:59)
        const diasARestar = diaSemana === 0 ? 4 : diaSemana - 3;
        limite.setDate(fechaPartido.getDate() - diasARestar);
        limite.setHours(23, 59, 59, 999);

        const ahora = new Date();
        const diff = limite.getTime() - ahora.getTime();

        if (diff <= 0) {
          setTiempoRestante("VESTIDOR CERRADO 🔒");
          clearInterval(interval);
        } else {
          const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
          const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutos = Math.floor((diff / 1000 / 60) % 60);
          const segundos = Math.floor((diff / 1000) % 60);
          setTiempoRestante(`${dias}d ${horas}h ${minutos}m ${segundos}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [proximoPartido]);

  const handleConfirm = async () => {
    if (!proximoPartido || !proximoPartido.fecha) {
      return alert('No hay fecha definida para el próximo partido.');
    }

    const fechaPartido = new Date(proximoPartido.fecha);
    const limiteEnvio = new Date(fechaPartido);
    const diaSemana = fechaPartido.getDay(); 
    const diasARestar = diaSemana === 0 ? 4 : diaSemana - 3;
    
    limiteEnvio.setDate(fechaPartido.getDate() - diasARestar);
    limiteEnvio.setHours(23, 59, 59, 999);

    const ahora = new Date();

    if (ahora > limiteEnvio) {
      alert(`❌ PLAZO VENCIDO. El límite fue el miércoles ${limiteEnvio.toLocaleDateString()} a las 23:59.`);
      return;
    }

    if (Object.values(formacion).some(v => v === '')) {
      return alert('¡Completa el cuadro titular!');
    }

    setEnviando(true);
    const { error } = await supabase.from('alineaciones').upsert({
      partido_id: proximoPartido.id,
      equipo_id: equipo.id,
      jugador_1_id: formacion.j1,
      jugador_2_id: formacion.j2,
      jugador_3_id: formacion.j3,
      jugador_4_id: formacion.j4,
      portero_id: formacion.po,
      enviada: true
    });

    if (error) {
      if (error.code === '23505') alert('⚠️ Ya enviaste tu alineación para esta jornada.');
      else alert('Error: ' + error.message);
    } else {
      alert(`✅ ¡Alineación blindada para la Jornada ${proximoPartido.jornada}!`);
    }
    setEnviando(false);
  };

  if (!perfil) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-black tracking-[0.5em] text-[#fcc200] animate-pulse">
      SINCRONIZANDO VESTIDOR...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans">
      
      {/* NAVBAR */}
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
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
        
        {/* HEADER */}
        <header className="mb-8 bg-linear-to-b from-[#141414] to-transparent border border-white/5 p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={equipo.escudo_url} className="w-20 h-20 object-contain drop-shadow-2xl" alt="" />
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2">
                Manager <span className="text-[#fcc200]">{perfil.nombre_presidente.split(' ')[0]}</span>
              </h1>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Próximo Rival:</span>
                  <span className="text-xs font-black text-white uppercase italic">{rival || 'TBD'}</span>
                  {proximoPartido && <span className="px-2 py-0.5 bg-[#fcc200]/10 text-[#fcc200] text-[8px] font-black rounded-full">JORNADA {proximoPartido.jornada}</span>}
                </div>
                {/* TIMER DE CIERRE */}
                {tiempoRestante && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 animate-pulse">
                    <Clock size={10} className="text-[#fcc200]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#fcc200]">
                      {tiempoRestante}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PIZARRA TÁCTICA */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-[#141414] rounded-[3rem] border border-white/5 p-4 md:p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2">
                  <LayoutDashboard size={14} className="text-[#fcc200]" /> Pizarra Táctica
                </h3>
                <span className="text-[10px] font-bold uppercase italic text-zinc-700">Formación 4-1</span>
              </div>

              <div className="relative w-full aspect-4/3 md:aspect-video bg-[#050505] rounded-[2.5rem] border border-white/10 p-4 overflow-hidden shadow-2xl flex flex-col justify-center">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute inset-4 border border-white/20 rounded-3xl" />
                  <div className="absolute top-1/2 left-0 w-full h-px bg-white/20" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-white/20" />
                </div>

                <div className="relative z-10 flex justify-between items-center w-full px-2 mb-8">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="w-[23%] max-w-30 group">
                      <div className="relative aspect-square bg-zinc-900/90 rounded-xl border border-white/10 group-hover:border-[#fcc200]/50 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                        <span className="text-[7px] font-black text-zinc-500 absolute top-1.5 uppercase">J{n}</span>
                        <select 
                          className="w-full h-full bg-transparent text-[9px] md:text-xs font-black uppercase text-center outline-none cursor-pointer appearance-none z-10 pt-2 px-1"
                          onChange={(e) => setFormacion({...formacion, [`j${n}`]: e.target.value})}
                          value={formacion[`j${n}` as keyof typeof formacion]}
                        >
                          <option value="" className="bg-black text-zinc-600">+</option>
                          {jugadores.map(j => <option key={j.id} value={j.id} className="bg-black text-white">{j.nombre}</option>)}
                        </select>
                        {!formacion[`j${n}` as keyof typeof formacion] && (
                          <span className="text-zinc-700 text-lg absolute pointer-events-none mt-2">+</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 flex justify-center w-full">
                  <div className="w-[25%] max-w-32.5 group">
                    <div className="relative aspect-square bg-[#fcc200]/5 rounded-xl border-2 border-[#fcc200]/20 group-hover:border-[#fcc200] transition-all flex flex-col items-center justify-center backdrop-blur-md">
                      <select 
                        className="w-full h-full bg-transparent text-[9px] md:text-xs font-black uppercase text-center outline-none cursor-pointer appearance-none text-[#fcc200] z-10 pt-2 px-1"
                        onChange={(e) => setFormacion({...formacion, po: e.target.value})}
                        value={formacion.po}
                      >
                        <option value="" className="bg-black text-[#fcc200]">GK</option>
                        {jugadores.map(j => <option key={j.id} value={j.id} className="bg-black text-white">{j.nombre}</option>)}
                      </select>
                      {!formacion.po && (
                        <span className="text-[#fcc200]/40 text-lg absolute pointer-events-none mt-2">+</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleConfirm}
                disabled={enviando || !proximoPartido || tiempoRestante === "VESTIDOR CERRADO 🔒"}
                className="mt-8 w-full py-5 bg-[#fcc200] text-black rounded-2xl font-black uppercase italic tracking-[0.2em] transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 shadow-xl shadow-[#fcc200]/10 flex items-center justify-center gap-3"
              >
                <ShieldCheck size={20} />
                {enviando ? 'ENVIANDO...' : 'CONFIRMAR TITULARES'}
              </button>
            </div>
          </div>

          {/* LISTA DE JUGADORES */}
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