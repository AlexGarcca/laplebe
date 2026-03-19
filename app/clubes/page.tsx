'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeInUp, StaggeredGrid, GridItem, RevealSection, SharedPageTitle, SharedMetaBadge } from '@/components/AnimatedWrappers' // 🔥 Reutilizando tus componentes top

export default function ClubesPage() {
  const [clubes, setClubes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchClubes()
  }, [])

  const fetchClubes = async () => {
    setLoading(true)
    setLoadError(null)
    
    try {
      const [equiposRes, presisRes] = await Promise.all([
        supabase
          .from('equipos')
          .select('*')
          .neq('nombre', 'DRAFT')
          .order('nombre'),
        supabase
          .from('perfiles_presidentes')
          .select('nombre_presidente, equipo_id')
          .eq('aprobado', true),
      ])

      if (equiposRes.error) throw equiposRes.error
      if (presisRes.error) throw presisRes.error

      const equiposData = equiposRes.data || []
      const presisData = presisRes.data || []

      const equiposOficiales = equiposData.filter(e => e.nombre.toUpperCase() !== 'DRAFT')
      const presisByEquipo = new Map(presisData.map(p => [p.equipo_id, p.nombre_presidente]))

      const equiposConPresi = equiposOficiales.map(equipo => ({
        ...equipo,
        presidente: presisByEquipo.get(equipo.id) || 'Sin Presidente'
      }))

      setClubes(equiposConPresi)
    } catch (error: any) {
      setLoadError(error?.message || 'No se pudieron cargar los clubes')
      setClubes([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20 selection:bg-[#fcc200]/30">
      <Navbar />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
        <FadeInUp>
          <header className="mb-12 md:mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <SharedPageTitle layoutId="shared-page-title" className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">
                Clubes <span className="text-[#fcc200]">Oficiales</span>
              </SharedPageTitle>
              <SharedMetaBadge layoutId="shared-page-kicker" className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mt-3 italic">
                Plebeians League Franchise Directory
              </SharedMetaBadge>
            </div>
            <div className="px-4 sm:px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 shadow-xl">
              <Shield size={20} className="text-[#fcc200]" />
              <span className="text-base sm:text-lg font-black text-white">{clubes.length} <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest ml-1">Equipos Inscritos</span></span>
            </div>
          </header>
        </FadeInUp>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="text-[#fcc200] animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#fcc200]">Cargando Franquicias...</p>
          </div>
        ) : (
          <RevealSection>
          <StaggeredGrid>
            {clubes.map((club) => (
              <GridItem key={club.id}>
                {/* 🔥 RECICLAMOS EXACTAMENTE TU DISEÑO DEL MAIN */}
                <Link href={`/equipo/${club.id}`} className="group block h-full">
                  <motion.div
                    layoutId={`club-card-${club.id}`}
                    whileHover={{ y: -10, scale: 1.012 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20, mass: 0.8 }}
                    className="relative bg-[#141414] rounded-[2.2rem] sm:rounded-[2.5rem] border border-white/5 p-5 sm:p-8 flex flex-col items-center transition-all duration-500 group-hover:bg-[#1a1a1a] group-hover:border-[#fcc200]/30 shadow-2xl h-full overflow-hidden"
                  >
                    {/* Línea superior con el color del equipo */}
                    <div 
                      className="absolute top-0 left-0 w-full h-1 opacity-20 transition-opacity group-hover:opacity-100" 
                      style={{ backgroundColor: club.color_hex || '#fcc200' }} 
                    />
                    
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mb-5 sm:mb-6 flex items-center justify-center transition-transform duration-700 group-hover:scale-110">
                      <motion.img 
                        layoutId={`club-crest-${club.id}`}
                        src={club.escudo_url || '/placeholder.png'} 
                        alt={club.nombre} 
                        className="w-full h-full object-contain brightness-110" 
                      />
                    </div>
                    
                    <motion.h3 layoutId={`club-title-${club.id}`} className="text-sm font-black text-center uppercase tracking-widest text-white group-hover:text-[#fcc200] mb-2">
                      {club.nombre}
                    </motion.h3>
                    
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      {club.presidente?.split(',')[0]}
                    </p>
                  </motion.div>
                </Link>
              </GridItem>
            ))}
          </StaggeredGrid>
          </RevealSection>
        )}

        {!loading && loadError && (
          <FadeInUp delay={0.15}>
            <div className="text-center py-16 bg-[#141414] rounded-[3rem] border border-rose-500/20 shadow-2xl">
              <Shield size={44} className="mx-auto text-rose-500/80 mb-4" />
              <p className="text-rose-400 font-black uppercase tracking-[0.25em] text-[10px] mb-3">Error de Carga</p>
              <p className="text-zinc-500 text-xs font-bold">{loadError}</p>
              <button
                onClick={fetchClubes}
                className="mt-6 px-5 py-3 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:border-[#fcc200]/40 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                Reintentar
              </button>
            </div>
          </FadeInUp>
        )}

        {!loading && !loadError && clubes.length === 0 && (
          <FadeInUp delay={0.2}>
            <div className="text-center py-20 bg-[#141414] rounded-[3rem] border border-white/5 shadow-2xl">
              <Shield size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">No hay clubes registrados aún</p>
            </div>
          </FadeInUp>
        )}
      </main>
    </div>
  )
}