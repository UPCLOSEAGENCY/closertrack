import styles from './Header.module.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'forecast', label: 'Prévisionnel' },
  { id: 'missions', label: 'Missions' },
];

export default function Header({ view, onChangeView, onNewMission, user, onSignOut }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => onChangeView('dashboard')}
        >
          <span className={styles.logo}>
            <span className={styles.logoMark}>CT</span>
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>CloserTrack</span>
            <span className={styles.brandSub}>Suivi de commissions</span>
          </span>
        </button>

        <nav className={styles.nav}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${view === tab.id ? styles.tabActive : ''}`}
              onClick={() => onChangeView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.right}>
          {user && (
            <span className={styles.userEmail}>{user.email}</span>
          )}
          <button type="button" className={styles.cta} onClick={onNewMission}>
            + Nouvelle mission
          </button>
          {onSignOut && (
            <button type="button" className={styles.signOut} onClick={onSignOut}>
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
