import { describe, it, expect } from 'vitest';
const { calculateItemSubtotal, calculateSaleTotals, calculateChange, round2 } = require('../src/utils/calculation');

describe('POS Billing Calculation Logic', () => {
  it('should round numbers to 2 decimal places accurately', () => {
    expect(round2(10.556)).toBe(10.56);
    expect(round2(10.554)).toBe(10.55);
  });

  it('should calculate item subtotal with per-item percentage discount', () => {
    // 2 items @ Rs. 850 each with 10% discount = 1700 - 170 = 1530
    const result = calculateItemSubtotal(850, 2, 10);
    expect(result).toBe(1530);
  });

  it('should calculate grand total, tax and discounts for a multi-item sale', () => {
    const items = [
      { sellingPrice: 850, quantity: 2, taxRate: 8, discountPercent: 0 }, // subtotal 1700, tax 136
      { sellingPrice: 3200, quantity: 1, taxRate: 8, discountPercent: 10 }, // base 3200, disc 320, net 2880, tax 230.4
    ];

    const totals = calculateSaleTotals({ items });

    expect(totals.subtotal).toBe(4900); // 1700 + 3200
    expect(totals.discountAmount).toBe(320);
    expect(totals.taxAmount).toBe(366.4); // 136 + 230.4
    expect(totals.grandTotal).toBe(round2(4900 - 320 + 366.4)); // 4946.4
  });

  it('should calculate change due correctly', () => {
    const change = calculateChange(4946.4, 5000);
    expect(change).toBe(53.6);
  });

  it('should handle zero change when paid exact or insufficient amount', () => {
    expect(calculateChange(1000, 1000)).toBe(0);
    expect(calculateChange(1000, 800)).toBe(0);
  });
});
