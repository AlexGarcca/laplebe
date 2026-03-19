'use client'
import { motion } from 'framer-motion'
import { FadeInUp } from './AnimatedWrappers'

const sponsors = {
  title: { name: 'Amor', logo: '/Sponsors/amor.png', label: 'Title Partner' },
  technical: { name: 'Golxlaedu2', logo: '/Sponsors/golxlaedu2.png', label: 'Technical Partner' },
  others: [
    { name: 'Chaman', logo: '/Sponsors/chaman.jpeg', label: 'Principal Partner' },
    { name: 'Drogon', logo: '/Sponsors/drogon.png', label: 'Principal Partner' },
    { name: 'Morenoyprt', logo: '/Sponsors/morenoyprt.png', label: 'Main Partner' },
    { name: 'Jaibalo', logo: '/Sponsors/jaibalo.png', label: 'Main Partner' },
  ]
}

export default function Sponsors() {
  return (
    <section className="w-full bg-[#0a0a0a] py-32 border-t border-white/5 relative overflow-hidden">
      {/* Resplandor de fondo sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[#fcc200]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeInUp>
          {/* TITLE PARTNER */}
          <div className="flex flex-col items-center mb-24">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-6"
            >
              <img src={sponsors.title.logo} alt={sponsors.title.name} className="h-18 md:h-24 lg:h-28 w-auto object-contain opacity-95 drop-shadow-[0_0_20px_rgba(252,194,0,0.08)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic ml-2">{sponsors.title.label}</span>
            </motion.div>
          </div>

          {/* GRID DE SOCIOS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-16 gap-x-8 items-end justify-items-center">
            
            {/* TECHNICAL PARTNER */}
            <div className="flex flex-col items-center gap-5">
              <img src={sponsors.technical.logo} alt={sponsors.technical.name} className="h-12 md:h-16 lg:h-18 w-auto object-contain opacity-80 hover:opacity-100 hover:scale-105 transition-all" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 text-center">{sponsors.technical.label}</span>
            </div>

            {/* RESTO DE PARTNERS */}
            {sponsors.others.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-5">
                <img src={s.logo} alt={s.name} className="h-12 md:h-16 lg:h-18 w-auto object-contain opacity-80 hover:opacity-100 hover:scale-105 transition-all" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}