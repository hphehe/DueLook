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
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'

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

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="cal-btn" onClick={prev}>{'‹'}</button>
        <div className="cal-title">{format(monthStart, 'MMMM yyyy')}</div>
        <button className="cal-btn" onClick={next}>{'›'}</button>
      </div>
      <div className="cal-grid">
        <div className="cal-row cal-weekdays">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="cal-cell cal-weekday">{d}</div>
          ))}
        </div>
        {rows.map((week, wi) => (
          <div key={wi} className="cal-row">
            {week.map((c) => (
              <div
                key={c.iso}
                className={`cal-cell ${c.inMonth ? '' : 'muted'}`}
                onClick={() => onDateClick?.(c.day)}
              >
                <div className={`cal-day ${isSameDay(c.day, new Date()) ? 'today' : ''}`}>
                  {c.formatted}
                </div>
                {counts[c.iso] ? (
                  <div className="cal-badge">{counts[c.iso]}</div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
