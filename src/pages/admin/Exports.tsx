import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { functions } from '../../services/firebase'
import { httpsCallable } from 'firebase/functions'
import { useTranslation } from 'react-i18next'

export default function AdminExports() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [csvData, setCsvData] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleExport = async () => {
    setMessage(null)
    setCsvData(null)
    setLoading(true)

    try {
      const exportToCSV = httpsCallable(functions, 'exportToCSV')
      const result = await exportToCSV({ year, month })
      const data = result.data as any

      if (data.success) {
        setCsvData(data.csv)
        setMessage({
          type: 'success',
          text: `Exported ${data.rowCount} records successfully`
        })
      } else {
        setMessage({ type: 'error', text: 'Failed to export data' })
      }
    } catch (error: any) {
      console.error('Error exporting:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to export data' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!csvData) return

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dzn-timme-export-${year}-${String(month).padStart(2, '0')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('exports')}
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

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Export Work & Payment Data
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            >
              {months.map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? t('loading') : 'Export'}
          </button>
        </div>
      </div>

      {csvData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              Export Preview
            </h3>
            <button onClick={handleDownload} className="btn btn-primary">
              Download CSV
            </button>
          </div>

          <div style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.375rem',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            <pre style={{ fontSize: '0.875rem', margin: 0 }}>
              {csvData}
            </pre>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Export Format
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
          The CSV export includes the following columns:
        </p>
        <ul style={{ color: '#6b7280', paddingLeft: '1.5rem' }}>
          <li>employeeId - Internal employee ID</li>
          <li>name - Employee full name</li>
          <li>site - Job site name</li>
          <li>jobDate - Date of the job</li>
          <li>start - Planned start time</li>
          <li>end - Actual check-out time</li>
          <li>hoursWorked - Total hours worked</li>
          <li>hourlyWage - Hourly wage rate</li>
          <li>totalPay - Total payment amount</li>
          <li>status - Payment status (pending/exported)</li>
        </ul>
      </div>
    </Layout>
  )
}
