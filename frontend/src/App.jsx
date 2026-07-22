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
  saveToken,
  syncGmail,
} from './api'
import { toDateTimeLocal } from './utils'
import AuthForm from './components/AuthForm'
import Toolbar from './components/Toolbar'
import EmailCard from './components/EmailCard'
import ContextMenu from './components/ContextMenu'
import DeadlineModal from './components/DeadlineModal'
import EmailModal from './components/EmailModal'
import Calendar from './components/Calendar'
import DateListModal from './components/DateListModal'
import { format, parseISO } from 'date-fns'

function gmailSyncMessage(result, prefix = 'Synced') {
  const changes = []
  const updated = result.updated ?? 0
  if (result.imported) {
    changes.push(`${result.imported} new email${result.imported === 1 ? '' : 's'}`)
  }
  if (updated) {
    changes.push(`${updated} existing email${updated === 1 ? '' : 's'} with rich content`)
  }
  const summary = changes.length ? changes.join(' and ') : 'no new email content'
  const skipped = result.skipped ? ` (${result.skipped} already up to date)` : ''
  return `${prefix} ${summary} from Gmail${skipped}.`
}

export default function App() {
  const [user, setUser]                   = useState(null)
  const [booting, setBooting]             = useState(true)
  const [activeTab, setActiveTab]         = useState(null)
  const [emails, setEmails]               = useState([])
  const [allEmails, setAllEmails]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [uploading, setUploading]         = useState(false)
  const [syncing, setSyncing]             = useState(false)
  const [error, setError]                 = useState(null)
  const [uploadMsg, setUploadMsg]         = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [menu, setMenu]                   = useState(null)
  const [deadlineModal, setDeadlineModal] = useState(null)
  const [deadlineValue, setDeadlineValue] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [dateModalEmails, setDateModalEmails] = useState([])
  const fileRef = useRef()
  const allEmailsCountRef = useRef(0)
  useEffect(() => { allEmailsCountRef.current = allEmails.length }, [allEmails.length])

  // Auto-sync once on login so the user sees fresh emails immediately
  useEffect(() => {
    if (!user) return
    silentSync()
  }, [user?.user_id])

  //Poll the DB every 2 minutes to pick up emails imported by the background scheduler
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      const prevCount = allEmailsCountRef.current
      await reload()
      setAllEmails(prev => {
        if (prev.length > prevCount) {
          const diff = prev.length - prevCount
          setUploadMsg(`${diff} new email${diff === 1 ? '' : 's'} arrived.`)
        }
        return prev
      })
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.user_id])

  //Restore a session from a stored token on first load.
  //Handles the Google OAuth callback: token and auth_error arrive as URL params.
  useEffect(() => {
    const boot = async () => {
      const params = new URLSearchParams(window.location.search)
      const oauthToken = params.get('token')
      const authError = params.get('auth_error')
      if (oauthToken || authError) {
        window.history.replaceState({}, '', window.location.pathname)
      }
      if (oauthToken) saveToken(oauthToken)
      if (authError) setError(decodeURIComponent(authError))

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

  // The calendar reflects ALL deadlines, independent of the active tab. fetchEmails(null)
  // returns every non-BIN email, so this loads once per session and refreshes only after a
  // mutation — never on a tab switch, so the calendar stays put as you change folders.
  const loadAll = async () => {
    try {
      setAllEmails(await fetchEmails(null))
    } catch (e) {
      setError(e.message)
    }
  }

  //Refresh both the tab list and the calendar after a mutation.
  const reload = () => Promise.all([load(activeTab), loadAll()])

  //List re-fetches on tab change or once a session is established.
  useEffect(() => { if (user) load(activeTab) }, [activeTab, user])
  //Calendar data loads once per session, NOT on tab change.
  useEffect(() => { if (user) loadAll() }, [user])

  // Every non-BIN email that carries a deadline, drawn from the tab-independent set.
  const deadlineEmails = allEmails.filter(e => e.extracted_deadline && e.tab !== 'BIN')

  const handleMarkDone = async (emailId) => {
    setError(null)
    try {
      await markDoneApi(emailId)
      await reload()
      setMenu(null)
      setSelectedEmail(null)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleConfirm = async (emailId) => {
    setError(null)
    try {
      await confirmApi(emailId)
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDismiss = async (emailId) => {
    setError(null)
    try {
      await dismissApi(emailId)
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSetTab = async (emailId, tab) => {
    setMenu(null)
    setError(null)
    try {
      await setTabApi(emailId, tab)
      await reload()
      setSelectedEmail(null)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (emailId) => {
    setMenu(null)
    setError(null)
    try {
      await deleteEmailApi(emailId)
      await reload()
      setSelectedEmail(null)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRecover = async (emailId) => {
    setError(null)
    try {
      await recoverEmailApi(emailId)
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleOpenDeadline = (email) => {
    setMenu(null)
    setSelectedEmail(null)
    setDeadlineValue(toDateTimeLocal(email.extracted_deadline))
    setDeadlineModal({ email })
  }

  const handleSaveDeadline = async () => {
    const email = deadlineModal.email
    // Convert `datetime-local` (YYYY-MM-DDTHH:MM) in local time to an ISO instant (UTC)
    let deadline = null
    if (deadlineValue) {
      try {
        const [datePart, timePart] = deadlineValue.split('T')
        if (datePart && timePart) {
          const [y, m, d] = datePart.split('-').map(Number)
          const [hh, mm] = timePart.split(':').map(Number)
          const dt = new Date(y, m - 1, d, hh, mm)
          deadline = dt.toISOString()
        } else {
          deadline = deadlineValue
        }
      } catch (err) {
        deadline = deadlineValue
      }
    }
    setDeadlineModal(null)
    setError(null)
    try {
      await setDeadlineApi(email.email_id, deadline)
      await reload()
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

  const handleSyncGmail = async () => {
    setSyncing(true)
    setUploadMsg(null)
    setError(null)
    try {
      const result = await syncGmail()
      setUploadMsg(gmailSyncMessage(result))
      if (result.imported + (result.updated ?? 0) > 0) await reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  const silentSync = async () => {
    setSyncing(true)
    try {
      const result = await syncGmail()
      if (result.imported + (result.updated ?? 0) > 0) {
        setUploadMsg(gmailSyncMessage(result, 'Auto-synced'))
        await reload()
      }
    } catch {
      // Silently ignore — user may not have Google connected
    } finally {
      setSyncing(false)
    }
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
      await reload()
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
    setAllEmails([])
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
        syncing={syncing}
        onSyncGmail={handleSyncGmail}
        hasGmail={user?.has_gmail ?? false}
      />

      {uploadMsg && <div className="banner success">{uploadMsg}</div>}
      {error     && <div className="banner error">{error}</div>}

      {allEmails.length > 0 && (
        <Calendar
          emails={deadlineEmails}
          onDateClick={(date) => {
            setSelectedDate(date)
            const key = format(date, 'yyyy-MM-dd')
            const matched = deadlineEmails.filter(e => {
              if (!e.extracted_deadline) return false
              try {
                const d = parseISO(e.extracted_deadline)
                const ek = format(d, 'yyyy-MM-dd')
                return ek === key
              } catch (err) {
                return (e.extracted_deadline || '').startsWith(key)
              }
            })
            setDateModalEmails(matched)
          }}
        />
      )}

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

      <DateListModal
        open={!!selectedDate}
        date={selectedDate}
        emails={dateModalEmails}
        onClose={() => { setSelectedDate(null); setDateModalEmails([]) }}
        onEmailClick={(e) => { setSelectedEmail(e); setSelectedDate(null) }}
      />

      {selectedEmail && (
        <EmailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onContextMenu={ev => selectedEmail.tab !== 'BIN'
            ? handleContextMenu(ev, selectedEmail)
            : ev.preventDefault()}
          onMarkDone={() => handleMarkDone(selectedEmail.email_id)}
        />
      )}
    </div>
  )
}
