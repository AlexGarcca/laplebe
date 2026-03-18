'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Navbar from '@/components/Navbar'
import { FadeInUp } from '@/components/AnimatedWrappers'

export default function CalendarioPage() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [jornadaActual, setJornadaActual] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartidos = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('partidos')
        .select(`
          *,
          local:equipo_local_id (nombre, escudo_url, color_hex),
          visita:equipo_visita_id (nombre, escudo_url, color_hex)
        `)
        .eq('jornada', jornadaActual)
        .order('fecha', { ascending: true })

      if (data) setPartidos(data)
      setLoading(false)
    }
    fetchPartidos()
  }, [jornadaActual])

  const jornadas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] 

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      {/* NAVBAR UNIFICADO (Ya incluye el menú de hamburguesa) */}
      <Navbar />

      <MatchTicker />

      <main className="max-w-5xl mx-auto p-6 md:p-12 md:py-20">
        <header className="mb-12 text-center">
          <FadeInUp>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-6">
              Calendario <span className="text-[#fcc200]">Plebe</span>
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">Temporada 2026 • Split 3</p>
          </FadeInUp>
        </header>

        {/* SELECTOR DE JORNADAS RESPONSIVO */}
        <div className="flex justify-start md:justify-center gap-2 mb-16 overflow-x-auto pb-6 scrollbar-hide px-2">
          {jornadas.map((j) => (
            <button
              key={j}
              onClick={() => setJornadaActual(j)}
              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                jornadaActual === j 
                ? 'bg-[#fcc200] text-black shadow-xl scale-110' 
                : 'bg-[#141414] text-zinc-500 hover:text-white border border-white/5'
              }`}
            >
              J{j}
            </button>
          ))}
        </div>

        {/* LISTA DE PARTIDOS */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 text-zinc-700 font-black uppercase tracking-[0.3em]"
              >
                Sincronizando Jornada...
              </motion.div>
            ) : (
              <motion.div 
                key={jornadaActual}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6"
              >
                {partidos.map((partido) => (
                  <div 
                    key={partido.id}
                    className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#fcc200]/20 transition-all group shadow-2xl"
                  >
                    {/* LOCAL */}
                    <div className="flex flex-1 items-center justify-end gap-4 md:gap-6 text-right w-full md:w-auto order-2 md:order-1">
                      <span className="text-sm md:text-xl font-black uppercase italic tracking-tighter group-hover:text-[#fcc200] transition-colors">
                        {partido.local?.nombre}
                      </span>
                      <img src={partido.local?.escudo_url} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" alt="" />
                    </div>

                    {/* SCORE / INFO */}
                    <div className="flex flex-col items-center gap-1 order-1 md:order-2 px-6 py-3 bg-black/40 rounded-3xl border border-white/5 min-w-30">
                      {partido.jugado ? (
                        <div className="text-3xl md:text-5xl font-black italic tracking-tighter flex items-center gap-3">
                          <span className={partido.goles_local > partido.goles_visita ? 'text-[#fcc200]' : 'text-white'}>{partido.goles_local}</span>
                          <span className="text-zinc-800 text-xl">-</span>
                          <span className={partido.goles_visita > partido.goles_local ? 'text-[#fcc200]' : 'text-white'}>{partido.goles_visita}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#fcc200]">
                          {partido.fecha ? new Date(partido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                        </div>
                      )}
                      <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Estadio Plebe</span>
                    </div>

                    {/* VISITA */}
                    <div className="flex flex-1 items-center justify-start gap-4 md:gap-6 w-full md:w-auto order-3">
                      <img src={partido.visita?.escudo_url} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" alt="" />
                      <span className="text-sm md:text-xl font-black uppercase italic tracking-tighter group-hover:text-[#fcc200] transition-colors">
                        {partido.visita?.nombre}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Estilo para ocultar scrollbar en el selector de jornadas */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}