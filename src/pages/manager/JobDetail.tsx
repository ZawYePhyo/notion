import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { db } from '../../services/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { Job, Application, Employee, Work } from '../../types'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'

interface ApplicantData {
  application: Application
  employee: Employee
  work?: Work
}

export default function ManagerJobDetail() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [applicants, setApplicants] = useState<ApplicantData[]>([])
  const [checkInQR, setCheckInQR] = useState('')
  const [checkOutQR, setCheckOutQR] = useState('')
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      loadJobDetails()
    }
  }, [id])

  const loadJobDetails = async () => {
    if (!id) return

    try {
      // Load job
      const jobDoc = await getDoc(doc(db, 'jobs', id))
      if (!jobDoc.exists()) {
        console.error('Job not found')
        return
      }

      const jobData = { id: jobDoc.id, ...jobDoc.data() } as Job
      setJob(jobData)

      // Generate QR codes
      const checkInData = `${id}:${jobData.checkInQrSecret}:checkin`
      const checkOutData = `${id}:${jobData.checkOutQrSecret}:checkout`

      const checkInQRCode = await QRCode.toDataURL(checkInData)
      const checkOutQRCode = await QRCode.toDataURL(checkOutData)

      setCheckInQR(checkInQRCode)
      setCheckOutQR(checkOutQRCode)

      // Load applications
      const applicationsRef = collection(db, 'applications')
      const q = query(
        applicationsRef,
        where('jobId', '==', id),
        where('status', '==', 'approved')
      )

      const applicationsSnapshot = await getDocs(q)

      const applicantsData = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const application = { id: appDoc.id, ...appDoc.data() } as Application

          // Get employee data
          const employeeDoc = await getDoc(doc(db, 'employees', application.employeeId))
          const employee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee

          // Get work data
          const worksRef = collection(db, 'works')
          const worksQuery = query(
            worksRef,
            where('jobId', '==', id),
            where('employeeId', '==', application.employeeId)
          )
          const worksSnapshot = await getDocs(worksQuery)

          let work: Work | undefined
          if (!worksSnapshot.empty) {
            work = { id: worksSnapshot.docs[0].id, ...worksSnapshot.docs[0].data() } as Work
          }

          return { application, employee, work }
        })
      )

      setApplicants(applicantsData)
    } catch (error) {
      console.error('Error loading job details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>{t('loading')}</p>
      </Layout>
    )
  }

  if (!job) {
    return (
      <Layout>
        <div className="card">
          <p>Job not found</p>
          <button onClick={() => navigate('/manager/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <button
        onClick={() => navigate('/manager/dashboard')}
        style={{ marginBottom: '1rem', color: '#3b82f6' }}
      >
        ← Back to Dashboard
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          {job.title}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {job.taskDescription}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Date</div>
            <div style={{ fontWeight: '500' }}>{job.date}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Time</div>
            <div style={{ fontWeight: '500' }}>{job.startTime} - {job.endTime}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hourly Wage</div>
            <div style={{ fontWeight: '500' }}>¥{job.hourlyWage}/h</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Slots</div>
            <div style={{ fontWeight: '500' }}>
              {job.currentApprovedCount} / {job.requiredHeadcount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Status</div>
            <div>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: job.status === 'open' ? '#d1fae5' : '#fee2e2',
                color: job.status === 'open' ? '#065f46' : '#991b1b'
              }}>
                {t(job.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Check-In QR Code
          </h3>
          {checkInQR && (
            <img
              src={checkInQR}
              alt="Check-in QR Code"
              style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'block' }}
            />
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Check-Out QR Code
          </h3>
          {checkOutQR && (
            <img
              src={checkOutQR}
              alt="Check-out QR Code"
              style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'block' }}
            />
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Applicants ({applicants.length})
        </h3>

        {applicants.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            No applicants yet
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {applicants.map(({ application, employee, work }) => (
              <div
                key={application.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {employee.name.first} {employee.name.last}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {employee.email}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {work ? (
                      <div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor:
                            work.status === 'completed' ? '#d1fae5' :
                            work.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
                          color:
                            work.status === 'completed' ? '#065f46' :
                            work.status === 'in_progress' ? '#92400e' : '#6b7280'
                        }}>
                          {t(work.status)}
                        </div>
                        {work.totalPay && (
                          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: '500' }}>
                            ¥{Math.round(work.totalPay).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280'
                      }}>
                        Not Started
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
