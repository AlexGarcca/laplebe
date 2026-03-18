import { supabase } from './lib/supabase'
import Link from 'next/link'
import MatchTicker from '@/components/MatchTicker'
import HallOfFame from '@/components/HallOfFame' // 🔥 Importamos el nuevo componente
import { FadeInUp, StaggeredGrid, GridItem } from '@/components/AnimatedWrappers'

export const revalidate = 0; 

interface Equipo {
  id: string;
  nombre: string;
  presidente: string;
  color_hex: string;
  escudo_url: string;
}

export default async function Home() {
  const { data: equipos } = await supabase
    .from('equipos')
    .select('*')
    .neq('nombre', 'DRAFT') // 🛡️ Filtro de seguridad para el equipo invisible
    .order('nombre');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      {/* NAVBAR ELITE STICKY */}
      <nav className="backdrop-blur-2xl bg-black/80 border-b border-white/5 sticky top-0 z-100 px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
            <img 
              src="/LOGO_PNG.png" 
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(252,194,0,0.3)]" 
              alt="Logo Plebeians League" 
            />
          </div>
          <div className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-[#fcc200] transition-colors">
            Plebeians <span className="text-[#fcc200]">League</span>
          </div>
        </Link>

        <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 items-center">
          <Link href="/partidos" className="hover:text-[#fcc200] transition-colors">Calendario</Link>
          <Link href="/clasificacion" className="hover:text-[#fcc200] transition-colors">Posiciones</Link>
          <Link href="/estadisticas" className="hover:text-[#fcc200] transition-colors">Estadísticas</Link>
          
          <Link href="/login" className="ml-6 px-6 py-2.5 bg-[#fcc200] text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(252,194,0,0.2)]">
            Portal Presis
          </Link>
        </div>
      </nav>

      <div className="overflow-x-hidden">
        <MatchTicker />

        {/* HERO BANNER */}
        <header className="relative w-full py-40 md:py-56 flex items-center justify-center text-center px-8 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/banner.jpg" 
              className="w-full h-full object-cover opacity-40 scale-105" 
              alt="Banner" 
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
          </div>
          <FadeInUp>
            <div className="relative z-10 max-w-5xl">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.5em] text-[#fcc200] mb-10 bg-[#fcc200]/10 px-6 py-2.5 rounded-full border border-[#fcc200]/20 backdrop-blur-md">
                Temporada Regular 2026 • Split 3
              </span>
              <h1 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter text-white mb-10 leading-[0.85] drop-shadow-2xl">
                La Liga de los <br />
                <span className="text-[#fcc200] drop-shadow-[0_0_50px_rgba(252,194,0,0.4)]">Plebeyos</span>
              </h1>
              <p className="text-zinc-400 text-xl md:text-2xl font-medium max-w-2xl mx-auto tracking-tight leading-relaxed opacity-90">
                14 clubes, una sola corona. La competición más intensa de México llevada al siguiente nivel digital.
              </p>
            </div>
          </FadeInUp>
        </header>

        {/* 🔥 SALÓN DE LA FAMA (Líderes Estadísticos) */}
        <HallOfFame />

        <main className="p-8 md:p-20 max-w-7xl mx-auto">
          <FadeInUp delay={0.2}>
            <div className="flex items-center gap-4 mb-16">
              <div className="w-1.5 h-8 bg-[#fcc200] rounded-full"></div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Clubes Oficiales</h2>
            </div>
          </FadeInUp>
          
          {/* GRID ANIMADO DE EQUIPOS */}
          <StaggeredGrid>
            {equipos?.map((equipo: Equipo) => (
              <GridItem key={equipo.id}>
                <Link href={`/equipo/${equipo.id}`} className="group block h-full">
                  <div className="relative bg-[#141414] rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center transition-all duration-500 group-hover:bg-[#1a1a1a] group-hover:border-[#fcc200]/30 shadow-2xl h-full overflow-hidden">
                    {/* Indicador de color del equipo */}
                    <div className="absolute top-0 left-0 w-full h-1 opacity-20 transition-opacity group-hover:opacity-100" style={{ backgroundColor: equipo.color_hex }} />
                    
                    <div className="w-24 h-24 mb-6 flex items-center justify-center transition-transform duration-700 group-hover:scale-110">
                      <img src={equipo.escudo_url || '/placeholder.png'} alt={equipo.nombre} className="w-full h-full object-contain brightness-110" />
                    </div>
                    <h3 className="text-sm font-black text-center uppercase tracking-widest text-white group-hover:text-[#fcc200] mb-2">{equipo.nombre}</h3>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      Presi: {equipo.presidente?.split(',')[0]}
                    </p>
                  </div>
                </Link>
              </GridItem>
            ))}
          </StaggeredGrid>

          {/* CTA FINAL VESTIDOR */}
          <section className="mt-40 mb-20 relative">
            <FadeInUp delay={0.1}>
              <div className="max-w-5xl mx-auto bg-linear-to-b from-[#141414] to-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#fcc200]/5 rounded-full blur-3xl group-hover:bg-[#fcc200]/10 transition-colors" />
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-6 tracking-tighter">¿Lideras un <span className="text-[#fcc200]">Club?</span></h2>
                <p className="text-zinc-500 mb-12 max-w-lg mx-auto font-medium text-lg leading-relaxed">
                  Gestiona tu plantilla, analiza estadísticas y confirma tu alineación desde el vestidor oficial.
                </p>
                <Link href="/login" className="inline-block bg-white text-black font-black uppercase italic tracking-[0.2em] px-12 py-5 rounded-2xl hover:bg-[#fcc200] hover:scale-105 transition-all shadow-xl shadow-black">
                  Entrar al Vestidor
                </Link>
              </div>
            </FadeInUp>
          </section>
        </main>
      </div>
    </div>
  );
}