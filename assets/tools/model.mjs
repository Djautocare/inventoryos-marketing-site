export function decimal(value, places = 2, limit = 100_000_000) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(text)) throw new Error('Enter a valid number.');
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > places) throw new Error('Use fewer decimal places.');
  const scaled = Number(whole) * 10 ** places + Number(fraction.padEnd(places, '0'));
  if (!Number.isSafeInteger(scaled) || scaled > limit * 10 ** places) throw new Error('That number is too large.');
  return scaled;
}

function positive(value, message) {
  if (value <= 0) throw new Error(message);
  return value;
}

export function reorderPoint({demand, days, safety}) {
  const product = BigInt(decimal(demand, 3)) * BigInt(decimal(days, 3));
  const safetyStock = decimal(safety, 0);
  const point = Number((product + 999_999n) / 1_000_000n) + safetyStock;
  if (!Number.isSafeInteger(point)) throw new Error('That number is too large.');
  return {point, demandDuringLead: Number(product) / 1_000_000, safetyStock};
}

export function breakEven({fixed, selling, variable}) {
  const fixedCost = decimal(fixed);
  const price = positive(decimal(selling), 'Selling price must be above zero.');
  const contribution = positive(price - decimal(variable), 'Selling price must exceed the variable cost per unit.');
  const quantity = Math.ceil(fixedCost / contribution);
  const revenue = quantity * price;
  if (!Number.isSafeInteger(revenue)) throw new Error('That number is too large.');
  return {quantity, revenue, contribution, contributionPercent: 100 * contribution / price};
}

export function wholesale({cost, method, target, vat}) {
  const unitCost = positive(decimal(cost), 'Product cost must be above zero.');
  const rate = decimal(target, 2, 1000);
  const vatRate = decimal(vat, 2, 100);
  if (method !== 'margin' && method !== 'markup') throw new Error('Choose margin or markup.');
  if (method === 'margin' && rate >= 10_000) throw new Error('Profit margin must be below 100%.');
  const price = method === 'margin'
    ? Math.ceil(unitCost * 10_000 / (10_000 - rate))
    : Math.ceil(unitCost * (10_000 + rate) / 10_000);
  if (!Number.isSafeInteger(price * vatRate)) throw new Error('That number is too large.');
  const vatAmount = Math.round(price * vatRate / 10_000);
  return {price, includingVat: price + vatAmount, margin: (price - unitCost) * 100 / price, markup: (price - unitCost) * 100 / unitCost};
}

export function economicQuantity({annualDemand, ordering, holding}) {
  const demand = positive(decimal(annualDemand, 0), 'Annual demand must be above zero.');
  const orderCost = positive(decimal(ordering) / 100, 'Ordering cost must be above zero.');
  const holdingCost = positive(decimal(holding) / 100, 'Holding cost must be above zero.');
  const eoq = Math.sqrt(2 * demand * orderCost / holdingCost);
  const low = Math.max(1, Math.floor(eoq));
  const high = Math.max(1, Math.ceil(eoq));
  const costAt = quantity => demand / quantity * orderCost + quantity / 2 * holdingCost;
  const quantity = costAt(low) <= costAt(high) ? low : high;
  return {quantity, orders: demand / quantity, orderCosts: demand / quantity * orderCost, holdingCosts: quantity / 2 * holdingCost, total: costAt(quantity)};
}

export function csv(rows) {
  return rows.map(row => row.map(value => {
    let cell = String(value ?? '');
    if (/^[\s\uFEFF]*[=+@-]/.test(cell) || /^[\t\r\n]/.test(cell)) cell = "'" + cell;
    return '"' + cell.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n') + '\r\n';
}

function skuPart(value, limit) {
  return value.normalize('NFKD').replace(/\p{Mark}/gu, '').toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, limit).replace(/-$/, '');
}

export function skus({prefix, category, names, sequence, padding}) {
  const first = positive(decimal(sequence, 0, 999_999), 'Start numbering at 1 or higher.');
  const width = positive(decimal(padding, 0, 6), 'Choose at least one digit.');
  const products = names.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (!products.length || products.length > 250) throw new Error('Enter between 1 and 250 product names, one per line.');
  if (first + products.length - 1 > 999_999) throw new Error('The last number exceeds 999999.');
  const leading = [skuPart(prefix, 12), skuPart(category, 12)].filter(Boolean);
  return products.map((name, index) => ({
    name,
    sku: [...leading, skuPart(name, 20) || 'ITEM', String(first + index).padStart(width, '0')].join('-')
  }));
}

export function documentTotals(rows, vatRate = 0) {
  const base = rows.reduce((subtotal, row) => subtotal + row.quantity * row.unitPrice, 0);
  if (!Number.isSafeInteger(base * Math.max(1, vatRate))) throw new Error('That number is too large.');
  const vat = Math.round(base * vatRate / 10_000);
  return {base, vat, total: base + vat};
}

export function barcodeValue(value) {
  if (!/^[\x20-\x7e]{1,80}$/.test(value) || !value.trim()) {
    throw new Error('Enter up to 80 letters, numbers or standard keyboard characters.');
  }
  return value;
}
