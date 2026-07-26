import { TAB_LABELS, getStatusOptions } from '../constants'
import './ContextMenu.css'

export default function ContextMenu({ menu, onSetTab, onOpenDeadline, onDelete }) {
  return (
    <div
      className="ctx-menu"
      style={{ top: menu.y, left: menu.x }}
      onClick={ev => ev.stopPropagation()}
    >
      <div className="ctx-section-label">Change Status</div>
      {getStatusOptions(menu.email.tab).map(tab => (
        <button
          key={tab}
          className="ctx-item"
          onClick={() => onSetTab(menu.email.email_id, tab)}
        >
          {tab === 'FILTERED' && menu.email.tab === 'DONE'
            ? 'Restore'
            : TAB_LABELS[tab]}
        </button>
      ))}
      <div className="ctx-divider" />
      <button className="ctx-item" onClick={() => onOpenDeadline(menu.email)}>
        Set Deadline
      </button>
      <div className="ctx-divider" />
      <button className="ctx-item ctx-delete" onClick={() => onDelete(menu.email.email_id)}>
        Delete
      </button>
    </div>
  )
}
