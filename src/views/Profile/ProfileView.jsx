import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './ProfileView.module.css';

export default function ProfileView() {
  const { user } = useAuth();
  const [closer, setCloser] = useState({ name: '', email: '', address: '', siret: '', iban: '', phone: '', company: '' });
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('closer_info').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (error) {
          setError("Impossible de charger ton profil.");
        } else if (data?.closer_info) {
          const merged = { name: '', email: '', address: '', siret: '', iban: '', phone: '', company: '', ...data.closer_info };
          setCloser(merged);
          setInitial(merged);
        } else {
          setInitial(closer);
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const dirty = initial && JSON.stringify(closer) !== JSON.stringify(initial);

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    setError('');
    const { error } = await supabase.from('profiles').update({ closer_info: closer }).eq('id', user.id);
    setSaving(false);
    if (error) {
      setError("Erreur lors de la sauvegarde. Réessaie.");
      return;
    }
    setInitial(closer);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const initials = (closer.name || closer.email || user?.email || '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement du profil…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Compte</div>
          <h1 className={styles.title}>Profil</h1>
          <p className={styles.subtitle}>
            Les informations de ton entreprise apparaîtront sur tes factures.
          </p>
        </div>
        <div className={styles.headActions}>
          {saved && <span className={styles.savedTag}>✓ Sauvegardé</span>}
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving ? 'Sauvegarde…' : dirty ? 'Sauvegarder' : 'À jour'}
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBar}>{error}</div>}

      <div className={styles.identityCard}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.identityInfo}>
          <span className={styles.identityName}>{closer.name || 'Sans nom'}</span>
          <span className={styles.identityEmail}>{user?.email}</span>
        </div>
        <div className={styles.identityMeta}>
          <span className={styles.metaLabel}>Compte créé</span>
          <span className={styles.metaValue}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <Section title="Identité" icon="◆">
          <Field
            label="Nom complet *"
            value={closer.name}
            onChange={(v) => setCloser({ ...closer, name: v })}
            placeholder="Jean Dupont"
          />
          <Field
            label="Nom de l'entreprise"
            value={closer.company}
            onChange={(v) => setCloser({ ...closer, company: v })}
            placeholder="UP CLOSE Agency"
          />
          <Field
            label="Email de contact *"
            value={closer.email}
            onChange={(v) => setCloser({ ...closer, email: v })}
            placeholder="jean@email.com"
            type="email"
          />
          <Field
            label="Téléphone"
            value={closer.phone}
            onChange={(v) => setCloser({ ...closer, phone: v })}
            placeholder="+33 6 ..."
          />
        </Section>

        <Section title="Coordonnées" icon="◷">
          <Field
            label="Adresse complète"
            value={closer.address}
            onChange={(v) => setCloser({ ...closer, address: v })}
            placeholder="12 rue de la Paix, 75001 Paris"
            multiline
          />
        </Section>

        <Section title="Informations légales" icon="◉">
          <Field
            label="SIRET / SIREN"
            value={closer.siret}
            onChange={(v) => setCloser({ ...closer, siret: v })}
            placeholder="123 456 789 00012"
            hint="Visible sur tes factures émises."
          />
          <Field
            label="IBAN bancaire"
            value={closer.iban}
            onChange={(v) => setCloser({ ...closer, iban: v })}
            placeholder="FR76 ...."
            hint="Affiché en pied de facture pour faciliter le règlement."
            monospace
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardIcon}>{icon}</span>
        <h2 className={styles.cardTitle}>{title}</h2>
      </div>
      <div className={styles.fields}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = 'text', multiline = false, monospace = false }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {multiline ? (
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type={type}
          className={`${styles.input} ${monospace ? styles.mono : ''}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
