import { TAB_COLORS } from '../constants'
import { formatDate, senderInitial } from '../utils'
import ReviewSummary from './ReviewSummary'

export default function EmailCard({
  email,
  onClick,
  onContextMenu,
  onMarkDone,
  onConfirm,
  onDismiss,
  onOpenDeadline,
  onRecover,
}) {
  const stopAndRun = (event, action) => {
    event.stopPropagation()
    action()
  }

  return (
    <li className="card" onClick={onClick} onContextMenu={onContextMenu}>
      <div className="avatar">{senderInitial(email.sender)}</div>
      <div className="card-body">
        <div className="card-top">
          <span className="subject">{email.subject || '(no subject)'}</span>
          <span
            className="tab-badge"
            style={{ background: TAB_COLORS[email.tab] ?? '#6b7280' }}
          >
            {email.tab.replace('_', ' ')}
          </span>
        </div>
        <div className="sender">{email.sender}</div>
        <div className="card-meta">
          <span className="category-badge">{email.category}</span>
          {email.extracted_deadline && (
            <span className="deadline">Due: {formatDate(email.extracted_deadline)}</span>
          )}
          {email.tab === 'FILTERED' && (
            <button className="done-btn" onClick={event => stopAndRun(event, onMarkDone)}>
              Mark Done
            </button>
          )}
          {email.tab === 'BIN' && (
            <button className="done-btn" onClick={event => stopAndRun(event, onRecover)}>
              Recover
            </button>
          )}
        </div>
        {email.tab === 'NEEDS_REVIEW' && (
          <>
            <ReviewSummary email={email} />
            <div className="review-actions">
              {email.ai_deadline && (
                <button className="confirm-btn" onClick={event => stopAndRun(event, onConfirm)}>
                  Confirm deadline
                </button>
              )}
              <button className="edit-deadline-btn" onClick={event => stopAndRun(event, onOpenDeadline)}>
                {email.ai_deadline ? 'Edit deadline' : 'Set deadline'}
              </button>
              <button className="dismiss-btn" onClick={event => stopAndRun(event, onDismiss)}>
                No deadline
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  )
}
