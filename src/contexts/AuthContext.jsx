import { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Загрузка профиля из kid_app_users (с таймаутом 5 сек)
  const fetchProfile = async (userId) => {
    if (!supabase) return null
    try {
      const query = supabase
        .from('kid_app_users')
        .select('display_name, role, family_code')
        .eq('id', userId)
        .single()

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('fetchProfile timeout')), 5000)
      )

      const { data, error } = await Promise.race([query, timeout])

      if (error) {
        console.error('Ошибка загрузки профиля:', error)
        return null
      }
      return data
    } catch (err) {
      console.warn('fetchProfile: не удалось загрузить профиль, используем metadata:', err.message)
      return null
    }
  }

  // Собрать объект user из auth + профиль
  const buildUser = (authUser, profile) => {
    if (!authUser) return null
    // Если профиль не найден — берём данные из user_metadata
    const resolvedProfile = profile || {
      display_name: authUser.user_metadata?.display_name || 'Пользователь',
      role: authUser.user_metadata?.role || 'child',
      family_code: null
    }
    return {
      id: authUser.id,
      email: authUser.email,
      role: resolvedProfile.role,
      display_name: resolvedProfile.display_name,
      username: resolvedProfile.display_name,
      family_code: resolvedProfile.family_code
    }
  }

  useEffect(() => {
    // Если Supabase не настроен — сразу снимаем загрузку
    if (!supabase) {
      console.warn('Supabase не настроен. Авторизация недоступна.')
      setLoading(false)
      return
    }

    let cancelled = false
    let subscription = null

    // Страховочный таймаут (последний рубеж — fetchProfile уже имеет свой таймаут 5с)
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('AuthContext: safety timeout — forcing loading=false')
        setLoading(false)
      }
    }, 8000)

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (cancelled) return

        setSession(currentSession)

        if (currentSession?.user) {
          const profile = await fetchProfile(currentSession.user.id)
          if (cancelled) return
          setUser(buildUser(currentSession.user, profile))
        }
      } catch (error) {
        console.error('Ошибка инициализации авторизации:', error)
      } finally {
        if (!cancelled) {
          clearTimeout(safetyTimeout)
          setLoading(false)
        }
      }
    }

    // Слушаем изменения состояния авторизации
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (cancelled) return
          setSession(newSession)

          if (event === 'SIGNED_IN' && newSession?.user) {
            const profile = await fetchProfile(newSession.user.id)
            if (cancelled) return
            setUser(buildUser(newSession.user, profile))
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          }
        }
      )
      subscription = data.subscription
    } catch (error) {
      console.error('Ошибка подписки на изменения авторизации:', error)
    }

    initAuth()

    return () => {
      cancelled = true
      clearTimeout(safetyTimeout)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Регистрация
  const signUp = async (email, password, displayName, role, familyCode) => {
    if (!supabase) return { data: null, error: { message: 'Supabase не настроен' } }

    const metadata = {
      display_name: displayName,
      role: role
    }
    // Для ребёнка передаём семейный код родителя
    if (role === 'child' && familyCode) {
      metadata.family_code = familyCode
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  // Вход
  const signIn = async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Supabase не настроен' } }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  // Выход
  const signOut = async () => {
    if (!supabase) return { error: null }
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setSession(null)
    }
    return { error }
  }

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    logout: signOut,
    loading,
    isParent: user?.role === 'parent',
    isChild: user?.role === 'child'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
