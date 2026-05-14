import { useEffect, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://closertrack.vercel.app/agenda';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h → 22h
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: SCOPES,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function getWeekDays(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

const COLORS = ['#5ba3f5','#e9ab3a','#2dd4a0','#a78bfa','#f97316','#f43f5e','#06b6d4'];

export default function AgendaView() {
  const [token, setToken]     = useState(() => localStorage.getItem('gcal_token'));
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const t = params.get('access_token');
      if (t) { localStorage.setItem('gcal_token', t); setToken(t); window.history.replaceState({}, '', window.location.pathname); }
    }
  }, []);

  useEffect(() => { if (token) fetchEvents(token); }, [token]);

  const fetchEvents = async (t) => {
    setLoading(true);
    const now = new Date(); now.setDate(now.getDate() - 7);
    const end = new Date(); end.setDate(end.getDate() + 60);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=200`,
      { headers: { Authorization: `Bearer ${t}` } }
    );
    if (res.status === 401) { localStorage.removeItem('gcal_token'); setToken(null); setLoading(false); return; }
    const data = await res.json();
    setEvents(data.items ?? []);
    setLoading(false);
  };

  const connect    = () => { window.location.href = getAuthUrl(); };
  const disconnect = () => { localStorage.removeItem('gcal_token'); setToken(null); setEvents([]); };
  const prevWeek   = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek   = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };
  const goToday    = () => setWeekBase(new Date());

  const weekDays = getWeekDays(weekBase);
  const today = new Date().toDateString();

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return events.filter(evt => {
      const start = evt.start?.dateTime ?? evt.start?.date;
      return start?.startsWith(dateStr);
    });
  };

  const getEventTop = (evt) => {
    if (!evt.start?.dateTime) return 0;
    const d = new Date(evt.start.dateTime);
    const h = d.getHours() + d.getMinutes() / 60;
    return Math.max(0, (h - 7) * 60);
  };

  const getEventHeight = (evt) => {
    if (!evt.start?.dateTime || !evt.end?.dateTime) return 30;
    const start = new Date(evt.start.dateTime);
    const end   = new Date(evt.end.dateTime);
    const diff  = (end - start) / 1000 / 60;
    return Math.max(20, diff);
  };

  const formatHour = (h) => `${String(h).padStart(2,'0')}:00`;

  const monthLabel = weekDays[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headLeft}>
          <div className={styles.eyebrow}>Google Calendar</div>
          <h1 className={styles.title}>Agenda</h1>
        </div>
        <div className={styles.headRight}>
          {token ? (
            <>
              <div className={styles.navRow}>
                <button className={styles.navBtn} onClick={prevWeek}>←</button>
                <button className={styles.todayBtn} onClick={goToday}>Aujourd'hui</button>
                <button className={styles.navBtn} onClick={nextWeek}>→</button>
                <span className={styles.monthLabel}>{monthLabel}</span>
              </div>
              <button className={styles.ghostBtn} onClick={disconnect}>Déconnecter</button>
            </>
          ) : (
            <button className={styles.primaryBtn} onClick={connect}>🔗 Connecter Google Calendar</button>
          )}
        </div>
      </header>

      {!token && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <h2 className={styles.emptyTitle}>Connecte ton Google Calendar</h2>
          <p className={styles.emptyDesc}>Visualise et gère tes RDV directement depuis CloserTrack.</p>
          <button className={styles.primaryBtn} onClick={connect}>Connecter maintenant</button>
        </div>
      )}

      {token && loading && <div className={styles.loading}>Chargement…</div>}

      {token && !loading && (
        <div className={styles.calendarWrap}>
          {/* Header jours */}
          <div className={styles.calHeader}>
            <div className={styles.timeGutter} />
            {weekDays.map((day, i) => (
              <div key={i} className={`${styles.dayHeader} ${day.toDateString() === today ? styles.dayHeaderToday : ''}`}>
                <span className={styles.dayName}>{DAYS_FR[day.getDay()]}</span>
                <span className={`${styles.dayNum} ${day.toDateString() === today ? styles.dayNumToday : ''}`}>
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className={styles.calBody}>
            {/* Colonne heures */}
            <div className={styles.timeGutter}>
              {HOURS.map(h => (
                <div key={h} className={styles.timeSlot}>{formatHour(h)}</div>
              ))}
            </div>

            {/* Colonnes jours */}
            {weekDays.map((day, di) => {
              const dayEvts = getEventsForDay(day);
              return (
                <div key={di} className={`${styles.dayCol} ${day.toDateString() === today ? styles.dayColToday : ''}`}>
                  {HOURS.map(h => <div key={h} className={styles.hourCell} />)}
                  {dayEvts.map((evt, ei) => (
                    <div
                      key={evt.id}
                      className={styles.event}
                      style={{
                        top: `${getEventTop(evt)}px`,
                        height: `${getEventHeight(evt)}px`,
                        background: COLORS[ei % COLORS.length],
                      }}
                      onClick={() => setSelectedEvent(evt)}
                    >
                      <div className={styles.eventTitle}>{evt.summary ?? '(Sans titre)'}</div>
                      {evt.start?.dateTime && (
                        <div className={styles.eventTime}>
                          {new Date(evt.start.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className={styles.modal} onClick={() => setSelectedEvent(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{selectedEvent.summary}</h3>
            {selectedEvent.start?.dateTime && (
              <div className={styles.modalMeta}>
                🗓 {new Date(selectedEvent.start.dateTime).toLocaleString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                {selectedEvent.end?.dateTime && ` → ${new Date(selectedEvent.end.dateTime).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`}
              </div>
            )}
            {selectedEvent.location && <div className={styles.modalMeta}>📍 {selectedEvent.location}</div>}
            {selectedEvent.attendees?.length > 0 && (
              <div className={styles.modalMeta}>👥 {selectedEvent.attendees.map(a => a.email).join(', ')}</div>
            )}
            {selectedEvent.description && <p className={styles.modalDesc}>{selectedEvent.description}</p>}
            <div className={styles.modalActions}>
              <a href={selectedEvent.htmlLink} target="_blank" rel="noreferrer" className={styles.primaryBtn}>
                Ouvrir dans Google Calendar →
              </a>
              <button className={styles.ghostBtn} onClick={() => setSelectedEvent(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
