import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../services/firebase'
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore'
import { Notification } from '../../types'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { employee } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    loadNotifications()
  }, [employee])

  const loadNotifications = async () => {
    if (!employee) return

    try {
      const notificationsRef = collection(db, 'notifications')
      const q = query(
        notificationsRef,
        where('userId', '==', employee.uid)
      )

      const snapshot = await getDocs(q)
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[]

      // Sort by creation date (most recent first)
      notificationsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

      setNotifications(notificationsData)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          {t('notifications')}
        </h2>
        {unreadCount > 0 && (
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            {unreadCount} unread
          </span>
        )}
      </div>

      {loading && <p>{t('loading')}</p>}

      {!loading && notifications.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            No notifications yet
          </p>
        </div>
      )}

      {notifications.map(notification => (
        <div
          key={notification.id}
          className="card"
          style={{
            marginBottom: '1rem',
            opacity: notification.read ? 0.7 : 1,
            cursor: notification.read ? 'default' : 'pointer'
          }}
          onClick={() => !notification.read && markAsRead(notification.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                  {notification.title}
                </h3>
                {!notification.read && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                {notification.message}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {format(notification.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </Layout>
  )
}
