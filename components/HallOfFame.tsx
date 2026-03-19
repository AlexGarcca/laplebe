'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { motion } from 'framer-motion'

export default function HallOfFame() {
  const [leaders, setLeaders] = useState<any>({ goles: null, asistencias: null, mvp: null })

  useEffect(() => {
    async function getLeaders() {
      // 1. Líder de Goles
      const { data: goles } = await supabase.from('registro_goles').select('jugadores(nombre, equipos(nombre, escudo_url))')
      // 2. Líder de Asistencias
      const { data: asis } = await supabase.from('registro_asistencias').select('jugadores(nombre, equipos(nombre, escudo_url))')
      // 3. Líder de MVPs
      const { data: mvp } = await supabase.from('registro_mvp').select('jugadores(nombre, equipos(nombre, escudo_url))')

      setLeaders({
        goles: processTop(goles ?? []),
        asistencias: processTop(asis ?? []),
        mvp: processTop(mvp ?? [])
      })
    }
    getLeaders()
  }, [])

  const processTop = (raw: any[]) => {
    if (!raw || raw.length === 0) return null
    const counts: any = {}
    raw.forEach(item => {
      const name = item.jugadores.nombre
      if (!counts[name]) counts[name] = { ...item.jugadores, count: 0 }
      counts[name].count++
    })
    return Object.values(counts).sort((a: any, b: any) => b.count - a.count)[0]
  }

  const cards = [
    { title: 'Pichichi', data: leaders.goles, label: 'Goles', color: 'from-yellow-500' },
    { title: 'Asistente', data: leaders.asistencias, label: 'Asis', color: 'from-blue-500' },
    { title: 'El King (MVP)', data: leaders.mvp, label: 'Premios', color: 'from-[#fcc200]' },
  ]

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">
          Salón de la <span className="text-[#fcc200]">Fama</span>
        </h2>
        <p className="text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[9px] sm:text-[10px] font-bold mt-4">Los mejores del 3er Split</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="relative group cursor-pointer"
          >
            <div className={`absolute -inset-1 bg-linear-to-b ${card.color} to-transparent opacity-20 group-hover:opacity-40 blur transition rounded-[3rem]`} />
            <div className="relative bg-[#141414] border border-white/5 rounded-[2.2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-10 flex flex-col items-center shadow-2xl overflow-hidden">
              
              <div className="absolute top-5 right-6 sm:top-6 sm:right-8 text-3xl sm:text-4xl font-black italic text-white/5 uppercase">#{i+1}</div>
              
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">{card.title}</span>
              
              {card.data ? (
                <>
                  <img src={card.data.equipos.escudo_url} className="w-24 h-24 object-contain mb-6 drop-shadow-[0_0_20px_rgba(252,194,0,0.4)]" alt="Shield" />
                  <h3 className="text-2xl font-black uppercase italic text-white mb-2">{card.data.nombre}</h3>
                  <p className="text-xs font-bold text-[#fcc200] uppercase tracking-tighter mb-6">{card.data.equipos.nombre}</p>
                  
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black italic text-white tracking-tighter">{card.data.count}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase pb-2">{card.label}</span>
                  </div>
                </>
              ) : (
                <div className="py-10 text-zinc-800 font-bold italic uppercase">Cargando Leyenda...</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}