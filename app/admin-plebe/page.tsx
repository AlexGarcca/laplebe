'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, UserPlus, Trophy, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [pendientes, setPendientes] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email !== 'garcca29@gmail.com') {
        router.push('/')
        return
      }

      fetchAdminData()
    }

    validateAndFetch()
  }, [router])

  const fetchAdminData = async () => {
    setLoading(true)
    // 1. Traer perfiles (especialmente los no aprobados primero)
    const { data: pData } = await supabase
      .from('perfiles_presidentes')
      .select('*, equipos(nombre, escudo_url)')
      .order('aprobado', { ascending: true })

    // 2. Traer lista de equipos para el selector
    const { data: eData } = await supabase.from('equipos').select('*').order('nombre')

    if (pData) setPendientes(pData)
    if (eData) setEquipos(eData)
    setLoading(false)
  }

  const handleUpdate = async (id: string, equipoId: string, aprobado: boolean) => {
    const { error } = await supabase
      .from('perfiles_presidentes')
      .update({ equipo_id: equipoId, aprobado: aprobado })
      .eq('id', id)

    if (error) alert("Error al actualizar: " + error.message)
    else fetchAdminData() // Refrescar lista
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
              Panel de <span className="text-[#fcc200]">Control</span>
            </h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Plebeians League Authorization Hub</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-[#fcc200]"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

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
                {/* INFO DEL SOLICITANTE */}
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

                {/* ACCIONES DE ADMIN */}
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  {/* SELECTOR DE EQUIPO */}
                  <select 
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#fcc200] transition-all flex-1 md:flex-none min-w-45"
                    value={presi.equipo_id || ""}
                    onChange={(e) => handleUpdate(presi.id, e.target.value, presi.aprobado)}
                  >
                    <option value="">ASIGNAR EQUIPO...</option>
                    {equipos.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre.toUpperCase()}</option>
                    ))}
                  </select>

                  {/* BOTÓN DE APROBACIÓN */}
                  <button
                    onClick={() => handleUpdate(presi.id, presi.equipo_id, !presi.aprobado)}
                    disabled={!presi.equipo_id}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex-1 md:flex-none justify-center ${
                      presi.aprobado 
                      ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
                      : 'bg-[#fcc200] text-black hover:scale-105 disabled:opacity-20'
                    }`}
                  >
                    {presi.aprobado ? <><XCircle size={14}/> REVOCAR</> : <><CheckCircle2 size={14}/> APROBAR</>}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {pendientes.length === 0 && (
            <div className="text-center py-20 bg-[#141414] rounded-[3rem] border border-white/5">
              <ShieldCheck size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">No hay solicitudes de acceso</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
