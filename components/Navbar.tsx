'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  
  const links = [
    { name: 'Calendario', href: '/partidos' },
    { name: 'Posiciones', href: '/clasificacion' },
    { name: 'Estadísticas', href: '/estadisticas' },
  ]

  return (
    <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-6 md:px-8 py-5 flex items-center justify-between">
      {/* LOGO */}
      <Link href="/" className="flex items-center gap-4 group">
        <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
          <img src="/LOGO_PNG.png" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(252,194,0,0.3)]" alt="Logo" />
        </div>
        <div className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#fcc200] transition-colors">
          Plebeians <span className="text-[#fcc200]">League</span>
        </div>
      </Link>

      {/* DESKTOP NAV */}
      <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 items-center">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-[#fcc200] transition-colors">
            {link.name}
          </Link>
        ))}
        <Link href="/login" className="ml-6 px-6 py-2.5 bg-[#fcc200] text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(252,194,0,0.2)]">
          Portal Presis
        </Link>
      </div>

      {/* MOBILE BURGER */}
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#fcc200]">
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-3xl border-b border-white/5 p-8 flex flex-col gap-6 md:hidden"
          >
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className="text-2xl font-black uppercase italic text-white hover:text-[#fcc200] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="mt-4 py-4 bg-[#fcc200] text-black text-center font-black uppercase italic rounded-2xl text-lg"
            >
              Portal Presis
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}