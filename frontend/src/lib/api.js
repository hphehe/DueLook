function getToken() {
  return localStorage.getItem('duelook_token')
}

function getAuthHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readJson(res) {
  return res.json().catch(() => ({}))
}

async function requestJson(path, options = {}) {
  const res = await fetch(path, options)
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

async function authRequest(path, email, password) {
  return requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function register(email, password) {
  return authRequest('/auth/register', email, password)
}

export function login(email, password) {
  return authRequest('/auth/login', email, password)
}

export async function fetchCurrentUser() {
  return requestJson('/auth/me', {
    headers: getAuthHeaders(),
  })
}

export async function fetchEmails(tab) {
  const url = tab ? `/emails?tab=${tab}` : '/emails'
  return requestJson(url, {
    headers: getAuthHeaders(),
  })
}

export async function uploadEml(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/emails/import', {
    method: 'POST',
    body: form,
    headers: getAuthHeaders(),
  })
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.detail || 'Upload failed')
  return data
}

export function saveToken(token) {
  localStorage.setItem('duelook_token', token)
}

export function clearToken() {
  localStorage.removeItem('duelook_token')
}

export function hasToken() {
  return Boolean(getToken())
}