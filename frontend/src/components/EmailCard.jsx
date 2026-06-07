import { TAB_COLORS } from '../constants'
import { formatDate, senderInitial } from '../utils'

export default function EmailCard({
  email,
  onClick,
  onContextMenu,
  onMarkDone,
  onConfirm,
  onDismiss,
  onRecover,
}) {
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
          {/* stopPropagation: keep action-button clicks from bubbling to <li onClick> (which opens the detail modal). Same applies below. */}
          {email.tab === 'FILTERED' && (
            <button className="done-btn" onClick={ev => { ev.stopPropagation(); onMarkDone() }}>
              Mark Done
            </button>
          )}
          {email.tab === 'NEEDS_REVIEW' && (
            <>
              <button className="confirm-btn" onClick={ev => { ev.stopPropagation(); onConfirm() }}>
                Confirm
              </button>
              <button className="dismiss-btn" onClick={ev => { ev.stopPropagation(); onDismiss() }}>
                Dismiss
              </button>
            </>
          )}
          {email.tab === 'BIN' && (
            <button className="done-btn" onClick={ev => { ev.stopPropagation(); onRecover() }}>
              Recover
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
