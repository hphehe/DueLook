import HoverMenu from './HoverMenu'
import styles from './AccountMenu.module.css'

export default function AccountMenu({ user, onOpenSettings, onLogout }) {
  return (
    <HoverMenu
      label="Open account menu"
      menuLabel="Account"
      className={styles.accountMenu}
      triggerClassName={styles.trigger}
      panelClassName={styles.dropdown}
      trigger={(
        <>
          <span className={styles.avatar} aria-hidden="true">
            {user.email.trim().charAt(0).toUpperCase()}
          </span>
          <span className={styles.email}>{user.email}</span>
          <span className={styles.chevron} aria-hidden="true">&#9662;</span>
        </>
      )}
    >
      {close => (
        <>
          <div className={styles.identity}>{user.email}</div>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              close()
              onOpenSettings()
            }}
          >
            Settings
          </button>
          <div className={styles.separator} role="separator" />
          <button
            type="button"
            className={`${styles.menuItem} ${styles.logoutItem}`}
            role="menuitem"
            onClick={() => {
              close()
              onLogout()
            }}
          >
            Log out
          </button>
        </>
      )}
    </HoverMenu>
  )
}
