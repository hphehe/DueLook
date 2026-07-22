function IconMail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
      <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-accent" />
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-badge">DL</span>
            <div>
              <strong className="footer-brand-name">DueLook</strong>
              <p className="footer-brand-tag">Let us look for what's due</p>
            </div>
          </div>
          <p className="footer-desc">
            An AI-powered email deadline tracker built for students and professionals
          </p>
          <span className="footer-orbital">A NUS Orbital 2026 project</span>
        </div>

        <span className="footer-contact-label">Contact the devs</span>
        <div className="footer-dev-card">
          <strong>Hoang Phuong</strong>
          <a href="mailto:e1528398@u.nus.edu"><IconMail /><span>e1528398@u.nus.edu</span></a>
          <span><IconPhone /><span>+65 8679 9635</span></span>
        </div>
        <div className="footer-dev-card">
          <strong>Nguyen Hoang Thai</strong>
          <a href="mailto:e1528467@u.nus.edu"><IconMail /><span>e1528467@u.nus.edu</span></a>
          <span><IconPhone /><span>+65 9866 8965</span></span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 DueLook</span>
        <span>NUS School of Computing</span>
      </div>
    </footer>
  )
}
