import { useState, useEffect, useRef } from 'react'

const TABS = [
  { key: null,           label: 'All' },
  { key: 'FILTERED',     label: 'Filtered' },
  { key: 'NEEDS_REVIEW', label: 'Needs Review' },
  { key: 'NO_DEADLINE',  label: 'No Deadline' },
  { key: 'DONE',         label: 'Done' },
  { key: 'MISSED',       label: 'Missed' },
]

const TAB_COLORS = {
  FILTERED:     '#3b82f6',
  NEEDS_REVIEW: '#f59e0b',
  DONE:         '#5d8a6d',
  MISSED:       '#ef4444',
  NO_DEADLINE:  '#6b7280',
}

async function fetchEmails(tab) {
  const url = tab ? `/emails?tab=${tab}` : '/emails'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch emails')
  return res.json()
}

async function uploadEml(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/emails/import', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

function formatDate(str) {
  if (!str) return null
  try {
    return new Date(str).toLocaleString('en-SG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return str
  }
}

function senderInitial(sender) {
  return (sender.replace(/<.*>/, '').trim()[0] || '?').toUpperCase()
}

export default function App() {
  const [activeTab, setActiveTab] = useState(null)
  const [emails, setEmails]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState(null)
  const [uploadMsg, setUploadMsg] = useState(null)
  const fileRef = useRef()

  const load = async (tab) => {
    setLoading(true)
    setError(null)
    try {
      setEmails(await fetchEmails(tab))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(activeTab) }, [activeTab])

  const handleTabClick = (key) => {
    setActiveTab(key)
    setUploadMsg(null)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    setError(null)
    try {
      const result = await uploadEml(file)
      setUploadMsg(
        result.is_duplicate
          ? `Already imported: "${result.email.subject}"`
          : `Imported "${result.email.subject}" → ${result.email.tab.replace('_', ' ')}`
      )
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>DueLook</h1>
        <p className="subtitle">Let us look for what's due.</p>
      </header>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map(t => (
            <button
              key={String(t.key)}
              className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
              onClick={() => handleTabClick(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          className="upload-btn"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          {uploading ? 'Importing…' : '+ Import .eml'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".eml"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {uploadMsg && <div className="banner success">{uploadMsg}</div>}
      {error     && <div className="banner error">{error}</div>}

      {loading ? (
        <div className="empty">Loading…</div>
      ) : emails.length === 0 ? (
        <div className="empty">No emails here yet. Import a .eml file to get started.</div>
      ) : (
        <ul className="email-list">
          {emails.map(e => (
            <li key={e.email_id} className="card">
              <div className="avatar">{senderInitial(e.sender)}</div>
              <div className="card-body">
                <div className="card-top">
                  <span className="subject">{e.subject || '(no subject)'}</span>
                  <span
                    className="tab-badge"
                    style={{ background: TAB_COLORS[e.tab] ?? '#6b7280' }}
                  >
                    {e.tab.replace('_', ' ')}
                  </span>
                </div>
                <div className="sender">{e.sender}</div>
                <div className="card-meta">
                  <span className="category-badge">{e.category}</span>
                  {e.extracted_deadline && (
                    <span className="deadline">Due: {formatDate(e.extracted_deadline)}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
