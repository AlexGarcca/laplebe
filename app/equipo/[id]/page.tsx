'use client'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { FadeInUp, StaggeredGrid, GridItem } from '@/components/AnimatedWrappers'
import { ChevronLeft } from 'lucide-react'

export default function EquipoPage({ params }: { params: any }) {
  const [equipo, setEquipo] = useState<any>(null)
  const [jugadoresOrdenados, setJugadoresOrdenados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params // Next.js 15+ requiere el await
      const { data: eq } = await supabase.from('equipos').select('*').eq('id', id).single()
      const { data: jugs } = await supabase.from('jugadores').select('*').eq('id_equipo', id).order('posicion')

      if (eq) {
        setEquipo(eq)
        const ordenJerarquia: Record<string, number> = { 
          'Presidente': 0, 
          'Franquicia': 1, 
          'Rescatado': 2, 
          'Draft': 3 
        }
        const ordenados = jugs?.sort((a, b) => (ordenJerarquia[a.tipo] || 4) - (ordenJerarquia[b.tipo] || 4))
        setJugadoresOrdenados(ordenados || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [params])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#fcc200] font-black tracking-[0.5em] animate-pulse uppercase">
      Sincronizando Plantilla...
    </div>
  )

  if (!equipo) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-bold">EQUIPO NO ENCONTRADO</div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      <Navbar />

      {/* HEADER DINÁMICO RESPONSIVO */}
      <header className="relative w-full pt-16 md:pt-24 pb-12 md:pb-20 px-6 md:px-16 border-b border-white/5 overflow-hidden">
        {/* Fondo con el color del equipo */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 md:opacity-20 pointer-events-none" 
          style={{ backgroundImage: `radial-gradient(circle at center, ${equipo.color_hex}60, transparent 70%)` }}
        ></div>
        
        <FadeInUp>
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Botón Volver - Más amigable en celular */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-[#fcc200] transition-all mb-12 group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver a la Liga
            </Link>

            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 text-center md:text-left">
              <img src={equipo.escudo_url} className="w-32 h-32 md:w-48 md:h-48 object-contain brightness-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" alt="Logo" />
              <div className="flex-1">
                <span className="inline-block px-4 py-1 bg-white/5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 border border-white/5 mb-6">Club Oficial • Plebeians League</span>
                <h1 className="text-5xl md:text-9xl font-black uppercase italic tracking-tighter leading-none mb-6" style={{ color: equipo.color_hex }}>
                  {equipo.nombre}
                </h1>
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-zinc-400">
                  <p className="text-lg md:text-xl font-medium tracking-tight">Presi: <b className="text-white uppercase font-black">{equipo.presidente || '-'}</b></p>
                  <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600 italic">Est. 2026 • Split 3</p>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-20">
        <FadeInUp delay={0.2}>
          <div className="flex items-center gap-4 mb-12 md:mb-16">
            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: equipo.color_hex }}></div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Plantilla de Jugadores</h2>
          </div>
        </FadeInUp>

        {jugadoresOrdenados.length === 0 ? (
          <FadeInUp delay={0.3}>
            <div className="bg-[#141414] rounded-[2.5rem] border border-white/5 p-12 md:p-20 text-center shadow-2xl">
              <h3 className="text-lg md:text-2xl font-black uppercase italic text-zinc-700">Esperando el DRAFT Oficial...</h3>
            </div>
          </FadeInUp>
        ) : (
          <StaggeredGrid>
            {jugadoresOrdenados.map((jugador) => {
              let colorEspecial = equipo.color_hex;
              if (jugador.tipo === 'Franquicia') colorEspecial = '#fcc200';
              if (jugador.tipo === 'Rescatado') colorEspecial = '#a1a1aa';

              return (
                <GridItem key={jugador.id}>
                  <div className="group relative bg-[#141414] rounded-4xl md:rounded-[2.5rem] border border-white/5 p-6 md:p-8 flex flex-col transition-all duration-500 hover:bg-[#1a1a1a] hover:border-[#fcc200]/20 shadow-2xl overflow-hidden h-full">
                    {/* Barra de color lateral dinámica */}
                    <div className="absolute top-0 right-0 w-1 h-full opacity-30" style={{ backgroundColor: colorEspecial }}></div>

                    <div className="flex justify-between items-start mb-8">
                      <span className="text-4xl md:text-5xl font-black italic tracking-tighter opacity-10 group-hover:opacity-40 transition-opacity" style={{ color: colorEspecial }}>{jugador.numero_camiseta || '00'}</span>
                      <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border" style={{ borderColor: `${colorEspecial}40`, color: colorEspecial }}>
                        {jugador.posicion}
                      </span>
                    </div>

                    <div className="mt-auto relative z-10">
                      {jugador.tipo !== 'Draft' && (
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-2 block" style={{ color: colorEspecial }}>
                          JUGADOR {jugador.tipo}
                        </span>
                      )}
                      <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-white mb-2 leading-tight group-hover:text-[#fcc200] transition-colors">
                        {jugador.nombre}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold uppercase text-zinc-600 tracking-widest">Rating:</span>
                        <span className="text-xs md:text-sm font-black text-white">{jugador.valoracion || '80'}</span>
                      </div>
                    </div>
                  </div>
                </GridItem>
              );
            })}
          </StaggeredGrid>
        )}
      </main>
    </div>
  );
}