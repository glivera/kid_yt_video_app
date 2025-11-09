import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Auth/Login'
import ParentDashboard from './pages/Parent/ParentDashboard'
import ChildDashboard from './pages/Child/ChildDashboard'
import ProtectedRoute from './components/Common/ProtectedRoute'
import './styles/App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Parent Routes */}
          <Route
            path="/parent/*"
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Child Routes */}
          <Route
            path="/child/*"
            element={
              <ProtectedRoute allowedRole="child">
                <ChildDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
