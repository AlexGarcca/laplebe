'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MatchTicker() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    if (!el) return

    // Permite usar rueda/touchpad vertical para desplazarse horizontalmente por la tira.
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollBy({ left: e.deltaY, behavior: 'smooth' })
    }
  }

  const updateArrows = () => {
    const el = scrollerRef.current
    if (!el) return

    const maxLeft = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < maxLeft - 4)
  }

  const scrollByPage = (dir: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return

    const amount = Math.max(260, Math.floor(el.clientWidth * 0.74))
    const delta = dir === 'left' ? -amount : amount
    el.scrollBy({ left: delta, behavior: 'smooth' })
    window.setTimeout(updateArrows, 220)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollByPage('left')
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollByPage('right')
    }
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    updateArrows()
    const onScroll = () => updateArrows()
    const onResize = () => updateArrows()

    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [partidos])

  return (
    <div className="bg-[#0a0a0a] border-b border-white/5 py-3 md:py-4 overflow-hidden selection:bg-transparent">
      <div className="relative">
        <button
          onClick={() => scrollByPage('left')}
          className={`hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full border bg-black/60 transition-all ${canScrollLeft ? 'border-white/10 text-zinc-300 hover:text-[#fcc200] hover:border-[#fcc200]/40 opacity-100 pointer-events-auto' : 'border-transparent text-transparent opacity-0 pointer-events-none'}`}
          aria-label="Desplazar partidos a la izquierda"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => scrollByPage('right')}
          className={`hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full border bg-black/60 transition-all ${canScrollRight ? 'border-white/10 text-zinc-300 hover:text-[#fcc200] hover:border-[#fcc200]/40 opacity-100 pointer-events-auto' : 'border-transparent text-transparent opacity-0 pointer-events-none'}`}
          aria-label="Desplazar partidos a la derecha"
        >
          <ChevronRight size={16} />
        </button>

        <div className="pointer-events-none absolute left-0 top-0 h-full w-10 sm:w-14 bg-linear-to-r from-[#0a0a0a] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:w-14 bg-linear-to-l from-[#0a0a0a] to-transparent z-10" />

        <div
          ref={scrollerRef}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="px-4 sm:px-8 md:px-12 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
          aria-label="Tira de partidos"
        >
          <div className="flex gap-3.5 sm:gap-4 w-max">
            {partidos.map((partido, index) => (
              <motion.div
                key={partido.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={`snap-start min-w-[72vw] sm:min-w-70 md:min-w-72 bg-[#141414] border rounded-[1.6rem] sm:rounded-[1.8rem] px-4 py-3 sm:px-5 sm:py-3.5 shadow-xl transition-colors ${
                  partido.jugado ? 'border-white/6 opacity-80' : 'border-[#fcc200]/35'
                }`}
              >
                <div className="flex justify-between items-center mb-3 text-[8px] font-black uppercase italic tracking-[0.2em]">
                  <span className={partido.jugado ? 'text-zinc-500' : 'text-[#fcc200]'}>
                    {partido.jugado ? 'Finalizado' : `Jornada ${partido.jornada}`}
                  </span>
                  <span className="text-zinc-700 font-bold uppercase">Split 3</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={partido.local?.escudo_url} className="w-6 h-6 object-contain shrink-0" alt="" />
                      <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight truncate ${partido.jugado && partido.goles_local < partido.goles_visita ? 'text-zinc-600' : 'text-white'}`}>
                        {partido.local?.nombre}
                      </span>
                    </div>
                    <span className={`text-xs sm:text-sm font-black italic shrink-0 ${partido.jugado ? 'text-white' : 'text-zinc-600'}`}>
                      {partido.jugado ? partido.goles_local : '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={partido.visita?.escudo_url} className="w-6 h-6 object-contain shrink-0" alt="" />
                      <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight truncate ${partido.jugado && partido.goles_visita < partido.goles_local ? 'text-zinc-600' : 'text-white'}`}>
                        {partido.visita?.nombre}
                      </span>
                    </div>
                    <span className={`text-xs sm:text-sm font-black italic shrink-0 ${partido.jugado ? 'text-white' : 'text-zinc-600'}`}>
                      {partido.jugado ? partido.goles_visita : '-'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}