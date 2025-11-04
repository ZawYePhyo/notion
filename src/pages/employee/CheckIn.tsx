import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { QRScanner } from '../../components/QRScanner'
import { functions } from '../../services/firebase'
import { httpsCallable } from 'firebase/functions'
import { useTranslation } from 'react-i18next'

export default function EmployeeCheckIn() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const { t } = useTranslation()

  const handleScan = async (data: string) => {
    if (processing) return

    setProcessing(true)
    setMessage(null)

    try {
      // Parse QR code data (format: jobId:token:type)
      const [jobId, token, type] = data.split(':')

      if (!jobId || !token || !type) {
        setMessage({ type: 'error', text: 'Invalid QR code format' })
        setProcessing(false)
        return
      }

      if (type === 'checkin') {
        const checkIn = httpsCallable(functions, 'checkIn')
        const result = await checkIn({ jobId, token })
        const resultData = result.data as any

        if (resultData.success) {
          setMessage({ type: 'success', text: 'Checked in successfully!' })
        } else {
          setMessage({ type: 'error', text: resultData.message || 'Failed to check in' })
        }
      } else if (type === 'checkout') {
        const checkOut = httpsCallable(functions, 'checkOut')
        const result = await checkOut({ jobId, token })
        const resultData = result.data as any

        if (resultData.success) {
          setMessage({
            type: 'success',
            text: `Checked out successfully! Worked ${resultData.workedMinutes} minutes. Total pay: ¥${Math.round(resultData.totalPay)}`
          })
        } else {
          setMessage({ type: 'error', text: resultData.message || 'Failed to check out' })
        }
      } else {
        setMessage({ type: 'error', text: 'Invalid QR code type' })
      }
    } catch (error: any) {
      console.error('Error processing check in/out:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to process check in/out'
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('checkIn')}
      </h2>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '0.5rem',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b'
        }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
          Scan the QR code at the job site to check in or check out
        </p>

        <QRScanner
          onScan={handleScan}
          onError={(error) => setMessage({ type: 'error', text: error })}
        />
      </div>

      {processing && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>{t('loading')}</p>
        </div>
      )}
    </Layout>
  )
}
