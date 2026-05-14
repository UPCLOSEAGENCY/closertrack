import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './SettingsView.module.css';

const FUNCTION_URL = 'https://vjrdyzohkslhtoddilag.supabase.co/functions/v1/calendly-webhook';

export default function SettingsView({ missions = [] }) {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('webhook_token').eq('id', user.id).single()
      .then(({ data }) => { if (data) setToken(data.webhook_token); });
  }, [user]);

  const buildUrl = (missionId) =>
    missionId
      ? `${FUNCTION_URL}?token=${token}&mission=${missionId}`
      : `${FUNCTION_URL}?token=${token}`;

  const copy = (key, url) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeMissions = missions.filter((m) => m.status === 'active');

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.eyebrow}>Configuration</div>
        <h1 className={styles.title}>Paramètres</h1>
        <p className={styles.subtitle}>Connecte tes outils à CloserTrack</p>
      </header>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>📅</div>
          <div>
            <h2 className={styles.cardTitle}>Connexion Calendly</h2>
            <p className={styles.cardDesc}>Chaque mission a son propre webhook Calendly. Les leads bookés via le lien d'une mission atterrissent directement dans son pipeline.</p>
          </div>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span>Va sur <strong>calendly.com</strong> → Intégrations → Webhooks</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span>Crée un <strong>webhook par mission</strong> et colle l'URL correspondante</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span>Coche l'événement <strong>"invitee.created"</strong> et sauvegarde</span>
          </div>
        </div>

        <div className={styles.urlSection}>
          <div className={styles.urlSectionLabel}>Webhook général (sans mission)</div>
          <div className={styles.urlBox}>
            <div className={styles.urlRow}>
              <code className={styles.url}>{token ? buildUrl(null) : 'Chargement...'}</code>
              <button
                className={`${styles.copyBtn} ${copiedKey === 'global' ? styles.copied : ''}`}
                onClick={() => copy('global', buildUrl(null))}
                disabled={!token}
              >
                {copiedKey === 'global' ? '✓ Copié !' : 'Copier'}
              </button>
            </div>
            <p className={styles.urlNote}>Les leads arrivent dans la vue "Tous" sans mission assignée.</p>
          </div>
        </div>

        <div className={styles.urlSection}>
          <div className={styles.urlSectionLabel}>Webhooks par mission active</div>
          {activeMissions.length === 0 && (
            <div className={styles.emptyMissions}>
              Aucune mission active. Crée une mission pour obtenir son webhook dédié.
            </div>
          )}
          {activeMissions.map((m) => (
            <div key={m.id} className={styles.urlBox}>
              <div className={styles.missionHeader}>
                <span className={styles.missionDot} />
                <span className={styles.missionName}>{m.name}</span>
              </div>
              <div className={styles.urlRow}>
                <code className={styles.url}>{token ? buildUrl(m.id) : 'Chargement...'}</code>
                <button
                  className={`${styles.copyBtn} ${copiedKey === m.id ? styles.copied : ''}`}
                  onClick={() => copy(m.id, buildUrl(m.id))}
                  disabled={!token}
                >
                  {copiedKey === m.id ? '✓ Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className={styles.urlNote}>⚠️ Ne partage jamais ces URLs — elles sont uniques à ton compte.</p>
      </div>
    </div>
  );
}
