import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { db } from '../../services/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { Site } from '../../types'
import { useTranslation } from 'react-i18next'

export default function AdminSettings() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    region: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { t } = useTranslation()

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
    } catch (error) {
      console.error('Error loading sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      if (editing) {
        // Update existing site
        await updateDoc(doc(db, 'sites', editing), formData)
        setMessage({ type: 'success', text: 'Site updated successfully' })
      } else {
        // Create new site
        await addDoc(collection(db, 'sites'), formData)
        setMessage({ type: 'success', text: 'Site created successfully' })
      }

      setFormData({ name: '', address: '', region: '' })
      setEditing(null)
      loadSites()
    } catch (error: any) {
      console.error('Error saving site:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save site' })
    }
  }

  const handleEdit = (site: Site) => {
    setEditing(site.id)
    setFormData({
      name: site.name,
      address: site.address,
      region: site.region
    })
  }

  const handleDelete = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return

    try {
      await deleteDoc(doc(db, 'sites', siteId))
      setMessage({ type: 'success', text: 'Site deleted successfully' })
      loadSites()
    } catch (error: any) {
      console.error('Error deleting site:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete site' })
    }
  }

  const handleCancel = () => {
    setEditing(null)
    setFormData({ name: '', address: '', region: '' })
  }

  return (
    <Layout>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        {t('settings')}
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
          {editing ? 'Edit Site' : 'Add New Site'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Site Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                Region *
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select region</option>
                <option value="tokyo">Tokyo</option>
                <option value="osaka">Osaka</option>
                <option value="kyoto">Kyoto</option>
                <option value="hokkaido">Hokkaido</option>
                <option value="okinawa">Okinawa</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {editing && (
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                {t('cancel')}
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update Site' : 'Add Site'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Existing Sites
        </h3>

        {loading ? (
          <p>{t('loading')}</p>
        ) : sites.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No sites yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {sites.map(site => (
              <div
                key={site.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {site.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {site.address}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Region: {site.region}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(site)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '0.375rem'
                    }}
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="btn btn-danger"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
