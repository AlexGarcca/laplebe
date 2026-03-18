'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { FadeInUp } from '@/components/AnimatedWrappers'

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
        pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0
      }))

      partidos?.forEach(p => {
        const local = stats.find(s => s.id === p.equipo_local_id)
        const visita = stats.find(s => s.id === p.equipo_visita_id)
        if (local && visita) {
          local.pj++; visita.pj++;
          local.gf += p.goles_local; local.gc += p.goles_visita;
          visita.gf += p.goles_visita; visita.gc += p.goles_local;
          if (p.goles_local > p.goles_visita) { local.pg++; local.pts += 3; visita.pp++; }
          else if (p.goles_local < p.goles_visita) { visita.pg++; visita.pts += 3; local.pp++; }
          else { local.pe++; local.pts += 1; visita.pe++; visita.pts += 1; }
          local.dg = local.gf - local.gc;
          visita.dg = visita.gf - visita.gc;
        }
      })

      setTabla(stats.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf))
      setLoading(false)
    }
    calcularPosiciones()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-black text-[#fcc200] animate-pulse uppercase tracking-[0.5em]">
      Sincronizando Tablero...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f7] font-sans selection:bg-[#fcc200]/30">
      
      <Navbar />

      <MatchTicker />

      <main className="max-w-7xl mx-auto p-4 md:p-20">
        <header className="mb-12 md:mb-20 text-center">
          <FadeInUp>
            <h1 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-6 leading-none">
              Tablero de <span className="text-[#fcc200]">Posiciones</span>
            </h1>
            <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.5em]">Temporada Regular • Split 3</p>
          </FadeInUp>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#141414] rounded-4xl md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
        >
          {/* Contenedor con scroll horizontal para móviles */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse min-w-150 md:min-w-full">
              <thead>
                <tr className="bg-black/40 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">
                  <th className="w-16 py-6 text-center">Rk</th>
                  <th className="px-6 py-6 text-left sticky left-0 bg-[#141414] md:relative z-10">Club</th>
                  <th className="w-14 py-6 text-center">PJ</th>
                  <th className="w-20 py-6 text-center text-[#fcc200] bg-[#fcc200]/5">PTS</th>
                  <th className="w-14 py-6 text-center">PG</th>
                  <th className="w-14 py-6 text-center hidden md:table-cell">PE</th>
                  <th className="w-14 py-6 text-center hidden md:table-cell">PP</th>
                  <th className="w-20 py-6 text-center">DG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tabla.map((equipo, index) => {
                  const isLiguilla = index < 8;
                  const isDescenso = index >= 10;

                  return (
                    <motion.tr 
                      key={equipo.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="group hover:bg-white/2 transition-all"
                    >
                      <td className={`py-5 text-center font-black italic text-lg md:text-xl border-l-4 ${isLiguilla ? 'border-cyan-500' : isDescenso ? 'border-rose-500' : 'border-transparent'} ${index === 0 ? 'text-[#fcc200]' : 'text-zinc-700'}`}>
                        {index + 1}
                      </td>
                      
                      <td className="px-6 py-5 text-left sticky left-0 bg-[#141414] group-hover:bg-[#1a1a1a] transition-colors md:relative z-10">
                        <div className="flex items-center gap-4">
                          <img src={equipo.escudo} className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="" />
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-black uppercase tracking-tight group-hover:text-[#fcc200] transition-colors">{equipo.nombre}</span>
                            {isLiguilla && <span className="text-[6px] md:text-[7px] font-black uppercase text-cyan-500/60 tracking-widest">Zona Liguilla</span>}
                            {isDescenso && <span className="text-[6px] md:text-[7px] font-black uppercase text-rose-500/60 tracking-widest">Zona Riesgo</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-5 text-center text-[10px] md:text-xs font-bold text-zinc-400">{equipo.pj}</td>
                      <td className="py-5 text-center font-black text-[#fcc200] bg-[#fcc200]/5 text-base md:text-lg">{equipo.pts}</td>
                      <td className="py-5 text-center text-[10px] font-bold text-zinc-500">{equipo.pg}</td>
                      <td className="py-5 text-center text-[10px] font-bold text-zinc-500 hidden md:table-cell">{equipo.pe}</td>
                      <td className="py-5 text-center text-[10px] font-bold text-zinc-500 hidden md:table-cell">{equipo.pp}</td>
                      <td className={`py-5 text-center text-xs font-black ${equipo.dg > 0 ? 'text-emerald-500' : equipo.dg < 0 ? 'text-rose-500' : 'text-zinc-700'}`}>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}