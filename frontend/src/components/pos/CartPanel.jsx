import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import {
  Trash2,
  Plus,
  Minus,
  UserPlus,
  Tag,
  CreditCard,
  PauseCircle,
  XCircle,
  Percent,
  MessageSquare,
} from 'lucide-react';

export default function CartPanel({ onOpenPayment, onOpenHoldModal }) {
  const {
    cartItems,
    selectedCustomer,
    setSelectedCustomer,
    overallDiscountPercent,
    setOverallDiscountPercent,
    notes,
    setNotes,
    updateQuantity,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    totals,
  } = useCart();

  const [customers, setCustomers] = useState([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingDiscountItemId, setEditingDiscountItemId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <div className="w-96 glass-panel border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shrink-0">
      {/* Top Header & Customer Selector */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
            <span>Current Sale</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {totals.itemCount} items
            </span>
          </h3>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {/* Customer Search / Selection */}
        <div className="relative">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-brand-950/40 border border-brand-500/30 p-2.5 rounded-xl">
              <div>
                <p className="text-xs font-bold text-emerald-400">{selectedCustomer.name}</p>
                <p className="text-[10px] text-slate-400">
                  {selectedCustomer.phone} • {selectedCustomer.loyaltyPoints} Loyalty Pts
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-rose-400 p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              className="w-full flex items-center justify-between bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-300 hover:border-emerald-500/40 transition"
            >
              <span className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Assign Customer (Loyalty)</span>
              </span>
              <span className="text-slate-500 text-[10px]">Select</span>
            </button>
          )}

          {/* Customer Dropdown Popup */}
          {showCustomerSelect && !selectedCustomer && (
            <div className="absolute top-12 left-0 right-0 z-30 glass-panel border border-slate-700 rounded-xl p-3 shadow-2xl space-y-2 max-h-60 overflow-y-auto">
              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowCustomerSelect(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.phone}</p>
                    </div>
                    <span className="text-[10px] bg-brand-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      {c.loyaltyPoints} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
            <Tag className="w-10 h-10 mb-2 stroke-[1.5] text-slate-600" />
            <p className="text-sm font-medium text-slate-400">Cart is Empty</p>
            <p className="text-xs text-slate-500 mt-1">
              Click items or scan barcodes to build invoice
            </p>
          </div>
        ) : (
          totals.processedCartItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-semibold text-xs text-slate-100">{item.name}</h5>
                  <p className="text-[10px] text-slate-400">
                    {formatCurrency(item.unitPrice)} / {item.unit}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Per-Item Discount Popover Button */}
                <button
                  onClick={() =>
                    setEditingDiscountItemId(
                      editingDiscountItemId === item.id ? null : item.id
                    )
                  }
                  className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <Percent className="w-3 h-3" />
                  <span>
                    {item.discountPercent > 0 ? `${item.discountPercent}% Disc` : 'Add Disc'}
                  </span>
                </button>

                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-400">
                    {formatCurrency(item.itemTotal)}
                  </span>
                </div>
              </div>

              {/* Inline Per-Item Discount Input */}
              {editingDiscountItemId === item.id && (
                <div className="pt-2 flex items-center space-x-2 bg-slate-950 p-2 rounded-lg">
                  <label className="text-[10px] text-slate-400">Item Discount %:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discountPercent}
                    onChange={(e) => updateItemDiscount(item.id, Number(e.target.value))}
                    className="w-16 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  />
                  <button
                    onClick={() => setEditingDiscountItemId(null)}
                    className="text-[10px] bg-brand-500 text-slate-950 px-2 py-0.5 rounded font-bold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cart Summary Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
        {/* Overall Discount Input */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Overall Sale Discount %</span>
          <input
            type="number"
            min="0"
            max="100"
            value={overallDiscountPercent}
            onChange={(e) => setOverallDiscountPercent(Number(e.target.value))}
            className="w-16 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-right text-xs text-white"
          />
        </div>

        {/* Notes Input */}
        <div className="flex items-center space-x-2 text-xs">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Add note to receipt..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
          />
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-amber-400">
              <span>Total Discount</span>
              <span>-{formatCurrency(totals.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Tax (VAT)</span>
            <span>{formatCurrency(totals.totalTax)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 text-base font-bold text-white border-t border-slate-800">
            <span>Grand Total</span>
            <span className="text-emerald-400 text-lg">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenHoldModal}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 font-semibold transition"
          >
            <PauseCircle className="w-4 h-4 text-amber-400" />
            <span>Hold Sale</span>
          </button>

          <button
            onClick={onOpenPayment}
            disabled={cartItems.length === 0}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay & Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
