import { useMemo } from 'react';
import {
  currentMonth,
  monthRange,
  timelineData,
} from '../lib/commissions.js';
import { formatMonthLong, formatMoney } from '../lib/format.js';
import ProgressBar from '../components/ProgressBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import styles from './Forecast.module.css';

export default function Forecast({ missions, sales }) {
  const start = currentMonth();
  const months = useMemo(() => monthRange(start, 12), [start]);
  const data = useMemo(() => timelineData(sales, months), [sales, months]);
  const grandTotal = data.reduce((acc, d) => acc + d.total, 0);
  const max = Math.max(0, ...data.map((d) => d.total));

  const missionMap = new Map(missions.map((m) => [m.id, m]));
  const saleMap = new Map(sales.map((s) => [s.id, s]));

  const enriched = data.map((d) => {
    const byMission = new Map();
    for (const inst of d.installments) {
      const sale = saleMap.get(inst.saleId);
      if (!sale) continue;
      const id = sale.missionId;
      if (!byMission.has(id)) byMission.set(id, { name: missionMap.get(id)?.name ?? '—', total: 0, count: 0 });
      const entry = byMission.get(id);
      entry.total += inst.amount;
      entry.count += 1;
    }
    return { ...d, byMission: [...byMission.values()].sort((a, b) => b.total - a.total) };
  });

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Prévisionnel</div>
          <h1 className={styles.title}>12 mois glissants</h1>
          <p className={styles.subtitle}>
            Projection à partir de {formatMonthLong(start).toLowerCase()}
          </p>
        </div>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Total prévisionnel</span>
          <span className={styles.totalValue}>{formatMoney(grandTotal)}</span>
        </div>
      </header>

      {sales.length === 0 ? (
        <EmptyState
          title="Pas de prévisionnel"
          description="Ajoute des ventes échelonnées pour visualiser ta projection sur 12 mois."
        />
      ) : (
        <div className={styles.grid}>
          {enriched.map((d) => {
            const pct = max > 0 ? (d.total / max) * 100 : 0;
            return (
              <article key={d.month} className={styles.monthCard}>
                <div className={styles.monthHeader}>
                  <span className={styles.monthName}>{formatMonthLong(d.month)}</span>
                  {d.count > 0 && (
                    <span className={styles.monthCount}>
                      {d.count} {d.count > 1 ? 'éch.' : 'éch.'}
                    </span>
                  )}
                </div>

                <div className={styles.monthAmount}>
                  {d.total > 0 ? formatMoney(d.total, { precise: true }) : '—'}
                </div>

                <ProgressBar value={pct} tone={pct > 0 ? 'gold' : 'gold'} />

                {d.byMission.length > 0 && (
                  <ul className={styles.breakdown}>
                    {d.byMission.map((m, i) => (
                      <li key={i} className={styles.breakdownItem}>
                        <span className={styles.breakdownDot} />
                        <span className={styles.breakdownName}>{m.name}</span>
                        <span className={styles.breakdownAmount}>
                          {formatMoney(m.total, { precise: true })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
