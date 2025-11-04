import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { DatePicker } from '../../components/DatePicker'
import { JobCard } from '../../components/JobCard'
import { useAuth } from '../../contexts/AuthContext'
import { db, functions } from '../../services/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Job } from '../../types'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

export default function EmployeeDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [jobs, setJobs] = useState<Job[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { employee } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    loadJobs()
    loadAppliedJobs()
  }, [selectedDate, employee])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const jobsRef = collection(db, 'jobs')
      const q = query(
        jobsRef,
        where('date', '==', dateStr),
        where('status', '==', 'open')
      )

      const snapshot = await getDocs(q)
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[]

      setJobs(jobsData)
    } catch (error) {
      console.error('Error loading jobs:', error)
      setMessage({ type: 'error', text: 'Failed to load jobs' })
    } finally {
      setLoading(false)
    }
  }

  const loadAppliedJobs = async () => {
    if (!employee) return

    try {
      const applicationsRef = collection(db, 'applications')
      const q = query(
        applicationsRef,
        where('employeeId', '==', employee.uid),
        where('status', '==', 'approved')
      )

      const snapshot = await getDocs(q)
      const jobIds = new Set(snapshot.docs.map(doc => doc.data().jobId))
      setAppliedJobIds(jobIds)
    } catch (error) {
      console.error('Error loading applied jobs:', error)
    }
  }

  const handleApply = async (jobId: string) => {
    setMessage(null)
    setLoading(true)

    try {
      const applyForJob = httpsCallable(functions, 'applyForJob')
      const result = await applyForJob({ jobId })
      const data = result.data as any

      if (data.success) {
        setMessage({ type: 'success', text: 'Application submitted successfully!' })
        setAppliedJobIds(prev => new Set(prev).add(jobId))
        loadJobs() // Reload to update counts
      } else {
        setMessage({
          type: 'error',
          text: `Application blocked: ${data.messages.join(', ')}`
        })
      }
    } catch (error: any) {
      console.error('Error applying for job:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to apply for job'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('dashboard')}
      </h2>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b'
        }}>
          {message.text}
        </div>
      )}

      <DatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        daysToShow={14}
      />

      {loading && <p>{t('loading')}</p>}

      {!loading && jobs.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            No jobs available for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
      )}

      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onApply={handleApply}
          showApplyButton={true}
          applied={appliedJobIds.has(job.id)}
        />
      ))}
    </Layout>
  )
}
