'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const redirectTo = `${window.location.origin}/update-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setErrorMsg('No pudimos enviar el enlace. Verifica el correo e intenta otra vez.')
      setLoading(false)
      return
    }

    setSuccessMsg('Enlace enviado. Revisa tu correo para restablecer tu acceso.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans relative overflow-hidden selection:bg-[#fcc200]/30">
      <Navbar />

      <div className="absolute top-[10%] right-[-10%] w-[80%] md:w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-[#fcc200]/5 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-[#141414]/80 border border-white/5 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-10 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                Recuperar <span className="text-[#fcc200]">Acceso</span>
              </h1>
              <p className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mt-4 italic">
                Reset Protocol
              </p>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500"
                >
                  <AlertCircle size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400"
                >
                  <CheckCircle2 size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{successMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleResetPassword} className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-2">
                  Email del Club
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm text-white focus:outline-none focus:border-[#fcc200]/40 transition-all placeholder:text-zinc-800"
                  placeholder="presidencia@club.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#fcc200] text-black font-black uppercase italic tracking-[0.2em] py-4 md:py-5 rounded-2xl hover:bg-[#fbd34d] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_15px_40px_rgba(252,194,0,0.15)] cursor-pointer"
                >
                  {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
                </button>

                <Link
                  href="/login"
                  className="inline-block w-full py-4 md:py-5 border border-white/10 rounded-2xl text-white text-center text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
                >
                  Volver al portal
                </Link>
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
