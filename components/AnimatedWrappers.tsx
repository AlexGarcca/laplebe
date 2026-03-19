'use client' // <--- Obligatorio para Framer Motion
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface WrapperProps { children: ReactNode; delay?: number; }

// 1. Entrada desde Abajo (Para Hero y Títulos)
export const FadeInUp = ({ children, delay = 0 }: WrapperProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }} // Solo se anima una vez al hacer scroll
    transition={{ duration: 0.8, delay: delay, ease: [0.22, 1, 0.36, 1] }} // Ease tipo Apple
  >
    {children}
  </motion.div>
)

// 2. Revelación Escalonada para las Cards de Equipos (Ingeniería Pura)
export const StaggeredGrid = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.1 }}
    variants={{
      visible: { transition: { staggerChildren: 0.05 } } // Retraso de 0.05s entre cada card
    }}
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
  >
    {children}
  </motion.div>
)

// Variante individual para cada Card dentro del StaggeredGrid
export const GridItem = ({ children }: { children: ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -8, transition: { duration: 0.3 } }} // Hover effect sexy
    className="h-full"
  >
    {children}
  </motion.div>
)

// 3. Zoom Out Suave para el CTA Final
export const ScaleIn = ({ children, delay = 0 }: WrapperProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.7, delay: delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
)