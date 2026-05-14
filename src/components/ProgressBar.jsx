import styles from './ProgressBar.module.css';

export default function ProgressBar({ value = 0, tone = 'gold' }) {
  return (
    <div className={styles.track}>
      <div
        className={`${styles.fill} ${styles[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
