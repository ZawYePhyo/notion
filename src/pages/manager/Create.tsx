import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { db, functions } from '../../services/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Site } from '../../types'
import { useTranslation } from 'react-i18next'

export default function ManagerCreate() {
  const [sites, setSites] = useState<Site[]>([])
  const [formData, setFormData] = useState({
    siteId: '',
    title: '',
    taskDescription: '',
    date: '',
    startTime: '',
    endTime: '',
    hourlyWage: '',
    requiredHeadcount: '',
    applicationDeadlineHours: '24'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { employee } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async () => {
    try {
      const sitesRef = collection(db, 'sites')
      const snapshot = await getDocs(sitesRef)
      const sitesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Site[]

      setSites(sitesData)

      if (sitesData.length > 0) {
        setFormData(prev => ({ ...prev, siteId: sitesData[0].id }))
      }
    } catch (error) {
      console.error('Error loading sites:', error)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const createJob = httpsCallable(functions, 'createJob')
      const result = await createJob({
        siteId: formData.siteId,
        title: formData.title,
        taskDescription: formData.taskDescription,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyWage: Number(formData.hourlyWage),
        requiredHeadcount: Number(formData.requiredHeadcount),
        applicationDeadlineHours: Number(formData.applicationDeadlineHours)
      })

      const data = result.data as any

      if (data.success) {
        setMessage({ type: 'success', text: 'Job created successfully!' })
        setTimeout(() => {
          navigate(`/manager/job/${data.jobId}`)
        }, 1500)
      } else {
        setMessage({ type: 'error', text: 'Failed to create job' })
      }
    } catch (error: any) {
      console.error('Error creating job:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to create job' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('createJob')}
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

      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Site *
            </label>
            <select
              name="siteId"
              value={formData.siteId}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            >
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} - {site.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              {t('jobTitle')} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Task Description *
            </label>
            <textarea
              name="taskDescription"
              value={formData.taskDescription}
              onChange={handleChange}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('date')} *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                End Time *
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('wage')} (¥/hour) *
              </label>
              <input
                type="number"
                name="hourlyWage"
                value={formData.hourlyWage}
                onChange={handleChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('slots')} *
              </label>
              <input
                type="number"
                name="requiredHeadcount"
                value={formData.requiredHeadcount}
                onChange={handleChange}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Deadline (hours before) *
              </label>
              <input
                type="number"
                name="applicationDeadlineHours"
                value={formData.applicationDeadlineHours}
                onChange={handleChange}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/manager/dashboard')}
              className="btn btn-secondary"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? t('loading') : t('createJob')}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  )
}
