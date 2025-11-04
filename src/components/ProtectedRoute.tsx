import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, employee, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!user || !employee) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(employee.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = `/${employee.role}/dashboard`
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}
