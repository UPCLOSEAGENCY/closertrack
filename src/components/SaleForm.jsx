import { useMemo, useState } from 'react';
import {
  INSTALLMENT_OPTIONS,
  buildInstallments,
  totalCommission,
} from '../lib/commissions.js';
import { formatMoney, formatMonthShort } from '../lib/format.js';
import styles from './Form.module.css';
import previewStyles from './SalePreview.module.css';

export default function SaleForm({ mission, sale, defaultMonth, onSubmit, onCancel }) {
  const [client, setClient] = useState(sale?.client ?? '');
  const [amount, setAmount] = useState(sale?.amount != null ? String(sale.amount) : '');
  const [rate, setRate] = useState(
    sale?.rate != null ? String(sale.rate) : String(mission?.defaultRate ?? 15)
  );
  const [installments, setInstallments] = useState(sale?.installments ?? 1);
  const [saleMonth, setSaleMonth] = useState(sale?.saleMonth ?? defaultMonth);

  const parsedAmount = Number(amount);
  const parsedRate = Number(rate);

  const valid =
    client.trim().length > 0 &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !Number.isNaN(parsedRate) &&
    parsedRate >= 0 &&
    saleMonth;

  const preview = useMemo(() => {
    if (!valid) return null;
    const draft = {
      id: 'preview',
      amount: parsedAmount,
      rate: parsedRate,
      installments,
      saleMonth,
    };
    return {
      total: totalCommission(draft),
      installments: buildInstallments(draft),
    };
  }, [valid, parsedAmount, parsedRate, installments, saleMonth]);

  const monthInputValue = saleMonth || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      client: client.trim(),
      amount: parsedAmount,
      rate: parsedRate,
      installments,
      saleMonth,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Client</label>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Nom du client"
            autoFocus
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Mois de la vente</label>
          <input
            type="month"
            value={monthInputValue}
            onChange={(e) => setSaleMonth(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Montant de la vente</label>
          <div className={styles.suffixWrap}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
            <span className={styles.suffix}>€</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Taux de commission</label>
          <div className={styles.suffixWrap}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
            <span className={styles.suffix}>%</span>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Échéances</label>
        <div className={styles.installmentGroup} role="radiogroup">
          {INSTALLMENT_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              role="radio"
              aria-checked={installments === opt}
              className={`${styles.installmentBtn} ${
                installments === opt ? styles.installmentBtnActive : ''
              }`}
              onClick={() => setInstallments(opt)}
            >
              {opt}x
            </button>
          ))}
        </div>
      </div>

      <div className={previewStyles.preview}>
        <div className={previewStyles.previewHeader}>
          <span className={previewStyles.previewLabel}>Aperçu</span>
          <div className={previewStyles.previewTotal}>
            <span className={previewStyles.previewTotalLabel}>Commission totale</span>
            <span className={previewStyles.previewTotalValue}>
              {preview ? formatMoney(preview.total, { precise: true }) : '—'}
            </span>
          </div>
        </div>

        {preview ? (
          <div className={previewStyles.installmentList}>
            {preview.installments.map((inst) => (
              <div className={previewStyles.installmentItem} key={`${inst.month}-${inst.index}`}>
                <span className={previewStyles.installmentIndex}>
                  {inst.index}/{inst.total}
                </span>
                <span className={previewStyles.installmentMonth}>
                  {formatMonthShort(inst.month)}
                </span>
                <span className={previewStyles.installmentAmount}>
                  {formatMoney(inst.amount, { precise: true })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={previewStyles.empty}>
            Renseigne le montant et le taux pour voir l'aperçu.
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn} onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.primaryBtn} disabled={!valid}>
          {sale ? 'Enregistrer' : 'Ajouter la vente'}
        </button>
      </div>
    </form>
  );
}
