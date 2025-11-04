import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { JobCard } from '../../components/JobCard'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../services/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Job, Application } from '../../types'
import { useTranslation } from 'react-i18next'

export default function EmployeeMyJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const { employee } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    loadMyJobs()
  }, [employee])

  const loadMyJobs = async () => {
    if (!employee) return

    try {
      // Get approved applications
      const applicationsRef = collection(db, 'applications')
      const q = query(
        applicationsRef,
        where('employeeId', '==', employee.uid),
        where('status', '==', 'approved')
      )

      const applicationsSnapshot = await getDocs(q)
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[]

      // Get job details for each application
      const jobPromises = applications.map(async (app) => {
        const jobSnapshot = await getDocs(
          query(collection(db, 'jobs'), where('__name__', '==', app.jobId))
        )
        if (!jobSnapshot.empty) {
          return {
            id: jobSnapshot.docs[0].id,
            ...jobSnapshot.docs[0].data()
          } as Job
        }
        return null
      })

      const jobsData = (await Promise.all(jobPromises)).filter(Boolean) as Job[]

      // Sort by date
      jobsData.sort((a, b) => a.date.localeCompare(b.date))

      setJobs(jobsData)
    } catch (error) {
      console.error('Error loading my jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('myJobs')}
      </h2>

      {loading && <p>{t('loading')}</p>}

      {!loading && jobs.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            You haven't applied to any jobs yet
          </p>
        </div>
      )}

      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </Layout>
  )
}
