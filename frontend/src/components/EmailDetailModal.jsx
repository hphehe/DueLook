import { TAB_COLORS } from '../constants'
import { formatDate } from '../utils'

export default function EmailDetailModal({ email, onClose, onContextMenu, onMarkDone }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} onContextMenu={onContextMenu}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <span
            className="tab-badge"
            style={{ background: TAB_COLORS[email.tab] ?? '#6b7280' }}
          >
            {email.tab.replace('_', ' ')}
          </span>
          <span className="category-badge">{email.category}</span>
        </div>
        <h2 className="modal-subject">{email.subject || '(no subject)'}</h2>
        <div className="modal-meta">
          <span>From: {email.sender}</span>
          <span>Received: {formatDate(email.received_date)}</span>
          {email.extracted_deadline && (
            <span className="deadline">Due: {formatDate(email.extracted_deadline)}</span>
          )}
        </div>
        <pre className="modal-body">{email.body}</pre>
        {email.tab === 'FILTERED' && (
          <div className="modal-actions">
            <button type="button" className="done-btn" onClick={onMarkDone}>
              Mark Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
