import { useRef } from 'react'

const TABS = [
  { key: null, label: 'All' },
  { key: 'FILTERED', label: 'Filtered' },
  { key: 'NEEDS_REVIEW', label: 'Needs Review' },
  { key: 'NO_DEADLINE', label: 'No Deadline' },
  { key: 'DONE', label: 'Done' },
  { key: 'MISSED', label: 'Missed' },
]

const TAB_COLORS = {
  FILTERED: '#3b82f6',
  NEEDS_REVIEW: '#f59e0b',
  DONE: '#5d8a6d',
  MISSED: '#ef4444',
  NO_DEADLINE: '#6b7280',
}

function formatDate(str) {
  if (!str) return null
  try {
    return new Date(str).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return str
  }
}

function senderInitial(sender) {
  return (sender.replace(/<.*>/, '').trim()[0] || '?').toUpperCase()
}

export default function Dashboard({
  user,
  activeTab,
  setActiveTab,
  uploading,
  onUpload,
  onLogout,
  uploadMsg,
  error,
  loading,
  emails,
}) {
  const fileRef = useRef()

  const handleUploadClick = () => {
    fileRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUpload(file)
    e.target.value = ''
  }

  return (
    <div className="shell">
      <header className="header">
        <div>
          <p className="eyebrow">Authenticated workspace</p>
          <h1>DueLook</h1>
          <p className="subtitle">Let us look for what's due.</p>
        </div>

        <div className="session-chip">
          <span>{user.email}</span>
          <button type="button" className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              type="button"
              key={String(tab.key)}
              className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button type="button" className="upload-btn" onClick={handleUploadClick} disabled={uploading}>
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
      {error && <div className="banner error">{error}</div>}

      {loading ? (
        <div className="empty">Loading…</div>
      ) : emails.length === 0 ? (
        <div className="empty">No emails here yet. Import a .eml file to get started.</div>
      ) : (
        <ul className="email-list">
          {emails.map((email) => (
            <li key={email.email_id} className="card">
              <div className="avatar">{senderInitial(email.sender)}</div>
              <div className="card-body">
                <div className="card-top">
                  <span className="subject">{email.subject || '(no subject)'}</span>
                  <span
                    className="tab-badge"
                    style={{ background: TAB_COLORS[email.tab] ?? '#6b7280' }}
                  >
                    {email.tab.replace('_', ' ')}
                  </span>
                </div>
                <div className="sender">{email.sender}</div>
                <div className="card-meta">
                  <span className="category-badge">{email.category}</span>
                  {email.extracted_deadline && (
                    <span className="deadline">Due: {formatDate(email.extracted_deadline)}</span>
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