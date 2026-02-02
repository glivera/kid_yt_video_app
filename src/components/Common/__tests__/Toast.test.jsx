import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from '../Toast'

describe('Toast', () => {
  it('рендерит сообщение', () => {
    render(<Toast message="Операция выполнена" onClose={vi.fn()} />)
    expect(screen.getByText('Операция выполнена')).toBeInTheDocument()
  })

  it('показывает иконку success по умолчанию', () => {
    render(<Toast message="OK" onClose={vi.fn()} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('показывает иконку error', () => {
    render(<Toast message="Ошибка" type="error" onClose={vi.fn()} />)
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('показывает иконку info', () => {
    render(<Toast message="Инфо" type="info" onClose={vi.fn()} />)
    expect(screen.getByText('ℹ')).toBeInTheDocument()
  })

  it('вызывает onClose по кнопке закрытия', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} />)

    await user.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('автоматически закрывается через duration', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} duration={2000} />)

    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onClose).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('применяет CSS-класс типа', () => {
    const { container } = render(<Toast message="Test" type="error" onClose={vi.fn()} />)
    expect(container.querySelector('.toast-error')).toBeInTheDocument()
  })
})
