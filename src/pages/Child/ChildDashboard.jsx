import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import VideoList from '../../components/Child/VideoList'
import VideoPlayer from '../../components/Child/VideoPlayer'
import WatchHistory from '../../components/Child/WatchHistory'
import './ChildDashboard.css'

const ChildDashboard = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { path: '/child/videos', label: 'Мои видео', component: VideoList },
    { path: '/child/history', label: 'История', component: WatchHistory }
  ]

  return (
    <div className="child-dashboard">
      <header className="child-header">
        <h1 className="child-title">Привет, {user?.username}! 👋</h1>
        <button onClick={logout} className="button button-secondary logout-btn">
          Выйти
        </button>
      </header>

      <nav className="child-nav">
        {navigation.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`child-nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="child-content">
        <Routes>
          {navigation.map((item) => (
            <Route
              key={item.path}
              path={item.path.replace('/child', '')}
              element={<item.component />}
            />
          ))}
          <Route path="/player/:videoId" element={<VideoPlayer />} />
          <Route path="*" element={<VideoList />} />
        </Routes>
      </main>
    </div>
  )
}

export default ChildDashboard
