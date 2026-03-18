'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Link from 'next/link'
import { FadeInUp } from '@/components/AnimatedWrappers'

export default function CalendarioPage() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [jornadaActual, setJornadaActual] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPartidos = async () => {
      setLoading(true)
      const { data, error } = await supabase
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
      
      {/* NAVBAR ELITE (Universal) */}
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-8 py-5 flex items-center justify-between">
        
        {/* LOGO Y TÍTULO (Botón de Inicio) */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
            <img 
              src="/LOGO_PNG.png" 
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(252,194,0,0.3)]" 
              alt="Logo Plebeians League" 
            />
          </div>
          <div className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#fcc200] transition-colors">
            Plebeians <span className="text-[#fcc200]">League</span>
          </div>
        </Link>

        {/* MENÚ DE NAVEGACIÓN */}
        <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 items-center">
          <Link href="/partidos" className="text-[#fcc200] border-b border-[#fcc200]/50 pb-1">Calendario</Link>
          <Link href="/clasificacion" className="hover:text-[#fcc200] transition-colors">Posiciones</Link>
          <Link href="/estadisticas" className="hover:text-[#fcc200] transition-colors">Estadísticas</Link>
          
          <Link href="/login" className="ml-6 px-6 py-2.5 bg-[#fcc200] text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(252,194,0,0.2)]">
            Portal Presis
          </Link>
        </div>
      </nav>

      <MatchTicker />

      <main className="max-w-5xl mx-auto p-8 md:py-20">
        <header className="mb-16 text-center">
          <FadeInUp>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-6">
              Calendario de <span className="text-[#fcc200]">Partidos</span>
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">Temporada 2026 • Split 3</p>
          </FadeInUp>
        </header>

        {/* SELECTOR DE JORNADAS */}
        <div className="flex justify-center gap-2 mb-20 overflow-x-auto pb-4 scrollbar-hide px-4">
          {jornadas.map((j) => (
            <button
              key={j}
              onClick={() => setJornadaActual(j)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                jornadaActual === j 
                ? 'bg-[#fcc200] text-black shadow-[0_0_20px_rgba(252,194,0,0.3)] scale-110' 
                : 'bg-[#141414] text-zinc-500 hover:text-white border border-white/5'
              }`}
            >
              J{j}
            </button>
          ))}
        </div>

        {/* LISTA DE PARTIDOS ANIMADA */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20 text-zinc-700 font-black uppercase tracking-[0.3em]"
              >
                Cargando Jornada...
              </motion.div>
            ) : (
              <motion.div 
                key={jornadaActual}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-4"
              >
                {partidos.map((partido) => (
                  <div 
                    key={partido.id}
                    className="bg-[#141414] border border-white/5 rounded-4xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-[#fcc200]/20 transition-all group shadow-2xl"
                  >
                    {/* EQUIPO LOCAL */}
                    <div className="flex flex-1 items-center justify-end gap-6 text-right order-2 md:order-1">
                      <span className="text-sm md:text-xl font-black uppercase italic tracking-tighter group-hover:text-[#fcc200] transition-colors">
                        {partido.local?.nombre}
                      </span>
                      <img src={partido.local?.escudo_url} className="w-14 h-14 object-contain drop-shadow-lg" alt="" />
                    </div>

                    {/* MARCADOR / INFO */}
                    <div className="flex flex-col items-center gap-2 order-1 md:order-2 px-8 py-4 bg-black/40 rounded-3xl border border-white/5 min-w-35">
                      {partido.jugado ? (
                        <div className="text-3xl md:text-5xl font-black italic tracking-tighter flex items-center gap-4">
                          <span>{partido.goles_local}</span>
                          <span className="text-[#fcc200] text-xl">:</span>
                          <span>{partido.goles_visita}</span>
                        </div>
                      ) : (
                        <div className="text-xs font-black uppercase tracking-widest text-[#fcc200]">
                          {partido.fecha ? new Date(partido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                        </div>
                      )}
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Estadio de la Plebeians</span>
                    </div>

                    {/* EQUIPO VISITA */}
                    <div className="flex flex-1 items-center justify-start gap-6 order-3">
                      <img src={partido.visita?.escudo_url} className="w-14 h-14 object-contain drop-shadow-lg" alt="" />
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
    </div>
  )
}