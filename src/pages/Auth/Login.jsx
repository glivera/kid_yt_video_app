import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/Common/Toast'
import './Login.css'

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('parent')
  const [familyCode, setFamilyCode] = useState('')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { signUp, signIn, user } = useAuth()
  const navigate = useNavigate()

  // Если пользователь уже авторизован — перенаправляем
  useEffect(() => {
    if (user) {
      navigate(user.role === 'parent' ? '/parent' : '/child', { replace: true })
    }
  }, [user, navigate])

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setToast(null)
    setSubmitting(true)

    try {
      if (isRegistering) {
        // Регистрация
        if (!displayName.trim()) {
          showToast('Пожалуйста, введите имя')
          setSubmitting(false)
          return
        }
        if (!email.trim()) {
          showToast('Пожалуйста, введите электронную почту')
          setSubmitting(false)
          return
        }
        if (password.length < 6) {
          showToast('Пароль должен быть не менее 6 символов')
          setSubmitting(false)
          return
        }
        if (role === 'child' && familyCode.trim().length !== 6) {
          showToast('Введите 6-символьный семейный код родителя')
          setSubmitting(false)
          return
        }

        const { data, error } = await signUp(
          email, password, displayName.trim(), role,
          role === 'child' ? familyCode.trim().toUpperCase() : undefined
        )

        if (error) {
          showToast(error.message)
          setSubmitting(false)
          return
        }

        if (!data.session) {
          // Требуется подтверждение email
          showToast('Регистрация успешна! Проверьте почту для подтверждения.', 'success')
          setIsRegistering(false)
          setPassword('')
        }
        // Если session есть — useEffect([user]) выполнит навигацию автоматически
      } else {
        // Вход
        if (!email.trim()) {
          showToast('Пожалуйста, введите электронную почту')
          setSubmitting(false)
          return
        }
        if (!password.trim()) {
          showToast('Пожалуйста, введите пароль')
          setSubmitting(false)
          return
        }

        const { error } = await signIn(email, password)

        if (error) {
          showToast(error.message)
          setSubmitting(false)
          return
        }
        // Навигация произойдёт автоматически через useEffect([user])
        // когда AuthContext обработает SIGNED_IN и установит user
      }
    } catch (err) {
      showToast('Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (registering) => {
    setIsRegistering(registering)
    setToast(null)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Детские YouTube Видео</h1>
        <p className="login-subtitle">Безопасный просмотр для детей</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegistering ? 'active' : ''}`}
            onClick={() => switchMode(false)}
          >
            Вход
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegistering ? 'active' : ''}`}
            onClick={() => switchMode(true)}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="displayName">Имя</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Введите имя"
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Электронная почта</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegistering ? 'Минимум 6 символов' : 'Введите пароль'}
              className="form-input"
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label>Выберите роль</label>
              <div className="role-buttons">
                <button
                  type="button"
                  className={`role-button ${role === 'parent' ? 'active' : ''}`}
                  onClick={() => setRole('parent')}
                >
                  Родитель
                </button>
                <button
                  type="button"
                  className={`role-button ${role === 'child' ? 'active' : ''}`}
                  onClick={() => setRole('child')}
                >
                  Ребенок
                </button>
              </div>
            </div>
          )}

          {isRegistering && role === 'child' && (
            <div className="form-group">
              <label htmlFor="familyCode">Семейный код родителя</label>
              <input
                type="text"
                id="familyCode"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                placeholder="Введите 6-символьный код"
                className="form-input"
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 'bold' }}
              />
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                Попросите родителя сообщить код из личного кабинета
              </small>
            </div>
          )}

          <button
            type="submit"
            className="button button-primary submit-button"
            disabled={submitting}
          >
            {submitting
              ? 'Загрузка...'
              : isRegistering ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Login
