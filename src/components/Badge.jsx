import styles from './Badge.module.css';

export default function Badge({ children, tone = 'neutral', size = 'md' }) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${styles[`size_${size}`]}`}>
      {children}
    </span>
  );
}
