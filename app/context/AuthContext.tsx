'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext<any>(null)

// IMPORTANTE: El "export" debe estar aquí
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const TIEMPO_INACTIVIDAD = 30 * 60 * 1000 // 30 Minutos
  let timeout: any

  const resetTimer = () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(logoutDueToInactivity, TIEMPO_INACTIVIDAD)
  }

  const logoutDueToInactivity = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    setUser(null)
    alert("Sesión cerrada por inactividad.")
    router.push('/login')
  }

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        const msg = error.message?.toLowerCase() || ''
        if (msg.includes('refresh token')) {
          // Si el refresh token ya no existe, limpiamos la sesión local para evitar errores repetidos.
          await supabase.auth.signOut({ scope: 'local' })
        }
        setUser(null)
        setLoading(false)
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
    }
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      subscription.unsubscribe()
      events.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// También exportamos el hook para usarlo en otras páginas
export const useAuth = () => useContext(AuthContext)