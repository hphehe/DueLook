import HoverMenu from './HoverMenu'
import styles from './SettingsPanel.module.css'

const PANIC_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '2 Days', value: 2 },
  { label: '3 Days', value: 3 },
  { label: '5 Days', value: 5 },
  { label: '7 Days', value: 7 },
  { label: '10 Days', value: 10 },
  { label: '14 Days', value: 14 },
]

export default function SettingsPanel({
  user,
  syncing,
  statusMessage,
  error,
  theme,
  panicDays = 2,
  onBack,
  onSyncGmail,
  onThemeChange,
  onPanicDaysChange,
}) {
  const hasGmail = user.has_gmail ?? false
  const darkMode = theme === 'dark'
  const selectedPanicOption = PANIC_OPTIONS.find(o => o.value === panicDays) || PANIC_OPTIONS[1]

  return (
    <main className={styles.settings} aria-labelledby="settings-title">
      <header className={styles.heading}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          <span aria-hidden="true">&larr;</span> Back to inbox
        </button>
        <div>
          <h2 id="settings-title">Settings</h2>
          <p>Manage your account and email connection.</p>
        </div>
      </header>

      {statusMessage && <div className="banner success" role="status">{statusMessage}</div>}
      {error && <div className="banner error" role="alert">{error}</div>}

      <section className={`${styles.section} ${styles.preference}`}>
        <div>
          <h3>Dark mode</h3>
          <p>Use a darker color scheme throughout DueLook.</p>
        </div>
        <button
          type="button"
          className={styles.switch}
          role="switch"
          aria-label="Dark mode"
          aria-checked={darkMode}
          onClick={() => onThemeChange(darkMode ? 'light' : 'dark')}
        >
          <span aria-hidden="true" />
        </button>
      </section>

      <section className={`${styles.section} ${styles.preference}`}>
        <div>
          <h3>Panic Window</h3>
          <p>Tasks with deadlines within this timeframe appear on the Panic Board.</p>
        </div>
        <HoverMenu
          label={`Panic Window: ${selectedPanicOption.label}`}
          align="right"
          triggerClassName={styles.panicTrigger}
          panelClassName={styles.panicDropdown}
          trigger={(
            <>
              <span>{selectedPanicOption.label}</span>
              <span className={styles.chevron} aria-hidden="true">&#9662;</span>
            </>
          )}
        >
          {close => PANIC_OPTIONS.map(option => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={option.value === panicDays}
              className={styles.panicOption}
              key={option.value}
              onClick={() => {
                onPanicDaysChange?.(option.value)
                close()
              }}
            >
              <span>{option.label}</span>
              {option.value === panicDays && <span aria-hidden="true">&#10003;</span>}
            </button>
          ))}
        </HoverMenu>
      </section>

      <section className={styles.section} aria-labelledby="account-heading">
        <h3 id="account-heading">Account</h3>
        <p className={styles.accountEmail}>{user.email}</p>
      </section>

      <section className={styles.section} aria-labelledby="connection-heading">
        <div className={styles.connectionHeading}>
          <div>
            <h3 id="connection-heading">Email connection</h3>
            <p>
              {hasGmail
                ? 'DueLook imports recent emails from your primary Gmail inbox.'
                : 'This account uses .eml file imports and is not connected to Gmail.'}
            </p>
          </div>
          <span className={hasGmail ? styles.connected : styles.manual}>
            {hasGmail ? 'Gmail connected' : 'Manual import'}
          </span>
        </div>
        {hasGmail && (
          <button type="button" className={styles.syncButton} onClick={onSyncGmail} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Gmail now'}
          </button>
        )}
      </section>
    </main>
  )
}

