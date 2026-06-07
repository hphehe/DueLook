export function formatDate(str) {
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

export function senderInitial(sender) {
  return (sender.replace(/<.*>/, '').trim()[0] || '?').toUpperCase()
}

// <input type="datetime-local"> requires "YYYY-MM-DDTHH:MM" in local time — toISOString() gives UTC + seconds and is rejected.
export function toDateTimeLocal(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
