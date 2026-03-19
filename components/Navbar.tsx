'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Settings, LayoutDashboard, LogOut, Twitter, MessageSquare, Coins } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { supabase } from '@/app/lib/supabase'

const ADMIN_USER_IDS = new Set([
  '09c83b94-132f-4711-8009-0aa427d8df84',
])

const ADMIN_EMAILS = new Set([
  'garcca29@gmail.com',
  'sanchez_24399@hotmail.com',
])

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const links = [
    { name: 'Calendario', href: '/partidos' },
    { name: 'Posiciones', href: '/clasificacion' },
    { name: 'Estadísticas', href: '/estadisticas' },
    { name: 'Clubes', href: '/clubes' },
    { name: 'BET-ALV', href: '/bet-alv' },
  ]

  const userEmail = user?.email?.toLowerCase() || ''
  const isAdmin = !!user && (ADMIN_USER_IDS.has(user.id) || ADMIN_EMAILS.has(userEmail))

  useEffect(() => {
    const fetchPerfil = async () => {
      if (user) {
        const { data } = await supabase
          .from('perfiles_presidentes')
          .select('*, equipos(*)')
          .eq('id', user.id)
          .single()
        if (data) setPerfil(data)
      } else {
        setPerfil(null)
      }
    }
    fetchPerfil()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    setIsOpen(false)
  }

  return (
    <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-4 sm:px-6 md:px-7 lg:px-8 py-4 md:py-4.5 flex items-center justify-between">
      
      {/* LOGO LIGA */}
      <Link href="/" className="flex items-center gap-2 sm:gap-3 group cursor-pointer min-w-0 shrink-0">
        <motion.div layoutId="shared-league-logo" className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110">
          <img src="/LOGO_PNG.png" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(252,194,0,0.3)]" alt="Logo" />
        </motion.div>
        <motion.div layoutId="shared-league-wordmark" className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-black italic tracking-tight text-white uppercase group-hover:text-[#fcc200] transition-colors whitespace-nowrap">
          Plebeians <span className="text-[#fcc200] hidden sm:inline">League</span>
          <span className="text-[#fcc200] sm:hidden">Lg</span>
        </motion.div>
      </Link>

      {/* DESKTOP NAV */}
      <div className="hidden md:flex gap-6 lg:gap-7 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500 items-center min-w-0">
        {links.map((link) => (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`transition-colors cursor-pointer ${link.name === 'BET-ALV' ? 'text-[#fcc200]/60 hover:text-[#fcc200]' : 'hover:text-[#fcc200]'}`}
            
          >
            {link.name}
          </Link>
        ))}

        {/* 🔗 REDES SOCIALES DESKTOP */}
        <div className="flex items-center gap-4 ml-4 border-l border-white/10 pl-6">
          <a href="https://x.com/PlebeiansLeague" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            <Twitter size={16} />
          </a>
          <a href="https://discord.gg/fPBxSdXCWt" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] transition-colors">
            <MessageSquare size={16} />
          </a>
        </div>

        <div className="flex items-center gap-4 ml-4">
          {isAdmin && (
            <>
              <Link
                href="/admin-jugadores"
                className="px-3 py-2 rounded-full border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/10 transition-colors text-[9px] font-black uppercase tracking-widest"
              >
                Admin Jugadores
              </Link>
              <Link 
                href="/admin-plebe" 
                className="p-2 text-zinc-700 hover:text-[#fcc200] transition-all hover:rotate-90 duration-500 cursor-pointer"
                title="Panel Admin"
              >
                <Settings size={18} />
              </Link>
            </>
          )}

          {!loading && (
            user && perfil?.equipos ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                {typeof perfil?.saldo_bet === 'number' && (
                  <motion.div
                    layoutId="shared-bet-saldo"
                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-full bg-[#fcc200]/10 border border-[#fcc200]/20"
                  >
                    <Coins size={12} className="text-[#fcc200]" />
                    <span className="text-[10px] font-black text-white tracking-widest">{perfil.saldo_bet}M</span>
                  </motion.div>
                )}
                <Link href="/vestidor" className="flex items-center gap-3 group cursor-pointer">
                  <div className="text-right hidden lg:block">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Tu Vestidor</p>
                    <p className="text-[10px] font-black text-white uppercase italic group-hover:text-[#fcc200] transition-colors">{perfil.equipos.nombre}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1.5 group-hover:border-[#fcc200]/50 transition-all">
                    <img src={perfil.equipos.escudo_url} className="w-full h-full object-contain" alt="Escudo" />
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors cursor-pointer hover:scale-110 active:scale-90"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="px-6 py-2.5 bg-[#fcc200] text-black rounded-full font-black uppercase italic text-[10px] tracking-widest hover:scale-105 transition-all cursor-pointer">
                Portal Presis
              </Link>
            )
          )}
        </div>
      </div>

      {/* MOBILE BURGER */}
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#fcc200] cursor-pointer">
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-3xl border-b border-white/5 p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 md:hidden"
          >
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsOpen(false)} 
                className={`text-xl sm:text-2xl font-black uppercase italic cursor-pointer ${link.name === 'BET-ALV' ? 'text-[#fcc200]' : 'text-white'}`}
              >
                {link.name}
              </Link>
            ))}

            {/* 🔗 REDES SOCIALES MOBILE */}
            <div className="flex gap-8 py-4 border-y border-white/5 justify-center">
              <a href="https://x.com/PlebeiansLeague" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#fcc200]">
                <Twitter size={24} />
              </a>
              <a href="https://discord.gg/fPBxSdXCWt" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#5865F2]">
                <MessageSquare size={24} />
              </a>
            </div>

            {user && perfil?.equipos ? (
              <>
                <Link href="/vestidor" onClick={() => setIsOpen(false)} className="mt-4 p-4 sm:p-6 bg-white/5 border border-white/10 rounded-4xl flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <img src={perfil.equipos.escudo_url} className="w-12 h-12 object-contain" alt="" />
                    <p className="text-base sm:text-xl font-black text-white uppercase italic">{perfil.equipos.nombre}</p>
                  </div>
                  <LayoutDashboard className="text-[#fcc200]" size={24} />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 border border-rose-500/20 text-rose-500 font-black uppercase italic rounded-2xl flex items-center justify-center gap-3 cursor-pointer"
                >
                  <LogOut size={20} /> Cerrar Sesión
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="mt-4 py-4 bg-[#fcc200] text-black text-center font-black uppercase italic rounded-2xl text-lg cursor-pointer">
                Portal Presis
              </Link>
            )}

            {isAdmin && (
              <div className="mt-4 grid grid-cols-1 gap-2">
                <Link
                  href="/admin-jugadores"
                  onClick={() => setIsOpen(false)}
                  className="py-3 text-center rounded-xl border border-cyan-500/25 text-cyan-300 font-black uppercase tracking-widest text-[11px]"
                >
                  Admin Jugadores
                </Link>
                <Link 
                  href="/admin-plebe" 
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] text-center"
                >
                  — Panel Maestro —
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}