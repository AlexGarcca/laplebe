'use client'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FadeInUp, StaggeredGrid, GridItem } from '@/components/AnimatedWrappers'

export default function EquipoPage({ params }: { params: any }) {
  const [equipo, setEquipo] = useState<any>(null)
  const [jugadoresOrdenados, setJugadoresOrdenados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params
      const { data: eq } = await supabase.from('equipos').select('*').eq('id', id).single()
      const { data: jugs } = await supabase.from('jugadores').select('*').eq('id_equipo', id).order('posicion')

      if (eq) {
        setEquipo(eq)
        const ordenJerarquia: Record<string, number> = { 
          'Presidente': 0, // <--- Prioridad máxima
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
      
      {/* NAVBAR ELITE (Universal con Contexto de Equipo) */}
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-6 md:px-8 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-6 md:gap-8">
          {/* LOGO DE LA LIGA */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
              <img 
                src="/LOGO_PNG.png" 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(252,194,0,0.3)]" 
                alt="Logo Plebeians League" 
              />
            </div>
            <div className="hidden lg:block text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#fcc200] transition-colors">
              Plebeians <span className="text-[#fcc200]">League</span>
            </div>
          </Link>

          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

          {/* BOTÓN VOLVER (Minimalista) */}
          <Link 
            href="/" 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform text-[#fcc200]">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </Link>
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 mr-4">
            <img src={equipo.escudo_url} className="w-8 h-8 object-contain brightness-125" alt="" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fcc200] hidden md:block">
              {equipo.nombre}
            </span>
          </div>
          <Link 
            href="/login" 
            className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
          >
            Portal Presis
          </Link>
        </div>
      </nav>

      {/* HEADER DINÁMICO */}
      <header className="relative w-full pt-24 pb-20 px-8 md:px-16 border-b border-white/5 overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 pointer-events-none" 
          style={{ backgroundImage: `radial-gradient(circle at center, ${equipo.color_hex}60, transparent 70%)` }}
        ></div>
        
        <FadeInUp>
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end gap-12 text-center md:text-left">
            <img src={equipo.escudo_url} className="w-48 h-48 object-contain brightness-110 drop-shadow-[0_0_50px_rgba(255,255,255,0.05)]" alt="Logo" />
            <div className="flex-1">
              <span className="inline-block px-4 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 border border-white/5 mb-6">Club Oficial • Plebeians League</span>
              <h1 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-none mb-6" style={{ color: equipo.color_hex }}>
                {equipo.nombre}
              </h1>
              <div className="flex flex-col md:flex-row md:items-center gap-6 text-zinc-400">
                <p className="text-xl font-medium tracking-tight">Presidencia: <b className="text-white uppercase font-black">{equipo.presidente || '-'}</b></p>
                <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                <p className="text-sm uppercase tracking-widest font-bold text-zinc-600 italic">Temporada 2026</p>
              </div>
            </div>
          </div>
        </FadeInUp>
      </header>

      <main className="max-w-7xl mx-auto p-8 md:p-20">
        <FadeInUp delay={0.2}>
          <div className="flex items-center gap-4 mb-16">
            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: equipo.color_hex }}></div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Plantilla de Jugadores</h2>
          </div>
        </FadeInUp>

        {jugadoresOrdenados.length === 0 ? (
          <FadeInUp delay={0.3}>
            <div className="bg-[#141414] rounded-[3rem] border border-white/5 p-20 text-center shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic text-zinc-700">Esperando el DRAFT Oficial...</h3>
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
                  <div className="group relative bg-[#141414] rounded-[2.5rem] border border-white/5 p-8 flex flex-col transition-all duration-500 hover:bg-[#1a1a1a] shadow-2xl overflow-hidden h-full">
                    <div className="flex justify-between items-start mb-10">
                      <span className="text-5xl font-black italic tracking-tighter opacity-10 group-hover:opacity-30 transition-opacity" style={{ color: colorEspecial }}>{jugador.numero_camiseta || '00'}</span>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border" style={{ borderColor: `${colorEspecial}40`, color: colorEspecial }}>
                        {jugador.posicion}
                      </span>
                    </div>

                    <div className="mt-auto relative z-10">
                      {jugador.tipo !== 'Draft' && (
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block" style={{ color: colorEspecial }}>
                          JUGADOR {jugador.tipo}
                        </span>
                      )}
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-2 leading-tight group-hover:text-[#fcc200] transition-colors">
                        {jugador.nombre}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest">Rating:</span>
                        <span className="text-sm font-black text-white">{jugador.valoracion || 'N/A'}</span>
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