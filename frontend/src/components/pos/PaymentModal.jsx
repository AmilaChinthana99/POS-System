import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import { saveOfflineSale } from '../../services/offlineSync';
import { Banknote, CreditCard, Landmark, Smartphone, Layers, CheckCircle2 } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onSaleComplete }) {
  const { cartItems, selectedCustomer, overallDiscountPercent, overallDiscountAmount, notes, totals, clearCart } =
    useCart();

  const [paymentMode, setPaymentMode] = useState('SINGLE'); // SINGLE or SPLIT
  const [selectedMethod, setSelectedMethod] = useState('CASH'); // CASH, CARD, BANK_TRANSFER, MOBILE
  const [paidAmount, setPaidAmount] = useState(totals.grandTotal);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Split Payment state
  const [splitCashAmount, setSplitCashAmount] = useState(0);
  const [splitCardAmount, setSplitCardAmount] = useState(0);

  const grandTotal = totals.grandTotal;

  // Auto calculation of change due
  const currentTotalPaid =
    paymentMode === 'SINGLE'
      ? Number(paidAmount) || 0
      : Number(splitCashAmount || 0) + Number(splitCardAmount || 0);

  const changeDue = Math.max(0, currentTotalPaid - grandTotal);
  const isPaymentValid = currentTotalPaid >= grandTotal;

  const handleQuickCash = (amount) => {
    if (amount === 'EXACT') {
      setPaidAmount(grandTotal);
    } else {
      setPaidAmount(Number(amount));
    }
  };

  const handleSubmitPayment = async () => {
    if (!isPaymentValid || submitting) return;

    setSubmitting(true);

    const paymentsList =
      paymentMode === 'SINGLE'
        ? [{ paymentMethod: selectedMethod, amount: Number(paidAmount), referenceNumber }]
        : [
            { paymentMethod: 'CASH', amount: Number(splitCashAmount) },
            { paymentMethod: 'CARD', amount: Number(splitCardAmount) },
          ];

    const salePayload = {
      items: totals.processedCartItems,
      customerId: selectedCustomer?.id || null,
      overallDiscountPercent,
      overallDiscountAmount,
      payments: paymentsList,
      notes,
    };

    try {
      let completedSale = null;

      if (navigator.onLine) {
        const res = await api.post('/pos/sales', salePayload);
        completedSale = res.data;
      } else {
        // Save to offline queue if connection is dropped
        saveOfflineSale(salePayload);
        completedSale = {
          invoiceNumber: `OFFLINE-${Date.now().toString().slice(-6)}`,
          grandTotal: totals.grandTotal,
          paidAmount: currentTotalPaid,
          changeAmount: changeDue,
          createdAt: new Date().toISOString(),
          items: totals.processedCartItems,
          customer: selectedCustomer,
          isOffline: true,
        };
      }

      clearCart();
      onClose();
      onSaleComplete(completedSale);
    } catch (error) {
      alert('Failed to complete sale: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment & Print Receipt" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Total Header */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total Amount Due</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPaymentMode('SINGLE')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                paymentMode === 'SINGLE' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Single Method
            </button>
            <button
              onClick={() => {
                setPaymentMode('SPLIT');
                setSplitCashAmount(Math.round(grandTotal / 2));
                setSplitCardAmount(Math.round(grandTotal / 2));
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                paymentMode === 'SPLIT' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Split Payment
            </button>
          </div>
        </div>

        {/* Single Payment Mode Options */}
        {paymentMode === 'SINGLE' ? (
          <div className="space-y-4">
            {/* Method Select Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Landmark },
                { id: 'MOBILE', label: 'Mobile Pay', icon: Smartphone },
              ].map((m) => {
                const Icon = m.icon;
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMethod(m.id);
                      setPaidAmount(grandTotal);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                      active
                        ? 'bg-brand-500/20 border-brand-500 text-emerald-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Cash Presets (LKR) */}
            {selectedMethod === 'CASH' && (
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Quick Cash Preset (LKR):</label>
                <div className="grid grid-cols-5 gap-2">
                  {['EXACT', 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickCash(amt)}
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 rounded-lg"
                    >
                      {amt === 'EXACT' ? 'Exact' : `Rs. ${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paid Amount & Reference Number Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Amount Received (LKR)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-white focus:border-emerald-500"
                />
              </div>

              {selectedMethod !== 'CASH' && (
                <div>
                  <label className="text-xs text-slate-400 font-medium">Card/Transaction Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-99882"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Split Payment Mode Form */
          <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <Layers className="w-4 h-4" />
              <span>Split Payment Breakdown</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Part 1: Cash Amount</label>
                <input
                  type="number"
                  value={splitCashAmount}
                  onChange={(e) => setSplitCashAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Part 2: Card Amount</label>
                <input
                  type="number"
                  value={splitCardAmount}
                  onChange={(e) => setSplitCardAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Change Due Display */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Change Due to Customer</span>
          <span className="text-lg font-bold text-emerald-400">{formatCurrency(changeDue)}</span>
        </div>

        {/* Validation Error warning */}
        {!isPaymentValid && (
          <p className="text-xs text-rose-400 font-semibold text-center">
            ⚠️ Total paid ({formatCurrency(currentTotalPaid)}) is less than total due (
            {formatCurrency(grandTotal)})
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubmitPayment}
          disabled={!isPaymentValid || submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-slate-950 font-bold text-base shadow-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm & Issue Receipt</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
