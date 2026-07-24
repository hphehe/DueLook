import './DeadlineModal.css'

export default function DeadlineModal({ email, value, onChange, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal deadline-modal" onClick={ev => ev.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
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
