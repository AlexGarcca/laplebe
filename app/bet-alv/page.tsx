'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Coins, TrendingUp, X, Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function BetAlvPage() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [saldo, setSaldo] = useState(0)
  const [ticket, setTicket] = useState<any[]>([])
  const [apuestaMonto, setApuestaMonto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?error=auth_required')
      return
    }
    setUserId(user.id)
    fetchData(user.id)
  }

  const fetchData = async (uid: string) => {
    setLoading(true)

    // 1. Traer Saldo
    const { data: perfil } = await supabase.from('perfiles_presidentes').select('saldo_bet').eq('id', uid).single()
    if (perfil) setSaldo(perfil.saldo_bet)

    // 2. Próxima Jornada Activa
    const { data: proxPart } = await supabase
      .from('partidos')
      .select('jornada')
      .eq('jugado', false)
      .order('jornada', { ascending: true })
      .limit(1)
      .single()

    const jornadaActiva = proxPart?.jornada || 1

    // 3. Traer Partidos de esa Jornada
    const { data: pData } = await supabase
      .from('partidos')
      .select('*, local:equipo_local_id(id, nombre, escudo_url), visita:equipo_visita_id(id, nombre, escudo_url)')
      .eq('jornada', jornadaActiva)
      .eq('jugado', false)

    // 4. Historial para Momios
    const { data: historial } = await supabase.from('partidos').select('*').eq('jugado', true)

    // FÓRMULA MATEMÁTICA CORREGIDA PARA MOMIOS
    const getPuntos = (id: string) => {
      const parts = historial?.filter(h => h.equipo_local_id === id || h.equipo_visita_id === id).slice(-3) || []
      return parts.reduce((acc, curr) => {
        const esLocal = curr.equipo_local_id === id
        const golesPropio = esLocal ? curr.goles_local : curr.goles_visita
        const golesRival = esLocal ? curr.goles_visita : curr.goles_local
        return acc + (golesPropio > golesRival ? 3 : golesPropio === golesRival ? 1 : 0)
      }, 0)
    }

    if (pData) {
      const partidosConMomios = pData.map(p => {
        const pwrLocal = getPuntos(p.local.id) + 5  // Base de 5 para que no sea 0
        const pwrVisita = getPuntos(p.visita.id) + 5 // Base de 5
        
        // Multiplicador base de 1.90. Si tienen el mismo poder, el momio es 1.90 vs 1.90
        let momioL = 1.90 * (pwrVisita / pwrLocal)
        let momioV = 1.90 * (pwrLocal / pwrVisita)

        // Evitar que paguen una miseria o una locura
        momioL = Math.max(1.15, Math.min(momioL, 6.00))
        momioV = Math.max(1.15, Math.min(momioV, 6.00))

        return {
          ...p,
          momios: {
            LOCAL: momioL.toFixed(2),
            EMPATE: 3.20, // Empate fijo por ahora
            VISITA: momioV.toFixed(2)
          }
        }
      })
      setPartidos(partidosConMomios)
    }
    setLoading(false)
  }

  const addToTicket = (partido: any, seleccion: string, momio: number) => {
    const exists = ticket.find(t => t.partidoId === partido.id)
    if (exists) {
      setTicket(ticket.map(t => t.partidoId === partido.id ? { ...t, seleccion, momio } : t))
    } else {
      setTicket([...ticket, { partidoId: partido.id, local: partido.local.nombre, visita: partido.visita.nombre, seleccion, momio }])
    }
  }

  const handlePlaceBet = async () => {
    const monto = parseFloat(apuestaMonto)
    if (monto > saldo) return alert("¡No tienes tanta lana! Baja la apuesta.")
    if (monto <= 0) return alert("¿Vas a apostar aire o qué?")

    setEnviando(true)
    const parlayId = crypto.randomUUID()

    const nuevasApuestas = ticket.map(t => ({
      user_id: userId,
      partido_id: t.partidoId,
      monto: monto,
      seleccion: t.seleccion,
      momio: t.momio,
      es_parlay: ticket.length > 1,
      parlay_id: ticket.length > 1 ? parlayId : null
    }))

    const { error: errorBet } = await supabase.from('apuestas').insert(nuevasApuestas)

    if (!errorBet) {
      const nuevoSaldo = saldo - monto
      await supabase.from('perfiles_presidentes').update({ saldo_bet: nuevoSaldo }).eq('id', userId)
      setSaldo(nuevoSaldo)
      setTicket([])
      setApuestaMonto('')
      alert("¡APUESTA METIDA! Que Dios nos agarre confesados. 💸")
    } else {
      alert("Error: " + errorBet.message)
    }
    setEnviando(false)
  }

  const momioTotal = ticket.reduce((acc, t) => acc * t.momio, 1).toFixed(2)
  const posibleGanancia = (parseFloat(apuestaMonto || '0') * parseFloat(momioTotal)).toFixed(2)

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#fcc200] animate-spin" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#fcc200]">Preparando el Casino...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8">
          <header className="mb-10">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">
              BET-<span className="text-[#fcc200]">ALV</span>
            </h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="px-5 py-3 bg-[#fcc200]/10 border border-[#fcc200]/20 rounded-2xl flex items-center gap-3">
                <Coins size={20} className="text-[#fcc200]" />
                <span className="text-lg font-black text-white italic">{saldo}M <span className="text-zinc-500 not-italic text-[10px] ml-2 tracking-widest uppercase">Lana disponible</span></span>
              </div>
            </div>
          </header>

          <div className="space-y-4">
            {partidos.map((p) => (
              <div key={p.id} className="bg-[#141414] border border-white/5 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[#181818] transition-all">
                <div className="flex items-center gap-10 flex-1 justify-center md:justify-start">
                  <div className="text-center">
                    <img src={p.local.escudo_url} className="w-16 h-16 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" alt="" />
                    <p className="text-[11px] font-black uppercase italic text-white">{p.local.nombre}</p>
                  </div>
                  <span className="text-zinc-800 font-black italic text-4xl">VS</span>
                  <div className="text-center">
                    <img src={p.visita.escudo_url} className="w-16 h-16 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" alt="" />
                    <p className="text-[11px] font-black uppercase italic text-white">{p.visita.nombre}</p>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {['LOCAL', 'EMPATE', 'VISITA'].map((label) => {
                    const m = p.momios[label]
                    const isSelected = ticket.find(t => t.partidoId === p.id && t.seleccion === label)
                    return (
                      <button 
                        key={label}
                        onClick={() => addToTicket(p, label, parseFloat(m))}
                        className={`flex-1 md:flex-none px-6 py-4 rounded-2xl border transition-all group cursor-pointer ${isSelected ? 'bg-[#fcc200] border-[#fcc200] text-black scale-105' : 'bg-black border-white/5 hover:border-[#fcc200] text-zinc-500'}`}
                      >
                        <p className={`text-[8px] font-black uppercase mb-1 ${isSelected ? 'text-black/50' : 'text-zinc-600'}`}>{label}</p>
                        <p className={`text-lg font-black ${isSelected ? 'text-black' : 'text-[#fcc200]'}`}>{m}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-[#141414] border-2 border-[#fcc200]/20 rounded-[3rem] p-10 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                <TrendingUp size={24} className="text-[#fcc200]" /> Ticket
              </h3>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-[#fcc200] uppercase italic tracking-widest">
                {ticket.length === 1 ? 'SIMPLE' : ticket.length > 1 ? 'PARLAY 🔥' : 'VACÍO'}
              </span>
            </div>

            <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-3 custom-scrollbar">
              {ticket.map((t, i) => (
                <div key={i} className="bg-black/50 p-5 rounded-3xl border border-white/5 relative group animate-in slide-in-from-right duration-300">
                  <button onClick={() => setTicket(ticket.filter(x => x.partidoId !== t.partidoId))} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg cursor-pointer"><X size={14} /></button>
                  <p className="text-[9px] font-black text-zinc-600 uppercase italic mb-2">{t.local} <span className="text-[#fcc200]/30 mx-1">VS</span> {t.visita}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-white uppercase italic">{t.seleccion}</span>
                    <span className="text-sm font-black text-[#fcc200]">{t.momio}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-8 space-y-6">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                <span>Cuota Total</span>
                <span className="text-2xl text-white italic">{ticket.length > 0 ? momioTotal : '0.00'}</span>
              </div>
              
              <div className="relative">
                <input type="number" placeholder="DINERO A JUGAR..." className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-5 text-lg font-black text-white outline-none focus:border-[#fcc200] transition-all" value={apuestaMonto} onChange={(e) => setApuestaMonto(e.target.value)} />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-700">M</span>
              </div>

              <div className="bg-[#fcc200]/10 p-6 rounded-3xl border border-[#fcc200]/20 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Premio Potencial</p>
                  <p className="text-3xl font-black text-[#fcc200] italic leading-none">{posibleGanancia}M</p>
                </div>
                <Dices size={40} className="text-[#fcc200]/20" />
              </div>

              <button 
                onClick={handlePlaceBet}
                disabled={ticket.length === 0 || !apuestaMonto || enviando}
                className="w-full py-6 bg-[#fcc200] text-black rounded-4xl font-black uppercase italic tracking-widest hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-20 shadow-2xl shadow-[#fcc200]/20 cursor-pointer flex items-center justify-center gap-3"
              >
                {enviando ? <Loader2 className="animate-spin" /> : 'METER APUESTA ALV 🎰'}
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fcc20020; border-radius: 10px; }
      `}</style>
    </div>
  )
}