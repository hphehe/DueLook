import { useEffect, useState } from 'react'

import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'
import {
  clearToken,
  fetchCurrentUser,
  fetchEmails,
  hasToken,
  uploadEml,
} from './lib/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadMsg, setUploadMsg] = useState(null)

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

  const loadCurrentUser = async () => {
    if (!hasToken()) return false

    try {
      setUser(await fetchCurrentUser())
      return true
    } catch {
      clearToken()
      setUser(null)
      return false
    }
  }

  useEffect(() => {
    const boot = async () => {
      const ok = await loadCurrentUser()
      if (ok) {
        await load(activeTab)
      } else {
        setLoading(false)
      }
    }

    boot()
  }, [])

  useEffect(() => {
    if (!user) return
    load(activeTab)
  }, [activeTab, user])

  const handleTabClick = (key) => {
    setActiveTab(key)
    setUploadMsg(null)
  }

  const handleFileChange = async (file) => {
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
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('duelook_token')
    setUser(null)
    setEmails([])
    setError(null)
    setUploadMsg(null)
    setActiveTab(null)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="shell auth-shell">
        <AuthForm onAuthSuccess={setUser} />
      </div>
    )
  }

  return (
    <Dashboard
      user={user}
      activeTab={activeTab}
      setActiveTab={handleTabClick}
      uploading={uploading}
      onUpload={handleFileChange}
      onLogout={handleLogout}
      uploadMsg={uploadMsg}
      error={error}
      loading={loading}
      emails={emails}
    />
  )
}
