import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { buildInstallments, totalCommission } from '../../lib/commissions.js';
import { formatMonthLong } from '../../lib/format.js';
import styles from './InvoiceView.module.css';

export default function InvoiceView({ missions, sales }) {
  const { user } = useAuth();
  const printRef = useRef();
  const [closer, setCloser] = useState({ name: '', email: '', address: '', siret: '', iban: '' });
  const [client, setClient] = useState({ name: '', address: '' });
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('2026-001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('fr-FR'));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('closer_info').eq('id', user.id).single()
      .then(({ data }) => { if (data?.closer_info) setCloser(data.closer_info); });
  }, [user]);

  const mission = missions.find((m) => m.id === selectedMissionId);
  const missionSales = sales.filter((s) => s.missionId === selectedMissionId);
  const allInstallments = missionSales.flatMap((sale) =>
    buildInstallments(sale).map((inst) => ({
      ...inst,
      monthLabel: formatMonthLong(inst.month),
      client: sale.client,
      saleAmount: sale.amount,
      saleRate: sale.rate,
    }))
  );
  const total = allInstallments.reduce((acc, i) => acc + i.amount, 0);
  const canGenerate = closer.name && closer.email && client.name && selectedMissionId && allInstallments.length > 0;

  const saveCloserInfo = async () => {
    await supabase.from('profiles').update({ closer_info: closer }).eq('id', user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Facture ${invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: white; padding: 48px; }
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .inv-name { font-size: 24px; font-weight: 800; color: #111; }
        .inv-sub { font-size: 12px; color: #888; margin-top: 4px; }
        .inv-right { text-align: right; }
        .inv-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .inv-num { font-size: 20px; font-weight: 700; color: #111; margin-top: 4px; }
        .inv-date { font-size: 12px; color: #888; margin-top: 2px; }
        hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
        .inv-parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .inv-party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
        .inv-party-name { font-size: 14px; font-weight: 700; color: #111; }
        .inv-party-info { font-size: 12px; color: #555; margin-top: 4px; line-height: 1.6; }
        .inv-mission { margin-bottom: 24px; }
        .inv-mission-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
        .inv-mission-name { font-size: 18px; font-weight: 700; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 10px 12px; background: #f8f8f8; text-align: left; }
        td { padding: 12px; font-size: 13px; color: #333; border-bottom: 1px solid #f0f0f0; }
        .td-right { text-align: right; }
        .inv-total { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .inv-total-box { background: #f8f8f8; border-radius: 8px; padding: 16px 24px; min-width: 240px; }
        .inv-total-row { display: flex; justify-content: space-between; gap: 32px; }
        .inv-total-label { font-size: 14px; font-weight: 700; color: #111; }
        .inv-total-value { font-size: 18px; font-weight: 800; color: #c8892a; }
        .inv-note { font-size: 11px; color: #aaa; margin-top: 8px; }
        .inv-footer { text-align: center; font-size: 11px; color: #bbb; padding-top: 24px; border-top: 1px solid #eee; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const invoiceHTML = canGenerate ? `
    <div class="inv-header">
      <div>
        <div class="inv-name">${closer.name}</div>
        <div class="inv-sub">${closer.address || ''}</div>
        ${closer.siret ? `<div class="inv-sub">SIRET : ${closer.siret}</div>` : ''}
      </div>
      <div class="inv-right">
        <div class="inv-label">Facture</div>
        <div class="inv-num">N° ${invoiceNumber}</div>
        <div class="inv-date">${invoiceDate}</div>
      </div>
    </div>
    <hr/>
    <div class="inv-parties">
      <div>
        <div class="inv-party-label">Émetteur</div>
        <div class="inv-party-name">${closer.name}</div>
        <div class="inv-party-info">${closer.email}<br/>${closer.address || ''}</div>
      </div>
      <div>
        <div class="inv-party-label">Client</div>
        <div class="inv-party-name">${client.name}</div>
        <div class="inv-party-info">${client.address || ''}</div>
      </div>
    </div>
    <div class="inv-mission">
      <div class="inv-mission-label">Mission</div>
      <div class="inv-mission-name">${mission?.name || ''}</div>
    </div>
    <table>
      <thead><tr>
        <th>Client</th>
        <th>Description</th>
        <th>Mois</th>
        <th class="td-right">Montant</th>
      </tr></thead>
      <tbody>
        ${allInstallments.map(inst => `
          <tr>
            <td>${inst.client}</td>
            <td>Commission ${inst.index}/${inst.total}</td>
            <td>${inst.monthLabel}</td>
            <td class="td-right">${inst.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="inv-total">
      <div class="inv-total-box">
        <div class="inv-total-row">
          <span class="inv-total-label">Total HT</span>
          <span class="inv-total-value">${total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div class="inv-note">TVA non applicable — article 293 B du CGI</div>
      </div>
    </div>
    <div class="inv-footer">
      ${closer.name} · ${closer.email} ${closer.iban ? `· IBAN : ${closer.iban}` : ''}
    </div>
  ` : '';

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.eyebrow}>Documents</div>
        <h1 className={styles.title}>Facturation</h1>
        <p className={styles.subtitle}>Génère tes factures PDF par mission</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle}>Tes informations</h2>
              <button className={styles.saveBtn} onClick={saveCloserInfo}>{saved ? '✓ Sauvegardé' : 'Sauvegarder'}</button>
            </div>
            <div className={styles.fields}>
              <Field label="Nom / Raison sociale" value={closer.name} onChange={(v) => setCloser({ ...closer, name: v })} placeholder="Jean Dupont" />
              <Field label="Email" value={closer.email} onChange={(v) => setCloser({ ...closer, email: v })} placeholder="jean@email.com" />
              <Field label="Adresse" value={closer.address} onChange={(v) => setCloser({ ...closer, address: v })} placeholder="12 rue de la Paix, 75001 Paris" />
              <Field label="SIRET (optionnel)" value={closer.siret} onChange={(v) => setCloser({ ...closer, siret: v })} placeholder="123 456 789 00012" />
              <Field label="IBAN (optionnel)" value={closer.iban} onChange={(v) => setCloser({ ...closer, iban: v })} placeholder="FR76 ..." />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Client & Mission</h2>
            <div className={styles.fields}>
              <Field label="Nom du client / Agence" value={client.name} onChange={(v) => setClient({ ...client, name: v })} placeholder="UP CLOSE AGENCY" />
              <Field label="Adresse client (optionnel)" value={client.address} onChange={(v) => setClient({ ...client, address: v })} placeholder="Adresse du client" />
              <Field label="Numéro de facture" value={invoiceNumber} onChange={setInvoiceNumber} placeholder="2026-001" />
              <Field label="Date" value={invoiceDate} onChange={setInvoiceDate} placeholder="14/05/2026" />
              <div className={styles.field}>
                <label className={styles.label}>Mission</label>
                <select className={styles.select} value={selectedMissionId} onChange={(e) => setSelectedMissionId(e.target.value)}>
                  <option value="">— Sélectionne une mission —</option>
                  {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Aperçu facture</h2>
            {!canGenerate ? (
              <div className={styles.empty}>Remplis les infos à gauche pour voir l'aperçu</div>
            ) : (
              <>
                <div className={styles.previewBox}>
                  <div ref={printRef} dangerouslySetInnerHTML={{ __html: invoiceHTML }} />
                </div>
                <button className={styles.downloadBtn} onClick={handlePrint}>
                  🖨️ Télécharger / Imprimer PDF
                </button>
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
