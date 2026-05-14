import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Compte créé !</h2>
          <p className={styles.subtitle}>Vérifie ta boîte mail et clique sur le lien de confirmation.</p>
          <button className={styles.ghost} onClick={() => { setSuccess(false); setMode('login'); }}>Retour à la connexion</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>CT</div>
          <div>
            <div className={styles.brandName}>CloserTrack</div>
            <div className={styles.brandTagline}>Tes commissions. Ton business.</div>
          </div>
        </div>
        <div className={styles.toggle}>
          <button className={`${styles.toggleBtn} ${mode === 'login' ? styles.toggleActive : ''}`} onClick={() => { setMode('login'); setError(null); }}>Connexion</button>
          <button className={`${styles.toggleBtn} ${mode === 'signup' ? styles.toggleActive : ''}`} onClick={() => { setMode('signup'); setError(null); }}>Inscription</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" required autoFocus className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={styles.input} />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.primary} disabled={loading}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
