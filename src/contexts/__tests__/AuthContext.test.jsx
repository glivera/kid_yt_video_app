import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'

// vi.hoisted гарантирует что переменная доступна в момент hoisting vi.mock
const mockSupabase = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn()
}))

vi.mock('../../config/supabase', () => ({
  supabase: mockSupabase
}))

import { AuthProvider, useAuth } from '../AuthContext'

// Компонент-помощник для тестирования хука useAuth
const TestConsumer = ({ onAuth }) => {
  const auth = useAuth()
  onAuth?.(auth)
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user ? auth.user.display_name : 'null'}</span>
      <span data-testid="role">{auth.user?.role || 'none'}</span>
      <span data-testid="family-code">{auth.user?.family_code || 'none'}</span>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // По умолчанию: нет сессии
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null }
  })
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  })
})

describe('AuthProvider', () => {
  it('показывает loading=false и user=null для неавторизованного пользователя', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('загружает профиль авторизованного пользователя', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-123',
            email: 'parent@test.com',
            user_metadata: { display_name: 'Родитель', role: 'parent' }
          }
        }
      }
    })

    // Мок fetchProfile → from('kid_app_users').select(...).eq(...).single()
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { display_name: 'Родитель', role: 'parent', family_code: 'ABC123' },
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(queryBuilder)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('Родитель')
    expect(screen.getByTestId('role')).toHaveTextContent('parent')
    expect(screen.getByTestId('family-code')).toHaveTextContent('ABC123')
  })

  it('использует metadata если профиль не найден', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-456',
            email: 'child@test.com',
            user_metadata: { display_name: 'Ребёнок', role: 'child' }
          }
        }
      }
    })

    // Профиль возвращает ошибку
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'not found' }
      })
    }
    mockSupabase.from.mockReturnValue(queryBuilder)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('Ребёнок')
    expect(screen.getByTestId('role')).toHaveTextContent('child')
    expect(screen.getByTestId('family-code')).toHaveTextContent('none')
  })
})

describe('signUp', () => {
  it('вызывает supabase.auth.signUp с правильными metadata для родителя', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null })

    let authRef
    render(
      <AuthProvider>
        <TestConsumer onAuth={(auth) => { authRef = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    await act(async () => {
      await authRef.signUp('parent@test.com', 'password', 'Родитель', 'parent')
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'parent@test.com',
      password: 'password',
      options: {
        data: {
          display_name: 'Родитель',
          role: 'parent'
        }
      }
    })
  })

  it('включает family_code для ребёнка', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null })

    let authRef
    render(
      <AuthProvider>
        <TestConsumer onAuth={(auth) => { authRef = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    await act(async () => {
      await authRef.signUp('child@test.com', 'password', 'Ребёнок', 'child', 'ABC123')
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'child@test.com',
      password: 'password',
      options: {
        data: {
          display_name: 'Ребёнок',
          role: 'child',
          family_code: 'ABC123'
        }
      }
    })
  })
})

describe('signOut', () => {
  it('очищает user и session после выхода', async () => {
    // Начинаем авторизованным
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-123',
            email: 'test@test.com',
            user_metadata: { display_name: 'Тест', role: 'parent' }
          }
        }
      }
    })

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { display_name: 'Тест', role: 'parent', family_code: null },
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(queryBuilder)
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    let authRef
    render(
      <AuthProvider>
        <TestConsumer onAuth={(auth) => { authRef = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Тест')
    })

    await act(async () => {
      await authRef.signOut()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })
})
