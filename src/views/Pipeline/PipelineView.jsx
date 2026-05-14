import { useState } from 'react';
import styles from './PipelineView.module.css';

const STATUTS = [
  { id: 'appel_reserve', label: 'Appel réservé', color: '#5ba3f5', bg: 'rgba(91,163,245,0.06)', empty: '📞' },
  { id: 'r2',            label: 'R2',            color: '#a78bfa', bg: 'rgba(167,139,250,0.06)', empty: '🔁' },
  { id: 'annule',        label: 'Annulé',        color: '#f87171', bg: 'rgba(248,113,113,0.05)', empty: '✕' },
  { id: 'follow_up',     label: 'Follow Up',     color: '#e9ab3a', bg: 'rgba(233,171,58,0.06)',  empty: '💬' },
  { id: 'acompte',       label: 'Acompte',       color: '#f97316', bg: 'rgba(249,115,22,0.06)',  empty: '💳' },
  { id: 'gagne',         label: 'Gagné',         color: '#2dd4a0', bg: 'rgba(45,212,160,0.06)',  empty: '🏆' },
  { id: 'perdu',         label: 'Perdu',         color: '#6b7280', bg: 'rgba(107,114,128,0.05)', empty: '○' },
];

export default function PipelineView({ missions, leadsState }) {
  const { leads, loading, addLead, updateLead, deleteLead } = leadsState;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', missionId: '', source: 'manuel', status: 'appel_reserve', callDate: '' });
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addLead(form);
    setForm({ name: '', phone: '', email: '', missionId: '', source: 'manuel', status: 'appel_reserve', callDate: '' });
    setShowForm(false);
  };

  const handleDrop = async (status) => {
    if (!dragging) return;
    await updateLead(dragging, { status });
    setDragging(null); setDragOver(null);
  };

  const gagne = leads.filter(l => l.status === 'gagne').length;
  const total = leads.length;
  const taux = total > 0 ? Math.round((gagne / total) * 100) : 0;

  if (loading) return <div className={styles.loading}>Chargement…</div>;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Gestion des leads</div>
          <h1 className={styles.title}>Pipeline</h1>
          <p className={styles.subtitle}>{total} lead{total > 1 ? 's' : ''} · {taux}% conversion · {gagne} gagné{gagne > 1 ? 's' : ''}</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>+ Nouveau lead</button>
      </header>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}><label className={styles.label}>Nom *</label><input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" required /></div>
            <div className={styles.field}><label className={styles.label}>Téléphone</label><input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 ..." /></div>
            <div className={styles.field}><label className={styles.label}>Email</label><input className={styles.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="lead@email.com" /></div>
            <div className={styles.field}><label className={styles.label}>Date du call</label><input className={styles.input} type="datetime-local" value={form.callDate} onChange={(e) => setForm({ ...form, callDate: e.target.value })} /></div>
            <div className={styles.field}><label className={styles.label}>Mission</label><select className={styles.select} value={form.missionId} onChange={(e) => setForm({ ...form, missionId: e.target.value })}><option value="">— Aucune —</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div className={styles.field}><label className={styles.label}>Source</label><select className={styles.select} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option value="manuel">Manuel</option><option value="calendly">Calendly</option><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="referral">Référence</option></select></div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => setShowForm(false)}>Annuler</button>
            <button type="submit" className={styles.primaryBtn}>Ajouter</button>
          </div>
        </form>
      )}

      <div className={styles.kanban}>
        {STATUTS.map((statut) => {
          const col = leads.filter((l) => l.status === statut.id);
          const isOver = dragOver === statut.id;
          return (
            <div
              key={statut.id}
              className={styles.col}
              style={{
                background: isOver ? statut.color + '12' : statut.bg,
                borderColor: isOver ? statut.color + '60' : 'rgba(255,255,255,0.06)',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(statut.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(statut.id)}
            >
              <div className={styles.colTop} style={{ background: statut.color }} />
              <div className={styles.colHeader}>
                <span className={styles.colDot} style={{ background: statut.color }} />
                <span className={styles.colLabel}>{statut.label}</span>
                <span className={styles.colCount}>{col.length}</span>
              </div>
              <div className={styles.colCards}>
                {col.length === 0 && (
                  <div className={styles.colEmpty}>
                    <span className={styles.colEmptyIcon}>{statut.empty}</span>
                    <span className={styles.colEmptyText}>Aucun lead</span>
                  </div>
                )}
                {col.map((lead) => (
                  <div key={lead.id} className={styles.card} draggable onDragStart={() => setDragging(lead.id)} onDragEnd={() => { setDragging(null); setDragOver(null); }}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardName}>{lead.name}</span>
                      <button className={styles.deleteBtn} onClick={() => { if (confirm('Supprimer ?')) deleteLead(lead.id); }}>×</button>
                    </div>
                    {lead.phone && <div className={styles.cardInfo}>📞 {lead.phone}</div>}
                    {lead.email && <div className={styles.cardInfo}>✉ {lead.email}</div>}
                    {lead.call_date && <div className={styles.cardInfo}>🗓 {new Date(lead.call_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                    <div className={styles.cardFooter}>
                      <span className={styles.cardSource}>{lead.source}</span>
                      <select className={styles.statusSelect} value={lead.status} onChange={(e) => updateLead(lead.id, { status: e.target.value })} onClick={(e) => e.stopPropagation()}>
                        {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
