import { useMemo, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import Timeline from '../components/Timeline.jsx';
import MonthDetail from '../components/MonthDetail.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useInstallmentStatuses } from '../hooks/useInstallmentStatuses.js';
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

export default function Dashboard({ missions, sales, leads = [], onOpenMission }) {
  const now = currentMonth();
  const [selectedMonth, setSelectedMonth] = useState(now);

  const months = useMemo(() => monthRange(shiftMonth(now, -2), 12), [now]);
  const saleIds = useMemo(() => sales.map((s) => s.id), [sales]);
  const { getStatus } = useInstallmentStatuses(saleIds);

  const stats = useMemo(() => {
    const installments = allInstallments(sales);
    let thisMonth = 0;
    let upcoming = 0;
    let totalGenerated = 0;
    let paid = 0;
    let cancelled = 0;
    for (const inst of installments) {
      if (inst.month === now) thisMonth += inst.amount;
      if (inst.month > now) upcoming += inst.amount;
      const st = getStatus(inst.saleId, inst.index);
      if (st === 'cancelled') cancelled += inst.amount;
      else if (st === 'paid' || inst.month <= now) paid += inst.amount;
    }
    for (const sale of sales) totalGenerated += totalCommission(sale);
    return { thisMonth, upcoming, totalGenerated, totalSales: sales.length, paid, cancelled };
  }, [sales, now, getStatus]);

  const conversionRate = useMemo(() => {
    if (leads.length === 0) return null;
    const won = leads.filter((l) => l.status === 'gagne').length;
    return Math.round((won / leads.length) * 100);
  }, [leads]);

  const avgPerSale = sales.length > 0 ? stats.totalGenerated / sales.length : null;
  const collectedRate = stats.totalGenerated > 0 ? Math.round((stats.paid / stats.totalGenerated) * 100) : null;

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
            {leads.length > 0 && <> · {leads.length} lead{leads.length > 1 ? 's' : ''}</>}
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

      <section className={styles.statsSecondary}>
        <StatCard
          label="Taux de closing"
          value={conversionRate != null ? `${conversionRate}%` : '—'}
          caption={
            conversionRate != null
              ? `${leads.filter((l) => l.status === 'gagne').length} / ${leads.length} leads gagnés`
              : 'Ajoute des leads dans Pipeline'
          }
          tone="gold"
          icon="%"
        />
        <StatCard
          label="CA moyen / vente"
          value={avgPerSale != null ? formatMoney(avgPerSale, { precise: true }) : '—'}
          caption={avgPerSale != null ? `Moyenne sur ${stats.totalSales} vente${stats.totalSales > 1 ? 's' : ''}` : 'Aucune vente enregistrée'}
          tone="blue"
          icon="x̄"
        />
        <StatCard
          label="Paiements encaissés"
          value={collectedRate != null ? `${collectedRate}%` : '—'}
          caption={
            collectedRate != null
              ? `${formatMoney(stats.paid)} encaissés · ${formatMoney(stats.cancelled)} annulés`
              : 'En attente de ventes'
          }
          tone={stats.cancelled > 0 ? 'danger' : 'green'}
          icon="✓"
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
