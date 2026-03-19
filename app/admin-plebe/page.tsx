'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, UserPlus, Trophy, CheckCircle2, XCircle, RefreshCw, Trash2, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // <-- IMPORTANTE: Agregamos Link

const ADMIN_USER_IDS = new Set([
  '09c83b94-132f-4711-8009-0aa427d8df84',
])

const ADMIN_EMAILS = new Set([
  'garcca29@gmail.com',
  'sanchez_24399@hotmail.com',
])

export default function AdminPage() {
  const router = useRouter()
  const [pendientes, setPendientes] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // VALIDACIÓN DE ADMIN
      const email = user?.email?.toLowerCase() || ''
      const isAdmin = !!user && (ADMIN_USER_IDS.has(user.id) || ADMIN_EMAILS.has(email))

      if (!isAdmin) {
        router.push('/')
        return
      }

      fetchAdminData()
    }

    validateAndFetch()
  }, [router])

  const fetchAdminData = async () => {
    setLoading(true)
    const { data: pData } = await supabase
      .from('perfiles_presidentes')
      .select('*, equipos(nombre, escudo_url)')
      .order('aprobado', { ascending: true })

    const { data: eData } = await supabase.from('equipos').select('*').order('nombre')

    if (pData) setPendientes(pData)
    if (eData) setEquipos(eData)
    setLoading(false)
  }

  const handleUpdate = async (
    id: string,
    equipoId: string,
    aprobado: boolean,
    aprobadoActual: boolean,
    saldoActual: number | null
  ) => {
    const updatePayload: { equipo_id: string; aprobado: boolean; saldo_bet?: number } = {
      equipo_id: equipoId,
      aprobado,
    }

    // Al aprobar por primera vez (o sin saldo), otorgamos crédito inicial para casino.
    if (!aprobadoActual && aprobado && (!saldoActual || saldoActual <= 0)) {
      updatePayload.saldo_bet = 500
    }

    const { error } = await supabase
      .from('perfiles_presidentes')
      .update(updatePayload)
      .eq('id', id)

    if (error) alert("Error al actualizar: " + error.message)
    else fetchAdminData()
  }

  const handleDelete = async (id: string, nombre: string) => {
    const confirmar = confirm(`¿Estás seguro de que quieres eliminar a "${nombre}"? Esta acción borrará su perfil de la base de datos.`);
    
    if (confirmar) {
      const { error } = await supabase
        .from('perfiles_presidentes')
        .delete()
        .eq('id', id);

      if (error) alert("Error al eliminar: " + error.message);
      else fetchAdminData(); 
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white text-center md:text-left">
              Panel de <span className="text-[#fcc200]">Control</span>
            </h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Plebeians League Authorization Hub</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-[#fcc200] cursor-pointer"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {/* 🔥 SECCIÓN DE HERRAMIENTAS MAESTRAS 🔥 */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#fcc200] rounded-full"></div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Herramientas del Sistema</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/admin-resultados" 
              className="bg-[#141414] border border-[#fcc200]/20 p-6 sm:p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 hover:bg-[#1a1a1a] hover:scale-105 hover:border-[#fcc200]/50 transition-all shadow-[0_0_30px_rgba(252,194,0,0.05)] hover:shadow-[0_0_30px_rgba(252,194,0,0.15)] group cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#fcc200]/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy size={32} className="text-[#fcc200]" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black uppercase italic text-white mb-1">Resultados & Apuestas</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capturar Goles y Pagar Casino</p>
              </div>
            </Link>

            {/* Espacio para futuras herramientas (Draft, Sanciones, etc.) */}
            <div className="bg-[#141414] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 opacity-50 cursor-not-allowed">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                 <ShieldCheck size={32} className="text-zinc-600" />
               </div>
               <div className="text-center">
                 <h3 className="text-xl font-black uppercase italic text-zinc-500 mb-1">Próximamente</h3>
                 <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Módulo en Desarrollo</p>
               </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE GESTIÓN DE PRESIDENTES */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-white/20 rounded-full"></div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Gestión de Presidentes</h2>
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {pendientes.map((presi) => (
                <motion.div
                  key={presi.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-[#141414] border ${presi.aprobado ? 'border-white/5' : 'border-[#fcc200]/30 shadow-[0_0_20px_rgba(252,194,0,0.05)]'} rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${presi.aprobado ? 'bg-zinc-900 text-zinc-600' : 'bg-[#fcc200]/10 text-[#fcc200]'}`}>
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase italic text-white leading-none mb-2">
                        {presi.nombre_presidente || 'Usuario Nuevo'}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${presi.aprobado ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {presi.aprobado ? 'ACCESO TOTAL' : 'ESPERANDO APROBACIÓN'}
                        </span>
                        {presi.equipos && (
                          <span className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Trophy size={10} /> {presi.equipos.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <select 
                      className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#fcc200] transition-all flex-1 md:flex-none min-w-0 md:min-w-50 cursor-pointer w-full md:w-auto"
                      value={presi.equipo_id || ""}
                      onChange={(e) => handleUpdate(presi.id, e.target.value, presi.aprobado, presi.aprobado, presi.saldo_bet ?? null)}
                    >
                      <option value="">ASIGNAR EQUIPO...</option>
                      {equipos.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre.toUpperCase()}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleDelete(presi.id, presi.nombre_presidente)}
                        className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/20 cursor-pointer"
                        title="Eliminar Registro"
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        onClick={() => handleUpdate(presi.id, presi.equipo_id, !presi.aprobado, presi.aprobado, presi.saldo_bet ?? null)}
                        disabled={!presi.equipo_id}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex-1 md:flex-none justify-center cursor-pointer ${
                          presi.aprobado 
                          ? 'bg-zinc-800 text-zinc-400 hover:text-rose-500' 
                          : 'bg-[#fcc200] text-black hover:scale-105 disabled:opacity-20 shadow-lg shadow-[#fcc200]/10'
                        }`}
                      >
                        {presi.aprobado ? <><XCircle size={14}/> REVOCAR</> : <><CheckCircle2 size={14}/> APROBAR</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {pendientes.length === 0 && !loading && (
              <div className="text-center py-20 bg-[#141414] rounded-[3rem] border border-white/5">
                <ShieldCheck size={48} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">No hay solicitudes de acceso</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}