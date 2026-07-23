import styles from './SettingsPanel.module.css'

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
}

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
      <div className={styles.heading}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          <BackIcon />
          <span>Back to inbox</span>
        </button>
        <div>
          <h2 id="settings-title">Settings</h2>
          <p>Manage your account and email connection.</p>
        </div>
      </div>

      {statusMessage && <div className="banner success" role="status">{statusMessage}</div>}
      {error && <div className="banner error" role="alert">{error}</div>}

      <section className={styles.section} aria-labelledby="appearance-heading">
        <div className={styles.preferenceRow}>
          <div className={styles.preferenceCopy}>
            <h3 id="appearance-heading">Appearance</h3>
            <p>Use a darker color scheme throughout DueLook.</p>
          </div>
          <div className={styles.switchControl}>
            <span>Dark mode</span>
            <button
              type="button"
              className={styles.switch}
              role="switch"
              aria-label="Dark mode"
              aria-checked={darkMode}
              onClick={() => onThemeChange(darkMode ? 'light' : 'dark')}
            >
              <span className={styles.switchKnob} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="account-heading">
        <div className={styles.sectionHeading}>
          <h3 id="account-heading">Account</h3>
          <p>Your current DueLook identity.</p>
        </div>
        <dl className={styles.details}>
          <div><dt>Email address</dt><dd>{user.email}</dd></div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="connection-heading">
        <div className={styles.connectionLayout}>
          <div className={styles.connectionIcon}><MailIcon /></div>
          <div className={styles.connectionCopy}>
            <div className={styles.connectionTitle}>
              <h3 id="connection-heading">Email connection</h3>
              <span className={hasGmail ? styles.connected : styles.manual}>
                {hasGmail ? 'Gmail connected' : 'Manual import'}
              </span>
            </div>
            <p>
              {hasGmail
                ? 'DueLook checks your primary Gmail inbox and imports recent emails automatically.'
                : 'This account uses .eml file imports and is not connected to Gmail.'}
            </p>
          </div>
          {hasGmail && (
            <button type="button" className={styles.syncButton} onClick={onSyncGmail} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync Gmail now'}
            </button>
          )}
        </div>
      </section>
    </main>
  )
}