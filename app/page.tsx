import Link from 'next/link'
import { supabase } from './lib/supabase'
import MatchTicker from '@/components/MatchTicker'
import HallOfFame from '@/components/HallOfFame'
import Navbar from '@/components/Navbar'
import { FadeInUp, StaggeredGrid, GridItem } from '@/components/AnimatedWrappers'
import { Metadata } from 'next'

// 🔥 CONFIGURACIÓN DE PESTAÑA (Metadata)
export const metadata: Metadata = {
  title: 'Plebeians League | Split 3',
  description: 'La Liga de los Plebeyos - Sitio Oficial',
  icons: {
    icon: '/icon.png?v=1', // Recuerda renombrar tu logo a icon.png en public/
  },
}

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
    .neq('nombre', 'DRAFT')
    .order('nombre');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      {/* NAVBAR RESPONSIVO (Ya no es estático) */}
      <Navbar />

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
            {/* Corregido: gradient-to-b es el estándar de Tailwind */}
            <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
          </div>
          <FadeInUp>
            <div className="relative z-10 max-w-5xl">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.5em] text-[#fcc200] mb-10 bg-[#fcc200]/10 px-6 py-2.5 rounded-full border border-[#fcc200]/20 backdrop-blur-md">
                Temporada Regular 2026 • Split 3
              </span>
              <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter text-white mb-10 leading-[0.85] drop-shadow-2xl">
                La Liga de los <br />
                <span className="text-[#fcc200] drop-shadow-[0_0_50px_rgba(252,194,0,0.4)]">Plebeyos</span>
              </h1>
              <p className="text-zinc-400 text-lg md:text-2xl font-medium max-w-2xl mx-auto tracking-tight leading-relaxed opacity-90 px-4">
                14 clubes, una sola corona. La competición más intensa de México llevada al siguiente nivel digital.
              </p>
            </div>
          </FadeInUp>
        </header>

        <HallOfFame />

        <main className="p-6 md:p-20 max-w-7xl mx-auto">
          <FadeInUp delay={0.2}>
            <div className="flex items-center gap-4 mb-16">
              <div className="w-1.5 h-8 bg-[#fcc200] rounded-full"></div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Clubes Oficiales</h2>
            </div>
          </FadeInUp>
          
          <StaggeredGrid>
            {equipos?.map((equipo: Equipo) => (
              <GridItem key={equipo.id}>
                <Link href={`/equipo/${equipo.id}`} className="group block h-full">
                  <div className="relative bg-[#141414] rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center transition-all duration-500 group-hover:bg-[#1a1a1a] group-hover:border-[#fcc200]/30 shadow-2xl h-full overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 opacity-20 transition-opacity group-hover:opacity-100" style={{ backgroundColor: equipo.color_hex }} />
                    <div className="w-24 h-24 mb-6 flex items-center justify-center transition-transform duration-700 group-hover:scale-110">
                      <img src={equipo.escudo_url || '/placeholder.png'} alt={equipo.nombre} className="w-full h-full object-contain brightness-110" />
                    </div>
                    <h3 className="text-sm font-black text-center uppercase tracking-widest text-white group-hover:text-[#fcc200] mb-2">{equipo.nombre}</h3>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    {equipo.presidente?.split(',')[0]}
                    </p>
                  </div>
                </Link>
              </GridItem>
            ))}
          </StaggeredGrid>

          <section className="mt-40 mb-20 relative px-4">
            <FadeInUp delay={0.1}>
              <div className="max-w-5xl mx-auto bg-linear-to-b from-[#141414] to-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#fcc200]/5 rounded-full blur-3xl" />
                <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-6 tracking-tighter">¿Lideras un <span className="text-[#fcc200]">Club?</span></h2>
                <p className="text-zinc-500 mb-12 max-w-lg mx-auto font-medium text-base md:text-lg leading-relaxed">
                  Gestiona tu plantilla, analiza estadísticas y confirma tu alineación desde el vestidor oficial.
                </p>
                <Link href="/login" className="inline-block w-full md:w-auto bg-white text-black font-black uppercase italic tracking-[0.2em] px-12 py-5 rounded-2xl hover:bg-[#fcc200] hover:scale-105 transition-all shadow-xl shadow-black">
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