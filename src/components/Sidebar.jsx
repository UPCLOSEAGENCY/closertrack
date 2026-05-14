import styles from './Sidebar.module.css';

const NAV = [
  { id: 'dashboard', icon: '▣', label: 'Dashboard' },
  { id: 'pipeline',  icon: '◈', label: 'Pipeline' },
  { id: 'agenda',    icon: '◷', label: 'Agenda' },
  { id: 'forecast',  icon: '◎', label: 'Prévisionnel' },
  { id: 'missions',  icon: '◆', label: 'Missions' },
  { id: 'invoice',   icon: '◉', label: 'Facturation' },
];

export default function Sidebar({ view, onChangeView, onNewMission, user, onSignOut, pipelineBadge = 0 }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>CT</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>CloserTrack</span>
          <span className={styles.brandTag}>v2.0</span>
        </div>
      </div>

      <button className={styles.newBtn} onClick={onNewMission}>
        <span>+</span> Nouvelle mission
      </button>

      <nav className={styles.nav}>
        <div className={styles.navLabel}>Navigation</div>
        {NAV.map((item) => {
          const showBadge = item.id === 'pipeline' && pipelineBadge > 0;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${view === item.id ? styles.navActive : ''}`}
              onClick={() => onChangeView(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel2}>{item.label}</span>
              {showBadge && (
                <span className={styles.badge} title={`${pipelineBadge} nouveau${pipelineBadge > 1 ? 'x' : ''} lead${pipelineBadge > 1 ? 's' : ''} Calendly`}>
                  {pipelineBadge > 99 ? '99+' : pipelineBadge}
                </span>
              )}
              {view === item.id && !showBadge && <span className={styles.navDot} />}
            </button>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <button
          className={`${styles.navItem} ${view === 'profile' ? styles.navActive : ''}`}
          onClick={() => onChangeView('profile')}
        >
          <span className={styles.navIcon}>◍</span>
          <span className={styles.navLabel2}>Profil</span>
        </button>
        <button
          className={`${styles.navItem} ${view === 'settings' ? styles.navActive : ''}`}
          onClick={() => onChangeView('settings')}
        >
          <span className={styles.navIcon}>⚙</span>
          <span className={styles.navLabel2}>Paramètres</span>
        </button>

        <div className={styles.user}>
          <div className={styles.userAvatar}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email}</span>
            <button className={styles.signOut} onClick={onSignOut}>Déconnexion</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
