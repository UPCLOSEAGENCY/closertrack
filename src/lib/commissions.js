export const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 6, 12];

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(yyyymm, offset) {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthRange(startYYYYMM, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(shiftMonth(startYYYYMM, i));
  return out;
}

export function compareMonth(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function totalCommission(sale) {
  return (sale.amount * sale.rate) / 100;
}

export function buildInstallments(sale) {
  const total = totalCommission(sale);
  const count = sale.installments || 1;
  const per = total / count;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push({
      saleId: sale.id,
      month: shiftMonth(sale.saleMonth, i),
      amount: per,
      index: i + 1,
      total: count,
    });
  }
  return result;
}

export function allInstallments(sales) {
  return sales.flatMap(buildInstallments);
}

export function installmentsByMonth(sales) {
  const map = new Map();
  for (const inst of allInstallments(sales)) {
    if (!map.has(inst.month)) map.set(inst.month, []);
    map.get(inst.month).push(inst);
  }
  return map;
}

export function sumInstallments(installments) {
  return installments.reduce((acc, inst) => acc + inst.amount, 0);
}

export function timelineData(sales, months) {
  const map = installmentsByMonth(sales);
  return months.map((month) => {
    const entries = map.get(month) ?? [];
    return {
      month,
      total: sumInstallments(entries),
      count: entries.length,
      installments: entries,
    };
  });
}
