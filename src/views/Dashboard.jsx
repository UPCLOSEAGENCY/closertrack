import { useMemo, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import Timeline from '../components/Timeline.jsx';
import MonthDetail from '../components/MonthDetail.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  allInstallments,
  currentMonth,
  monthRange,
  shiftMonth,
  timelineData,
  totalCommission,
} from '../lib/commissions.js';
import { formatMonthLong, formatMoney } from '../lib/format.js';
import styles from './Dashboard.module.css';

export default function Dashboard({ missions, sales, onOpenMission }) {
  const now = currentMonth();
  const [selectedMonth, setSelectedMonth] = useState(now);

  const months = useMemo(() => monthRange(shiftMonth(now, -2), 12), [now]);

  const stats = useMemo(() => {
    const installments = allInstallments(sales);
    let thisMonth = 0;
    let upcoming = 0;
    let totalGenerated = 0;
    for (const inst of installments) {
      if (inst.month === now) thisMonth += inst.amount;
      if (inst.month > now) upcoming += inst.amount;
    }
    for (const sale of sales) totalGenerated += totalCommission(sale);
    return { thisMonth, upcoming, totalGenerated, totalSales: sales.length };
  }, [sales, now]);

  const timeline = useMemo(() => timelineData(sales, months), [sales, months]);
  const selectedData = timeline.find((t) => t.month === selectedMonth);

  return (
    <div className={styles.dashboard}>
      <header className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Vue d'ensemble</div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            {formatMonthLong(now)} · {missions.length}{' '}
            {missions.length > 1 ? 'missions' : 'mission'} · {sales.length}{' '}
            {sales.length > 1 ? 'ventes' : 'vente'}
          </p>
        </div>
      </header>

      <section className={styles.stats}>
        <StatCard
          label="Commissions ce mois-ci"
          value={formatMoney(stats.thisMonth)}
          caption={formatMonthLong(now)}
          tone="gold"
          icon="€"
        />
        <StatCard
          label="Récurrences à venir"
          value={formatMoney(stats.upcoming)}
          caption="échéances futures"
          tone="blue"
          icon="↗"
        />
        <StatCard
          label="Total généré"
          value={formatMoney(stats.totalGenerated)}
          caption={`${stats.totalSales} ${stats.totalSales > 1 ? 'ventes closées' : 'vente closée'}`}
          tone="green"
          icon="∑"
        />
      </section>

      {sales.length === 0 ? (
        <EmptyState
          title="Aucune vente enregistrée"
          description="Crée une mission et ajoute ta première vente pour voir tes commissions s'afficher ici."
        />
      ) : (
        <>
          <section className={styles.timelineSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Timeline mensuelle</h2>
              <div className={styles.legend}>
                <span className={styles.legendDot} /> Mois actuel
              </div>
            </div>
            <Timeline
              data={timeline}
              selectedMonth={selectedMonth}
              currentMonthValue={now}
              onSelect={setSelectedMonth}
            />
          </section>

          {selectedData && (
            <MonthDetail
              data={selectedData}
              missions={missions}
              sales={sales}
              onOpenMission={onOpenMission}
            />
          )}
        </>
      )}
    </div>
  );
}
