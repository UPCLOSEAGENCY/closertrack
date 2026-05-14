import { useMemo } from 'react';
import Badge from '../components/Badge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { allInstallments, currentMonth, totalCommission } from '../lib/commissions.js';
import { formatMoney, formatPercent } from '../lib/format.js';
import styles from './MissionsView.module.css';

export default function MissionsView({ missions, sales, onOpen, onNewMission }) {
  const now = currentMonth();

  const stats = useMemo(() => {
    const map = new Map();
    for (const m of missions) {
      map.set(m.id, { sales: 0, generated: 0, paid: 0, upcoming: 0 });
    }
    for (const sale of sales) {
      const entry = map.get(sale.missionId);
      if (!entry) continue;
      const total = totalCommission(sale);
      entry.sales += 1;
      entry.generated += total;
    }
    for (const inst of allInstallments(sales)) {
      const sale = sales.find((s) => s.id === inst.saleId);
      if (!sale) continue;
      const entry = map.get(sale.missionId);
      if (!entry) continue;
      if (inst.month <= now) entry.paid += inst.amount;
      else entry.upcoming += inst.amount;
    }
    return map;
  }, [missions, sales, now]);

  if (missions.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <div className={styles.eyebrow}>Programmes</div>
            <h1 className={styles.title}>Missions</h1>
          </div>
        </header>
        <EmptyState
          title="Aucune mission"
          description="Crée ta première mission pour commencer à enregistrer des ventes."
          actionLabel="+ Nouvelle mission"
          onAction={onNewMission}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Programmes</div>
          <h1 className={styles.title}>Missions</h1>
          <p className={styles.subtitle}>
            {missions.length} {missions.length > 1 ? 'missions enregistrées' : 'mission enregistrée'}
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={onNewMission}>
          + Nouvelle mission
        </button>
      </header>

      <div className={styles.grid}>
        {missions.map((mission) => {
          const s = stats.get(mission.id);
          const progress = s.generated > 0 ? (s.paid / s.generated) * 100 : 0;

          return (
            <button
              key={mission.id}
              type="button"
              className={styles.card}
              onClick={() => onOpen(mission.id)}
            >
              <div className={styles.cardTop}>
                <div className={styles.nameBlock}>
                  <h3 className={styles.name}>{mission.name}</h3>
                  <Badge tone={mission.status === 'active' ? 'green' : 'muted'} size="sm">
                    {mission.status === 'active' ? 'Active' : 'Terminée'}
                  </Badge>
                </div>
                <div className={styles.rate}>
                  <span className={styles.rateValue}>{formatPercent(mission.defaultRate)}</span>
                  <span className={styles.rateLabel}>par défaut</span>
                </div>
              </div>

              {mission.notes && <p className={styles.notes}>{mission.notes}</p>}

              <div className={styles.statRow}>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>CA généré</span>
                  <span className={styles.statValue}>{formatMoney(s.generated)}</span>
                </div>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Ventes</span>
                  <span className={styles.statValue}>{s.sales}</span>
                </div>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>À venir</span>
                  <span className={`${styles.statValue} ${styles.upcoming}`}>
                    {formatMoney(s.upcoming)}
                  </span>
                </div>
              </div>

              <ProgressBar value={progress} tone="gold" />
              <div className={styles.progressMeta}>
                <span>{formatMoney(s.paid)} encaissées</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
