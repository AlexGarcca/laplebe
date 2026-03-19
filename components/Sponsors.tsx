'use client'
import Image from 'next/image'
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
    <section className="w-full bg-[#0a0a0a] py-16 md:py-28 border-t border-white/5 relative overflow-hidden">
      {/* Resplandor de fondo sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[#fcc200]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <FadeInUp>
          {/* TITLE PARTNER */}
          <div className="flex flex-col items-center mb-14 md:mb-20">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-full max-w-195 flex flex-col items-center gap-4 md:gap-6"
            >
              <div className="relative w-full aspect-16/8 sm:aspect-16/7">
                <Image
                  src={sponsors.title.logo}
                  alt={sponsors.title.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 780px"
                  className="object-cover opacity-95 drop-shadow-[0_0_20px_rgba(252,194,0,0.08)]"
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.42em] sm:tracking-[0.5em] text-zinc-500 italic text-center">{sponsors.title.label}</span>
            </motion.div>
          </div>

          {/* GRID DE SOCIOSsossos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-y-10 sm:gap-y-12 gap-x-6 md:gap-x-8 items-end justify-items-center">
            
            {/* TECHNICAL PARTNERrs */}
            <div className="w-full max-w-95 flex flex-col items-center gap-4">
              <div className="relative w-full aspect-16/8 sm:aspect-16/7">
                <Image
                  src={sponsors.technical.logo}
                  alt={sponsors.technical.name}
                  fill
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 18vw"
                  className="object-cover opacity-85 hover:opacity-100 hover:scale-[1.02] transition-all duration-300"
                />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.32em] text-zinc-600 text-center">{sponsors.technical.label}</span>
            </div>

            {/* RESTO DE PARTNERS */}
            {sponsors.others.map((s, i) => (
              <div key={i} className="w-full max-w-95 flex flex-col items-center gap-4">
                <div className="relative w-full aspect-16/8 sm:aspect-16/7">
                  <Image
                    src={s.logo}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 18vw"
                    className="object-cover opacity-85 hover:opacity-100 hover:scale-[1.02] transition-all duration-300"
                  />
                </div>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.32em] text-zinc-600 text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}