import { useState } from 'react';
import { useLeads } from '../../hooks/useLeads.js';
import styles from './PipelineView.module.css';

const STATUTS = [
  { id: 'appel_reserve', label: 'Appel réservé', color: '#5ba3f5' },
  { id: 'r2',            label: 'R2',            color: '#a78bfa' },
  { id: 'annule',        label: 'Annulé',        color: '#f87171' },
  { id: 'follow_up',     label: 'Follow Up',     color: '#e9ab3a' },
  { id: 'acompte',       label: 'Acompte',       color: '#f97316' },
  { id: 'gagne',         label: 'Gagné',         color: '#2dd4a0' },
  { id: 'perdu',         label: 'Perdu',         color: '#6b7280' },
];

export default function PipelineView({ missions }) {
  const { leads, loading, addLead, updateLead, deleteLead } = useLeads();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', missionId: '', source: 'manuel', status: 'appel_reserve', notes: '', callDate: '' });
  const [dragging, setDragging] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addLead(form);
    setForm({ name: '', phone: '', email: '', missionId: '', source: 'manuel', status: 'appel_reserve', notes: '', callDate: '' });
    setShowForm(false);
  };

  const handleDrop = async (status) => {
    if (!dragging) return;
    await updateLead(dragging, { status });
    setDragging(null);
  };

  if (loading) return <div className={styles.loading}>Chargement…</div>;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Gestion des leads</div>
          <h1 className={styles.title}>Pipeline</h1>
          <p className={styles.subtitle}>{leads.length} lead{leads.length > 1 ? 's' : ''} au total</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
          + Nouveau lead
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nom *</label>
              <input className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Téléphone</label>
              <input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 ..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="lead@email.com" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date du call</label>
              <input className={styles.input} type="datetime-local" value={form.callDate} onChange={(e) => setForm({ ...form, callDate: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Mission</label>
              <select className={styles.select} value={form.missionId} onChange={(e) => setForm({ ...form, missionId: e.target.value })}>
                <option value="">— Aucune —</option>
                {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Source</label>
              <select className={styles.select} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="manuel">Manuel</option>
                <option value="calendly">Calendly</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referral">Référence</option>
              </select>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => setShowForm(false)}>Annuler</button>
            <button type="submit" className={styles.primaryBtn}>Ajouter le lead</button>
          </div>
        </form>
      )}

      <div className={styles.kanban}>
        {STATUTS.map((statut) => {
          const col = leads.filter((l) => l.status === statut.id);
          return (
            <div key={statut.id} className={styles.col} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(statut.id)}>
              <div className={styles.colHeader}>
                <span className={styles.colDot} style={{ background: statut.color }} />
                <span className={styles.colLabel}>{statut.label}</span>
                <span className={styles.colCount}>{col.length}</span>
              </div>
              <div className={styles.colCards}>
                {col.map((lead) => (
                  <div key={lead.id} className={styles.card} draggable onDragStart={() => setDragging(lead.id)}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardName}>{lead.name}</span>
                      <button className={styles.deleteBtn} onClick={() => { if (confirm('Supprimer ce lead ?')) deleteLead(lead.id); }}>×</button>
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
