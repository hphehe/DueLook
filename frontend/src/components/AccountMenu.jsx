import { useEffect, useRef, useState } from 'react'

import styles from './AccountMenu.module.css'

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.93V21h-4v-.08a1.7 1.7 0 0 0-1.06-1.52 1.7 1.7 0 0 0-1.88.34L7 19.8l-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.57 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.57 1.7 1.7 0 0 0 10 3V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06A1.7 1.7 0 0 0 19.43 9 1.7 1.7 0 0 0 21 10h.08v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m10 17 5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </svg>
  )
}

export default function AccountMenu({ user, onOpenSettings, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const firstItemRef = useRef(null)
  const closeTimerRef = useRef(null)

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) return
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const openMenu = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const closeMenu = () => {
    clearCloseTimer()
    setOpen(false)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) closeMenu()
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearCloseTimer()
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const handleTriggerKeyDown = (event) => {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    openMenu()
    window.requestAnimationFrame(() => firstItemRef.current?.focus())
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose()
  }

  const choose = (action) => {
    closeMenu()
    action()
  }

  const initial = user.email.trim().charAt(0).toUpperCase()

  return (
    <div
      className={styles.accountMenu}
      ref={rootRef}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onBlur={handleBlur}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.avatar} aria-hidden="true">{initial}</span>
        <span className={styles.email}>{user.email}</span>
        <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
        <span className={styles.srOnly}>Open account menu</span>
      </button>

      {open && (
        <div className={styles.dropdown} role="menu" aria-label="Account">
          <div className={styles.identity}>
            <span>Signed in as</span>
            <strong>{user.email}</strong>
          </div>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            ref={firstItemRef}
            onClick={() => choose(onOpenSettings)}
          >
            <SettingsIcon />
            <span>Settings</span>
          </button>
          <div className={styles.separator} role="separator" />
          <button
            type="button"
            className={`${styles.menuItem} ${styles.logoutItem}`}
            role="menuitem"
            onClick={() => choose(onLogout)}
          >
            <LogoutIcon />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  )
}