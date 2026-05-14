import { useEffect, useRef, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://closertrack.vercel.app/agenda';
const SCOPES = 'https://www.googleapis.com/auth/calendar';


function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
const PALETTE = ['#5ba3f5','#2dd4a0','#e9ab3a','#a78bfa','#f97316','#f43f5e','#06b6d4','#10b981'];
const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const HOURS   = Array.from({ length: 16 }, (_, i) => i + 7);

function authUrl() {
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: CLIENT_ID, redirect_uri: REDIRECT_URI,
    response_type: 'token', scope: SCOPES, prompt: 'consent select_account'
  })}`;
}

function weekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0,0,0,0);
  return d;
}
function weekDays(base) {
  const s = weekStart(base);
  return Array.from({length:7}, (_,i) => { const d=new Date(s); d.setDate(s.getDate()+i); return d; });
}

function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)||'null') ?? fallback; } catch { return fallback; } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export default function AgendaView() {
  const [accounts, setAccounts]         = useState(() => load('ct_gcal_accounts', []));
  const [enabledCals, setEnabledCals]   = useState(() => load('ct_gcal_enabled', {}));
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [week, setWeek]                 = useState(new Date());
  const [modal, setModal]               = useState(null); // { event, editForm }
  const [saving, setSaving]             = useState(false);
  const [panel, setPanel]               = useState(false);
  const panelRef                        = useRef();

  // Capture token depuis URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;
    const p = new URLSearchParams(hash.replace('#',''));
    const token = p.get('access_token');
    window.history.replaceState({}, '', '/agenda');
    if (!token) return;
    (async () => {
      const info = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
      const email = info.email;
      const existing = load('ct_gcal_accounts', []);
      const updated = existing.find(a=>a.email===email)
        ? existing.map(a => a.email===email ? {...a, token} : a)
        : [...existing, { email, token, colorIndex: existing.length }];
      save('ct_gcal_accounts', updated);
      setAccounts(updated);
      // Fetch calendars for this account
      await fetchCalendarsForAccount({ email, token, colorIndex: updated.find(a=>a.email===email).colorIndex }, updated);
    })();
  }, []);

  useEffect(() => { if (accounts.length) refresh(accounts, enabledCals); }, []);

  const fetchCalendarsForAccount = async (acct, allAccounts) => {
    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50', { headers: { Authorization: `Bearer ${acct.token}` } });
    if (!res.ok) return;
    const data = await res.json();
    const cals = (data.items||[]).map(c => ({ id: c.id, name: c.summary, color: c.backgroundColor || PALETTE[acct.colorIndex % PALETTE.length], accountEmail: acct.email }));
    // Store calendars per account
    const stored = load('ct_gcal_cals', {});
    stored[acct.email] = cals;
    save('ct_gcal_cals', stored);
    // Enable all by default
    const enabled = load('ct_gcal_enabled', {});
    for (const cal of cals) { if (!(cal.accountEmail+'::'+cal.id in enabled)) enabled[cal.accountEmail+'::'+cal.id] = true; }
    save('ct_gcal_enabled', enabled);
    setEnabledCals({...enabled});
    await refresh(allAccounts, enabled);
  };

  const refresh = async (accts, enabled) => {
    setLoading(true);
    const stored = load('ct_gcal_cals', {});
    const allEvents = [];
    const now = new Date(); now.setDate(now.getDate()-7);
    const end = new Date(); end.setDate(end.getDate()+60);
    for (const acct of accts) {
      const cals = stored[acct.email] || [];
      for (const cal of cals) {
        const key = cal.accountEmail+'::'+cal.id;
        if (!enabled[key] && enabled[key] !== undefined) continue;
        try {
          const r = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`,
            { headers: { Authorization: `Bearer ${acct.token}` } }
          );
          if (!r.ok) continue;
          const d = await r.json();
          allEvents.push(...(d.items||[]).map(e => ({ ...e, _calColor: cal.color, _calName: cal.name, _accountEmail: acct.email, _token: acct.token })));
        } catch {}
      }
    }
    allEvents.sort((a,b)=>(a.start?.dateTime??a.start?.date??'')<(b.start?.dateTime??b.start?.date??'')?-1:1);
    setEvents(allEvents);
    setLoading(false);
  };

  const toggleCal = (key) => {
    const updated = { ...enabledCals, [key]: !enabledCals[key] };
    save('ct_gcal_enabled', updated);
    setEnabledCals(updated);
    refresh(accounts, updated);
  };

  const removeAccount = (email) => {
    const updated = accounts.filter(a=>a.email!==email);
    save('ct_gcal_accounts', updated);
    const stored = load('ct_gcal_cals', {});
    delete stored[email];
    save('ct_gcal_cals', stored);
    setAccounts(updated);
    refresh(updated, enabledCals);
  };

  const openModal = (evt) => setModal({ event: evt, editForm: {
    summary: evt.summary||'',
    location: evt.location||'',
    description: evt.description||'',
    start: evt.start?.dateTime ? evt.start.dateTime.slice(0,16) : '',
    end:   evt.end?.dateTime   ? evt.end.dateTime.slice(0,16)   : '',
  }});

  const saveEvent = async () => {
    setSaving(true);
    const { event, editForm } = modal;
    const patch = { summary: editForm.summary, location: editForm.location, description: editForm.description };
    if (editForm.start) patch.start = { dateTime: new Date(editForm.start).toISOString(), timeZone: 'Europe/Paris' };
    if (editForm.end)   patch.end   = { dateTime: new Date(editForm.end).toISOString(),   timeZone: 'Europe/Paris' };
    const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${event._token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
    });
    if (r.ok) { await refresh(accounts, enabledCals); setModal(null); }
    setSaving(false);
  };

  const deleteEvent = async () => {
    if (!confirm('Supprimer ?')) return;
    const { event } = modal;
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${event._token}` } });
    setEvents(prev => prev.filter(e=>e.id!==event.id));
    setModal(null);
  };

  const days  = weekDays(week);
  const today = new Date().toDateString();
  const allCals = Object.values(load('ct_gcal_cals', {})).flat();
  const activeCals = allCals.filter(c => enabledCals[c.accountEmail+'::'+c.id] !== false).length;

  const getDay  = (date) => { const ds=date.toISOString().slice(0,10); return events.filter(e=>(e.start?.dateTime??e.start?.date??'').startsWith(ds)); };
  const top     = (e) => { if (!e.start?.dateTime) return 0; const d=new Date(e.start.dateTime); return Math.max(0,(d.getHours()+d.getMinutes()/60-7)*64); };
  const height  = (e) => { if (!e.start?.dateTime||!e.end?.dateTime) return 32; return Math.max(28,(new Date(e.end.dateTime)-new Date(e.start.dateTime))/60000/60*64); };
  const fmt     = (dt) => new Date(dt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const month   = days[0].toLocaleDateString('fr-FR',{month:'long',year:'numeric'});

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Google Calendar</div>
          <h1 className={styles.title}>Agenda</h1>
        </div>
        <div className={styles.headRight}>
          {accounts.length > 0 && (
            <>
              <div className={styles.navRow}>
                <button className={styles.navBtn} onClick={()=>{const d=new Date(week);d.setDate(d.getDate()-7);setWeek(d);}}>←</button>
                <button className={styles.todayBtn} onClick={()=>setWeek(new Date())}>Aujourd'hui</button>
                <button className={styles.navBtn} onClick={()=>{const d=new Date(week);d.setDate(d.getDate()+7);setWeek(d);}}>→</button>
                <span className={styles.monthLabel}>{month}</span>
              </div>
              <button className={`${styles.calPickerBtn} ${panel ? styles.calPickerBtnActive : ''}`} onClick={()=>setPanel(!panel)}>
                ☰ {activeCals} agenda{activeCals>1?'s':''}
              </button>
              <button className={styles.addBtn} onClick={()=>window.location.href=authUrl()}>+ Compte</button>
            </>
          )}
        </div>
      </header>

      {/* Panel agendas */}
      {panel && (
        <div className={styles.panel} ref={panelRef}>
          {accounts.map((acct, ai) => {
            const cals = (load('ct_gcal_cals',{})[acct.email]||[]);
            return (
              <div key={acct.email} className={styles.panelAccount}>
                <div className={styles.panelAccountHeader}>
                  <span className={styles.panelAccountDot} style={{background: PALETTE[acct.colorIndex % PALETTE.length]}} />
                  <span className={styles.panelAccountEmail}>{acct.email}</span>
                  <button className={styles.panelRemove} onClick={()=>removeAccount(acct.email)}>Déconnecter</button>
                </div>
                {cals.map(cal => {
                  const key = cal.accountEmail+'::'+cal.id;
                  const on  = enabledCals[key] !== false;
                  return (
                    <label key={key} className={styles.panelCal}>
                      <input type="checkbox" checked={on} onChange={()=>toggleCal(key)} />
                      <span className={styles.panelCalDot} style={{background: cal.color, opacity: on?1:0.35}} />
                      <span className={styles.panelCalName} style={{opacity: on?1:0.4}}>{cal.name}</span>
                    </label>
                  );
                })}
              </div>
            );
          })}
          <button className={styles.panelAddAccount} onClick={()=>{setPanel(false);window.location.href=authUrl();}}>
            + Connecter un autre compte Google
          </button>
        </div>
      )}

      {accounts.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <h2 className={styles.emptyTitle}>Connecte ton Google Calendar</h2>
          <p className={styles.emptyDesc}>Centralise tous tes agendas dans CloserTrack. Crée, modifie et supprime tes RDV directement ici.</p>
          <button className={styles.primaryBtn} onClick={()=>window.location.href=authUrl()}>Connecter un compte Google</button>
        </div>
      )}

      {accounts.length > 0 && loading && <div className={styles.loading}>Synchronisation…</div>}

      {accounts.length > 0 && !loading && (
        <div className={styles.calWrap}>
          <div className={styles.calHead}>
            <div className={styles.gutter} />
            {days.map((day,i) => (
              <div key={i} className={`${styles.dayHead} ${day.toDateString()===today?styles.dayHeadToday:''}`}>
                <span className={styles.dayName}>{DAYS_FR[day.getDay()]}</span>
                <span className={`${styles.dayNum} ${day.toDateString()===today?styles.dayNumToday:''}`}>{day.getDate()}</span>
              </div>
            ))}
          </div>
          <div className={styles.calBody}>
            <div className={styles.gutter}>
              {HOURS.map(h=><div key={h} className={styles.hourLabel}>{String(h).padStart(2,'0')}:00</div>)}
            </div>
            {days.map((day,di) => (
              <div key={di} className={`${styles.dayCol} ${day.toDateString()===today?styles.dayColToday:''}`}>
                {HOURS.map(h=><div key={h} className={styles.cell}/>)}
                {getDay(day).map(evt => (
                  <div key={evt.id} className={styles.evt}
                    style={{ top:`${top(evt)}px`, height:`${height(evt)}px`, background: hexToRgba(evt._calColor||'#5ba3f5', 0.18), borderLeft: `3px solid ${evt._calColor||'#5ba3f5'}` }}
                    onClick={()=>openModal(evt)}
                  >
                    <div className={styles.evtInner}>
                      <div className={styles.evtTitle}>{evt.summary||'(Sans titre)'}</div>
                      {evt.start?.dateTime && <div className={styles.evtTime}>{fmt(evt.start.dateTime)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={()=>setModal(null)}>
          <div className={styles.modalCard} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalColor} style={{background: modal.event._calColor}} />
            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>{modal.event._calName} · {modal.event._accountEmail}</div>
              <h3 className={styles.modalTitle}>Modifier</h3>
              <div className={styles.mField}><label className={styles.mLabel}>Titre</label><input className={styles.mInput} value={modal.editForm.summary} onChange={e=>setModal(m=>({...m,editForm:{...m.editForm,summary:e.target.value}}))} /></div>
              <div className={styles.mRow}>
                <div className={styles.mField}><label className={styles.mLabel}>Début</label><input className={styles.mInput} type="datetime-local" value={modal.editForm.start} onChange={e=>setModal(m=>({...m,editForm:{...m.editForm,start:e.target.value}}))} /></div>
                <div className={styles.mField}><label className={styles.mLabel}>Fin</label><input className={styles.mInput} type="datetime-local" value={modal.editForm.end} onChange={e=>setModal(m=>({...m,editForm:{...m.editForm,end:e.target.value}}))} /></div>
              </div>
              <div className={styles.mField}><label className={styles.mLabel}>Lieu / Lien</label><input className={styles.mInput} value={modal.editForm.location} onChange={e=>setModal(m=>({...m,editForm:{...m.editForm,location:e.target.value}}))} placeholder="Zoom, Meet..." /></div>
              <div className={styles.mField}><label className={styles.mLabel}>Notes</label><textarea className={styles.mTextarea} rows={3} value={modal.editForm.description} onChange={e=>setModal(m=>({...m,editForm:{...m.editForm,description:e.target.value}}))} /></div>
              <div className={styles.mActions}>
                <button className={styles.mDanger} onClick={deleteEvent}>Supprimer</button>
                <div style={{display:'flex',gap:8}}>
                  <button className={styles.mGhost} onClick={()=>setModal(null)}>Annuler</button>
                  <button className={styles.mSave} onClick={saveEvent} disabled={saving}>{saving?'…':'✓ Sauvegarder'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
