'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Navbar from '@/components/Navbar'
import { FadeInUp } from '@/components/AnimatedWrappers'

export default function EstadisticasPage() {
  const [activeTab, setActiveTab] = useState('goles')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      let result: any[] = []

      // 1. OBTENER DATOS DE LA TABLA MAESTRA DE ESTADÍSTICAS
      const { data: statsRaw } = await supabase
        .from('estadisticas_jugadores')
        .select('*, jugador:jugador_id(nombre, posicion), equipo:equipo_id(nombre, escudo_url)')

      if (!statsRaw) {
        setLoading(false)
        return
      }

      // 2. PROCESAR LOS DATOS SEGÚN LA PESTAÑA ACTIVA
      if (activeTab === 'goles') {
        result = processStats(statsRaw, 'goles', 'Goles')
      } else if (activeTab === 'asistencias') {
        result = processStats(statsRaw, 'asistencias', 'Asistencias')
      } else if (activeTab === 'mvp') {
        // Asumiremos que MVP es el de mejor calificación promedio (mínimo 2 partidos jugados)
        result = processAverage(statsRaw, 'calificacion', 'Rating Avg')
      } else if (activeTab === 'porteros') {
        // Filtrar solo los que recibieron goles y promediar por partido jugado
        result = processPorteros(statsRaw)
      } else if (activeTab === 'tarjetas') {
        result = await fetchTeamFairPlay(statsRaw) 
      }

      setData(result)
      setLoading(false)
    }
    fetchStats()
  }, [activeTab])

  // PROCESADOR GENÉRICO (Suma todo)
  const processStats = (raw: any[], campo: string, label: string) => {
    const counts: any = {}
    raw.forEach(item => {
      if (item[campo] > 0 && item.jugador && item.equipo) {
        const id = item.jugador_id
        if (!counts[id]) {
          counts[id] = { 
            nombre: item.jugador.nombre, 
            equipo: item.equipo.nombre, 
            escudo: item.equipo.escudo_url, 
            valor: 0, 
            label 
          }
        }
        counts[id].valor += item[campo]
      }
    })
    return Object.values(counts).sort((a: any, b: any) => b.valor - a.valor)
  }

  // PROCESADOR DE PROMEDIOS (Para Rating / MVP)
  const processAverage = (raw: any[], campo: string, label: string) => {
    const stats: any = {}
    raw.forEach(item => {
      if (item[campo] > 0 && item.jugador && item.equipo) {
        const id = item.jugador_id
        if (!stats[id]) {
          stats[id] = { nombre: item.jugador.nombre, equipo: item.equipo.nombre, escudo: item.equipo.escudo_url, suma: 0, partidos: 0, label }
        }
        stats[id].suma += item[campo]
        stats[id].partidos += 1
      }
    })
    
    // Calcular promedio y ordenar (Valor = Promedio con 1 decimal)
    return Object.values(stats)
      .filter((s: any) => s.partidos > 0) // Podrías cambiar a > 1 si quieres exigir mínimo 2 juegos
      .map((s: any) => ({ ...s, valor: (s.suma / s.partidos).toFixed(1) }))
      .sort((a: any, b: any) => parseFloat(b.valor) - parseFloat(a.valor))
  }

  // PROCESADOR DE PORTEROS (Menos goles recibidos es mejor. Mínimo 1 partido registrado)
  const processPorteros = (raw: any[]) => {
    const stats: any = {}
    raw.forEach(item => {
      // Usamos el campo goles_recibidos. Filtramos a los que realmente son porteros o jugaron de portero
      if ((item.goles_recibidos >= 0 && item.jugador?.posicion === 'POR') || item.goles_recibidos > 0) {
        const id = item.jugador_id
        if (!stats[id]) {
          stats[id] = { nombre: item.jugador.nombre, equipo: item.equipo.nombre, escudo: item.equipo.escudo_url, golesRecibidos: 0, partidos: 0, label: 'Goles/P' }
        }
        stats[id].golesRecibidos += item.goles_recibidos
        stats[id].partidos += 1
      }
    })

    return Object.values(stats)
      .filter((s: any) => s.partidos > 0)
      .map((s: any) => ({ ...s, valor: (s.golesRecibidos / s.partidos).toFixed(2) }))
      .sort((a: any, b: any) => parseFloat(a.valor) - parseFloat(b.valor)) // OJO: Aquí se ordena de MENOR a MAYOR (es mejor recibir menos)
  }

  // PROCESADOR FAIR PLAY DE EQUIPOS
  const fetchTeamFairPlay = async (statsRaw: any[]) => {
    const { data: equipos } = await supabase.from('equipos').select('id, nombre, escudo_url').not('nombre', 'ilike', '%draft%')

    const teamStats = equipos?.map(equipo => {
      // Filtrar las stats que pertenecen a jugadores de este equipo
      const statsEquipo = statsRaw.filter(s => s.equipo_id === equipo.id)
      
      const amarillas = statsEquipo.reduce((acc, curr) => acc + (curr.amarillas || 0), 0)
      const azules = statsEquipo.reduce((acc, curr) => acc + (curr.azules || 0), 0)

      return {
        id: equipo.id,
        nombre: equipo.nombre,
        escudo: equipo.escudo_url,
        amarillas,
        azules,
      }
    }) || []

    return teamStats.sort((a, b) => (b.azules + b.amarillas) - (a.azules + a.amarillas))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans">
      <Navbar />
      <MatchTicker />

      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 md:py-20">
        <header className="mb-12 text-center">
          <FadeInUp>
            <h1 className="text-3xl sm:text-4xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-6 leading-none">
              Líderes del <span className="text-[#fcc200]">Torneo</span>
            </h1>
            
            <div className="flex overflow-x-auto pb-4 md:pb-0 md:justify-center gap-3 mt-8 no-scrollbar">
              {['goles', 'asistencias', 'porteros', 'tarjetas', 'mvp'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#fcc200] text-black shadow-xl scale-105' : 'bg-[#141414] text-zinc-500 border border-white/5 hover:text-white'}`}
                >
                  {tab === 'porteros' ? 'GUANTE ORO' : tab === 'tarjetas' ? 'FAIR PLAY' : tab}
                </button>
              ))}
            </div>
          </FadeInUp>
        </header>

        <section className="min-h-100">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-zinc-700 font-black uppercase tracking-widest">Sincronizando Data...</motion.div>
            ) : data.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-white/5 rounded-[2.5rem] bg-[#141414] text-zinc-600 font-bold uppercase italic">Sin datos registrados en esta categoría.</motion.div>
            ) : activeTab === 'tarjetas' ? (
              <motion.div key="fairplay" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="overflow-x-auto bg-[#141414] border border-white/5 rounded-[2.5rem] shadow-2xl">
                <table className="w-full text-left min-w-140">
                  <thead className="bg-black/40 text-[9px] uppercase font-black tracking-widest text-zinc-500">
                    <tr>
                      <th className="px-3 md:px-6 py-5">#</th>
                      <th className="px-3 md:px-6 py-5">Equipo</th>
                      <th className="px-3 md:px-6 py-5 text-center text-blue-500">Azules</th>
                      <th className="px-3 md:px-6 py-5 text-center text-yellow-500">Amarillas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.map((equipo, i) => (
                      <tr key={equipo.id} className="group hover:bg-white/2 transition-colors">
                        <td className="px-3 md:px-6 py-5 font-black italic text-zinc-700 text-xl">#{i + 1}</td>
                        <td className="px-3 md:px-6 py-5">
                          <div className="flex items-center gap-4">
                            <img src={equipo.escudo} className="w-8 h-8 object-contain" alt="" />
                            <span className="text-base font-black uppercase italic text-white group-hover:text-[#fcc200] transition-colors">{equipo.nombre}</span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-5 text-center text-xl font-black text-blue-500">{equipo.azules}</td>
                        <td className="px-3 md:px-6 py-5 text-center text-xl font-black text-yellow-500">{equipo.amarillas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid gap-4">
                {data.map((item, i) => (
                  <div key={i} className="bg-[#141414] border border-white/5 rounded-4xl md:rounded-[2.5rem] p-6 md:p-8 flex items-center justify-between group hover:border-[#fcc200]/30 transition-all shadow-2xl">
                    <div className="flex items-center gap-4 md:gap-8">
                      <span className={`text-2xl md:text-4xl font-black italic ${i < 3 ? 'text-[#fcc200]' : 'text-zinc-800'}`}>#{i + 1}</span>
                      <img src={item.escudo} className="w-10 h-10 md:w-12 md:h-12 object-contain" alt="" />
                      <div>
                        <h3 className="text-sm md:text-xl font-black uppercase italic text-white group-hover:text-[#fcc200] transition-colors leading-none">{item.nombre}</h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">{item.equipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl md:text-5xl font-black text-white italic tracking-tighter">{item.valor}</span>
                      <p className="text-[7px] md:text-[8px] font-black text-[#fcc200] uppercase tracking-widest mt-1">{item.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}