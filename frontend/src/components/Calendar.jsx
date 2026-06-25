import { useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Calendar({ emails = [], onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // map dates to email counts
  const counts = {}
  emails.forEach((e) => {
    if (!e.extracted_deadline) return
    try {
      const d = parseISO(e.extracted_deadline)
      const key = format(d, 'yyyy-MM-dd')
      counts[key] = (counts[key] || 0) + 1
    } catch (err) {
      // ignore parse errors
    }
  })

  const rows = []
  let day = startDate
  while (day <= endDate) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const formatted = format(day, 'd')
      const iso = format(day, 'yyyy-MM-dd')
      week.push({ day, formatted, iso, inMonth: isSameMonth(day, monthStart) })
      day = addDays(day, 1)
    }
    rows.push(week)
  }

  const prev = () => setCurrentMonth(subMonths(currentMonth, 1))
  const next = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Month/year quick-jump. Build the year list around the displayed year so the
  // current selection is always present and centered; the arrows still reach further.
  const displayedYear = currentMonth.getFullYear()
  const years = []
  for (let y = displayedYear - 5; y <= displayedYear + 5; y++) years.push(y)

  const selectMonth = (m) => setCurrentMonth(new Date(displayedYear, m, 1))
  const selectYear = (y) => setCurrentMonth(new Date(y, currentMonth.getMonth(), 1))

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="cal-btn" onClick={prev} aria-label="Previous month">{'‹'}</button>
        <div className="cal-selectors">
          <select
            className="cal-select"
            value={currentMonth.getMonth()}
            onChange={(e) => selectMonth(Number(e.target.value))}
            aria-label="Month"
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            className="cal-select"
            value={displayedYear}
            onChange={(e) => selectYear(Number(e.target.value))}
            aria-label="Year"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button className="cal-btn" onClick={next} aria-label="Next month">{'›'}</button>
      </div>
      <div className="cal-grid">
        <div className="cal-row cal-weekdays">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="cal-cell cal-weekday">{d}</div>
          ))}
        </div>
        {rows.map((week, wi) => (
          <div key={wi} className="cal-row">
            {week.map((c) => {
              const count = counts[c.iso] || 0
              const isPast = count > 0 && isBefore(c.day, startOfToday())
              const dayLabel = format(c.day, 'PPP')
              const label = count
                ? `${dayLabel}, ${count} deadline${count > 1 ? 's' : ''}${isPast ? ' (passed)' : ''}`
                : dayLabel
              return (
                <div
                  key={c.iso}
                  className={`cal-cell ${c.inMonth ? '' : 'muted'}`}
                  onClick={() => onDateClick?.(c.day)}
                  title={count ? `${count} deadline${count > 1 ? 's' : ''}${isPast ? ' (passed)' : ''}` : undefined}
                  aria-label={label}
                >
                  <div className={`cal-day ${isSameDay(c.day, new Date()) ? 'today' : ''}`}>
                    {c.formatted}
                  </div>
                  {count ? <div className={`cal-dot ${isPast ? 'past' : ''}`} /> : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
