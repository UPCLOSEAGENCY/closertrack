import { useMemo } from 'react';
import Badge from '../components/Badge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useInstallmentStatuses } from '../hooks/useInstallmentStatuses.js';
import {
  allInstallments,
  buildInstallments,
  currentMonth,
  totalCommission,
} from '../lib/commissions.js';
import {
  formatMoney,
  formatMonthCompact,
  formatMonthLong,
  formatPercent,
} from '../lib/format.js';
import styles from './MissionDetail.module.css';

const STATUS_LABELS = { pending: 'En attente', paid: 'Payé', cancelled: 'Annulé' };
const STATUS_COLORS = { pending: '#5ba3f5', paid: '#2dd4a0', cancelled: '#f87171' };

export default function MissionDetail({
  mission, sales, onBack, onAddSale, onEditSale, onDeleteSale,
  onEdit, onDelete, onToggleStatus,
}) {
  const now = currentMonth();
  const saleIds = sales.map((s) => s.id);
  const { getStatus, setStatus } = useInstallmentStatuses(saleIds);

  const stats = useMemo(() => {
    let generated = 0, paid = 0, upcoming = 0, cancelled = 0;
    for (const sale of sales) generated += totalCommission(sale);
    for (const inst of allInstallments(sales)) {
      const st = getStatus(inst.saleId, inst.index);
      if (st === 'cancelled') { cancelled += inst.amount; continue; }
      if (st === 'paid' || inst.month <= now) paid += inst.amount;
      else upcoming += inst.amount;
    }
    return { generated, paid, upcoming, cancelled };
  }, [sales, now, getStatus]);

  const orderedSales = useMemo(
    () => [...sales].sort((a, b) => a.saleMonth < b.saleMonth ? 1 : -1),
    [sales]
  );

  const progress = stats.generated > 0 ? (stats.paid / stats.generated) * 100 : 0;

  const cycleStatus = (saleId, index) => {
    const cur = getStatus(saleId, index);
    const next = cur === 'pending' ? 'paid' : cur === 'paid' ? 'cancelled' : 'pending';
    setStatus(saleId, index, next);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>← Missions</button>
        <div className={styles.topActions}>
          <button type="button" className={styles.ghostBtn} onClick={onToggleStatus}>
            {mission.status === 'active' ? 'Marquer terminée' : 'Réactiver'}
          </button>
          <button type="button" className={styles.ghostBtn} onClick={onEdit}>Modifier</button>
          <button type="button" className={styles.dangerBtn} onClick={onDelete}>Supprimer</button>
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <Badge tone={mission.status === 'active' ? 'green' : 'muted'}>
            {mission.status === 'active' ? 'Active' : 'Terminée'}
          </Badge>
          <h1 className={styles.title}>{mission.name}</h1>
          {mission.notes && <p className={styles.notes}>{mission.notes}</p>}
        </div>
        <div className={styles.rateBadge}>
          <span className={styles.rateValue}>{formatPercent(mission.defaultRate)}</span>
          <span className={styles.rateLabel}>commission par défaut</span>
        </div>
      </header>

      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total généré</span>
          <span className={styles.statValue}>{formatMoney(stats.generated)}</span>
          <span className={styles.statSub}>{sales.length} {sales.length > 1 ? 'ventes' : 'vente'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Encaissé</span>
          <span className={`${styles.statValue} ${styles.green}`}>{formatMoney(stats.paid)}</span>
          <span className={styles.statSub}>échéances payées</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>À recevoir</span>
          <span className={`${styles.statValue} ${styles.blue}`}>{formatMoney(stats.upcoming)}</span>
          <span className={styles.statSub}>récurrences à venir</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Annulé</span>
          <span className={`${styles.statValue} ${styles.red}`}>{formatMoney(stats.cancelled)}</span>
          <span className={styles.statSub}>échéances annulées</span>
        </div>
      </section>

      <section className={styles.progressSection}>
        <div className={styles.progressHead}>
          <span className={styles.progressLabel}>Progression encaissement</span>
          <span className={styles.progressValue}>{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} tone="gold" />
      </section>

      <section className={styles.salesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ventes</h2>
          <button type="button" className={styles.primaryBtn} onClick={onAddSale}>+ Nouvelle vente</button>
        </div>

        {orderedSales.length === 0 ? (
          <EmptyState title="Aucune vente" description="Ajoute une première vente pour cette mission." actionLabel="+ Ajouter une vente" onAction={onAddSale} />
        ) : (
          <ul className={styles.saleList}>
            {orderedSales.map((sale) => {
              const total = totalCommission(sale);
              const installments = buildInstallments(sale);
              return (
                <li key={sale.id} className={styles.saleCard}>
                  <div className={styles.saleHeader}>
                    <div className={styles.saleHeadLeft}>
                      <span className={styles.saleClient}>{sale.client}</span>
                      <span className={styles.saleMeta}>
                        {formatMonthLong(sale.saleMonth)} · {formatMoney(sale.amount)} · {formatPercent(sale.rate)}
                      </span>
                    </div>
                    <div className={styles.saleHeadRight}>
                      <Badge tone={sale.installments === 1 ? 'green' : 'blue'} size="sm">{sale.installments}x</Badge>
                      <span className={styles.saleTotal}>{formatMoney(total, { precise: true })}</span>
                      <button type="button" className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); onEditSale(sale); }} title="Modifier">✎</button>
                      <button type="button" className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer cette vente ?')) onDeleteSale(sale.id); }} title="Supprimer">×</button>
                    </div>
                  </div>

                  <div className={styles.installments}>
                    {installments.map((inst, i) => {
                      const st = getStatus(sale.id, inst.index);
                      const isPast = inst.month < now;
                      const isCurrent = inst.month === now;
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`${styles.installment} ${styles[`inst_${st}`]}`}
                          onClick={() => cycleStatus(sale.id, inst.index)}
                          title={`Cliquer pour changer : ${STATUS_LABELS[st]}`}
                        >
                          <span className={styles.installmentMonth}>{formatMonthCompact(inst.month)}</span>
                          <span className={styles.installmentAmount}>{formatMoney(inst.amount, { precise: true })}</span>
                          <span className={styles.installmentStatus} style={{ color: STATUS_COLORS[st] }}>
                            {STATUS_LABELS[st]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {sale.installments > 1 && (
                    <div className={styles.saleFooter}>
                      {installments.filter((inst) => getStatus(sale.id, inst.index) === 'paid').length}/{sale.installments} payées
                      {installments.filter((inst) => getStatus(sale.id, inst.index) === 'cancelled').length > 0 && (
                        <span className={styles.cancelledCount}>
                          · {installments.filter((inst) => getStatus(sale.id, inst.index) === 'cancelled').length} annulée(s)
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
