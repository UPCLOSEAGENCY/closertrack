import { useEffect, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export default function AgendaView() {
  const [connected, setConnected]   = useState(false);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      const tc = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.access_token) {
            localStorage.setItem('gcal_token', resp.access_token);
            setConnected(true);
            fetchEvents(resp.access_token);
          }
        },
      });
      setTokenClient(tc);
      const saved = localStorage.getItem('gcal_token');
      if (saved) { setConnected(true); fetchEvents(saved); }
    };
    document.body.appendChild(script);
  }, []);

  const fetchEvents = async (token) => {
    setLoading(true);
    const now = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 401) { localStorage.removeItem('gcal_token'); setConnected(false); setLoading(false); return; }
    const data = await res.json();
    setEvents(data.items ?? []);
    setLoading(false);
  };

  const connect = () => tokenClient?.requestAccessToken();

  const disconnect = () => {
    localStorage.removeItem('gcal_token');
    setConnected(false);
    setEvents([]);
  };

  const updateEvent = async (eventId, patch) => {
    const token = localStorage.getItem('gkal_token');
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    fetchEvents(token);
    setSelectedEvent(null);
  };

  const groupByDay = (evts) => {
    const map = new Map();
    for (const evt of evts) {
      const day = (evt.start?.dateTime ?? evt.start?.date ?? '').slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(evt);
    }
    return map;
  };

  const days = groupByDay(events);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Google Calendar</div>
          <h1 className={styles.title}>Agenda</h1>
          <p className={styles.subtitle}>Tes 30 prochains jours</p>
        </div>
        {connected
          ? <button className={styles.ghostBtn} onClick={disconnect}>Déconnecter Google</button>
          : <button className={styles.primaryBtn} onClick={connect}>🔗 Connecter Google Calendar</button>
        }
      </header>

      {!connected && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <h2 className={styles.emptyTitle}>Connecte ton Google Calendar</h2>
          <p className={styles.emptyDesc}>Visualise et modifie tes RDV directement depuis CloserTrack.</p>
          <button className={styles.primaryBtn} onClick={connect}>Connecter maintenant</button>
        </div>
      )}

      {connected && loading && <div className={styles.loading}>Chargement de ton agenda…</div>}

      {connected && !loading && events.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎉</div>
          <h2 className={styles.emptyTitle}>Aucun événement à venir</h2>
        </div>
      )}

      {connected && !loading && (
        <div className={styles.calendar}>
          {[...days.entries()].map(([day, evts]) => (
            <div key={day} className={styles.dayBlock}>
              <div className={styles.dayLabel}>
                {new Date(day + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className={styles.eventList}>
                {evts.map((evt) => {
                  const start = evt.start?.dateTime ? new Date(evt.start.dateTime) : null;
                  const end   = evt.end?.dateTime   ? new Date(evt.end.dateTime)   : null;
                  return (
                    <div key={evt.id} className={styles.eventCard} onClick={() => setSelectedEvent(evt)}>
                      <div className={styles.eventTime}>
                        {start ? start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Journée entière'}
                        {end ? ` → ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                      <div className={styles.eventTitle}>{evt.summary ?? '(Sans titre)'}</div>
                      {evt.location && <div className={styles.eventMeta}>📍 {evt.location}</div>}
                      {evt.attendees?.length > 0 && (
                        <div className={styles.eventMeta}>👥 {evt.attendees.slice(0,3).map(a => a.email).join(', ')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <div className={styles.modal} onClick={() => setSelectedEvent(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{selectedEvent.summary}</h3>
            <div className={styles.modalMeta}>
              {selectedEvent.start?.dateTime && new Date(selectedEvent.start.dateTime).toLocaleString('fr-FR')}
            </div>
            {selectedEvent.description && <p className={styles.modalDesc}>{selectedEvent.description}</p>}
            <a href={selectedEvent.htmlLink} target="_blank" rel="noreferrer" className={styles.primaryBtn}>
              Modifier sur Google Calendar →
            </a>
            <button className={styles.ghostBtn} onClick={() => setSelectedEvent(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
