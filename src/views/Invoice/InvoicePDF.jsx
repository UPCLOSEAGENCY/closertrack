import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 48, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#08080e' },
  brandSub: { fontSize: 10, color: '#888888', marginTop: 4 },
  invoiceLabel: { fontSize: 10, color: '#888888', textAlign: 'right' },
  invoiceNumber: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#08080e', textAlign: 'right', marginTop: 4 },
  invoiceDate: { fontSize: 10, color: '#888888', textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 24 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  colTitle: { fontSize: 9, color: '#888888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  colValue: { fontSize: 11, color: '#08080e', lineHeight: 1.6 },
  table: { marginBottom: 24 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 10, borderRadius: 4 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  colDesc: { flex: 3, fontSize: 10 },
  colMois: { flex: 2, fontSize: 10, textAlign: 'center' },
  colMontant: { flex: 2, fontSize: 10, textAlign: 'right' },
  colHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#555555' },
  totalBox: { alignItems: 'flex-end', marginTop: 8 },
  totalRow: { flexDirection: 'row', gap: 24, marginTop: 6 },
  totalLabel: { fontSize: 11, color: '#555555', width: 140, textAlign: 'right' },
  totalValue: { fontSize: 11, color: '#08080e', width: 100, textAlign: 'right' },
  totalFinalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#08080e', width: 140, textAlign: 'right' },
  totalFinalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#e9ab3a', width: 100, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48 },
  footerText: { fontSize: 9, color: '#bbbbbb', textAlign: 'center' },
});

export default function InvoicePDF({ invoice }) {
  const { number, date, closer, client, mission, installments, total } = invoice;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{closer.name}</Text>
            <Text style={styles.brandSub}>{closer.address}</Text>
            {closer.siret && <Text style={styles.brandSub}>SIRET : {closer.siret}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>N° {number}</Text>
            <Text style={styles.invoiceDate}>{date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Émetteur / Destinataire */}
        <View style={styles.twoCol}>
          <View>
            <Text style={styles.colTitle}>De</Text>
            <Text style={styles.colValue}>{closer.name}</Text>
            <Text style={styles.colValue}>{closer.email}</Text>
          </View>
          <View>
            <Text style={styles.colTitle}>Pour</Text>
            <Text style={styles.colValue}>{client.name}</Text>
            {client.address && <Text style={styles.colValue}>{client.address}</Text>}
          </View>
        </View>

        {/* Mission */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.colTitle}>Mission</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#08080e' }}>{mission.name}</Text>
        </View>

        {/* Tableau */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.colHeaderText]}>Description</Text>
            <Text style={[styles.colMois, styles.colHeaderText]}>Mois</Text>
            <Text style={[styles.colMontant, styles.colHeaderText]}>Montant</Text>
          </View>
          {installments.map((inst, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>Commission {inst.index}/{inst.total}</Text>
              <Text style={styles.colMois}>{inst.monthLabel}</Text>
              <Text style={styles.colMontant}>{inst.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalFinalLabel}>Total HT</Text>
            <Text style={styles.totalFinalValue}>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</Text>
          </View>
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 9, color: '#aaaaaa', textAlign: 'right' }}>TVA non applicable — article 293 B du CGI</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>
            {closer.name} · {closer.email} · {closer.iban ? `IBAN : ${closer.iban}` : ''}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
