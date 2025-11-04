import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeMyJobs from './pages/employee/MyJobs'
import EmployeeCheckIn from './pages/employee/CheckIn'
import EmployeeHistory from './pages/employee/History'
import EmployeeNotifications from './pages/employee/Notifications'
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerCreate from './pages/manager/Create'
import ManagerJobDetail from './pages/manager/JobDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminExports from './pages/admin/Exports'
import AdminSettings from './pages/admin/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/my-jobs"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeMyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/checkin"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeCheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/history"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/notifications"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeNotifications />
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/create"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/job/:id"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerJobDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminExports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
