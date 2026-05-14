import { useEffect, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://closertrack.vercel.app/agenda';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

function getAuthUrl() {
  const params = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: 'token', scope: SCOPES, prompt: 'consent select_account' });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function getWeekDays(baseDate) {
  const d = new Date(baseDate);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return date; });
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const ACCOUNT_COLORS = ['#5ba3f5', '#2dd4a0', '#e9ab3a', '#a78bfa', '#f97316'];

function loadAccounts() {
  try { return JSON.parse(localStorage.getItem('gcal_accounts') || '[]'); } catch { return []; }
}
function saveAccounts(accounts) { localStorage.setItem('gcal_accounts', JSON.stringify(accounts)); }

export default function AgendaView() {
  const [accounts, setAccounts]     = useState(loadAccounts);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [weekBase, setWeekBase]     = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const t = params.get('access_token');
      if (t) {
        window.history.replaceState({}, '', '/agenda');
        addAccount(t);
      }
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) fetchAllAccounts(accounts);
  }, []);

  const addAccount = async (token) => {
    // Récupère l'email du compte
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } });
    const info = await res.json();
    const email = info.email || 'Compte Google';
    const existing = loadAccounts();
    if (existing.find(a => a.email === email)) {
      // Update le token si déjà connecté
      const updated = existing.map(a => a.email === email ? { ...a, token } : a);
      saveAccounts(updated);
      setAccounts(updated);
      fetchAllAccounts(updated);
    } else {
      const newAccounts = [...existing, { email, token, active: true }];
      saveAccounts(newAccounts);
      setAccounts(newAccounts);
      fetchAllAccounts(newAccounts);
    }
  };

  const fetchAllAccounts = async (accts) => {
    setLoading(true);
    const allEvents = [];
    const now = new Date(); now.setDate(now.getDate() - 7);
    const end = new Date(); end.setDate(end.getDate() + 60);
    for (let ai = 0; ai < accts.length; ai++) {
      const acct = accts[ai];
      if (!acct.active) continue;
      try {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=150`,
          { headers: { Authorization: `Bearer ${acct.token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          allEvents.push(...(data.items ?? []).map(e => ({ ...e, accountEmail: acct.email, accountIndex: ai })));
        }
      } catch {}
    }
    allEvents.sort((a, b) => (a.start?.dateTime ?? a.start?.date ?? '') < (b.start?.dateTime ?? b.start?.date ?? '') ? -1 : 1);
    setEvents(allEvents);
    setLoading(false);
  };

  const toggleAccount = (email) => {
    const updated = accounts.map(a => a.email === email ? { ...a, active: !a.active } : a);
    saveAccounts(updated);
    setAccounts(updated);
    fetchAllAccounts(updated);
  };

  const removeAccount = (email) => {
    const updated = accounts.filter(a => a.email !== email);
    saveAccounts(updated);
    setAccounts(updated);
    fetchAllAccounts(updated);
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
  };

  const saveEvent = async () => {
    setSaving(true);
    const acct = accounts.find(a => a.email === selectedEvent.accountEmail);
    if (!acct) { setSaving(false); return; }
    const patch = { summary: editForm.summary, location: editForm.location, description: editForm.description };
    if (editForm.startDate) patch.start = { dateTime: new Date(editForm.startDate).toISOString(), timeZone: 'Europe/Paris' };
    if (editForm.endDate) patch.end = { dateTime: new Date(editForm.endDate).toISOString(), timeZone: 'Europe/Paris' };
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${selectedEvent.id}`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${acct.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }
    );
    if (res.ok) { await fetchAllAccounts(accounts); setSelectedEvent(null); }
    setSaving(false);
  };

  const deleteEvent = async () => {
    if (!confirm('Supprimer cet événement ?')) return;
    const acct = accounts.find(a => a.email === selectedEvent.accountEmail);
    if (!acct) return;
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${selectedEvent.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${acct.token}` } });
    setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
    setSelectedEvent(null);
  };

  const weekDays = getWeekDays(weekBase);
  const today = new Date().toDateString();
  const getEventsForDay = (date) => { const ds = date.toISOString().slice(0, 10); return events.filter(e => (e.start?.dateTime ?? e.start?.date ?? '').startsWith(ds)); };
  const getEventTop = (evt) => { if (!evt.start?.dateTime) return 0; const d = new Date(evt.start.dateTime); return Math.max(0, (d.getHours() + d.getMinutes() / 60 - 7) * 60); };
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
          <div className={styles.navRow}>
            <button className={styles.navBtn} onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}>←</button>
            <button className={styles.todayBtn} onClick={() => setWeekBase(new Date())}>Aujourd'hui</button>
            <button className={styles.navBtn} onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}>→</button>
            <span className={styles.monthLabel}>{monthLabel}</span>
          </div>
          <button className={styles.calPickerBtn} onClick={() => setShowAccounts(!showAccounts)}>
            👤 {accounts.length} compte{accounts.length > 1 ? 's' : ''}
          </button>
          <button className={styles.newEventBtn} onClick={() => { window.location.href = getAuthUrl(); }}>+ Ajouter un compte</button>
        </div>
      </header>

      {showAccounts && (
        <div className={styles.calPicker}>
          <div className={styles.calPickerTitle}>Comptes Google connectés</div>
          {accounts.length === 0 && <span className={styles.calPickerName} style={{ opacity: 0.4 }}>Aucun compte connecté</span>}
          {accounts.map((acct, i) => (
            <div key={acct.email} className={styles.calPickerItem}>
              <input type="checkbox" checked={acct.active} onChange={() => toggleAccount(acct.email)} />
              <span className={styles.calPickerDot} style={{ background: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length] }} />
              <span className={styles.calPickerName}>{acct.email}</span>
              <button className={styles.removeAccountBtn} onClick={() => removeAccount(acct.email)}>×</button>
            </div>
          ))}
          <button className={styles.addAccountBtn} onClick={() => { setShowAccounts(false); window.location.href = getAuthUrl(); }}>+ Connecter un autre compte Google</button>
        </div>
      )}

      {accounts.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <h2 className={styles.emptyTitle}>Connecte ton Google Calendar</h2>
          <p className={styles.emptyDesc}>Centralise tous tes agendas Google dans CloserTrack. Crée, modifie et supprime tes RDV directement ici.</p>
          <button className={styles.primaryBtn} onClick={() => { window.location.href = getAuthUrl(); }}>Connecter un compte Google</button>
        </div>
      )}

      {accounts.length > 0 && loading && <div className={styles.loading}>Chargement…</div>}

      {accounts.length > 0 && !loading && (
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
                {getEventsForDay(day).map((evt) => (
                  <div key={evt.id} className={styles.event} style={{ top: `${getEventTop(evt)}px`, height: `${getEventHeight(evt)}px`, background: ACCOUNT_COLORS[evt.accountIndex % ACCOUNT_COLORS.length] }} onClick={() => openEdit(evt)}>
                    <div className={styles.eventTitle}>{evt.summary ?? '(Sans titre)'}</div>
                    {evt.start?.dateTime && <div className={styles.eventTime}>{new Date(evt.start.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className={styles.modal} onClick={() => setSelectedEvent(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalAccountBadge} style={{ background: ACCOUNT_COLORS[selectedEvent.accountIndex % ACCOUNT_COLORS.length] + '20', color: ACCOUNT_COLORS[selectedEvent.accountIndex % ACCOUNT_COLORS.length] }}>
              {selectedEvent.accountEmail}
            </div>
            <h3 className={styles.modalTitle}>Modifier l'événement</h3>
            <div className={styles.editField}><label className={styles.editLabel}>Titre</label><input className={styles.editInput} value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} /></div>
            <div className={styles.editRow}>
              <div className={styles.editField}><label className={styles.editLabel}>Début</label><input className={styles.editInput} type="datetime-local" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} /></div>
              <div className={styles.editField}><label className={styles.editLabel}>Fin</label><input className={styles.editInput} type="datetime-local" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
            </div>
            <div className={styles.editField}><label className={styles.editLabel}>Lieu / Lien</label><input className={styles.editInput} value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Zoom, Meet, adresse..." /></div>
            <div className={styles.editField}><label className={styles.editLabel}>Notes</label><textarea className={styles.editTextarea} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} /></div>
            <div className={styles.modalActions}>
              <button className={styles.dangerBtn} onClick={deleteEvent}>Supprimer</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className={styles.ghostBtn} onClick={() => setSelectedEvent(null)}>Annuler</button>
                <button className={styles.primaryBtn} onClick={saveEvent} disabled={saving}>{saving ? 'Sauvegarde...' : '✓ Sauvegarder'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
