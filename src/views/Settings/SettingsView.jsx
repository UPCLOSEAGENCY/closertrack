import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './SettingsView.module.css';

const FUNCTION_URL = 'https://vjrdyzohkslhtoddilag.supabase.co/functions/v1/calendly-webhook';

export default function SettingsView() {
  const { user } = useAuth();
  const [token, setToken]     = useState('');
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('webhook_token').eq('id', user.id).single()
      .then(({ data }) => { if (data) setToken(data.webhook_token); });
  }, [user]);

  const webhookUrl = `${FUNCTION_URL}?token=${token}`;

  const copy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <p className={styles.cardDesc}>Les leads qui bookent sur ton Calendly apparaissent automatiquement dans ton Pipeline.</p>
          </div>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span>Va sur <strong>calendly.com</strong> → Intégrations → Webhooks</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span>Clique <strong>"New Webhook"</strong> et colle l'URL ci-dessous</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span>Coche l'événement <strong>"invitee.created"</strong> et sauvegarde</span>
          </div>
        </div>

        <div className={styles.urlBox}>
          <div className={styles.urlLabel}>Ton URL Webhook unique</div>
          <div className={styles.urlRow}>
            <code className={styles.url}>{token ? webhookUrl : 'Chargement...'}</code>
            <button className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} onClick={copy}>
              {copied ? '✓ Copié !' : 'Copier'}
            </button>
          </div>
          <p className={styles.urlNote}>⚠️ Ne partage jamais cette URL — elle est unique à ton compte.</p>
        </div>
      </div>
    </div>
  );
}
