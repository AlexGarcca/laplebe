'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    } else {
      router.push('/vestidor')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans relative overflow-hidden selection:bg-[#fcc200]/30">
      
      {/* 1. NAVBAR ELITE INTEGRADA */}
      <nav className="sticky top-0 z-100 backdrop-blur-2xl bg-black/80 border-b border-white/5 px-8 py-5 flex items-center justify-between">
        
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
        
        <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 items-center">
          <Link href="/partidos" className="hover:text-[#fcc200] transition-colors">Calendario</Link>
          <Link href="/clasificacion" className="hover:text-[#fcc200] transition-colors">Posiciones</Link>
          <Link href="/estadisticas" className="hover:text-[#fcc200] transition-colors">Estadísticas</Link>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <Link href="/" className="text-white hover:text-[#fcc200] transition-colors">Volver al Inicio</Link>
        </div>
      </nav>

      {/* DECORACIÓN DE FONDO */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex flex-col items-center justify-center py-20 px-4 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          {/* CARD DE LOGIN APPLE STYLE */}
          <div className="bg-[#141414]/80 border border-white/5 p-10 md:p-14 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-8">
                 <img src="/LOGO_PNG.png" className="w-24 h-24 object-contain brightness-125 drop-shadow-[0_0_25px_rgba(252,194,0,0.3)]" alt="Logo" />
              </div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                Portal de <span className="text-[#fcc200]">Presis</span>
              </h1>
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em] mt-5 italic">System Access Protocol</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">Email del Club</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  placeholder="presidencia@club.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">Código Secreto</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#fcc200] text-black font-black uppercase italic tracking-[0.2em] py-5 rounded-2xl hover:bg-[#fbd34d] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_15px_40px_rgba(252,194,0,0.15)] mt-4"
              >
                {loading ? 'Autenticando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>

          <p className="text-center text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em] mt-16">
             • Plebeians Development Crew 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}