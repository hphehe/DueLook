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

const FLOATING_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/

function floatingParts(str) {
  if (!str) return null
  const match = String(str).match(FLOATING_DATETIME)
  if (!match) return null
  const [, year, month, day, hour, minute, seconds = '00'] = match
  const values = [year, month, day, hour, minute, seconds].map(Number)
  const date = new Date(Date.UTC(
    values[0], values[1] - 1, values[2], values[3], values[4], values[5],
  ))
  if (
    date.getUTCFullYear() !== values[0]
    || date.getUTCMonth() !== values[1] - 1
    || date.getUTCDate() !== values[2]
    || date.getUTCHours() !== values[3]
    || date.getUTCMinutes() !== values[4]
    || date.getUTCSeconds() !== values[5]
  ) return null
  return { year, month, day, hour, minute, seconds, date }
}

// A deadline is a floating wall-clock value. Any suffix is ignored without
// shifting the written date or time; UTC is only an internal arithmetic frame.
export function parseFloatingDateTime(str) {
  return floatingParts(str)?.date ?? null
}

export function floatingDateKey(str) {
  const parts = floatingParts(str)
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : null
}

export function floatingNow() {
  const now = new Date()
  return new Date(Date.UTC(
    now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds(),
  ))
}

export function formatFloatingDateTime(str) {
  const date = parseFloatingDateTime(str)
  if (!date) return str
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(date)
}

export function senderInitial(sender) {
  return (sender.replace(/<.*>/, '').trim()[0] || '?').toUpperCase()
}

// <input type="datetime-local"> uses the same floating wall-clock fields.
export function toDateTimeLocal(isoStr) {
  const parts = floatingParts(isoStr)
  return parts
    ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
    : ''
}
