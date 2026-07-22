import { useState } from 'react'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from 'date-fns'

import './Calendar.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_VISIBLE_EVENTS = 2

export default function Calendar({ emails = [], onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const displayedYear = currentMonth.getFullYear()

  const eventsByDate = {}
  emails.forEach((email) => {
    if (!email.extracted_deadline) return
    try {
      const key = format(parseISO(email.extracted_deadline), 'yyyy-MM-dd')
      eventsByDate[key] = [...(eventsByDate[key] || []), email]
    } catch {
      // Ignore malformed deadlines so one bad record cannot break the calendar.
    }
  })

  const dates = []
  let day = startDate
  while (day <= endDate) {
    dates.push({
      date: day,
      key: format(day, 'yyyy-MM-dd'),
      label: format(day, 'PPP'),
      number: format(day, 'd'),
      inMonth: isSameMonth(day, monthStart),
    })
    day = addDays(day, 1)
  }

  const years = []
  for (let year = displayedYear - 5; year <= displayedYear + 5; year += 1) {
    years.push(year)
  }

  const selectMonth = (month) => setCurrentMonth(new Date(displayedYear, month, 1))
  const selectYear = (year) => setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))

  return (
    <section className="due-calendar" aria-label={`${MONTHS[currentMonth.getMonth()]} ${displayedYear} deadlines`}>
      <header className="due-calendar__header">
        <div className="due-calendar__navigation" aria-label="Calendar navigation">
          <button
            type="button"
            className="due-calendar__arrow"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="due-calendar__arrow"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="due-calendar__period">
          <label className="due-calendar__select-wrap">
            <span className="due-calendar__sr-only">Month</span>
            <select
              className="due-calendar__select due-calendar__select--month"
              value={currentMonth.getMonth()}
              onChange={(event) => selectMonth(Number(event.target.value))}
              aria-label="Month"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </label>

          <label className="due-calendar__select-wrap">
            <span className="due-calendar__sr-only">Year</span>
            <select
              className="due-calendar__select due-calendar__select--year"
              value={displayedYear}
              onChange={(event) => selectYear(Number(event.target.value))}
              aria-label="Year"
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="due-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="due-calendar__weekday">{weekday}</div>
        ))}
      </div>

      <div className="due-calendar__grid">
        {dates.map((cell) => {
          const events = eventsByDate[cell.key] || []
          const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS)
          const hiddenCount = events.length - visibleEvents.length
          const isPast = isBefore(cell.date, startOfToday())
          const deadlineLabel = events.length
            ? `, ${events.length} deadline${events.length === 1 ? '' : 's'}`
            : ''

          return (
            <button
              type="button"
              key={cell.key}
              className={`due-calendar__cell${cell.inMonth ? '' : ' is-outside'}${isSameDay(cell.date, new Date()) ? ' is-today' : ''}`}
              onClick={() => onDateClick?.(cell.date)}
              aria-label={`${cell.label}${deadlineLabel}`}
            >
              <span className="due-calendar__date">{cell.number}</span>

              {visibleEvents.length > 0 && (
                <span className="due-calendar__events">
                  {visibleEvents.map((email) => (
                    <span
                      key={email.email_id}
                      className={`due-calendar__event${isPast ? ' is-overdue' : ''}`}
                      title={email.subject || '(No subject)'}
                    >
                      <span className="due-calendar__event-dot" aria-hidden="true" />
                      <span className="due-calendar__event-title">
                        {email.subject || '(No subject)'}
                      </span>
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="due-calendar__more">+{hiddenCount} more</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
