import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Login.css'

const Login = () => {
  const [role, setRole] = useState('parent')
  const [username, setUsername] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!username.trim()) {
      alert('Пожалуйста, введите имя пользователя')
      return
    }

    const userData = {
      id: Date.now(),
      username: username.trim(),
      role
    }

    login(userData)
    navigate(role === 'parent' ? '/parent' : '/child')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Детские YouTube Видео</h1>
        <p className="login-subtitle">Безопасный просмотр для детей</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя"
              className="form-input"
            />
          </div>

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

          <button type="submit" className="button button-primary submit-button">
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
