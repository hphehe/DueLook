import './DeadlineModal.css'

export default function DeadlineModal({ email, value, onChange, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal deadline-modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-tools">
          <button
            type="button"
            className="modal-tool"
            onClick={onClose}
            aria-label="Close deadline dialog"
            title="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <h2 className="modal-subject">Set Deadline</h2>
        <div className="deadline-preview">{email.subject || '(no subject)'}</div>
        <input
          type="datetime-local"
          className="deadline-input"
          value={value}
          onChange={ev => onChange(ev.target.value)}
          autoFocus
        />
        <div className="deadline-actions">
          <button className="deadline-clear" onClick={() => onChange('')}>Clear</button>
          <div className="flex-spacer" />
          <button className="deadline-cancel" onClick={onClose}>Cancel</button>
          <button className="deadline-save" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
