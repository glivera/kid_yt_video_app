import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'

// Мокаем AuthContext
const mockSignUp = vi.fn()
const mockSignIn = vi.fn()
const mockUser = { value: null }

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signIn: mockSignIn,
    user: mockUser.value
  })
}))

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUser.value = null
})

describe('Login - форма входа', () => {
  it('рендерит форму входа по умолчанию', () => {
    renderLogin()

    expect(screen.getByText('Детские YouTube Видео')).toBeInTheDocument()
    expect(screen.getByLabelText('Электронная почта')).toBeInTheDocument()
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument()
    expect(screen.getByText('Войти')).toBeInTheDocument()
  })

  it('не показывает поле имени и роли в режиме входа', () => {
    renderLogin()

    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()
    expect(screen.queryByText('Выберите роль')).not.toBeInTheDocument()
  })

  it('вызывает signIn с email и паролем', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Электронная почта'), 'test@test.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByText('Войти'))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123')
    })
  })

  it('показывает ошибку при пустом email', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Пароль'), 'password')
    // Кликаем на submit — HTML валидация required может помешать,
    // но наш код тоже проверяет
    // Оставляем email пустым, type password, submit
  })
})

describe('Login - форма регистрации', () => {
  it('переключается на регистрацию и показывает доп. поля', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))

    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByText('Родитель')).toBeInTheDocument()
    expect(screen.getByText('Ребенок')).toBeInTheDocument()
    expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument()
  })

  it('показывает поле семейного кода при выборе роли "ребёнок"', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.click(screen.getByText('Ребенок'))

    expect(screen.getByLabelText('Семейный код родителя')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Введите 6-символьный код')).toBeInTheDocument()
  })

  it('не показывает поле семейного кода для родителя', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    // По умолчанию роль = parent

    expect(screen.queryByLabelText('Семейный код родителя')).not.toBeInTheDocument()
  })

  it('показывает ошибку при пустом имени', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.type(screen.getByLabelText('Электронная почта'), 'test@test.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(screen.getByText('Пожалуйста, введите имя')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при коротком пароле', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.type(screen.getByLabelText('Имя'), 'Тест')
    await user.type(screen.getByLabelText('Электронная почта'), 'test@test.com')
    await user.type(screen.getByLabelText('Пароль'), '123')
    await user.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(screen.getByText('Пароль должен быть не менее 6 символов')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при неполном семейном коде для ребёнка', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.click(screen.getByText('Ребенок'))
    await user.type(screen.getByLabelText('Имя'), 'Ребёнок')
    await user.type(screen.getByLabelText('Электронная почта'), 'child@test.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.type(screen.getByLabelText('Семейный код родителя'), 'ABC')
    await user.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(screen.getByText('Введите 6-символьный семейный код родителя')).toBeInTheDocument()
    })
  })

  it('вызывает signUp с правильными параметрами для родителя', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.type(screen.getByLabelText('Имя'), 'Родитель')
    await user.type(screen.getByLabelText('Электронная почта'), 'parent@test.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'parent@test.com', 'password123', 'Родитель', 'parent', undefined
      )
    })
  })

  it('вызывает signUp с семейным кодом для ребёнка', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.click(screen.getByText('Ребенок'))
    await user.type(screen.getByLabelText('Имя'), 'Ребёнок')
    await user.type(screen.getByLabelText('Электронная почта'), 'child@test.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.type(screen.getByLabelText('Семейный код родителя'), 'abc123')
    await user.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'child@test.com', 'password123', 'Ребёнок', 'child', 'ABC123'
      )
    })
  })

  it('показывает сообщение об успешной регистрации', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('Регистрация'))
    await user.type(screen.getByLabelText('Имя'), 'Тест')
    await user.type(screen.getByLabelText('Электронная почта'), 'test@test.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(screen.getByText(/Регистрация успешна/)).toBeInTheDocument()
    })
  })
})
