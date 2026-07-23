import styles from './SettingsPanel.module.css'

export default function SettingsPanel({
  user,
  syncing,
  statusMessage,
  error,
  theme,
  onBack,
  onSyncGmail,
  onThemeChange,
}) {
  const hasGmail = user.has_gmail ?? false
  const darkMode = theme === 'dark'

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
