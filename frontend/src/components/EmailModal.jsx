import { useState } from 'react'
import './EmailModal.css'
import { TAB_COLORS } from '../constants'
import { formatDate } from '../utils'
import EmailBody from './EmailBody'

function FullscreenIcon({ expanded }) {
  return expanded ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
    </svg>
  )
}

export default function EmailModal({ email, onClose, onContextMenu, onMarkDone }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${isFullscreen ? ' modal--fullscreen' : ''}`}
        onClick={e => e.stopPropagation()}
        onContextMenu={onContextMenu}
      >
        <div className="modal-tools">
          <button
            type="button"
            className="modal-tool"
            onClick={() => setIsFullscreen(current => !current)}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
            aria-pressed={isFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
          >
            <FullscreenIcon expanded={isFullscreen} />
          </button>
          <button
            type="button"
            className="modal-tool"
            onClick={onClose}
            aria-label="Close email"
            title="Close email"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
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
        <EmailBody html={email.body_html} text={email.body} />
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
