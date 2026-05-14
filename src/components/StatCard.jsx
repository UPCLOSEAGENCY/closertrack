import styles from './StatCard.module.css';

export default function StatCard({ label, value, caption, tone = 'neutral', icon }) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}
