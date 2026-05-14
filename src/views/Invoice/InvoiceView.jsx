import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF.jsx';
import { buildInstallments } from '../../lib/commissions.js';
import { formatMonthLong } from '../../lib/format.js';
import styles from './InvoiceView.module.css';

export default function InvoiceView({ missions, sales }) {
  const [closer, setCloser] = useState({ name: '', email: '', address: '', siret: '', iban: '' });
  const [client, setClient] = useState({ name: '', address: '' });
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('2026-001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('fr-FR'));
  const [ready, setReady] = useState(false);

  const mission = missions.find((m) => m.id === selectedMissionId);
  const missionSales = sales.filter((s) => s.missionId === selectedMissionId);
  const allInstallments = missionSales.flatMap((sale) =>
    buildInstallments(sale).map((inst) => ({
      ...inst,
      monthLabel: formatMonthLong(inst.month),
    }))
  );
  const total = allInstallments.reduce((acc, i) => acc + i.amount, 0);

  const invoice = {
    number: invoiceNumber,
    date: invoiceDate,
    closer,
    client,
    mission: { name: mission?.name ?? '' },
    installments: allInstallments,
    total,
  };

  const canGenerate = closer.name && closer.email && client.name && selectedMissionId && allInstallments.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.eyebrow}>Documents</div>
        <h1 className={styles.title}>Facturation</h1>
        <p className={styles.subtitle}>Génère tes factures PDF par mission</p>
      </header>

      <div className={styles.grid}>
        {/* Colonne gauche — formulaire */}
        <div className={styles.col}>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Tes informations</h2>
            <div className={styles.fields}>
              <Field label="Nom / Raison sociale" value={closer.name} onChange={(v) => setCloser({ ...closer, name: v })} placeholder="Jean Dupont" />
              <Field label="Email" value={closer.email} onChange={(v) => setCloser({ ...closer, email: v })} placeholder="jean@email.com" />
              <Field label="Adresse" value={closer.address} onChange={(v) => setCloser({ ...closer, address: v })} placeholder="12 rue de la Paix, 75001 Paris" />
              <Field label="SIRET (optionnel)" value={closer.siret} onChange={(v) => setCloser({ ...closer, siret: v })} placeholder="123 456 789 00012" />
              <Field label="IBAN (optionnel)" value={closer.iban} onChange={(v) => setCloser({ ...closer, iban: v })} placeholder="FR76 ..." />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Client (donneur d'ordre)</h2>
            <div className={styles.fields}>
              <Field label="Nom / Société" value={client.name} onChange={(v) => setClient({ ...client, name: v })} placeholder="UP CLOSE AGENCY" />
              <Field label="Adresse (optionnel)" value={client.address} onChange={(v) => setClient({ ...client, address: v })} placeholder="Adresse du client" />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Facture</h2>
            <div className={styles.fields}>
              <Field label="Numéro de facture" value={invoiceNumber} onChange={setInvoiceNumber} placeholder="2026-001" />
              <Field label="Date" value={invoiceDate} onChange={setInvoiceDate} placeholder="14/05/2026" />
              <div className={styles.field}>
                <label className={styles.label}>Mission</label>
                <select className={styles.select} value={selectedMissionId} onChange={(e) => setSelectedMissionId(e.target.value)}>
                  <option value="">— Sélectionne une mission —</option>
                  {missions.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite — aperçu */}
        <div className={styles.col}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Aperçu</h2>
            {!canGenerate ? (
              <div className={styles.empty}>Remplis les infos à gauche pour voir l'aperçu</div>
            ) : (
              <>
                <div className={styles.previewHeader}>
                  <span className={styles.previewMission}>{mission?.name}</span>
                  <span className={styles.previewTotal}>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <div className={styles.previewList}>
                  {allInstallments.map((inst, i) => (
                    <div key={i} className={styles.previewRow}>
                      <span>Commission {inst.index}/{inst.total}</span>
                      <span className={styles.previewMonth}>{inst.monthLabel}</span>
                      <span className={styles.previewAmount}>{inst.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.previewFooter}>
                  <span>TVA non applicable — art. 293 B du CGI</span>
                  <span className={styles.previewTotalFinal}>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <PDFDownloadLink
                  document={<InvoicePDF invoice={invoice} />}
                  fileName={`facture-${invoiceNumber}-${mission?.name?.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                  className={styles.downloadBtn}
                >
                  {({ loading }) => loading ? 'Génération...' : '⬇ Télécharger la facture PDF'}
                </PDFDownloadLink>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
