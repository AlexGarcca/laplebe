'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Users, LayoutDashboard, ChevronRight, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'

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

      // Buscamos el perfil
      const { data: pData, error: pError } = await supabase
        .from('perfiles_presidentes')
        .select('*, equipos(*)')
        .eq('id', user.id)
        .single()

      // 🚩 EL PARCHE MAESTRO:
      // Si el usuario existe en Auth pero NO en perfiles (o hay error), lo sacamos.
      if (!pData || pError) {
        console.warn("Perfil no encontrado. Cerrando sesión...");
        await supabase.auth.signOut()
        router.push('/login?error=account_deleted')
        return
      }

      // Si llegamos aquí, el perfil sí existe
      setPerfil(pData)
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
        .maybeSingle() // Usamos maybeSingle para evitar errores si no hay partidos

      if (partido) {
          setProximoPartido(partido)
          setRival(partido.equipo_local_id === pData.equipo_id ? partido.visita.nombre : partido.local.nombre)
      }
    }
    fetchData()
  }, [router])

  // LÓGICA DEL CONTADOR (Se mantiene igual)
  useEffect(() => {
    if (proximoPartido?.fecha) {
      const interval = setInterval(() => {
        const fechaPartido = new Date(proximoPartido.fecha);
        const limite = new Date(fechaPartido);
        const diaSemana = fechaPartido.getDay(); 
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
    if (!proximoPartido?.id) return alert('No hay partido activo.');
    
    // ... lógica de fecha (omito por brevedad, igual que la tenías) ...

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

    if (error) alert('Error: ' + error.message);
    else alert(`✅ ¡Alineación blindada!`);
    setEnviando(false);
  };

  if (!perfil) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-[#fcc200] font-black tracking-[0.5em] animate-pulse">SINCRONIZANDO...</div>
    </div>
  )

  if (!perfil.aprobado) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#fcc200]/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <ShieldCheck size={40} className="text-[#fcc200]" />
      </div>
      <h2 className="text-2xl font-black uppercase italic text-white mb-2">Acceso en Revisión</h2>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs">
        El Admin debe asignarte un equipo para entrar.
      </p>
      <button 
        onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
        className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 hover:text-white transition-all cursor-pointer"
      >
        Cerrar Sesión
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4 md:p-12">
        <header className="mb-8 bg-linear-to-b from-[#141414] to-transparent border border-white/5 p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={equipo?.escudo_url} className="w-20 h-20 object-contain drop-shadow-2xl" alt="" />
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2 text-white">
                Manager <span className="text-[#fcc200]">{perfil.nombre_presidente.split(' ')[0]}</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Siguiente: {rival || 'Por definir'}</span>
                {tiempoRestante && (
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#fcc200] rounded-full animate-ping" />
                    <span className="text-[9px] font-black text-[#fcc200] uppercase tracking-widest">{tiempoRestante}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* El resto del tablero se mantiene igual con tus selectores y lista... */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* ... Tu código de Pizarra Táctica y Lista de Jugadores ... */}
        </div>
      </main>
    </div>
  )
}