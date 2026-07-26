import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
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

import HoverMenu from './HoverMenu'
import './Calendar.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_VISIBLE_EVENTS = 2

function CalendarDropdown({ label, value, options, onChange, width }) {
  const selected = options.find(option => option.value === value)

  return (
    <HoverMenu
      label={`${label}: ${selected.label}`}
      align="left"
      triggerClassName="due-calendar__select"
      panelClassName={`due-calendar__dropdown due-calendar__dropdown--${width}`}
      trigger={(
        <>
          <span>{selected.label}</span>
          <span className="due-calendar__chevron" aria-hidden="true">&#9662;</span>
        </>
      )}
    >
      {close => options.map(option => (
        <button
          type="button"
          role="menuitemradio"
          aria-checked={option.value === value}
          className="due-calendar__option"
          key={option.value}
          onClick={() => {
            onChange(option.value)
            close()
          }}
        >
          <span>{option.label}</span>
          {option.value === value && <span aria-hidden="true">&#10003;</span>}
        </button>
      ))}
    </HoverMenu>
  )
}

export default function Calendar({ emails = [], onDateClick, compact = false }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const monthStart = startOfMonth(currentMonth)
  const displayedMonth = currentMonth.getMonth()
  const displayedYear = currentMonth.getFullYear()
  const today = startOfToday()

  const eventsByDate = emails.reduce((groups, email) => {
    if (!email.extracted_deadline) return groups
    try {
      const key = format(parseISO(email.extracted_deadline), 'yyyy-MM-dd')
      ;(groups[key] ||= []).push(email)
    } catch {
      // One malformed deadline should not break the calendar.
    }
    return groups
  }, {})

  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
  const dates = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(date => ({
    date,
    key: format(date, 'yyyy-MM-dd'),
    label: format(date, 'PPP'),
    number: format(date, 'd'),
    inMonth: isSameMonth(date, monthStart),
  }))
  const months = MONTHS.map((month, index) => ({ label: month, value: index }))
  const years = Array.from({ length: 11 }, (_, index) => {
    const year = displayedYear - 5 + index
    return { label: String(year), value: year }
  })

  return (
    <section className={`due-calendar${compact ? ' due-calendar--compact' : ''}`} aria-label={`${MONTHS[displayedMonth]} ${displayedYear} deadlines`}>

      <header className="due-calendar__header">
        <div className="due-calendar__navigation" aria-label="Calendar navigation">
          <button
            type="button"
            className="due-calendar__arrow"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>
          <button
            type="button"
            className="due-calendar__arrow"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </div>

        <div className="due-calendar__period">
          <CalendarDropdown
            label="Month"
            value={displayedMonth}
            options={months}
            width="month"
            onChange={month => setCurrentMonth(new Date(displayedYear, month, 1))}
          />
          <CalendarDropdown
            label="Year"
            value={displayedYear}
            options={years}
            width="year"
            onChange={year => setCurrentMonth(new Date(year, displayedMonth, 1))}
          />
        </div>
      </header>

      <div className="due-calendar__body">
        <div className="due-calendar__weekdays" aria-hidden="true">
          {WEEKDAYS.map(weekday => (
            <div key={weekday} className="due-calendar__weekday">{weekday}</div>
          ))}
        </div>

        <div className="due-calendar__grid">
          {dates.map(cell => {
            const events = eventsByDate[cell.key] || []
            const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS)
            const hiddenCount = events.length - visibleEvents.length
            const isPast = isBefore(cell.date, today)
            const deadlineLabel = events.length
              ? `, ${events.length} deadline${events.length === 1 ? '' : 's'}`
              : ''

            return (
              <button
                type="button"
                key={cell.key}
                className={`due-calendar__cell${cell.inMonth ? '' : ' is-outside'}${isSameDay(cell.date, today) ? ' is-today' : ''}`}
                onClick={() => onDateClick?.(cell.date)}
                aria-label={`${cell.label}${deadlineLabel}`}
              >
                <span className="due-calendar__date">{cell.number}</span>

                {visibleEvents.length > 0 && (
                  <span className="due-calendar__events">
                    {visibleEvents.map(email => (
                      <span
                        key={email.email_id}
                        className={`due-calendar__event${isPast ? ' is-overdue' : ''}`}
                        title={email.subject || '(No subject)'}
                      >
                        {email.subject || '(No subject)'}
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
      </div>
    </section>
  )
}
