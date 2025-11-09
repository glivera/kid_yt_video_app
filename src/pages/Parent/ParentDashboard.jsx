import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import VideoSearch from '../../components/Parent/VideoSearch'
import ApprovedVideos from '../../components/Parent/ApprovedVideos'
import BlockedList from '../../components/Parent/BlockedList'
import Recommendations from '../../components/Parent/Recommendations'
import './ParentDashboard.css'

const ParentDashboard = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { path: '/parent/search', label: 'Поиск видео', component: VideoSearch },
    { path: '/parent/approved', label: 'Утвержденные', component: ApprovedVideos },
    { path: '/parent/blocked', label: 'Заблокированные', component: BlockedList },
    { path: '/parent/recommendations', label: 'Рекомендации', component: Recommendations }
  ]

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Родительская панель</h1>
        <div className="header-user">
          <span>Привет, {user?.username}!</span>
          <button onClick={logout} className="button button-secondary">
            Выйти
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {navigation.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="main-content">
        <Routes>
          {navigation.map((item) => (
            <Route
              key={item.path}
              path={item.path.replace('/parent', '')}
              element={<item.component />}
            />
          ))}
          <Route path="*" element={<VideoSearch />} />
        </Routes>
      </main>
    </div>
  )
}

export default ParentDashboard
