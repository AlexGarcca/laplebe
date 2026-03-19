'use client'

import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  return (
    <LayoutGroup id="global-layout-motion">
      <motion.div
        key={pathname}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </LayoutGroup>
  )
}
