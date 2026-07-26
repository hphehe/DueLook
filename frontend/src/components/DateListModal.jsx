import React from 'react'
import './DateListModal.css'
import { format } from 'date-fns'
import { formatFloatingDateTime } from '../utils'

export default function DateListModal({ open, date, emails = [], onClose, onEmailClick }) {
  if (!open) return null
  const formattedDate = date ? format(date, 'PPP') : ''

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Deadlines for {formattedDate}</h3>
          <button className="date-modal-close" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          {emails.length === 0 ? (
            <div>No deadlines for this date.</div>
          ) : (
            <ul className="date-email-list">
              {emails.map((e) => (
                <li key={e.record_id || e.email_id} className="date-email-item">
                  <div className="date-email-subject" onClick={() => onEmailClick?.(e)}>
                    {e.subject || '(no subject)'}
                  </div>
                  <div className="date-email-meta">{e.from_name || e.from || ''} • {e.extracted_deadline ? formatFloatingDateTime(e.extracted_deadline) : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
