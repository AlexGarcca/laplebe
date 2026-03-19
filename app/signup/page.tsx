'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')

    // Registramos en Auth y mandamos el nombre en los metadatos (raw_user_meta_data)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { full_name: nombre } 
      }
    })

    if (error) {
      setMensaje("Error: " + error.message)
      setLoading(false)
    } else {
      setMensaje("¡Registro enviado! Notifica al Admin para que apruebe tu acceso oficial.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans relative overflow-hidden selection:bg-[#fcc200]/30">
      
      {/* NAVBAR INTEGRADO */}
      <Navbar />

      {/* DECORACIÓN DE FONDO */}
      <div className="absolute top-[10%] right-[-10%] w-[80%] md:w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-[#141414]/80 border border-white/5 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl backdrop-blur-xl text-center">
            
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                Nuevo <span className="text-[#fcc200]">Presidente</span>
              </h1>
              <p className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mt-4 italic">Registration Protocol</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6 text-left">
              
              <div className="space-y-3">
                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Alex García"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">Email del Club</label>
                <input 
                  type="email" 
                  required
                  placeholder="presidencia@tuclub.com"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">Contraseña Deseada</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 pr-14 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#fcc200] transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#fcc200] text-black font-black uppercase italic tracking-[0.2em] py-4 md:py-5 rounded-2xl hover:bg-[#fbd34d] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_15px_40px_rgba(252,194,0,0.15)]"
                >
                  {loading ? 'CREANDO CUENTA...' : 'SOLICITAR ACCESO'}
                </button>

                <div className="mt-8 text-center">
                  <Link href="/login" className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest hover:text-[#fcc200] transition-colors">
                    ¿Ya tienes cuenta? Iniciar Sesión
                  </Link>
                </div>
              </div>
            </form>

            <AnimatePresence>
              {mensaje && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-[#fcc200]/5 border border-[#fcc200]/20 rounded-2xl"
                >
                  <p className="text-[10px] font-black text-[#fcc200] uppercase tracking-widest leading-relaxed">
                    {mensaje}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          <p className="text-center text-[8px] md:text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em] mt-12">
              • Plebeians Development Crew 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}