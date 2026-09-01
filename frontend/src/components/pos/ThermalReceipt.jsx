import React, { useState } from 'react';
import Modal from '../common/Modal';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Printer, Mail, Send, Check } from 'lucide-react';

export default function ThermalReceipt({ isOpen, onClose, sale }) {
  const [emailInput, setEmailInput] = useState(sale?.customer?.email || '');
  const [emailSent, setEmailSent] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!emailInput) return;
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt Print & Summary" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Actions Top Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Receipt</span>
          </button>
        </div>

        {/* Email Receipt Option */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="email"
            placeholder="Enter customer email for digital receipt..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="flex-1 bg-transparent text-white focus:outline-none text-xs"
          />
          <button
            onClick={handleSendEmail}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center space-x-1"
          >
            {emailSent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
            <span>{emailSent ? 'Sent!' : 'Send'}</span>
          </button>
        </div>

        {/* Receipt Container (Styled as thermal paper slip) */}
        <div className="bg-white text-black p-5 font-mono text-xs shadow-inner rounded-xl border border-slate-300 space-y-3">
          <div id="thermal-receipt-print-area">
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-3 space-y-1">
              <h2 className="font-bold text-sm tracking-tight text-gray-900 uppercase">
                EcoLife Market
              </h2>
              <p className="text-[10px] text-gray-600">123 Green Street, Colombo 03</p>
              <p className="text-[10px] text-gray-600">Tel: +94 11 234 5678 • VAT: 987654321</p>
              <p className="text-[10px] text-emerald-800 font-semibold mt-1">🌱 100% Plastic-Free Goods</p>
            </div>

            {/* Meta Info */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Invoice No:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(sale.createdAt || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashier?.name || 'Cashier'}</span>
              </div>
              {sale.customer && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-semibold">{sale.customer.name}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-left my-2 text-[11px]">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 font-sans">{item.productName || item.name}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">{item.unitPrice}</td>
                    <td className="py-1 text-right font-semibold">{item.total || item.itemTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Tax (VAT 8%):</span>
                <span>{formatCurrency(sale.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-black border-t border-black pt-1">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(sale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700 pt-1">
                <span>Paid ({sale.paymentMethod}):</span>
                <span>{formatCurrency(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Change Due:</span>
                <span>{formatCurrency(sale.changeAmount)}</span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center border-t border-dashed border-gray-400 mt-3 pt-3 text-[10px] text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">
                Thank you for shopping green!
              </p>
              <p>Every step towards a plastic-free future counts.</p>
              <p className="font-mono text-[9px] text-gray-400">Software: EcoLife POS v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
