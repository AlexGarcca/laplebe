'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { FadeInUp } from '@/components/AnimatedWrappers'
import { Trophy } from 'lucide-react'

export default function ClasificacionPage() {
  const [tabla, setTabla] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calcularPosiciones = async () => {
      setLoading(true)
      const { data: equipos } = await supabase.from('equipos').select('*').neq('nombre', 'DRAFT')
      const { data: partidos } = await supabase.from('partidos').select('*').eq('jugado', true)

      if (!equipos) return

      const stats = equipos.map(e => ({
        id: e.id,
        nombre: e.nombre,
        escudo: e.escudo_url,
        pj: 0, pg: 0, pgs: 0, pps: 0, pp: 0, pe: 0, gf: 0, gc: 0, dg: 0, pts: 0
      }))

      partidos?.forEach(p => {
        const local = stats.find(s => s.id === p.equipo_local_id)
        const visita = stats.find(s => s.id === p.equipo_visita_id)
        
        if (local && visita) {
          local.pj++; visita.pj++;
          // Los goles a favor y en contra solo cuentan los del tiempo regular / gol de oro
          local.gf += p.goles_local; local.gc += p.goles_visita;
          visita.gf += p.goles_visita; visita.gc += p.goles_local;
          
          if (p.goles_local > p.goles_visita) { 
            // Victoria Regular Local (3 pts)
            local.pg++; local.pts += 3; visita.pp++; 
          } else if (p.goles_local < p.goles_visita) { 
            // Victoria Regular Visita (3 pts)
            visita.pg++; visita.pts += 3; local.pp++; 
          } else { 
            // EMPATE EN TIEMPO REGULAR -> VAMOS A SHOOTOUTS
            if (p.goles_shootout_local > p.goles_shootout_visita) {
              // Victoria Shootout Local (2 pts), Derrota Shootout Visita (1 pt)
              local.pgs++; local.pts += 2;
              visita.pps++; visita.pts += 1;
            } else if (p.goles_shootout_local < p.goles_shootout_visita) {
              // Victoria Shootout Visita (2 pts), Derrota Shootout Local (1 pt)
              visita.pgs++; visita.pts += 2;
              local.pps++; local.pts += 1;
            } else {
              // Empate absoluto (si por alguna razón no metieron resultados de shootouts)
              local.pe++; local.pts += 1; visita.pe++; visita.pts += 1; 
            }
          }
          
          local.dg = local.gf - local.gc;
          visita.dg = visita.gf - visita.gc;
        }
      })

      // CRITERIO DE DESEMPATE OFICIAL: 
      // 1. Puntos (pts)
      // 2. Diferencia de Goles (dg)
      // 3. Goles a Favor (gf)
      // 4. Menos Goles en Contra (gc)
      setTabla(stats.sort((a, b) => 
        b.pts - a.pts || 
        b.dg - a.dg || 
        b.gf - a.gf || 
        a.gc - b.gc 
      ))
      
      setLoading(false)
    }
    calcularPosiciones()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-black text-[#fcc200] animate-pulse uppercase tracking-[0.5em] gap-4">
      <Trophy size={40} className="animate-bounce" />
      Calculando Tablero...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans pb-20 selection:bg-[#fcc200]/30">
      <Navbar />
      <MatchTicker />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 mt-6 md:mt-8">
        <header className="mb-12 md:mb-16 text-center">
          <FadeInUp>
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-4 leading-none">
              Tabla <span className="text-[#fcc200]">General</span>
            </h1>
            <p className="text-zinc-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em]">Temporada Regular • Split 3</p>
          </FadeInUp>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#141414] rounded-4xl md:rounded-[3rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-165 md:min-w-full">
              <thead>
                <tr className="bg-black/60 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">
                  <th className="w-16 py-6 text-center">Rk</th>
                  <th className="px-3 md:px-6 py-6 text-left sticky left-0 bg-black/60 md:relative z-10 backdrop-blur-md">Franquicia</th>
                  <th className="w-14 py-6 text-center" title="Partidos Jugados">PJ</th>
                  <th className="w-20 py-6 text-center text-[#fcc200] bg-[#fcc200]/5 text-xs" title="Puntos">PTS</th>
                  <th className="w-14 py-6 text-center" title="Victoria Regular (3 Pts)">V</th>
                  <th className="w-14 py-6 text-center text-emerald-500" title="Victoria Shootouts (2 Pts)">VS</th>
                  <th className="w-14 py-6 text-center text-amber-500" title="Derrota Shootouts (1 Pt)">DS</th>
                  <th className="w-14 py-6 text-center" title="Derrota Regular (0 Pts)">D</th>
                  <th className="w-14 py-6 text-center hidden md:table-cell" title="Goles a Favor">GF</th>
                  <th className="w-14 py-6 text-center hidden md:table-cell" title="Goles en Contra">GC</th>
                  <th className="w-20 py-6 text-center" title="Diferencia de Goles">DG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tabla.map((equipo, index) => {
                  const isLider = index === 0;
                  const isLiguilla = index >= 1 && index <= 7;
                  const isDescenso = index >= tabla.length - 2;

                  return (
                    <motion.tr 
                      key={equipo.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-white/5 transition-all cursor-default"
                    >
                      <td className="py-4 text-center">
                        <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-xl font-black italic text-sm md:text-base border ${isLider ? 'bg-[#fcc200]/10 border-[#fcc200] text-[#fcc200]' : isLiguilla ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500' : isDescenso ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' : 'bg-transparent border-transparent text-zinc-600'}`}>
                          {index + 1}
                        </div>
                      </td>
                      
                      <td className="px-3 md:px-6 py-4 text-left sticky left-0 bg-[#141414] group-hover:bg-[#1a1a1a] transition-colors md:relative z-10">
                        <Link href={`/equipo/${equipo.id}`} className="flex items-center gap-4 cursor-pointer">
                          <img src={equipo.escudo} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform" alt="" />
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-black uppercase tracking-tight text-white group-hover:text-[#fcc200] transition-colors">{equipo.nombre}</span>
                            {isLider && <span className="text-[7px] font-black uppercase text-[#fcc200] tracking-widest">Súper Líder</span>}
                            {isLiguilla && <span className="text-[7px] font-black uppercase text-cyan-500/80 tracking-widest">Zona Clasificación</span>}
                            {isDescenso && <span className="text-[7px] font-black uppercase text-rose-500/80 tracking-widest">Zona Descenso</span>}
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 text-center text-[10px] md:text-xs font-black text-zinc-400">{equipo.pj}</td>
                      <td className="py-4 text-center font-black text-[#fcc200] bg-[#fcc200]/5 text-lg md:text-xl italic">{equipo.pts}</td>
                      
                      <td className="py-4 text-center text-xs font-black text-white">{equipo.pg}</td>
                      <td className="py-4 text-center text-xs font-black text-emerald-500 bg-emerald-500/5">{equipo.pgs}</td>
                      <td className="py-4 text-center text-xs font-black text-amber-500 bg-amber-500/5">{equipo.pps}</td>
                      <td className="py-4 text-center text-xs font-black text-zinc-600">{equipo.pp}</td>

                      <td className="py-4 text-center text-xs font-black text-zinc-400 hidden md:table-cell">{equipo.gf}</td>
                      <td className="py-4 text-center text-xs font-black text-zinc-400 hidden md:table-cell">{equipo.gc}</td>
                      <td className={`py-4 text-center text-sm md:text-base font-black italic ${equipo.dg > 0 ? 'text-emerald-400' : equipo.dg < 0 ? 'text-rose-400' : 'text-zinc-600'}`}>
                        {equipo.dg > 0 ? `+${equipo.dg}` : equipo.dg}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fcc20040; border-radius: 10px; }
      `}</style>
    </div>
  )
}