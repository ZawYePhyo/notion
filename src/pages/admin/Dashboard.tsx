import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { db } from '../../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    totalEmployees: 0,
    totalApplications: 0,
    completedWorks: 0,
    totalPayments: 0
  })
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Total jobs
      const jobsSnapshot = await getDocs(collection(db, 'jobs'))
      const totalJobs = jobsSnapshot.size

      // Open jobs
      const openJobsQuery = query(collection(db, 'jobs'), where('status', '==', 'open'))
      const openJobsSnapshot = await getDocs(openJobsQuery)
      const openJobs = openJobsSnapshot.size

      // Total employees
      const employeesSnapshot = await getDocs(collection(db, 'employees'))
      const totalEmployees = employeesSnapshot.size

      // Total applications
      const applicationsSnapshot = await getDocs(collection(db, 'applications'))
      const totalApplications = applicationsSnapshot.size

      // Completed works
      const completedWorksQuery = query(
        collection(db, 'works'),
        where('status', '==', 'completed')
      )
      const completedWorksSnapshot = await getDocs(completedWorksQuery)
      const completedWorks = completedWorksSnapshot.size

      // Total payments
      const paymentsSnapshot = await getDocs(collection(db, 'payments'))
      let totalPayments = 0
      paymentsSnapshot.docs.forEach(doc => {
        totalPayments += doc.data().amount || 0
      })

      setStats({
        totalJobs,
        openJobs,
        totalEmployees,
        totalApplications,
        completedWorks,
        totalPayments
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <div className="card">
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  )

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Admin Dashboard
      </h2>

      {loading ? (
        <p>{t('loading')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <StatCard title="Total Jobs" value={stats.totalJobs} color="#3b82f6" />
          <StatCard title="Open Jobs" value={stats.openJobs} color="#10b981" />
          <StatCard title="Total Employees" value={stats.totalEmployees} color="#8b5cf6" />
          <StatCard title="Total Applications" value={stats.totalApplications} color="#f59e0b" />
          <StatCard title="Completed Works" value={stats.completedWorks} color="#06b6d4" />
          <StatCard
            title="Total Payments"
            value={`¥${Math.round(stats.totalPayments).toLocaleString()}`}
            color="#ef4444"
          />
        </div>
      )}
    </Layout>
  )
}
