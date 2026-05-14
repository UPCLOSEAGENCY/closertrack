import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import styles from './Pricing.module.css';

const FEATURES = [
  '✅ Suivi des commissions & récurrences',
  '✅ Pipeline Kanban avec drag & drop',
  '✅ Agenda Google Calendar intégré',
  '✅ Génération de factures PDF',
  '✅ Webhook Calendly — leads automatiques',
  '✅ Multi-missions & multi-clients',
  '✅ Données cloud sécurisées',
];

export default function Pricing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://vjrdyzohkslhtoddilag.supabase.co/functions/v1/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, userId: user?.id }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.badge}>CloserTrack Pro</div>
        <h1 className={styles.title}>L'outil qui te fait<br />gagner du temps et de l'argent</h1>
        <p className={styles.subtitle}>Tout ce dont un closer professionnel a besoin. En un seul endroit.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTop}>
          <div className={styles.price}>
            <span className={styles.amount}>39€</span>
            <span className={styles.period}>/mois</span>
          </div>
          <div className={styles.priceNote}>Sans engagement · Annule quand tu veux</div>
        </div>

        <ul className={styles.features}>
          {FEATURES.map((f, i) => (
            <li key={i} className={styles.feature}>{f}</li>
          ))}
        </ul>

        <button
          className={styles.cta}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Redirection...' : 'Démarrer maintenant →'}
        </button>

        <p className={styles.guarantee}>
          🔒 Paiement sécurisé par Stripe · Données chiffrées
        </p>
      </div>
    </div>
  );
}
