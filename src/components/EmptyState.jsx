import styles from './EmptyState.module.css';

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.dot} />
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className={styles.btn} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
