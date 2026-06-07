const TOKEN_KEY = 'duelook_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasToken() {
  return Boolean(getToken())
}

function authHeaders(extra = {}) {
  const token = getToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

async function readJson(res) {
  return res.json().catch(() => ({}))
}

/** 
Authenticated request. On 401 (session expired/invalid mid-use) clear the
token and reload so the app bounces back to the login screen. Boot-time
session restore uses fetchCurrentUser below, which throws instead of
reloading so App can show the login form without a reload flash.
**/
async function authed(path, options = {}) {
  const res = await fetch(path, { ...options, headers: authHeaders(options.headers) })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('Session expired')
  }
  return res
}

async function authedJson(path, options = {}) {
  const res = await authed(path, options)
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

async function authedVoid(path, options = {}) {
  const res = await authed(path, options)
  if (!res.ok) {
    const data = await readJson(res)
    throw new Error(data.detail || 'Request failed')
  }
}

// ── Auth (unauthenticated) ──
async function authRequest(path, email, password) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export function register(email, password) {
  return authRequest('/auth/register', email, password)
}

export function login(email, password) {
  return authRequest('/auth/login', email, password)
}

export async function fetchCurrentUser() {
  const res = await fetch('/auth/me', { headers: authHeaders() })
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.detail || 'Failed to load user')
  return data
}

// ── Emails ──
export function fetchEmails(tab) {
  const url = tab ? `/emails?tab=${tab}` : '/emails'
  return authedJson(url)
}

export function markDoneApi(emailId) {
  return authedVoid(`/emails/${emailId}/done`, { method: 'POST' })
}

export function confirmApi(emailId) {
  return authedVoid(`/emails/${emailId}/confirm`, { method: 'POST' })
}

export function dismissApi(emailId) {
  return authedVoid(`/emails/${emailId}/dismiss`, { method: 'POST' })
}

export function setTabApi(emailId, tab) {
  return authedVoid(`/emails/${emailId}/set-tab`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab }),
  })
}

export function deleteEmailApi(emailId) {
  return authedVoid(`/emails/${emailId}/delete`, { method: 'POST' })
}

export function recoverEmailApi(emailId) {
  return authedVoid(`/emails/${emailId}/recover`, { method: 'POST' })
}

export function setDeadlineApi(emailId, deadline) {
  return authedVoid(`/emails/${emailId}/set-deadline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deadline }),
  })
}

export async function uploadEml(file) {
  const form = new FormData()
  form.append('file', file)
  return authedJson('/emails/import', { method: 'POST', body: form })
}
