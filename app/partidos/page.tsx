'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Navbar from '@/components/Navbar'
import { FadeInUp, RevealSection, SharedPageTitle, SharedMetaBadge } from '@/components/AnimatedWrappers'

export default function CalendarioPage() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [jornadaActual, setJornadaActual] = useState(1)
  const [loading, setLoading] = useState(true)
  const jornadasScrollRef = useRef<HTMLDivElement>(null)

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

  const handleJornadasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = jornadasScrollRef.current
    if (!el) return

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollBy({ left: e.deltaY, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      <Navbar />
      <MatchTicker />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10 md:py-16">
        <header className="mb-9 text-center">
          <FadeInUp>
            <SharedPageTitle layoutId="shared-page-title" className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-3 leading-tight">
              Calendario <span className="text-[#fcc200]">Plebe</span>
            </SharedPageTitle>
            <SharedMetaBadge layoutId="shared-page-kicker" className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">Temporada 2026 • Split 3</SharedMetaBadge>
          </FadeInUp>
        </header>

        {/* SELECTOR DE JORNADAS */}
        <div
          ref={jornadasScrollRef}
          onWheel={handleJornadasWheel}
          className="flex justify-start md:justify-center gap-2 mb-8 overflow-x-auto pb-3 scrollbar-hide px-2 snap-x snap-mandatory"
        >
          {jornadas.map((j) => (
            <motion.button
              key={j}
              onClick={() => setJornadaActual(j)}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className={`flex-none w-12 h-12 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center ${
                jornadaActual === j 
                ? 'bg-[#fcc200] text-black shadow-lg shadow-[#fcc200]/20 scale-110' 
                : 'bg-[#141414] text-zinc-500 border border-white/5 hover:border-white/20 hover:text-white'
              } snap-start`}
            >
              J{j}
            </motion.button>
          ))}
        </div>

        {/* LISTA DE PARTIDOS REDISEÑADA */}
        <RevealSection>
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 text-zinc-700 font-black uppercase tracking-[0.3em] text-xs"
              >
                Sincronizando...
              </motion.div>
            ) : (
              <motion.div 
                key={jornadaActual}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-2.5"
              >
                {partidos.map((partido) => {
                  const localGana = partido.goles_local > partido.goles_visita;
                  const visitaGana = partido.goles_visita > partido.goles_local;

                  return (
                    <motion.div
                      key={partido.id}
                      whileHover={{ y: -2, scale: 1.004 }}
                      transition={{ type: 'spring', stiffness: 230, damping: 20, mass: 0.9 }}
                      className="bg-[#141414] border border-white/5 rounded-2xl p-3.5 md:p-4.5 hover:border-[#fcc200]/30 transition-all group overflow-hidden"
                    >
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4.5">
                        
                        {/* LOCAL */}
                        <div className="flex items-center justify-end gap-2 md:gap-4 text-right">
                          <span className={`text-[10px] md:text-[15px] font-black uppercase italic tracking-tight transition-colors leading-tight ${localGana ? 'text-white' : 'text-zinc-500'}`}>
                            {partido.local?.nombre}
                          </span>
                          <div className={`relative ${localGana ? 'scale-110' : 'opacity-50 scale-90'} transition-all`}>
                            <img src={partido.local?.escudo_url} className="w-9 h-9 md:w-12 md:h-12 object-contain" alt="" />
                            {localGana && <div className="absolute -inset-1 bg-[#fcc200]/20 blur-xl rounded-full -z-10" />}
                          </div>
                        </div>

                        {/* SCORE / TIEMPO */}
                        <div className="flex flex-col items-center justify-center min-w-16 md:min-w-24 px-2 py-1.5 bg-black/40 rounded-xl border border-white/5">
                          {partido.jugado ? (
                            <div className="flex items-center gap-1 md:gap-2 text-lg md:text-3xl font-black italic tracking-tighter">
                              <span className={localGana ? 'text-[#fcc200]' : 'text-white'}>{partido.goles_local}</span>
                              <span className="text-zinc-800 text-xs md:text-xl">-</span>
                              <span className={visitaGana ? 'text-[#fcc200]' : 'text-white'}>{partido.goles_visita}</span>
                            </div>
                          ) : (
                            <span className="text-[8px] md:text-[10px] font-black text-[#fcc200] uppercase tracking-widest">
                              {partido.fecha ? new Date(partido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                            </span>
                          )}
                          <span className="text-[6px] md:text-[7px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1 text-center">ESTADIO PLEBE</span>
                        </div>

                        {/* VISITA */}
                        <div className="flex items-center justify-start gap-2 md:gap-4 text-left">
                          <div className={`relative ${visitaGana ? 'scale-110' : 'opacity-50 scale-90'} transition-all`}>
                            <img src={partido.visita?.escudo_url} className="w-9 h-9 md:w-12 md:h-12 object-contain" alt="" />
                            {visitaGana && <div className="absolute -inset-1 bg-[#fcc200]/20 blur-xl rounded-full -z-10" />}
                          </div>
                          <span className={`text-[10px] md:text-[15px] font-black uppercase italic tracking-tight transition-colors leading-tight ${visitaGana ? 'text-white' : 'text-zinc-500'}`}>
                            {partido.visita?.nombre}
                          </span>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </RevealSection>
      </main>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}