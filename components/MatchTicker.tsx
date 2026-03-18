'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { motion } from 'framer-motion'

export default function MatchTicker() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [width, setWidth] = useState(0)
  const carousel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTickerData = async () => {
      const { data: ultimosJugados } = await supabase
        .from('partidos')
        .select('jornada')
        .eq('jugado', true)
        .order('jornada', { ascending: false })
        .limit(1)

      const ultimaJornada = ultimosJugados && ultimosJugados.length > 0 ? ultimosJugados[0].jornada : 0
      const jornadasAMostrar = ultimaJornada === 0 ? [1] : [ultimaJornada, ultimaJornada + 1]

      const { data } = await supabase
        .from('partidos')
        .select(`*, local:equipo_local_id(nombre, escudo_url), visita:equipo_visita_id(nombre, escudo_url)`)
        .in('jornada', jornadasAMostrar)
        // 🔥 EL TRUCO DEL ORDEN: 
        // Primero J6 (descendente), luego J5. Y dentro de cada una, ordenadas por hora (ascendente).
        .order('jornada', { ascending: false })
        .order('fecha', { ascending: true })

      if (data) setPartidos(data)
    }
    fetchTickerData()
  }, [])

  // 🔥 EL FIX DEL DRAG: Recalcular el ancho de forma robusta
  useEffect(() => {
    const calculateWidth = () => {
      if (carousel.current) {
        setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth)
      }
    }
    
    // Un mini-delay para asegurar que React ya pintó las imágenes y el tamaño es real
    const timer = setTimeout(calculateWidth, 150)
    
    window.addEventListener('resize', calculateWidth)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculateWidth)
    }
  }, [partidos])

  return (
    <div className="bg-[#0a0a0a] border-b border-white/5 py-8 overflow-hidden selection:bg-transparent">
      <motion.div 
        ref={carousel} 
        className="cursor-grab active:cursor-grabbing px-12 overflow-hidden" 
        whileTap={{ cursor: "grabbing" }}
      >
        <motion.div 
          drag="x" 
          dragConstraints={{ right: 0, left: -width }}
          dragElastic={0.15} 
          dragTransition={{ bounceStiffness: 400, bounceDamping: 20 }} 
          // 🔥 EL FIX VISUAL: w-max obliga al div a envolver exactamente las tarjetas y no trabarse
          className="flex gap-6 w-max"
        >
          {partidos.map((partido) => (
            <div 
              key={partido.id} 
              className={`min-w-[300px] bg-[#141414] border rounded-[2.5rem] p-6 shadow-2xl pointer-events-none transition-colors ${
                partido.jugado ? 'border-white/5 opacity-70' : 'border-[#fcc200]/30'
              }`}
            >
              <div className="flex justify-between items-center mb-5 text-[9px] font-black uppercase italic tracking-[0.2em]">
                <span className={partido.jugado ? 'text-zinc-500' : 'text-[#fcc200]'}>
                  {partido.jugado ? 'Finalizado' : `Jornada ${partido.jornada}`}
                </span>
                <span className="text-zinc-700 font-bold uppercase">Split 3</span>
              </div>

              <div className="space-y-5">
                {/* LOCAL */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={partido.local?.escudo_url} className="w-7 h-7 object-contain" alt="" />
                    <span className={`text-xs font-black uppercase tracking-tight ${partido.jugado && partido.goles_local < partido.goles_visita ? 'text-zinc-600' : 'text-white'}`}>
                      {partido.local?.nombre}
                    </span>
                  </div>
                  <span className={`text-sm font-black italic ${partido.jugado ? 'text-white' : 'text-zinc-600'}`}>
                    {partido.jugado ? partido.goles_local : '-'}
                  </span>
                </div>

                {/* VISITA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={partido.visita?.escudo_url} className="w-7 h-7 object-contain" alt="" />
                    <span className={`text-xs font-black uppercase tracking-tight ${partido.jugado && partido.goles_visita < partido.goles_local ? 'text-zinc-600' : 'text-white'}`}>
                      {partido.visita?.nombre}
                    </span>
                  </div>
                  <span className={`text-sm font-black italic ${partido.jugado ? 'text-white' : 'text-zinc-600'}`}>
                    {partido.jugado ? partido.goles_visita : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}