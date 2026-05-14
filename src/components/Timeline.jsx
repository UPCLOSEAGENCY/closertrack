import { formatMoney, formatMonthShort } from '../lib/format.js';
import styles from './Timeline.module.css';

export default function Timeline({ data, selectedMonth, currentMonthValue, onSelect }) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className={styles.wrap}>
      <div className={styles.bars}>
        {data.map((d) => {
          const pct = (d.total / max) * 100;
          const isSelected = d.month === selectedMonth;
          const isCurrent = d.month === currentMonthValue;
          const isPast = d.month < currentMonthValue;
          return (
            <button
              key={d.month}
              type="button"
              className={`${styles.bar} ${isSelected ? styles.barSelected : ''} ${isCurrent ? styles.barCurrent : ''} ${isPast ? styles.barPast : ''}`}
              onClick={() => onSelect(d.month)}
              aria-pressed={isSelected}
            >
              <span className={styles.amount}>
                {d.total > 0 ? formatMoney(d.total) : '—'}
              </span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ height: `${Math.max(d.total > 0 ? 4 : 0, pct)}%` }}
                />
              </span>
              <span className={styles.month}>{formatMonthShort(d.month)}</span>
              {d.count > 0 && <span className={styles.count}>{d.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
