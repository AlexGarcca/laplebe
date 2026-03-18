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
      
      <Navbar />
      <MatchTicker />

      <main className="max-w-4xl mx-auto p-4 md:p-12 md:py-20">
        <header className="mb-12 text-center">
          <FadeInUp>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-4">
              Calendario <span className="text-[#fcc200]">Plebe</span>
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">Temporada 2026 • Split 3</p>
          </FadeInUp>
        </header>

        {/* SELECTOR DE JORNADAS */}
        <div className="flex justify-start md:justify-center gap-2 mb-10 overflow-x-auto pb-6 scrollbar-hide px-2">
          {jornadas.map((j) => (
            <button
              key={j}
              onClick={() => setJornadaActual(j)}
              className={`flex-none w-12 h-12 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center ${
                jornadaActual === j 
                ? 'bg-[#fcc200] text-black shadow-lg shadow-[#fcc200]/20 scale-110' 
                : 'bg-[#141414] text-zinc-500 border border-white/5 hover:border-white/20'
              }`}
            >
              J{j}
            </button>
          ))}
        </div>

        {/* LISTA DE PARTIDOS REDISEÑADA */}
        <div className="space-y-4">
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
                className="grid gap-3"
              >
                {partidos.map((partido) => {
                  const localGana = partido.goles_local > partido.goles_visita;
                  const visitaGana = partido.goles_visita > partido.goles_local;

                  return (
                    <div 
                      key={partido.id}
                      className="bg-[#141414] border border-white/5 rounded-3xl p-4 md:p-6 hover:border-[#fcc200]/30 transition-all group overflow-hidden"
                    >
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6">
                        
                        {/* LOCAL */}
                        <div className="flex items-center justify-end gap-2 md:gap-4 text-right">
                          <span className={`text-[10px] md:text-lg font-black uppercase italic tracking-tighter transition-colors leading-tight ${localGana ? 'text-white' : 'text-zinc-500'}`}>
                            {partido.local?.nombre}
                          </span>
                          <div className={`relative ${localGana ? 'scale-110' : 'opacity-50 scale-90'} transition-all`}>
                            <img src={partido.local?.escudo_url} className="w-10 h-10 md:w-16 md:h-16 object-contain" alt="" />
                            {localGana && <div className="absolute -inset-1 bg-[#fcc200]/20 blur-xl rounded-full -z-10" />}
                          </div>
                        </div>

                        {/* SCORE / TIEMPO */}
                        <div className="flex flex-col items-center justify-center min-w-17.5 md:min-w-30 px-2 py-2 bg-black/40 rounded-2xl border border-white/5">
                          {partido.jugado ? (
                            <div className="flex items-center gap-1 md:gap-3 text-xl md:text-4xl font-black italic tracking-tighter">
                              <span className={localGana ? 'text-[#fcc200]' : 'text-white'}>{partido.goles_local}</span>
                              <span className="text-zinc-800 text-sm md:text-2xl">-</span>
                              <span className={visitaGana ? 'text-[#fcc200]' : 'text-white'}>{partido.goles_visita}</span>
                            </div>
                          ) : (
                            <span className="text-[9px] md:text-xs font-black text-[#fcc200] uppercase tracking-widest">
                              {partido.fecha ? new Date(partido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                            </span>
                          )}
                          <span className="text-[6px] md:text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1 text-center">ESTADIO PLEBE</span>
                        </div>

                        {/* VISITA */}
                        <div className="flex items-center justify-start gap-2 md:gap-4 text-left">
                          <div className={`relative ${visitaGana ? 'scale-110' : 'opacity-50 scale-90'} transition-all`}>
                            <img src={partido.visita?.escudo_url} className="w-10 h-10 md:w-16 md:h-16 object-contain" alt="" />
                            {visitaGana && <div className="absolute -inset-1 bg-[#fcc200]/20 blur-xl rounded-full -z-10" />}
                          </div>
                          <span className={`text-[10px] md:text-lg font-black uppercase italic tracking-tighter transition-colors leading-tight ${visitaGana ? 'text-white' : 'text-zinc-500'}`}>
                            {partido.visita?.nombre}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}