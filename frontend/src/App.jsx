import { useState, useEffect, useRef } from 'react'
import {
  fetchEmails,
  markDoneApi,
  confirmApi,
  dismissApi,
  setTabApi,
  deleteEmailApi,
  recoverEmailApi,
  setDeadlineApi,
  uploadEml,
  fetchCurrentUser,
  hasToken,
  clearToken,
} from './api'
import { toDateTimeLocal } from './utils'
import AuthForm from './components/AuthForm'
import Toolbar from './components/Toolbar'
import EmailCard from './components/EmailCard'
import ContextMenu from './components/ContextMenu'
import DeadlineModal from './components/DeadlineModal'
import EmailDetailModal from './components/EmailDetailModal'

export default function App() {
  const [user, setUser]                   = useState(null)
  const [booting, setBooting]             = useState(true)
  const [activeTab, setActiveTab]         = useState(null)
  const [emails, setEmails]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [uploading, setUploading]         = useState(false)
  const [error, setError]                 = useState(null)
  const [uploadMsg, setUploadMsg]         = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [menu, setMenu]                   = useState(null)
  const [deadlineModal, setDeadlineModal] = useState(null)
  const [deadlineValue, setDeadlineValue] = useState('')
  const fileRef = useRef()

  // Restore a session from a stored token on first load.
  useEffect(() => {
    const boot = async () => {
      if (hasToken()) {
        try {
          setUser(await fetchCurrentUser())
        } catch {
          clearToken()
        }
      }
      setBooting(false)
    }
    boot()
  }, [])

  useEffect(() => {
    if (!selectedEmail) return
    const onKey = (e) => { if (e.key === 'Escape') setSelectedEmail(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedEmail])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null) }
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  useEffect(() => {
    if (!deadlineModal) return
    const onKey = (e) => { if (e.key === 'Escape') setDeadlineModal(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deadlineModal])

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

  // Load emails when the tab changes or once a user session is established.
  useEffect(() => { if (user) load(activeTab) }, [activeTab, user])

  const handleMarkDone = async (emailId) => {
    setError(null)
    try {
      await markDoneApi(emailId)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleConfirm = async (emailId) => {
    setError(null)
    try {
      await confirmApi(emailId)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDismiss = async (emailId) => {
    setError(null)
    try {
      await dismissApi(emailId)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSetTab = async (emailId, tab) => {
    setMenu(null)
    setError(null)
    try {
      await setTabApi(emailId, tab)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (emailId) => {
    setMenu(null)
    setError(null)
    try {
      await deleteEmailApi(emailId)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRecover = async (emailId) => {
    setError(null)
    try {
      await recoverEmailApi(emailId)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleOpenDeadline = (email) => {
    setMenu(null)
    setDeadlineValue(toDateTimeLocal(email.extracted_deadline))
    setDeadlineModal({ email })
  }

  const handleSaveDeadline = async () => {
    const email = deadlineModal.email
    const deadline = deadlineValue || null
    setDeadlineModal(null)
    setError(null)
    try {
      await setDeadlineApi(email.email_id, deadline)
      await load(activeTab)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleContextMenu = (ev, email) => {
    ev.preventDefault()
    ev.stopPropagation()
    // Clamp to viewport so the menu doesn't render offscreen near the edges; 185×220 ≈ its rendered size.
    const x = Math.min(ev.clientX, window.innerWidth - 185)
    const y = Math.min(ev.clientY, window.innerHeight - 220)
    setMenu({ x, y, email })
  }

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

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setEmails([])
    setActiveTab(null)
    setError(null)
    setUploadMsg(null)
    setSelectedEmail(null)
    setMenu(null)
    setDeadlineModal(null)
    setLoading(true)
  }

  if (booting) {
    return (
      <div className="auth-shell">
        <div className="empty">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <AuthForm onAuthSuccess={setUser} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>DueLook</h1>
          <p className="subtitle">Let us look for what's due.</p>
        </div>
        <div className="session-chip">
          <span className="session-email">{user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <Toolbar
        activeTab={activeTab}
        onTabClick={handleTabClick}
        uploading={uploading}
        fileRef={fileRef}
        onFileChange={handleFileChange}
      />

      {uploadMsg && <div className="banner success">{uploadMsg}</div>}
      {error     && <div className="banner error">{error}</div>}

      {loading ? (
        <div className="empty">Loading…</div>
      ) : emails.length === 0 ? (
        <div className="empty">No emails here yet. Import a .eml file to get started.</div>
      ) : (
        <ul className="email-list">
          {emails.map(e => (
            <EmailCard
              key={e.email_id}
              email={e}
              onClick={() => setSelectedEmail(e)}
              onContextMenu={ev => e.tab !== 'BIN' ? handleContextMenu(ev, e) : ev.preventDefault()}
              onMarkDone={() => handleMarkDone(e.email_id)}
              onConfirm={() => handleConfirm(e.email_id)}
              onDismiss={() => handleDismiss(e.email_id)}
              onRecover={() => handleRecover(e.email_id)}
            />
          ))}
        </ul>
      )}

      {menu && (
        <ContextMenu
          menu={menu}
          onSetTab={handleSetTab}
          onOpenDeadline={handleOpenDeadline}
          onDelete={handleDelete}
        />
      )}

      {deadlineModal && (
        <DeadlineModal
          email={deadlineModal.email}
          value={deadlineValue}
          onChange={setDeadlineValue}
          onSave={handleSaveDeadline}
          onClose={() => setDeadlineModal(null)}
        />
      )}

      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  )
}
