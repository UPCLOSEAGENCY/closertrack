import { formatMonthLong, formatMoney } from '../lib/format.js';
import styles from './MonthDetail.module.css';

export default function MonthDetail({ data, missions, sales, onOpenMission }) {
  const missionMap = new Map(missions.map((m) => [m.id, m]));
  const saleMap = new Map(sales.map((s) => [s.id, s]));

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Détail du mois</div>
          <h2 className={styles.title}>{formatMonthLong(data.month)}</h2>
        </div>
        <div className={styles.totalBlock}>
          <span className={styles.totalLabel}>Total commissions</span>
          <span className={styles.totalValue}>{formatMoney(data.total, { precise: true })}</span>
        </div>
      </header>

      {data.installments.length === 0 ? (
        <div className={styles.empty}>Aucune échéance pour ce mois.</div>
      ) : (
        <ul className={styles.list}>
          {data.installments.map((inst, idx) => {
            const sale = saleMap.get(inst.saleId);
            if (!sale) return null;
            const mission = missionMap.get(sale.missionId);
            return (
              <li className={styles.item} key={`${inst.saleId}-${idx}`}>
                <div className={styles.itemMain}>
                  <button
                    type="button"
                    className={styles.missionTag}
                    onClick={() => mission && onOpenMission(mission.id)}
                  >
                    {mission?.name ?? 'Mission supprimée'}
                  </button>
                  <span className={styles.client}>{sale.client}</span>
                </div>

                <div className={styles.itemMeta}>
                  <span className={styles.installment}>
                    Échéance {inst.index}/{inst.total}
                  </span>
                  <span className={styles.amount}>
                    {formatMoney(inst.amount, { precise: true })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
