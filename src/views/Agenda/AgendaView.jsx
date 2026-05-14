import { useEffect, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://closertrack.vercel.app/agenda';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: SCOPES,
    prompt: 'consent',
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

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const COLORS = ['#5ba3f5','#e9ab3a','#2dd4a0','#a78bfa','#f97316','#f43f5e','#06b6d4'];

export default function AgendaView() {
  const [token, setToken]     = useState(() => localStorage.getItem('gcal_token'));
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const t = params.get('access_token');
      if (t) { localStorage.setItem('gcal_token', t); setToken(t); window.history.replaceState({}, '', '/agenda'); }
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

  const openEdit = (evt) => {
    setSelectedEvent(evt);
    setEditForm({
      summary: evt.summary ?? '',
      location: evt.location ?? '',
      description: evt.description ?? '',
      startDate: evt.start?.dateTime ? evt.start.dateTime.slice(0, 16) : '',
      endDate: evt.end?.dateTime ? evt.end.dateTime.slice(0, 16) : '',
    });
    setEditing(true);
  };

  const saveEvent = async () => {
    setSaving(true);
    const patch = {
      summary: editForm.summary,
      location: editForm.location,
      description: editForm.description,
    };
    if (editForm.startDate) patch.start = { dateTime: new Date(editForm.startDate).toISOString(), timeZone: 'Europe/Paris' };
    if (editForm.endDate) patch.end = { dateTime: new Date(editForm.endDate).toISOString(), timeZone: 'Europe/Paris' };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${selectedEvent.id}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }
    );
    if (res.ok) {
      await fetchEvents(token);
      setEditing(false);
      setSelectedEvent(null);
    }
    setSaving(false);
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Supprimer cet événement Google Calendar ?')) return;
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setSelectedEvent(null);
    setEditing(false);
  };

  const connect    = () => { window.location.href = getAuthUrl(); };
  const disconnect = () => { localStorage.removeItem('gcal_token'); setToken(null); setEvents([]); };
  const prevWeek   = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek   = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };

  const weekDays = getWeekDays(weekBase);
  const today = new Date().toDateString();

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return events.filter(evt => (evt.start?.dateTime ?? evt.start?.date ?? '').startsWith(dateStr));
  };

  const getEventTop    = (evt) => { if (!evt.start?.dateTime) return 0; const d = new Date(evt.start.dateTime); return Math.max(0, (d.getHours() + d.getMinutes() / 60 - 7) * 60); };
  const getEventHeight = (evt) => { if (!evt.start?.dateTime || !evt.end?.dateTime) return 30; return Math.max(24, (new Date(evt.end.dateTime) - new Date(evt.start.dateTime)) / 60000); };

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
                <button className={styles.todayBtn} onClick={() => setWeekBase(new Date())}>Aujourd'hui</button>
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
          <p className={styles.emptyDesc}>Visualise et modifie tes RDV directement depuis CloserTrack.</p>
          <button className={styles.primaryBtn} onClick={connect}>Connecter maintenant</button>
        </div>
      )}

      {token && loading && <div className={styles.loading}>Chargement…</div>}

      {token && !loading && (
        <div className={styles.calendarWrap}>
          <div className={styles.calHeader}>
            <div className={styles.timeGutter} />
            {weekDays.map((day, i) => (
              <div key={i} className={`${styles.dayHeader} ${day.toDateString() === today ? styles.dayHeaderToday : ''}`}>
                <span className={styles.dayName}>{DAYS_FR[day.getDay()]}</span>
                <span className={`${styles.dayNum} ${day.toDateString() === today ? styles.dayNumToday : ''}`}>{day.getDate()}</span>
              </div>
            ))}
          </div>
          <div className={styles.calBody}>
            <div className={styles.timeGutter}>
              {HOURS.map(h => <div key={h} className={styles.timeSlot}>{String(h).padStart(2,'0')}:00</div>)}
            </div>
            {weekDays.map((day, di) => (
              <div key={di} className={`${styles.dayCol} ${day.toDateString() === today ? styles.dayColToday : ''}`}>
                {HOURS.map(h => <div key={h} className={styles.hourCell} />)}
                {getEventsForDay(day).map((evt, ei) => (
                  <div
                    key={evt.id}
                    className={styles.event}
                    style={{ top: `${getEventTop(evt)}px`, height: `${getEventHeight(evt)}px`, background: COLORS[ei % COLORS.length] }}
                    onClick={() => openEdit(evt)}
                  >
                    <div className={styles.eventTitle}>{evt.summary ?? '(Sans titre)'}</div>
                    {evt.start?.dateTime && <div className={styles.eventTime}>{new Date(evt.start.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && selectedEvent && (
        <div className={styles.modal} onClick={() => { setEditing(false); setSelectedEvent(null); }}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Modifier l'événement</h3>

            <div className={styles.editField}>
              <label className={styles.editLabel}>Titre</label>
              <input className={styles.editInput} value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} />
            </div>
            <div className={styles.editRow}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Début</label>
                <input className={styles.editInput} type="datetime-local" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Fin</label>
                <input className={styles.editInput} type="datetime-local" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Lieu</label>
              <input className={styles.editInput} value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Lien Zoom, adresse..." />
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Notes</label>
              <textarea className={styles.editTextarea} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.dangerBtn} onClick={() => deleteEvent(selectedEvent.id)}>Supprimer</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className={styles.ghostBtn} onClick={() => { setEditing(false); setSelectedEvent(null); }}>Annuler</button>
                <button className={styles.primaryBtn} onClick={saveEvent} disabled={saving}>{saving ? 'Sauvegarde...' : '✓ Sauvegarder'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
