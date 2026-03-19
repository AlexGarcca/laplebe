'use client'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

interface WrapperProps { children: ReactNode; delay?: number; }
interface SharedTitleProps extends WrapperProps {
  layoutId?: string
  className?: string
}

interface SharedMetaProps extends WrapperProps {
  layoutId?: string
  className?: string
}

interface SmartStaggerListProps {
  children: ReactNode
  itemsCount: number
  className?: string
}

export const MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const MOTION_DURATION = {
  fast: 0.32,
  base: 0.52,
  slow: 0.8,
}

const SPRING = {
  soft: { type: 'spring' as const, stiffness: 220, damping: 22, mass: 0.9 },
  medium: { type: 'spring' as const, stiffness: 260, damping: 20, mass: 0.85 },
  energetic: { type: 'spring' as const, stiffness: 300, damping: 18, mass: 0.82 },
  calm: { type: 'spring' as const, stiffness: 210, damping: 24, mass: 0.92 },
}

const scaleTime = (value: number, factor: number) => Number((value * factor).toFixed(3))

function useMotionPreset() {
  const prefersReduced = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const onChange = () => setIsMobile(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return useMemo(() => {
    if (prefersReduced) {
      return {
        timeFactor: 0.75,
        hoverLift: 2,
        hoverScale: 1.003,
        parallaxOffset: 8,
        staggerGap: 0.03,
      }
    }

    if (isMobile) {
      return {
        timeFactor: 0.86,
        hoverLift: 5,
        hoverScale: 1.007,
        parallaxOffset: 14,
        staggerGap: 0.04,
      }
    }

    return {
      timeFactor: 1,
      hoverLift: 8,
      hoverScale: 1.01,
      parallaxOffset: 24,
      staggerGap: 0.055,
    }
  }, [isMobile, prefersReduced])
}

// Entrada desde abajo para bloques/headers.
export const FadeInUp = ({ children, delay = 0 }: WrapperProps) => {
  const preset = useMotionPreset()

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: scaleTime(MOTION_DURATION.slow, preset.timeFactor), delay, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  )
}

// Revelación escalonada para grids.
export const StaggeredGrid = ({ children }: { children: ReactNode }) => {
  const preset = useMotionPreset()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: preset.staggerGap } }
      }}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
    >
      {children}
    </motion.div>
  )
}

// Variante individual para cada card dentro del stagger.
export const GridItem = ({ children }: { children: ReactNode }) => {
  const preset = useMotionPreset()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
      }}
      transition={{ duration: scaleTime(MOTION_DURATION.base, preset.timeFactor), ease: MOTION_EASE }}
      whileHover={{ y: -preset.hoverLift, scale: preset.hoverScale, transition: SPRING.soft }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

// Zoom suave para CTAs.
export const ScaleIn = ({ children, delay = 0 }: WrapperProps) => {
  const preset = useMotionPreset()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: scaleTime(0.7, preset.timeFactor), delay, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  )
}

// Reveal genérico de sección para páginas largas.
export const RevealSection = ({ children, delay = 0 }: WrapperProps) => {
  const preset = useMotionPreset()

  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: scaleTime(MOTION_DURATION.base, preset.timeFactor), delay, ease: MOTION_EASE }}
    >
      {children}
    </motion.section>
  )
}

// Capa parallax vertical sutil al hacer scroll.
export const ParallaxLayer = ({ children }: { children: ReactNode }) => {
  const preset = useMotionPreset()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [preset.parallaxOffset, -preset.parallaxOffset])

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  )
}

// Título con layoutId compartido para transiciones entre páginas.
export const SharedPageTitle = ({
  children,
  delay = 0,
  layoutId = 'shared-page-title',
  className,
}: SharedTitleProps) => {
  const preset = useMotionPreset()

  return (
    <motion.h1
      layoutId={layoutId}
      initial={{ opacity: 0, y: 22, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: scaleTime(MOTION_DURATION.base, preset.timeFactor), delay, ease: MOTION_EASE }}
      className={className}
    >
      {children}
    </motion.h1>
  )
}

export const SharedMetaBadge = ({
  children,
  delay = 0,
  layoutId = 'shared-page-kicker',
  className,
}: SharedMetaProps) => {
  const preset = useMotionPreset()

  return (
    <motion.p
      layoutId={layoutId}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: scaleTime(MOTION_DURATION.fast, preset.timeFactor), delay, ease: MOTION_EASE }}
      className={className}
    >
      {children}
    </motion.p>
  )
}

export const SmartStaggerList = ({ children, itemsCount, className }: SmartStaggerListProps) => {
  const preset = useMotionPreset()
  const stagger = Math.max(0.014, Math.min(0.07, 0.085 - itemsCount * 0.0012))

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: stagger } },
      }}
      transition={{ duration: scaleTime(MOTION_DURATION.base, preset.timeFactor), ease: MOTION_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const SmartStaggerItem = ({ children }: { children: ReactNode }) => {
  const preset = useMotionPreset()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
      }}
      transition={{ duration: scaleTime(MOTION_DURATION.fast, preset.timeFactor), ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  )
}

export const MOTION_SPRING = SPRING