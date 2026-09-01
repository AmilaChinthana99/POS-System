import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { PauseCircle, PlayCircle, Trash2, Clock } from 'lucide-react';

export default function HoldSaleModal({ isOpen, onClose }) {
  const [heldSales, setHeldSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loadParkedSale } = useCart();

  useEffect(() => {
    if (isOpen) fetchHeldSales();
  }, [isOpen]);

  const fetchHeldSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pos/sales/held');
      setHeldSales(res.data);
    } catch (e) {
      console.error('Failed to fetch held sales:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (sale) => {
    loadParkedSale(sale);
    onClose();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to discard this parked sale?')) return;
    try {
      await api.delete(`/pos/sales/held/${id}`);
      setHeldSales((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert('Failed to delete held sale');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Parked / Held Sales Queue" maxWidth="max-w-xl">
      {loading ? (
        <div className="py-8 text-center text-slate-400">Loading held sales...</div>
      ) : heldSales.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <PauseCircle className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-slate-300">No Parked Sales</p>
          <p className="text-xs text-slate-500 mt-1">
            You can park active cart transactions using the 'Hold Sale' button
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {heldSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-emerald-400">
                    {sale.holdReference || sale.invoiceNumber}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {sale.items.length} Items
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatDate(sale.createdAt)}</span>
                  {sale.customer && <span className="text-emerald-400"> • {sale.customer.name}</span>}
                </p>
                <p className="text-xs font-semibold text-slate-200">
                  Total: {formatCurrency(sale.grandTotal)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(sale.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Discard"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleResume(sale)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-slate-950 font-bold text-xs hover:bg-brand-400 transition"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
