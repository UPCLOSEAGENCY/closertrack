import { useEffect, useState } from 'react';
import styles from './AgendaView.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT  = 'https://closertrack.vercel.app/agenda';
const SCOPE     = 'https://www.googleapis.com/auth/calendar';
const DAYS      = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const HOURS     = Array.from({length:16},(_,i)=>i+7);

function authURL() {
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id:CLIENT_ID,redirect_uri:REDIRECT,response_type:'token',scope:SCOPE,prompt:'consent select_account'
  });
}
function getMonday(d){const m=new Date(d);m.setDate(m.getDate()-((m.getDay()+6)%7));m.setHours(0,0,0,0);return m;}
function getWeek(b){const m=getMonday(b);return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d;});}

export default function AgendaView() {
  const [token,setToken]   = useState(()=>localStorage.getItem('ag_tok'));
  const [email,setEmail]   = useState(()=>localStorage.getItem('ag_em'));
  const [events,setEvents] = useState([]);
  const [loading,setLoading] = useState(false);
  const [week,setWeek]     = useState(new Date());
  const [modal,setModal]   = useState(null);
  const [saving,setSaving] = useState(false);

  useEffect(()=>{
    const hash=window.location.hash;
    const p=new URLSearchParams(hash.replace('#',''));
    const t=p.get('access_token');
    window.history.replaceState({},'',window.location.pathname);
    fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:'Bearer '+t}})
      .then(r=>r.json()).then(info=>{
        const em=info.email||'';
        localStorage.setItem('ag_tok',t);
        localStorage.setItem('ag_em',em);
        setToken(t);setEmail(em);
        loadEvents(t);
      });
  },[]);

  useEffect(()=>{if(token)loadEvents(token);},[]);

  const loadEvents=async(t)=>{
    setLoading(true);
    const now=new Date();now.setDate(now.getDate()-7);
    const end=new Date();end.setDate(end.getDate()+60);
    const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+now.toISOString()+'&timeMax='+end.toISOString()+'&singleEvents=true&orderBy=startTime&maxResults=200',{headers:{Authorization:'Bearer '+t}});
    const d=await r.json();
    setEvents(d.items||[]);
    setLoading(false);
  };

  const disconnect=()=>{localStorage.removeItem('ag_tok');localStorage.removeItem('ag_em');setToken(null);setEmail(null);setEvents([]);};

  const getColor=e=>{const c=['#4f8ef7','#34c97e','#f5a623','#9b6bfa','#f76b6b','#00bcd4'];return c[Math.abs(e.id?.charCodeAt(0)||0)%c.length];};

  const openModal=e=>setModal({e,f:{summary:e.summary||'',location:e.location||'',description:e.description||'',start:e.start?.dateTime?e.start.dateTime.slice(0,16):'',end:e.end?.dateTime?e.end.dateTime.slice(0,16):''}});

  const saveEvent=async()=>{
    setSaving(true);
    const{e,f}=modal;
    const body={summary:f.summary,location:f.location,description:f.description};
    if(f.start)body.start={dateTime:new Date(f.start).toISOString(),timeZone:'Europe/Paris'};
    if(f.end)body.end={dateTime:new Date(f.end).toISOString(),timeZone:'Europe/Paris'};
    const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/'+e.id,{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.ok){await loadEvents(token);setModal(null);}
    setSaving(false);
  };

  const deleteEvent=async()=>{
    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/'+modal.e.id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});
    setEvents(prev=>prev.filter(e=>e.id!==modal.e.id));setModal(null);
  };

  const days7=getWeek(week);
  const today=new Date().toDateString();
  const byDay=d=>{const ds=d.toISOString().slice(0,10);return events.filter(e=>(e.start?.dateTime??e.start?.date??'').startsWith(ds));};
  const fmt=dt=>new Date(dt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const mth=days7[0].toLocaleDateString('fr-FR',{month:'long',year:'numeric'});

    <div className={styles.page}>
      <header className={styles.head}><div><div className={styles.eyebrow}>Google Calendar</div><h1 className={styles.title}>Agenda</h1></div></header>
      <div className={styles.empty}>
        <div style={{fontSize:44}}>📅</div>
        <h2 className={styles.emptyTitle}>Connecte ton Google Calendar</h2>
        <p className={styles.emptyDesc}>Visualise et modifie tes RDV directement dans CloserTrack.</p>
        <button className={styles.primaryBtn} onClick={()=>window.location.href=authURL()}>Connecter maintenant</button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div><div className={styles.eyebrow}>Google Calendar</div><h1 className={styles.title}>Agenda</h1></div>
        <div className={styles.headRight}>
          <div className={styles.navRow}>
            <button className={styles.navBtn} onClick={()=>{const d=new Date(week);d.setDate(d.getDate()-7);setWeek(d);}}>‹</button>
            <button className={styles.todayBtn} onClick={()=>setWeek(new Date())}>Aujourd'hui</button>
            <button className={styles.navBtn} onClick={()=>{const d=new Date(week);d.setDate(d.getDate()+7);setWeek(d);}}>›</button>
            <span className={styles.monthLabel}>{mth}</span>
          </div>
          <span className={styles.emailBadge}>{email}</span>
          <button className={styles.ghostBtn} onClick={disconnect}>Déconnecter</button>
        </div>
      </header>

      {loading && <div className={styles.loading}>Synchronisation…</div>}

        <div className={styles.calendarWrap}>
          <div className={styles.calHeader}>
            <div className={styles.timeGutter} />
            {days7.map((day,i)=>(
              <div key={i} className={day.toDateString()===today?styles.dayHeader+' '+styles.dayHeaderToday:styles.dayHeader}>
                <span className={styles.dayName}>{DAYS[day.getDay()]}</span>
                <span className={day.toDateString()===today?styles.dayNum+' '+styles.dayNumToday:styles.dayNum}>{day.getDate()}</span>
              </div>
            ))}
          </div>
          <div className={styles.calBody}>
            <div className={styles.timeGutterBody}>
              {HOURS.map(h=><div key={h} className={styles.timeSlot}>{String(h).padStart(2,'0')}:00</div>)}
            </div>
            {days7.map((day,di)=>(
              <div key={di} className={day.toDateString()===today?styles.dayCol+' '+styles.dayColToday:styles.dayCol}>
                {HOURS.map(h=><div key={h} className={styles.hourCell}/>)}
                {byDay(day).map(evt=>{
                  const col=getColor(evt);
                  return (
                    <div key={evt.id} className={styles.event}
                      style={{top:evTop(evt)+'px',height:evHt(evt)+'px',background:rgba(col,0.25),borderLeft:'3px solid '+col}}
                      onClick={()=>openModal(evt)}>
                      <div className={styles.eventTitle}>{evt.summary||'(Sans titre)'}</div>
                      {evt.start?.dateTime&&<div className={styles.eventTime}>{fmt(evt.start.dateTime)}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {modal&&(
        <div className={styles.overlay} onClick={()=>setModal(null)}>
          <div className={styles.modalCard} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalBar} style={{background:getColor(modal.e)}}/>
            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>{email}</div>
              <h3 className={styles.modalTitle}>Modifier</h3>
              <label className={styles.modalLabel}>Titre</label>
              <input className={styles.modalInput} value={modal.f.summary} onChange={e=>setModal(m=>({...m,f:{...m.f,summary:e.target.value}}))}/>
              <div className={styles.modalRow}>
                <div><label className={styles.modalLabel}>Début</label><input className={styles.modalInput} type='datetime-local' value={modal.f.start} onChange={e=>setModal(m=>({...m,f:{...m.f,start:e.target.value}}))}/></div>
                <div><label className={styles.modalLabel}>Fin</label><input className={styles.modalInput} type='datetime-local' value={modal.f.end} onChange={e=>setModal(m=>({...m,f:{...m.f,end:e.target.value}}))}/></div>
              </div>
              <label className={styles.modalLabel}>Lieu</label>
              <input className={styles.modalInput} value={modal.f.location} placeholder='Zoom, Meet...' onChange={e=>setModal(m=>({...m,f:{...m.f,location:e.target.value}}))}/>
              <label className={styles.modalLabel}>Notes</label>
              <textarea className={styles.modalTextarea} rows={3} value={modal.f.description} onChange={e=>setModal(m=>({...m,f:{...m.f,description:e.target.value}}))}/>
              <div className={styles.modalActions}>
                <button className={styles.modalDanger} onClick={deleteEvent}>Supprimer</button>
                <div style={{display:'flex',gap:8}}>
                  <button className={styles.modalGhost} onClick={()=>setModal(null)}>Annuler</button>
                  <button className={styles.modalSave} onClick={saveEvent} disabled={saving}>{saving?'…':'✓ Sauvegarder'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}