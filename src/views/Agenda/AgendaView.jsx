import { useEffect, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT  = 'https://closertrack.vercel.app/agenda';
const SCOPE     = 'https://www.googleapis.com/auth/calendar';

function authURL() {
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: CLIENT_ID, redirect_uri: REDIRECT,
    response_type: 'token', scope: SCOPE, prompt: 'consent select_account'
  });
}

export default function AgendaView() {
  const [email, setEmail] = useState(() => localStorage.getItem('gcal_email'));
  const [token, setToken] = useState(() => localStorage.getItem('gcal_token'));

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;
    const p = new URLSearchParams(hash.replace('#', ''));
    const t = p.get('access_token');
    window.history.replaceState({}, '', window.location.pathname);
    if (!t) return;
    localStorage.setItem('gcal_token', t);
    setToken(t);
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(info => { localStorage.setItem('gcal_email', info.email); setEmail(info.email); });
  }, []);

  const disconnect = () => {
    localStorage.removeItem('gcal_token');
    localStorage.removeItem('gcal_email');
    setToken(null); setEmail(null);
  };

  const calSrc = email
    ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(email)}&ctz=Europe%2FParis&mode=WEEK&showTitle=0&showNav=1&showPrint=0&showTabs=1&showCalendars=1`
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Google Calendar</div>
          <h1 className={styles.title}>Agenda</h1>
        </div>
        <div className={styles.actions}>
          {token && email && (
            <>
              <span className={styles.emailBadge}>{email}</span>
              <button className={styles.ghostBtn} onClick={disconnect}>Déconnecter</button>
            </>
          )}
          {!token && (
            <button className={styles.primaryBtn} onClick={() => window.location.href = authURL()}>
              🔗 Connecter Google Calendar
            </button>
          )}
        </div>
      </header>

      {!token && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <h2 className={styles.emptyTitle}>Connecte ton Google Calendar</h2>
          <button className={styles.primaryBtn} onClick={() => window.location.href = authURL()}>
            Connecter maintenant
          </button>
        </div>
      )}

      {token && calSrc && (
        <div className={styles.iframeWrap}>
          <iframe src={calSrc} className={styles.iframe} frameBorder="0" title="Google Calendar" />
        </div>
      )}
    </div>
  );
}
