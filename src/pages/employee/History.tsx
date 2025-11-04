import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../services/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { Work, Job } from '../../types'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

interface WorkWithJob extends Work {
  job?: Job
}

export default function EmployeeHistory() {
  const [works, setWorks] = useState<WorkWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const { employee } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    loadHistory()
  }, [employee])

  const loadHistory = async () => {
    if (!employee) return

    try {
      const worksRef = collection(db, 'works')
      const q = query(
        worksRef,
        where('employeeId', '==', employee.uid),
        where('status', '==', 'completed')
      )

      const worksSnapshot = await getDocs(q)
      const worksData = await Promise.all(
        worksSnapshot.docs.map(async (doc) => {
          const work = { id: doc.id, ...doc.data() } as Work

          // Get job details
          const jobSnapshot = await getDocs(
            query(collection(db, 'jobs'), where('__name__', '==', work.jobId))
          )

          let job: Job | undefined
          if (!jobSnapshot.empty) {
            job = {
              id: jobSnapshot.docs[0].id,
              ...jobSnapshot.docs[0].data()
            } as Job
          }

          return { ...work, job }
        })
      )

      // Sort by check-in date (most recent first)
      worksData.sort((a, b) => {
        if (!a.checkInAt || !b.checkInAt) return 0
        return b.checkInAt.toMillis() - a.checkInAt.toMillis()
      })

      setWorks(worksData)

      // Calculate total earnings
      const total = worksData.reduce((sum, work) => sum + (work.totalPay || 0), 0)
      setTotalEarnings(total)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('history')}
      </h2>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Total Earnings
        </h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
          ¥{Math.round(totalEarnings).toLocaleString()}
        </p>
      </div>

      {loading && <p>{t('loading')}</p>}

      {!loading && works.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            No completed work history yet
          </p>
        </div>
      )}

      {works.map(work => (
        <div key={work.id} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {work.job?.title || 'Unknown Job'}
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <div>
                  <strong>Date:</strong> {work.job?.date || 'N/A'}
                </div>
                <div>
                  <strong>Check In:</strong>{' '}
                  {work.checkInAt ? format(work.checkInAt.toDate(), 'HH:mm') : 'N/A'}
                </div>
                <div>
                  <strong>Check Out:</strong>{' '}
                  {work.checkOutAt ? format(work.checkOutAt.toDate(), 'HH:mm') : 'N/A'}
                </div>
                <div>
                  <strong>Hours:</strong>{' '}
                  {work.workedMinutes ? (work.workedMinutes / 60).toFixed(2) : 'N/A'}
                </div>
                <div>
                  <strong>Hourly Rate:</strong> ¥{work.hourlyWage}/h
                </div>
              </div>
            </div>

            <div style={{ marginLeft: '1rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Total Pay
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                ¥{work.totalPay ? Math.round(work.totalPay).toLocaleString() : '0'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </Layout>
  )
}
