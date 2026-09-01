import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Modal from '../components/common/Modal';
import { RotateCcw, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Returns() {
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  // Return Processing Form State
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundSale, setFoundSale] = useState(null);
  const [returnReason, setReturnReason] = useState('Customer Return');
  const [returnItems, setReturnItems] = useState({});

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns');
      setReturnsList(res.data);
    } catch (e) {
      console.error('Failed to fetch returns:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInvoice = async () => {
    if (!invoiceSearch) return;
    try {
      const res = await api.get(`/pos/sales?search=${invoiceSearch.trim()}`);
      if (res.data.sales && res.data.sales.length > 0) {
        const sale = res.data.sales[0];
        setFoundSale(sale);
        // Initialize return quantities map
        const initialQty = {};
        sale.items.forEach((item) => {
          initialQty[item.id] = 1;
        });
        setReturnItems(initialQty);
      } else {
        alert('Invoice not found');
      }
    } catch (e) {
      alert('Invoice search failed');
    }
  };

  const handleConfirmReturn = async () => {
    if (!foundSale || !returnReason) return;

    const selectedItemsList = Object.entries(returnItems)
      .filter(([saleItemId, qty]) => Number(qty) > 0)
      .map(([saleItemId, qty]) => ({
        saleItemId,
        quantity: Number(qty),
        returnToStock: true,
      }));

    if (selectedItemsList.length === 0) {
      alert('Please select at least one item quantity to return');
      return;
    }

    try {
      await api.post('/returns', {
        saleId: foundSale.id,
        items: selectedItemsList,
        reason: returnReason,
        refundMethod: 'CASH',
      });

      alert('Return processed successfully! Stock has been restored.');
      setIsProcessModalOpen(false);
      setFoundSale(null);
      fetchReturns();
    } catch (error) {
      alert('Failed to process return: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Returns & Refunds</h2>
          <p className="text-xs text-slate-400">Process invoice returns with automatic inventory stock replenishment</p>
        </div>

        <button
          onClick={() => setIsProcessModalOpen(true)}
          className="px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Process Return</span>
        </button>
      </div>

      {/* Returns History Table */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Return No</th>
              <th className="p-3.5">Original Invoice</th>
              <th className="p-3.5">Reason</th>
              <th className="p-3.5 text-right">Refund Amount</th>
              <th className="p-3.5 text-right">Date & Processed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {returnsList.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  No return transactions recorded
                </td>
              </tr>
            ) : (
              returnsList.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3.5 font-mono font-bold text-amber-400">{ret.returnNumber}</td>
                  <td className="p-3.5 font-semibold text-emerald-400">{ret.sale?.invoiceNumber}</td>
                  <td className="p-3.5 text-slate-300">{ret.reason}</td>
                  <td className="p-3.5 text-right font-bold text-rose-400">
                    -{formatCurrency(ret.totalRefundAmount)}
                  </td>
                  <td className="p-3.5 text-right">
                    <p className="text-slate-200">{formatDate(ret.createdAt)}</p>
                    <p className="text-[10px] text-slate-500">By {ret.processedBy?.name}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Process Return Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Process Return Against Invoice"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          {/* Invoice Lookup Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter original invoice number (e.g. INV-2026...)"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
            />
            <button
              onClick={handleSearchInvoice}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
            >
              Search
            </button>
          </div>

          {/* Found Invoice Items List */}
          {foundSale && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-400">{foundSale.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(foundSale.createdAt)}</p>
                </div>
                <span className="font-bold text-white">{formatCurrency(foundSale.grandTotal)}</span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Reason for Return</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">Select Items to Return:</label>
                {foundSale.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-semibold text-white">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">Purchased: {item.quantity} pcs @ {item.unitPrice}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Return Qty:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItems[item.id] || 0}
                        onChange={(e) => setReturnItems({ ...returnItems, [item.id]: e.target.value })}
                        className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmReturn}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition"
              >
                Confirm Refund & Restore Stock
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
