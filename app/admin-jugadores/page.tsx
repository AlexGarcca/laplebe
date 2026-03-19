'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Navbar from '@/components/Navbar'
import { PlusCircle, Save, Trash2, RefreshCw, ArrowRightLeft, UserRoundCog } from 'lucide-react'

type Equipo = {
  id: string
  nombre: string
  escudo_url?: string | null
}

type Jugador = {
  id: string
  id_equipo: string
  nombre: string
  posicion: string
  tipo: string
  numero_camiseta: number | null
  valoracion: number | null
  amarillas_acumuladas: number | null
  partidos_suspension: number | null
}

const TIPOS = ['Draft', 'Franquicia', 'Rescatado', 'Presidente']
const POSICIONES = ['POR', 'DEF', 'MCD', 'MC', 'MCO', 'EXT', 'DEL']

const ADMIN_USER_IDS = new Set([
  '09c83b94-132f-4711-8009-0aa427d8df84',
])

const ADMIN_EMAILS = new Set([
  'garcca29@gmail.com',
  'sanchez_24399@hotmail.com',
])

export default function AdminJugadoresPage() {
  const router = useRouter()

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equipoIdActivo, setEquipoIdActivo] = useState<string>('')
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '',
    posicion: 'MC',
    tipo: 'Draft',
    numero_camiseta: '',
    valoracion: '80',
    equipo_id: '',
  })

  useEffect(() => {
    const validateAndInit = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email?.toLowerCase() || ''
      const isAdmin = !!user && (ADMIN_USER_IDS.has(user.id) || ADMIN_EMAILS.has(email))

      if (!isAdmin) {
        router.push('/')
        return
      }

      await fetchEquipos()
    }

    validateAndInit()
  }, [router])

  const fetchEquipos = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('equipos').select('id, nombre, escudo_url').order('nombre')

    if (error) {
      alert('Error al cargar equipos: ' + error.message)
      setLoading(false)
      return
    }

    const equiposData = (data || []) as Equipo[]
    setEquipos(equiposData)

    const firstEquipoId = equiposData[0]?.id || ''
    const active = equipoIdActivo || firstEquipoId
    setEquipoIdActivo(active)

    setNuevoJugador((prev) => ({
      ...prev,
      equipo_id: prev.equipo_id || active,
    }))

    if (active) {
      await fetchJugadores(active)
    } else {
      setJugadores([])
      setLoading(false)
    }
  }

  const fetchJugadores = async (equipoId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jugadores')
      .select('id, id_equipo, nombre, posicion, tipo, numero_camiseta, valoracion, amarillas_acumuladas, partidos_suspension')
      .eq('id_equipo', equipoId)
      .order('nombre', { ascending: true })

    if (error) {
      alert('Error al cargar jugadores: ' + error.message)
      setJugadores([])
      setLoading(false)
      return
    }

    setJugadores((data || []) as Jugador[])
    setLoading(false)
  }

  const onEquipoChange = async (id: string) => {
    setEquipoIdActivo(id)
    await fetchJugadores(id)
  }

  const updateJugadorCampo = <K extends keyof Jugador>(id: string, campo: K, valor: Jugador[K]) => {
    setJugadores((prev) => prev.map((j) => (j.id === id ? { ...j, [campo]: valor } : j)))
  }

  const guardarJugador = async (jugador: Jugador) => {
    setGuardandoId(jugador.id)

    if (jugador.numero_camiseta !== null) {
      const dorsalRepetido = jugadores.find(
        (x) =>
          x.id !== jugador.id &&
          x.id_equipo === jugador.id_equipo &&
          x.numero_camiseta !== null &&
          Number(x.numero_camiseta) === Number(jugador.numero_camiseta)
      )

      if (dorsalRepetido) {
        alert(`Dorsal repetido: ${jugador.numero_camiseta}. Ya lo tiene ${dorsalRepetido.nombre} en ese club.`)
        setGuardandoId(null)
        return
      }
    }

    const payload = {
      nombre: jugador.nombre.trim(),
      posicion: jugador.posicion,
      tipo: jugador.tipo,
      id_equipo: jugador.id_equipo,
      numero_camiseta: jugador.numero_camiseta,
      valoracion: jugador.valoracion,
    }

    if (!payload.nombre) {
      alert('El nombre no puede ir vacío.')
      setGuardandoId(null)
      return
    }

    const { data, error } = await supabase
      .from('jugadores')
      .update(payload)
      .eq('id', jugador.id)
      .select('id')

    if (error) {
      alert('Error al guardar jugador: ' + error.message)
      setGuardandoId(null)
      return
    }

    if (!data || data.length === 0) {
      alert('No se pudo guardar. Revisa RLS/policies para UPDATE de jugadores.')
      setGuardandoId(null)
      return
    }

    if (jugador.id_equipo !== equipoIdActivo) {
      await fetchJugadores(equipoIdActivo)
    }

    setGuardandoId(null)
  }

  const eliminarJugador = async (jugador: Jugador) => {
    const ok = confirm(`¿Eliminar a ${jugador.nombre}? Esta acción no se puede deshacer.`)
    if (!ok) return

    setEliminandoId(jugador.id)

    const { data, error } = await supabase
      .from('jugadores')
      .delete()
      .eq('id', jugador.id)
      .select('id')

    if (error) {
      alert('Error al eliminar jugador: ' + error.message)
      setEliminandoId(null)
      return
    }

    if (!data || data.length === 0) {
      alert('No se eliminó ningún registro. Revisa RLS/policies para DELETE de jugadores.')
      setEliminandoId(null)
      return
    }

    await fetchJugadores(equipoIdActivo)
    setEliminandoId(null)
  }

  const crearJugador = async () => {
    if (!nuevoJugador.equipo_id) {
      alert('Selecciona un equipo para el nuevo jugador.')
      return
    }

    const nombreLimpio = nuevoJugador.nombre.trim()
    if (!nombreLimpio) {
      alert('Escribe un nombre para el jugador.')
      return
    }

    if (nuevoJugador.numero_camiseta) {
      const dorsalNuevo = Number(nuevoJugador.numero_camiseta)
      const dorsalRepetido = jugadores.find(
        (x) =>
          x.id_equipo === nuevoJugador.equipo_id &&
          x.numero_camiseta !== null &&
          Number(x.numero_camiseta) === dorsalNuevo
      )

      if (dorsalRepetido) {
        alert(`Dorsal repetido: ${dorsalNuevo}. Ya lo tiene ${dorsalRepetido.nombre} en ese club.`)
        return
      }
    }

    setCreando(true)

    const payload = {
      id_equipo: nuevoJugador.equipo_id,
      nombre: nombreLimpio,
      posicion: nuevoJugador.posicion,
      tipo: nuevoJugador.tipo,
      numero_camiseta: nuevoJugador.numero_camiseta ? Number(nuevoJugador.numero_camiseta) : null,
      valoracion: nuevoJugador.valoracion ? Number(nuevoJugador.valoracion) : 80,
      amarillas_acumuladas: 0,
      partidos_suspension: 0,
    }

    const { data, error } = await supabase.from('jugadores').insert(payload).select('id')

    if (error) {
      alert('Error al crear jugador: ' + error.message)
      setCreando(false)
      return
    }

    if (!data || data.length === 0) {
      alert('No se pudo crear. Revisa RLS/policies para INSERT de jugadores.')
      setCreando(false)
      return
    }

    const nuevoEquipoId = nuevoJugador.equipo_id
    setNuevoJugador((prev) => ({
      ...prev,
      nombre: '',
      numero_camiseta: '',
      valoracion: '80',
      equipo_id: nuevoEquipoId,
    }))

    if (nuevoEquipoId === equipoIdActivo) {
      await fetchJugadores(equipoIdActivo)
    }

    setCreando(false)
  }

  const equipoActivo = useMemo(
    () => equipos.find((e) => e.id === equipoIdActivo) || null,
    [equipos, equipoIdActivo]
  )

  const jugadoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return jugadores

    return jugadores.filter((j) => {
      const nombre = j.nombre?.toLowerCase() || ''
      const posicion = j.posicion?.toLowerCase() || ''
      const tipo = j.tipo?.toLowerCase() || ''
      const dorsal = j.numero_camiseta?.toString() || ''
      return (
        nombre.includes(q) ||
        posicion.includes(q) ||
        tipo.includes(q) ||
        dorsal.includes(q)
      )
    })
  }, [jugadores, busqueda])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
              Admin de <span className="text-[#fcc200]">Plantillas</span>
            </h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">
              Club Roster Console
            </p>
          </div>

          <button
            onClick={() => fetchEquipos()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-[#fcc200] cursor-pointer self-start lg:self-auto"
            title="Refrescar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <section className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 bg-[#fcc200] rounded-full"></div>
            <h2 className="text-lg font-black uppercase italic tracking-tighter">Filtro de Club</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {equipos.map((equipo) => (
              <button
                key={equipo.id}
                onClick={() => onEquipoChange(equipo.id)}
                className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                  equipo.id === equipoIdActivo
                    ? 'bg-[#fcc200] text-black border-[#fcc200]'
                    : 'bg-black/40 text-zinc-500 border-white/10 hover:text-white'
                }`}
              >
                {equipo.nombre}
              </button>
            ))}
          </div>

          {equipoActivo && (
            <div className="mt-4 flex items-center gap-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">
              {equipoActivo.escudo_url && <img src={equipoActivo.escudo_url} alt="" className="w-7 h-7" />}
              {equipoActivo.nombre}
            </div>
          )}
        </section>

        <section className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <PlusCircle size={18} className="text-[#fcc200]" />
            <h2 className="text-lg font-black uppercase italic tracking-tighter">Alta de Jugador</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <input
              type="text"
              value={nuevoJugador.nombre}
              onChange={(e) => setNuevoJugador((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre"
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#fcc200]"
            />

            <select
              value={nuevoJugador.posicion}
              onChange={(e) => setNuevoJugador((prev) => ({ ...prev, posicion: e.target.value }))}
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#fcc200] cursor-pointer"
            >
              {POSICIONES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={nuevoJugador.tipo}
              onChange={(e) => setNuevoJugador((prev) => ({ ...prev, tipo: e.target.value }))}
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#fcc200] cursor-pointer"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="number"
              value={nuevoJugador.numero_camiseta}
              onChange={(e) => setNuevoJugador((prev) => ({ ...prev, numero_camiseta: e.target.value }))}
              placeholder="Dorsal"
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#fcc200]"
            />

            <input
              type="number"
              min="1"
              max="99"
              value={nuevoJugador.valoracion}
              onChange={(e) => setNuevoJugador((prev) => ({ ...prev, valoracion: e.target.value }))}
              placeholder="Rating"
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#fcc200]"
            />

            <select
              value={nuevoJugador.equipo_id}
              onChange={(e) => setNuevoJugador((prev) => ({ ...prev, equipo_id: e.target.value }))}
              className="bg-black border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#fcc200] cursor-pointer"
            >
              <option value="">Equipo...</option>
              {equipos.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <button
            onClick={crearJugador}
            disabled={creando}
            className="mt-4 px-6 py-3 rounded-xl bg-[#fcc200] text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
          >
            <PlusCircle size={16} />
            {creando ? 'Creando...' : 'Agregar Jugador'}
          </button>
        </section>

        <section className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-4 sm:p-6 overflow-x-auto">
          <div className="flex items-center gap-3 mb-6">
            <UserRoundCog size={18} className="text-zinc-400" />
            <h2 className="text-lg font-black uppercase italic tracking-tighter">Plantilla Editable</h2>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, posición, tipo o dorsal..."
              className="w-full md:w-110 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-[#fcc200]"
            />
          </div>

          {loading ? (
            <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] py-10 text-center">Cargando...</div>
          ) : jugadores.length === 0 ? (
            <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] py-10 text-center">Este club no tiene jugadores aún.</div>
          ) : jugadoresFiltrados.length === 0 ? (
            <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] py-10 text-center">No hay jugadores que coincidan con la búsqueda.</div>
          ) : (
            <div className="min-w-240 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 pb-2 border-b border-white/10">
                <div className="col-span-3">Nombre</div>
                <div className="col-span-1 text-center">Pos</div>
                <div className="col-span-2 text-center">Tipo</div>
                <div className="col-span-1 text-center">Dorsal</div>
                <div className="col-span-1 text-center">Rating</div>
                <div className="col-span-2 text-center">Mover a Club</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>

              {jugadoresFiltrados.map((j) => {
                const estaGuardando = guardandoId === j.id
                const estaEliminando = eliminandoId === j.id

                return (
                  <div
                    key={j.id}
                    className="grid grid-cols-12 gap-2 items-center bg-black/40 border border-white/5 hover:border-[#fcc200]/20 rounded-xl p-2"
                  >
                    <input
                      type="text"
                      value={j.nombre}
                      onChange={(e) => updateJugadorCampo(j.id, 'nombre', e.target.value)}
                      className="col-span-3 bg-black border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200]"
                    />

                    <select
                      value={j.posicion}
                      onChange={(e) => updateJugadorCampo(j.id, 'posicion', e.target.value)}
                      className="col-span-1 bg-black border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200] cursor-pointer"
                    >
                      {POSICIONES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    <select
                      value={j.tipo}
                      onChange={(e) => updateJugadorCampo(j.id, 'tipo', e.target.value)}
                      className="col-span-2 bg-black border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200] cursor-pointer"
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={j.numero_camiseta ?? ''}
                      onChange={(e) => updateJugadorCampo(j.id, 'numero_camiseta', e.target.value === '' ? null : Number(e.target.value))}
                      className="col-span-1 bg-black border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200] text-center"
                    />

                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={j.valoracion ?? ''}
                      onChange={(e) => updateJugadorCampo(j.id, 'valoracion', e.target.value === '' ? null : Number(e.target.value))}
                      className="col-span-1 bg-black border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none focus:border-[#fcc200] text-center"
                    />

                    <select
                      value={j.id_equipo}
                      onChange={(e) => updateJugadorCampo(j.id, 'id_equipo', e.target.value)}
                      className="col-span-2 bg-black border border-cyan-500/20 rounded-lg px-2 py-2 text-xs font-bold text-cyan-300 outline-none focus:border-cyan-400 cursor-pointer"
                      title="Mover jugador a otro club"
                    >
                      {equipos.map((e) => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>

                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => guardarJugador(j)}
                        disabled={estaGuardando || estaEliminando}
                        className="px-3 py-2 rounded-lg bg-[#fcc200] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Save size={14} />
                        {estaGuardando ? '...' : 'Guardar'}
                      </button>

                      <button
                        onClick={() => eliminarJugador(j)}
                        disabled={estaGuardando || estaEliminando}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {estaEliminando ? '...' : 'Borrar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-5 text-[10px] uppercase tracking-wider text-zinc-600 font-bold flex items-center gap-2">
            <ArrowRightLeft size={12} className="text-cyan-400" />
            Para mover un jugador, selecciona otro club en "Mover a Club" y presiona Guardar.
          </p>
        </section>
      </main>
    </div>
  )
}
