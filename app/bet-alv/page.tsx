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
  const [misTickets, setMisTickets] = useState<any[]>([])
  const [filtroTickets, setFiltroTickets] = useState<'todos' | 'pendiente' | 'ganada' | 'perdida' | 'cancelada'>('todos')
  const [cancelandoTicketId, setCancelandoTicketId] = useState<string | null>(null)
  const [apuestaMonto, setApuestaMonto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [jornadaActiva, setJornadaActiva] = useState<number>(1)
  const [cierreJornadaUtc, setCierreJornadaUtc] = useState<Date | null>(null)
  const [mobilePanel, setMobilePanel] = useState<'ticket' | 'historial'>('ticket')
  const router = useRouter()

  const MOBILE_PANEL_STORAGE_KEY = 'bet_alv_mobile_panel'

  const switchMobilePanel = (panel: 'ticket' | 'historial') => {
    setMobilePanel(panel)

    // Mobile-first: al cambiar panel, regresamos al tope para mostrar el inicio del bloque.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedPanel = window.localStorage.getItem(MOBILE_PANEL_STORAGE_KEY)
    if (savedPanel === 'ticket' || savedPanel === 'historial') {
      setMobilePanel(savedPanel)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(MOBILE_PANEL_STORAGE_KEY, mobilePanel)
  }, [mobilePanel])

  const cargarSaldo = async (uid: string) => {
    const { data: perfil, error } = await supabase
      .from('perfiles_presidentes')
      .select('saldo_bet')
      .eq('id', uid)
      .single()

    if (error) throw error
    if (!perfil) throw new Error('No se encontro perfil del presidente para esta cuenta.')

    const saldoActual = Number(perfil.saldo_bet || 0)
    setSaldo(saldoActual)
    return saldoActual
  }

  const calcularCierreJornada = (partidosJornada: any[]) => {
    const fechasValidas = (partidosJornada || [])
      .map((p: any) => p?.fecha)
      .filter(Boolean)
      .map((f: string) => new Date(f))
      .filter((d: Date) => !Number.isNaN(d.getTime()))

    if (fechasValidas.length === 0) return null

    const primeraFecha = new Date(Math.min(...fechasValidas.map((d: Date) => d.getTime())))

    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(primeraFecha)

    const toNum = (type: string) => Number(partes.find(p => p.type === type)?.value || 0)
    const weekDayText = partes.find(p => p.type === 'weekday')?.value || 'Sat'
    const weekMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

    const y = toNum('year')
    const m = toNum('month')
    const d = toNum('day')
    const wd = weekMap[weekDayText] ?? 6

    // Regla de negocio: corte sabado 8:00pm CDMX.
    // Si la primera fecha cae en domingo, se toma el sabado anterior como corte.
    const deltaToSaturday = wd === 0 ? -1 : 6 - wd

    // CDMX opera en UTC-6 para este proyecto, por eso 20:00 local = 02:00 UTC del dia siguiente.
    return new Date(Date.UTC(y, m - 1, d + deltaToSaturday, 26, 0, 0))
  }

  const agruparTickets = (rows: any[]) => {
    const map = new Map<string, any>()

    for (const row of rows || []) {
      const groupField = row.ticket_id ? 'ticket_id' : row.parlay_id ? 'parlay_id' : 'id'
      const groupKey = row.ticket_id || row.parlay_id || row.id

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          ticketId: groupKey,
          groupField,
          monto: Number(row.monto || 0),
          createdAt: row.created_at,
          selecciones: [],
          estados: [],
          momioTotal: 1,
          jornada: row.partido?.jornada ?? null,
        })
      }

      const t = map.get(groupKey)
      t.selecciones.push(row)
      t.estados.push(row.estado || 'pendiente')
      t.momioTotal = Number((t.momioTotal * Number(row.momio || 1)).toFixed(2))

      if (row.created_at && (!t.createdAt || new Date(row.created_at) < new Date(t.createdAt))) {
        t.createdAt = row.created_at
      }
    }

    const calcularEstado = (estados: string[]) => {
      if (estados.some(e => e === 'cancelada')) return 'cancelada'
      if (estados.some(e => e === 'perdida')) return 'perdida'
      if (estados.every(e => e === 'ganada')) return 'ganada'
      return 'pendiente'
    }

    return Array.from(map.values())
      .map((t: any) => ({
        ...t,
        estado: calcularEstado(t.estados),
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

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

    try {
      // 1. Traer Saldo
      await cargarSaldo(uid)

      // 2. Próxima Jornada Activa
      const { data: proxPart } = await supabase
        .from('partidos')
        .select('jornada')
        .eq('jugado', false)
        .order('jornada', { ascending: true })
        .limit(1)
        .single()

      const jornadaActiva = proxPart?.jornada || 1
      setJornadaActiva(jornadaActiva)

      // 3. Traer Partidos de esa Jornada
      const { data: pData } = await supabase
        .from('partidos')
        .select('*, local:equipo_local_id(id, nombre, escudo_url), visita:equipo_visita_id(id, nombre, escudo_url)')
        .eq('jornada', jornadaActiva)
        .eq('jugado', false)

      setCierreJornadaUtc(calcularCierreJornada(pData || []))

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

      const { data: apuestasUsuario } = await supabase
        .from('apuestas')
        .select('id, ticket_id, parlay_id, es_parlay, partido_id, monto, seleccion, momio, estado, created_at, partido:partido_id(id, jornada, fecha, local:equipo_local_id(nombre), visita:equipo_visita_id(nombre))')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      setMisTickets(agruparTickets(apuestasUsuario || []))
    } catch (error: any) {
      alert('Error cargando BET-ALV: ' + (error?.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const addToTicket = (partido: any, seleccion: string, momio: number) => {
    const exists = ticket.find(t => t.partidoId === partido.id)
    if (exists) {
      setTicket(ticket.map(t => t.partidoId === partido.id ? { ...t, seleccion, momio } : t))
    } else {
      setTicket([...ticket, { partidoId: partido.id, local: partido.local.nombre, visita: partido.visita.nombre, seleccion, momio }])
    }

    // En mobile priorizamos mostrar el ticket cuando se agrega/edita una seleccion.
    switchMobilePanel('ticket')
  }

  const handlePlaceBet = async () => {
    if (!userId) return alert('Sesion invalida. Vuelve a iniciar sesion.')
    if (ticket.length === 0) return alert('Tu ticket esta vacio.')

    const monto = parseFloat(apuestaMonto)
    if (!Number.isFinite(monto)) return alert('Monto invalido.')
    if (monto > saldo) return alert("¡No tienes tanta lana! Baja la apuesta.")
    if (monto <= 0) return alert("¿Vas a apostar aire o qué?")
    if (cierreJornadaUtc && new Date() >= cierreJornadaUtc) {
      return alert('La ventana de apuesta para esta jornada ya cerro (sabado 8:00pm CDMX).')
    }

    setEnviando(true)
    const esParlay = ticket.length > 1

    try {
      const cuotaTotal = Number(ticket.reduce((acc, t) => acc * Number(t.momio || 1), 1).toFixed(2))
      
      // Construir payload de apuestas para la RPC
      const apuestasData = ticket.map(t => ({
        partido_id: t.partidoId,
        seleccion: t.seleccion,
        momio: t.momio
      }))

      // Llamar RPC atómica: place_bet_ticket
      const { data: resultado, error: rpcError } = await supabase.rpc('place_bet_ticket', {
        p_user_id: userId,
        p_monto: monto,
        p_cuota_total: cuotaTotal,
        p_tipo: esParlay ? 'parlay' : 'simple',
        p_apuestas_data: apuestasData
      })

      if (rpcError) {
        throw rpcError
      }

      if (!resultado || !resultado.ticket_id) {
        throw new Error('RPC retorno resultado inválido. Contacta al admin.')
      }

      // Actualizar estado local con valores retornados por la RPC
      setSaldo(Number(resultado.saldo_nuevo))
      setTicket([])
      setApuestaMonto('')
      switchMobilePanel('historial')
      
      const ticketShort = resultado.ticket_id.slice(0, 8).toUpperCase()
      alert(`¡APUESTA METIDA! Ticket: ${ticketShort} 💸\nSaldo nuevo: $${resultado.saldo_nuevo}`)
      
      // Recargar datos (mis tickets, próximas jornadas, etc.)
      await fetchData(userId)
    } catch (error: any) {
      const msg = error?.message || error?.msg || 'Error desconocido'
      alert('Error al registrar apuesta: ' + msg)
      
      // Intenta recargar saldo desde DB por si hubo cambio externo
      try {
        await cargarSaldo(userId)
      } catch {
        // Si falla la recarga, mantenemos el saldo en memoria sin bloquear al usuario.
      }
    } finally {
      setEnviando(false)
    }
  }

  const handleCancelarTicket = async (ticketData: any) => {
    if (!userId) return alert('Sesion invalida. Vuelve a iniciar sesion.')

    if (ticketData.estado !== 'pendiente') {
      return alert('Solo puedes cancelar tickets pendientes.')
    }

    if (ticketData.jornada !== jornadaActiva) {
      return alert('Solo se pueden cancelar tickets de la jornada activa.')
    }

    if (cierreJornadaUtc && new Date() >= cierreJornadaUtc) {
      return alert('La ventana de cancelacion ya cerro (sabado 8:00pm CDMX).')
    }

    if (!confirm('Se cancelara el ticket y se hara reembolso completo. ¿Continuar?')) return

    setCancelandoTicketId(ticketData.ticketId)

    try {
      // Llamar RPC atómica: cancel_bet_ticket
      const { data: resultado, error: rpcError } = await supabase.rpc('cancel_bet_ticket', {
        p_user_id: userId,
        p_ticket_id: ticketData.ticketId
      })

      if (rpcError) {
        throw rpcError
      }

      if (!resultado || !resultado.ticket_id) {
        throw new Error('RPC retorno resultado inválido. Contacta al admin.')
      }

      // Actualizar estado local con valores retornados por la RPC
      const nuevoSaldo = Number(resultado.saldo_nuevo)
      setSaldo(nuevoSaldo)

      alert(`Ticket cancelado ✓\nReembolso: $${resultado.monto_reembolsado}\nSaldo nuevo: $${nuevoSaldo}`)

      // Recargar datos (mis tickets, etc.)
      await fetchData(userId)
    } catch (error: any) {
      const msg = error?.message || error?.msg || 'Error desconocido'
      alert('Error cancelando ticket: ' + msg)
      try {
        await fetchData(userId)
      } catch {
        // Evitamos bloquear al usuario si falla el refresco.
      }
    } finally {
      setCancelandoTicketId(null)
    }
  }

  const momioTotal = ticket.reduce((acc, t) => acc * t.momio, 1).toFixed(2)
  const posibleGanancia = (parseFloat(apuestaMonto || '0') * parseFloat(momioTotal)).toFixed(2)
  const cambiosHabilitados = cierreJornadaUtc ? new Date() < cierreJornadaUtc : true
  const ticketsFiltrados = misTickets.filter(t => filtroTickets === 'todos' ? true : t.estado === filtroTickets)
  const filtrosTickets: ReadonlyArray<{ key: 'todos' | 'pendiente' | 'ganada' | 'perdida' | 'cancelada'; label: string }> = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'ganada', label: 'Ganados' },
    { key: 'perdida', label: 'Perdidos' },
    { key: 'cancelada', label: 'Cancelados' },
  ]

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#fcc200] animate-spin" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#fcc200]">Preparando el Casino...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        <div className="lg:col-span-8">
          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">
              BET-<span className="text-[#fcc200]">ALV</span>
            </h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="px-4 sm:px-5 py-3 bg-[#fcc200]/10 border border-[#fcc200]/20 rounded-2xl flex items-center gap-3">
                <Coins size={20} className="text-[#fcc200]" />
                <span className="text-base sm:text-lg font-black text-white italic">{saldo}M <span className="text-zinc-500 not-italic text-[9px] sm:text-[10px] ml-2 tracking-widest uppercase">Lana disponible</span></span>
              </div>
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cambiosHabilitados ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              {cambiosHabilitados ? 'Ventana abierta' : 'Ventana cerrada'}
              <span className="text-zinc-500 normal-case tracking-normal">
                {cierreJornadaUtc
                  ? `hasta ${new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium', timeStyle: 'short' }).format(cierreJornadaUtc)} CDMX`
                  : 'sin fecha de cierre definida'}
              </span>
            </div>
          </header>

          <div className="space-y-4">
            {partidos.map((p) => (
              <div key={p.id} className="bg-[#141414] border border-white/5 p-5 sm:p-8 rounded-[2.3rem] sm:rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[#181818] transition-all">
                <div className="flex items-center gap-5 sm:gap-10 flex-1 justify-center md:justify-start w-full">
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

                <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
                  {['LOCAL', 'EMPATE', 'VISITA'].map((label) => {
                    const m = p.momios[label]
                    const isSelected = ticket.find(t => t.partidoId === p.id && t.seleccion === label)
                    return (
                      <button 
                        key={label}
                        onClick={() => addToTicket(p, label, parseFloat(m))}
                        disabled={!cambiosHabilitados}
                        className={`flex-1 md:flex-none px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border transition-all group cursor-pointer ${isSelected ? 'bg-[#fcc200] border-[#fcc200] text-black scale-105' : 'bg-black border-white/5 hover:border-[#fcc200] text-zinc-500'}`}
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

        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <div className="lg:hidden bg-[#141414] border border-white/10 rounded-2xl p-2 flex gap-2">
            <button
              onClick={() => switchMobilePanel('ticket')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${mobilePanel === 'ticket' ? 'bg-[#fcc200] text-black' : 'bg-black/40 text-zinc-400'}`}
            >
              Ticket ({ticket.length})
            </button>
            <button
              onClick={() => switchMobilePanel('historial')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${mobilePanel === 'historial' ? 'bg-[#fcc200] text-black' : 'bg-black/40 text-zinc-400'}`}
            >
              Mis Tickets ({ticketsFiltrados.length})
            </button>
          </div>

          <div className={`${mobilePanel === 'ticket' ? 'block animate-in fade-in slide-in-from-right-2 duration-300' : 'hidden'} lg:block bg-[#141414] border-2 border-[#fcc200]/20 rounded-[2.3rem] sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                <TrendingUp size={24} className="text-[#fcc200]" /> Ticket
              </h3>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-[#fcc200] uppercase italic tracking-widest">
                {ticket.length === 1 ? 'SIMPLE' : ticket.length > 1 ? 'PARLAY 🔥' : 'VACÍO'}
              </span>
            </div>

            <div className="space-y-4 mb-8 max-h-[30vh] sm:max-h-[38vh] lg:max-h-[40vh] overflow-y-auto pr-2 sm:pr-3 custom-scrollbar">
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

            <div className="border-t border-white/5 pt-6 sm:pt-8 space-y-6">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                <span>Cuota Total</span>
                <span className="text-2xl text-white italic">{ticket.length > 0 ? momioTotal : '0.00'}</span>
              </div>
              
              <div className="relative">
                <input type="number" placeholder="DINERO A JUGAR..." className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-black text-white outline-none focus:border-[#fcc200] transition-all" value={apuestaMonto} onChange={(e) => setApuestaMonto(e.target.value)} />
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
                disabled={ticket.length === 0 || !apuestaMonto || enviando || !cambiosHabilitados}
                className="w-full py-5 sm:py-6 bg-[#fcc200] text-black rounded-4xl font-black uppercase italic tracking-[0.14em] sm:tracking-widest hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-20 shadow-2xl shadow-[#fcc200]/20 cursor-pointer flex items-center justify-center gap-3 text-sm sm:text-base"
              >
                {enviando ? <Loader2 className="animate-spin" /> : 'METER APUESTA ALV 🎰'}
              </button>
            </div>
          </div>

          <div className={`${mobilePanel === 'historial' ? 'block animate-in fade-in slide-in-from-left-2 duration-300' : 'hidden'} lg:block bg-[#141414] border border-white/5 rounded-[2.3rem] sm:rounded-[3rem] p-5 sm:p-7 lg:p-8`}>
            <div className="flex items-center justify-between gap-4 mb-5">
              <h4 className="text-lg font-black uppercase italic text-white">Mis Tickets</h4>
              <div className="flex gap-2 flex-wrap justify-end">
                {filtrosTickets.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFiltroTickets(f.key)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-colors ${filtroTickets === f.key ? 'bg-[#fcc200] text-black border-[#fcc200]' : 'bg-black/50 text-zinc-500 border-white/10 hover:text-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[46vh] sm:max-h-[42vh] overflow-y-auto pr-1 custom-scrollbar">
              {ticketsFiltrados.map((t) => {
                const estadoClase = t.estado === 'ganada'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : t.estado === 'perdida'
                    ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                    : t.estado === 'cancelada'
                      ? 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10'
                      : 'text-amber-300 border-amber-500/30 bg-amber-500/10'

                const puedeCancelar = t.estado === 'pendiente' && t.jornada === jornadaActiva && cambiosHabilitados

                return (
                  <div key={t.ticketId} className="bg-black/40 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Ticket {String(t.ticketId).slice(0, 8).toUpperCase()}</p>
                        <p className="text-[11px] text-zinc-400 font-bold">Jornada {t.jornada || '-'} • {new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(t.createdAt))}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${estadoClase}`}>
                        {t.estado}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {t.selecciones.map((s: any) => (
                        <div key={s.id} className="flex justify-between text-[11px] font-bold text-zinc-300">
                          <span>{s.partido?.local?.nombre} vs {s.partido?.visita?.nombre} • {s.seleccion}</span>
                          <span className="text-[#fcc200]">{s.momio}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black text-white">Monto: {t.monto}M • Cuota total: {t.momioTotal}</p>
                      <button
                        onClick={() => handleCancelarTicket(t)}
                        disabled={!puedeCancelar || cancelandoTicketId === t.ticketId}
                        className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-rose-500/10 transition-colors"
                      >
                        {cancelandoTicketId === t.ticketId ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {ticketsFiltrados.length === 0 && (
                <div className="text-center text-zinc-500 text-xs font-black uppercase tracking-[0.2em] py-6 border border-white/5 rounded-2xl">
                  No hay tickets para este filtro.
                </div>
              )}
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