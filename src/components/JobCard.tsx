import { Job } from '../types'
import { useTranslation } from 'react-i18next'

interface JobCardProps {
  job: Job
  onApply?: (jobId: string) => void
  onClick?: () => void
  showApplyButton?: boolean
  applied?: boolean
}

export function JobCard({ job, onApply, onClick, showApplyButton = false, applied = false }: JobCardProps) {
  const { t } = useTranslation()

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onApply) {
      onApply(job.id)
    }
  }

  return (
    <div
      className="card"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        marginBottom: '1rem'
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {job.title}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
            {job.taskDescription}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <strong>{t('date')}:</strong> {job.date}
            </div>
            <div>
              <strong>{t('time')}:</strong> {job.startTime} - {job.endTime}
            </div>
            <div>
              <strong>{t('wage')}:</strong> ¥{job.hourlyWage}/h
            </div>
            <div>
              <strong>{t('slots')}:</strong> {job.currentApprovedCount}/{job.requiredHeadcount}
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
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

        {showApplyButton && (
          <div style={{ marginLeft: '1rem' }}>
            {applied ? (
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#e5e7eb',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {t('applied')}
              </span>
            ) : (
              <button
                onClick={handleApplyClick}
                className="btn btn-primary"
                disabled={job.status !== 'open' || job.currentApprovedCount >= job.requiredHeadcount}
              >
                {t('apply')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
