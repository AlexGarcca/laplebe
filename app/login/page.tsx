'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase' 
import { useRouter, useSearchParams } from 'next/navigation' // Agregamos useSearchParams
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null) // Para mensajes elegantes
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // ESCUCHAR ERRORES DESDE LA URL (Si el vestidor lo expulsó)
  useEffect(() => {
    const errorType = searchParams.get('error')
    if (errorType === 'account_deleted') {
      setErrorMsg('ACCESO DENEGADO: Tu perfil no existe o fue revocado por la liga.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Traducimos el error de Supabase a algo más "Plebe"
      const mensaje = error.message === 'Invalid login credentials' 
        ? 'Credenciales incorrectas. Revisa tu código secreto.' 
        : error.message
      
      setErrorMsg(mensaje)
      setLoading(false)
    } else {
      router.push('/vestidor')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans relative overflow-hidden selection:bg-[#fcc200]/30">
      <Navbar />

      <div className="absolute top-[10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[80%] md:w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-[#141414]/80 border border-white/5 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-10 md:mb-12">
              <div className="flex justify-center mb-6 md:mb-8">
                 <img src="/LOGO_PNG.png" className="w-20 h-20 md:w-24 md:h-24 object-contain brightness-125 drop-shadow-[0_0_25px_rgba(252,194,0,0.3)]" alt="Logo" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                Portal de <span className="text-[#fcc200]">Presis</span>
              </h1>
              <p className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mt-4 italic">System Access Protocol</p>
            </div>

            {/* MENSAJE DE ERROR DINÁMICO */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500"
                >
                  <AlertCircle size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">Email del Club</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  placeholder="presidencia@club.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Código Secreto</label>
                  <Link href="/reset-password" title="recuperar" className="text-[8px] font-bold text-zinc-700 hover:text-[#fcc200] transition-colors uppercase tracking-widest">
                    ¿Olvidaste el acceso?
                  </Link>
                </div>
                <input 
                  type="password" 
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#fcc200] text-black font-black uppercase italic tracking-[0.2em] py-4 md:py-5 rounded-2xl hover:bg-[#fbd34d] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_15px_40px_rgba(252,194,0,0.15)] cursor-pointer"
                >
                  {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
                </button>

                <div className="mt-8 text-center">
                  <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mb-3">¿Eres un nuevo presidente?</p>
                  <Link 
                    href="/signup"
                    className="inline-block w-full py-4 md:py-5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
                  >
                    Crear mi acceso oficial
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center text-[8px] md:text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em] mt-12 md:mt-16">
              • Plebeians Development Crew 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}