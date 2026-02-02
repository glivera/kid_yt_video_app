import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'

// Мокаем AuthContext
const mockUseAuth = vi.fn()
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('рендерит children для авторизованного пользователя с правильной ролью', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'parent' } })

    renderWithRouter(
      <ProtectedRoute allowedRole="parent">
        <div>Защищённый контент</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Защищённый контент')).toBeInTheDocument()
  })

  it('рендерит children без ограничения роли', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'child' } })

    renderWithRouter(
      <ProtectedRoute>
        <div>Любой контент</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Любой контент')).toBeInTheDocument()
  })

  it('редиректит на /login без авторизации', () => {
    mockUseAuth.mockReturnValue({ user: null })

    renderWithRouter(
      <ProtectedRoute allowedRole="parent">
        <div>Не должно отобразиться</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText('Не должно отобразиться')).not.toBeInTheDocument()
  })

  it('редиректит родителя на /parent при попытке доступа к детскому маршруту', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'parent' } })

    renderWithRouter(
      <ProtectedRoute allowedRole="child">
        <div>Детский контент</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText('Детский контент')).not.toBeInTheDocument()
  })

  it('редиректит ребёнка на /child при попытке доступа к родительскому маршруту', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'child' } })

    renderWithRouter(
      <ProtectedRoute allowedRole="parent">
        <div>Родительский контент</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText('Родительский контент')).not.toBeInTheDocument()
  })
})
