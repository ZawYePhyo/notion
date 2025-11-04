import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { JobCard } from '../../components/JobCard'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../services/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Job } from '../../types'
import { useTranslation } from 'react-i18next'

export default function ManagerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const { employee } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    loadJobs()
  }, [employee])

  const loadJobs = async () => {
    if (!employee) return

    try {
      const jobsRef = collection(db, 'jobs')
      const q = query(
        jobsRef,
        where('managerId', '==', employee.uid)
      )

      const snapshot = await getDocs(q)
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[]

      // Sort by date (most recent first)
      jobsData.sort((a, b) => b.date.localeCompare(a.date))

      setJobs(jobsData)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          My Jobs
        </h2>
        <button
          onClick={() => navigate('/manager/create')}
          className="btn btn-primary"
        >
          {t('createJob')}
        </button>
      </div>

      {loading && <p>{t('loading')}</p>}

      {!loading && jobs.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            You haven't created any jobs yet. Click "Create Job" to get started.
          </p>
        </div>
      )}

      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onClick={() => navigate(`/manager/job/${job.id}`)}
        />
      ))}
    </Layout>
  )
}
