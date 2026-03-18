'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import MatchTicker from '@/components/MatchTicker'
import Link from 'next/link'

export default function ClasificacionElitePage() {
  const [tabla, setTabla] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calcularPosiciones = async () => {
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
      
      {/* NAVBAR ELITE (Universal) */}
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
          <Link href="/clasificacion" className="text-[#fcc200] border-b border-[#fcc200]/50 pb-1">Posiciones</Link>
          <Link href="/estadisticas" className="hover:text-[#fcc200] transition-colors">Estadísticas</Link>
          <Link href="/login" className="ml-6 px-6 py-2.5 bg-[#fcc200] text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(252,194,0,0.2)]">
            Portal Presis
          </Link>
        </div>
      </nav>

      <MatchTicker />

      <main className="max-w-7xl mx-auto p-8 md:p-20">
        <header className="mb-20 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-6">
            Tablero de <span className="text-[#fcc200] drop-shadow-[0_0_30px_rgba(252,194,0,0.2)]">Posiciones</span>
          </motion.h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">Temporada Regular • Split 3</p>
        </header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#141414] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black/40 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 border-b border-white/5">
                  <th className="w-20 py-8 text-center">Rk</th>
                  <th className="px-6 py-8 text-left">Club</th>
                  <th className="w-16 py-8 text-center">PJ</th>
                  <th className="w-20 py-8 text-center text-[#fcc200] bg-[#fcc200]/5">PTS</th>
                  <th className="w-16 py-8 text-center hidden md:table-cell">PG</th>
                  <th className="w-16 py-8 text-center hidden md:table-cell">PE</th>
                  <th className="w-16 py-8 text-center hidden md:table-cell">PP</th>
                  <th className="w-24 py-8 text-center hidden sm:table-cell italic">GF/GC</th>
                  <th className="w-20 py-8 text-center">DG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tabla.map((equipo, index) => {
                  const isLiguilla = index < 8;
                  const isDescenso = index >= 10; // Corregido: Posiciones 11-14

                  return (
                    <motion.tr 
                      key={equipo.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="group hover:bg-white/2 transition-all"
                    >
                      <td className={`py-6 text-center font-black italic text-xl border-l-4 ${isLiguilla ? 'border-cyan-500' : isDescenso ? 'border-rose-500' : 'border-transparent'} ${index === 0 ? 'text-[#fcc200]' : 'text-zinc-700'}`}>
                        {index + 1}
                      </td>
                      
                      <td className="px-6 py-6 text-left">
                        <div className="flex items-center gap-5">
                          <img src={equipo.escudo} className="w-10 h-10 object-contain" alt="" />
                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight group-hover:text-[#fcc200] transition-colors">{equipo.nombre}</span>
                            {isLiguilla && <span className="text-[7px] font-black uppercase text-cyan-500/60">Zona Liguilla</span>}
                            {isDescenso && <span className="text-[7px] font-black uppercase text-rose-500/60">Zona de Riesgo</span>}
                          </div>
                        </div>
                      </td>

                      <td className="w-16 py-6 text-center text-xs font-bold text-zinc-400">{equipo.pj}</td>
                      <td className="w-20 py-6 text-center font-black text-[#fcc200] bg-[#fcc200]/5 text-lg">{equipo.pts}</td>
                      <td className="w-16 py-6 text-center text-[10px] font-bold text-zinc-500 hidden md:table-cell">{equipo.pg}</td>
                      <td className="w-16 py-6 text-center text-[10px] font-bold text-zinc-500 hidden md:table-cell">{equipo.pe}</td>
                      <td className="w-16 py-6 text-center text-[10px] font-bold text-zinc-500 hidden md:table-cell">{equipo.pp}</td>
                      <td className="w-24 py-6 text-center text-[10px] font-bold text-zinc-600 hidden sm:table-cell italic">{equipo.gf} / {equipo.gc}</td>
                      <td className={`w-20 py-6 text-center text-xs font-black ${equipo.dg > 0 ? 'text-emerald-500' : equipo.dg < 0 ? 'text-rose-500' : 'text-zinc-700'}`}>
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
    </div>
  )
}