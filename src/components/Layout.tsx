import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { employee, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ja' : 'en'
    i18n.changeLanguage(newLang)
  }

  const getNavigationLinks = () => {
    if (!employee) return []

    switch (employee.role) {
      case 'employee':
        return [
          { path: '/employee/dashboard', label: t('dashboard') },
          { path: '/employee/my-jobs', label: t('myJobs') },
          { path: '/employee/checkin', label: t('checkIn') },
          { path: '/employee/history', label: t('history') },
          { path: '/employee/notifications', label: t('notifications') },
        ]
      case 'manager':
        return [
          { path: '/manager/dashboard', label: t('dashboard') },
          { path: '/manager/create', label: t('createJob') },
        ]
      case 'admin':
        return [
          { path: '/admin/dashboard', label: t('dashboard') },
          { path: '/admin/exports', label: t('exports') },
          { path: '/admin/settings', label: t('settings') },
        ]
      default:
        return []
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>DZN-Timme</h1>

          {employee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>
                {employee.name.first} {employee.name.last}
              </span>
              <button
                onClick={toggleLanguage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.375rem',
                  color: 'white'
                }}
              >
                {i18n.language === 'en' ? '日本語' : 'English'}
              </button>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      {employee && (
        <nav style={{
          backgroundColor: '#374151',
          padding: '0.75rem 2rem',
          borderBottom: '1px solid #4b5563'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '1.5rem'
          }}>
            {getNavigationLinks().map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '2rem',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
