/**
 * POS Calculation Helpers
 * Clean, pure functions for accurate currency calculations in LKR
 */

function round2(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function calculateItemSubtotal(price, quantity, itemDiscountPercent = 0) {
  const baseTotal = price * quantity;
  const discountAmount = (baseTotal * itemDiscountPercent) / 100;
  return round2(baseTotal - discountAmount);
}

function calculateSaleTotals({ items = [], overallDiscountPercent = 0, overallDiscountAmount = 0, defaultTaxRate = 8.0 }) {
  let subtotal = 0;
  let totalItemDiscounts = 0;
  let totalTax = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.sellingPrice || item.unitPrice) || 0;
    const itemDiscPct = Number(item.discountPercent) || 0;
    const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : defaultTaxRate;

    const rawSubtotal = price * qty;
    const itemDiscount = round2((rawSubtotal * itemDiscPct) / 100);
    const itemNetSubtotal = round2(rawSubtotal - itemDiscount);
    const itemTax = round2((itemNetSubtotal * taxRate) / 100);

    subtotal += rawSubtotal;
    totalItemDiscounts += itemDiscount;
    totalTax += itemTax;

    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      costPrice: Number(item.costPrice) || 0,
      discountAmount: itemDiscount,
      subtotal: itemNetSubtotal,
      taxAmount: itemTax,
      total: round2(itemNetSubtotal + itemTax),
    };
  });

  let totalDiscount = totalItemDiscounts;
  if (overallDiscountPercent > 0) {
    totalDiscount += round2(((subtotal - totalItemDiscounts) * overallDiscountPercent) / 100);
  } else if (overallDiscountAmount > 0) {
    totalDiscount += Number(overallDiscountAmount);
  }

  const netSubtotal = Math.max(0, subtotal - totalDiscount);
  const grandTotal = round2(netSubtotal + totalTax);

  return {
    subtotal: round2(subtotal),
    discountAmount: round2(totalDiscount),
    taxAmount: round2(totalTax),
    grandTotal,
    processedItems,
  };
}

function calculateChange(grandTotal, paidAmount) {
  const change = round2(Number(paidAmount) - Number(grandTotal));
  return change >= 0 ? change : 0;
}

module.exports = {
  round2,
  calculateItemSubtotal,
  calculateSaleTotals,
  calculateChange,
};
