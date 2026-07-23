import { useEffect, useRef, useState } from 'react'

import styles from './HoverMenu.module.css'

const classes = (...names) => names.filter(Boolean).join(' ')

export default function HoverMenu({
  label,
  menuLabel = label,
  trigger,
  children,
  align = 'right',
  className,
  triggerClassName,
  panelClassName,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const closeOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const openFromKeyboard = event => {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    setOpen(true)
    window.requestAnimationFrame(() => {
      rootRef.current?.querySelector('[role^="menuitem"]')?.focus()
    })
  }

  const navigateMenu = event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const items = [...event.currentTarget.querySelectorAll('[role^="menuitem"]')]
    if (!items.length) return
    event.preventDefault()

    const current = items.indexOf(document.activeElement)
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next].focus()
  }

  return (
    <div
      ref={rootRef}
      className={classes(styles.root, className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(current => !current)}
        onKeyDown={openFromKeyboard}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={menuLabel}
          className={classes(styles.panel, align === 'left' && styles.alignLeft, panelClassName)}
          onKeyDown={navigateMenu}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
