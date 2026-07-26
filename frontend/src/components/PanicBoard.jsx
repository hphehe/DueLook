import { parseISO, formatDistanceToNow, isBefore } from 'date-fns'
import styles from './PanicBoard.module.css'

function getCountdownLabel(deadlineIso) {
  if (!deadlineIso) return null
  try {
    const deadline = parseISO(deadlineIso)
    const now = new Date()
    const isPast = isBefore(deadline, now)
    const distance = formatDistanceToNow(deadline, { addSuffix: true })
    return { isPast, distance }
  } catch {
    return null
  }
}

export default function PanicBoard({
  emails = [],
  panicDays = 2,
  onEmailClick,
  onMarkDone,
  onOpenDeadline,
  onContextMenu,
}) {
  const now = new Date()

  // Separate upcoming deadlines from missed/overdue deadlines
  const upcoming = []
  const missed = []

  for (const email of emails) {
    try {
      const deadline = parseISO(email.extracted_deadline)
      const isPast = isBefore(deadline, now) || email.tab === 'MISSED'
      if (isPast) {
        missed.push({ email, deadline })
      } else {
        upcoming.push({ email, deadline })
      }
    } catch {
      upcoming.push({ email, deadline: new Date() })
    }
  }

  // Sort upcoming nearest deadline first (ascending order)
  upcoming.sort((a, b) => a.deadline - b.deadline)
  // Sort missed tasks
  missed.sort((a, b) => a.deadline - b.deadline)

  // Combine: nearest upcoming first, then missed/overdue; limit to 8 tasks at most
  const displayEmails = [...upcoming.map(item => item.email), ...missed.map(item => item.email)].slice(0, 8)

  return (
    <section className={styles.panicBoard} aria-label="Panic Board">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Panic Board</h2>
          <span className={styles.windowBadge}>
            Next {panicDays} {panicDays === 1 ? 'day' : 'days'}
          </span>
        </div>
        <span className={`${styles.countBadge} ${displayEmails.length > 0 ? styles.countActive : ''}`}>
          {displayEmails.length} {displayEmails.length === 1 ? 'task' : 'tasks'}
        </span>
      </header>

      {displayEmails.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>All clear</p>
          <p className={styles.emptySubtitle}>
            No urgent deadlines in your {panicDays}-{panicDays === 1 ? 'day' : 'day'} panic window.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {displayEmails.map(email => {
            const countdown = getCountdownLabel(email.extracted_deadline)
            const isOverdue = countdown?.isPast || email.tab === 'MISSED'

            return (
              <li
                key={email.email_id}
                className={`${styles.card} ${isOverdue ? styles.overdueCard : ''}`}
                onClick={() => onEmailClick?.(email)}
                onContextMenu={ev => onContextMenu?.(ev, email)}
              >
                <div className={styles.cardMain}>
                  <div className={styles.cardHeader}>
                    <span className={styles.subject} title={email.subject || '(No subject)'}>
                      {email.subject || '(No subject)'}
                    </span>
                    {countdown && (
                      <span className={`${styles.countdown} ${isOverdue ? styles.overdueBadge : styles.urgentBadge}`}>
                        {isOverdue ? 'Overdue ' : 'Due '}{countdown.distance.replace('about ', '')}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardMeta}>
                    <span className={styles.sender}>{email.sender || 'Unknown'}</span>
                    {email.category && (
                      <span className={styles.category}>{email.category}</span>
                    )}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    title="Mark Done"
                    onClick={ev => {
                      ev.stopPropagation()
                      onMarkDone?.(email.email_id)
                    }}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionSecondary}`}
                    title="Set Deadline"
                    onClick={ev => {
                      ev.stopPropagation()
                      onOpenDeadline?.(email)
                    }}
                  >
                    Edit
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
