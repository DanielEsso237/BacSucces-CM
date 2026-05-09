import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/auth'

interface Props {
  children: React.ReactNode
  allowedRoles?: Role[]
}

function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute