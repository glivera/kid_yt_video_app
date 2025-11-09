import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    const redirectPath = user.role === 'parent' ? '/parent' : '/child'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute
