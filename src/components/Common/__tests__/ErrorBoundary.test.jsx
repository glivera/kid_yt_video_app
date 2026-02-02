import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Тестовая ошибка')
  }
  return <div>Контент без ошибки</div>
}

describe('ErrorBoundary', () => {
  // Подавляем вывод ошибок в консоль во время тестов
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('рендерит children когда ошибки нет', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Контент без ошибки')).toBeInTheDocument()
  })

  it('показывает fallback UI при ошибке', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument()
    expect(screen.getByText('Тестовая ошибка')).toBeInTheDocument()
  })

  it('показывает кнопку перезагрузки', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Перезагрузить')).toBeInTheDocument()
  })

  it('показывает сообщение о перезагрузке', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Попробуйте перезагрузить страницу')).toBeInTheDocument()
  })
})
