'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Link from 'next/link'
import { FadeInUp } from '@/components/AnimatedWrappers'

export default function EstadisticasPage() {
  const [activeTab, setActiveTab] = useState('goles')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      let result: any[] = []

      if (activeTab === 'goles') {
        const { data: res } = await supabase.from('registro_goles').select('jugador_id, jugadores(nombre, equipos(nombre, escudo_url))')
        result = processCounts(res ?? [], 'Goles')
      } else if (activeTab === 'asistencias') {
        const { data: res } = await supabase.from('registro_asistencias').select('jugador_id, jugadores(nombre, equipos(nombre, escudo_url))')
        result = processCounts(res ?? [], 'Asistencias')
      } else if (activeTab === 'mvp') {
        const { data: res } = await supabase.from('registro_mvp').select('jugador_id, jugadores(nombre, equipos(nombre, escudo_url))')
        result = processCounts(res ?? [], 'MVPs')
      } else if (activeTab === 'tarjetas') {
        result = await fetchTeamFairPlay() 
      }

      setData(result)
      setLoading(false)
    }
    fetchStats()
  }, [activeTab])

  const fetchTeamFairPlay = async () => {
    const { data: equipos } = await supabase
      .from('equipos')
      .select('id, nombre, escudo_url')
      .not('nombre', 'ilike', '%draft%'); // 🛡️ Filtro para ignorar equipo DRAFT

    const { data: tarjetas } = await supabase.from('registro_tarjetas').select('tipo_tarjeta, jugadores(id_equipo)');

    const teamStats = equipos?.map(equipo => {
      const tarjetasEquipo = tarjetas?.filter(t => {
        const playerInfo = Array.isArray(t.jugadores) ? t.jugadores[0] : t.jugadores;
        return playerInfo?.id_equipo === equipo.id;
      }) || [];

      return {
        id: equipo.id,
        nombre: equipo.nombre,
        escudo: equipo.escudo_url,
        amarillas: tarjetasEquipo.filter(t => t.tipo_tarjeta === 'amarilla').length,
        rojas: tarjetasEquipo.filter(t => t.tipo_tarjeta === 'roja').length,
      };
    }) || [];

    return teamStats.sort((a, b) => (b.rojas + b.amarillas) - (a.rojas + a.amarillas));
  };

  const processCounts = (raw: any[], label: string) => {
    const counts: any = {}
    raw?.forEach(item => {
      if (item.jugadores && item.jugadores.equipos) {
        const id = item.jugador_id
        if (!counts[id]) {
          counts[id] = { 
            nombre: item.jugadores.nombre, 
            equipo: item.jugadores.equipos.nombre, 
            escudo: item.jugadores.equipos.escudo_url, 
            valor: 0, 
            label 
          }
        }
        counts[id].valor++
      }
    })
    return Object.values(counts).sort((a: any, b: any) => b.valor - a.valor)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans">
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-50 px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/LOGO_PNG.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#fcc200] transition-colors">
            Plebeians <span className="text-[#fcc200]">League</span>
          </div>
        </Link>
        <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 items-center">
          <Link href="/partidos" className="hover:text-[#fcc200] transition-colors">Calendario</Link>
          <Link href="/clasificacion" className="hover:text-[#fcc200] transition-colors">Posiciones</Link>
          <Link href="/estadisticas" className="text-[#fcc200] border-b border-[#fcc200]/50 pb-1">Estadísticas</Link>
          <Link href="/login" className="ml-6 px-6 py-2.5 bg-[#fcc200] text-black rounded-full shadow-lg">Portal Presis</Link>
        </div>
      </nav>

      <MatchTicker />

      <main className="max-w-5xl mx-auto p-8 md:py-20">
        <header className="mb-16 text-center">
          <FadeInUp>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-6">
              Líderes del <span className="text-[#fcc200]">Torneo</span>
            </h1>
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {['goles', 'asistencias', 'tarjetas', 'mvp'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#fcc200] text-black shadow-xl scale-105' : 'bg-[#141414] text-zinc-500 border border-white/5 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </FadeInUp>
        </header>

        <section className="min-h-100">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-zinc-700 font-black uppercase tracking-widest">Sincronizando Estadísticas...</motion.div>
            ) : data.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-white/5 rounded-[3rem] bg-[#141414] text-zinc-600 font-bold uppercase italic">Aún no hay datos suficientes.</motion.div>
            ) : activeTab === 'tarjetas' ? (
              /* 🟦 TABLA DE TARJETAS (FAIR PLAY) */
              <motion.div key="fairplay" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="overflow-hidden bg-[#141414] border border-white/5 rounded-[2.5rem] shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-black/40 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                    <tr>
                      <th className="px-8 py-6">Pos</th>
                      <th className="px-8 py-6">Equipo</th>
                      <th className="px-8 py-6 text-center">Azul</th>
                      <th className="px-8 py-6 text-center">Ama.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.map((equipo, i) => (
                      <tr key={equipo.id} className="group hover:bg-white/2 transition-colors">
                        <td className="px-8 py-6 font-black italic text-zinc-700 text-2xl">#{i + 1}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={equipo.escudo} className="w-10 h-10 object-contain" alt="" />
                            <span className="text-xl font-black uppercase italic text-white group-hover:text-[#fcc200] transition-colors">{equipo.nombre}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center text-2xl font-black text-blue-500">{equipo.rojas}</td>
                        <td className="px-8 py-6 text-center text-2xl font-black text-yellow-500">{equipo.amarillas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              /* 🏆 LISTADO DE JUGADORES (GOLES, ASIS, MVP) */
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid gap-4">
                {data.map((item, i) => (
                  <div key={i} className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-[#fcc200]/30 transition-all shadow-2xl">
                    <div className="flex items-center gap-8">
                      <span className={`text-4xl font-black italic ${i < 3 ? 'text-[#fcc200]' : 'text-zinc-800'}`}>#{i + 1}</span>
                      <img src={item.escudo} className="w-12 h-12 object-contain" alt="" />
                      <div>
                        <h3 className="text-xl font-black uppercase italic text-white group-hover:text-[#fcc200] transition-colors leading-none">{item.nombre}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{item.equipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{item.valor}</span>
                      <p className="text-[8px] font-black text-[#fcc200] uppercase tracking-widest mt-1">{item.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}