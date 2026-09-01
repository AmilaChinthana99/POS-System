import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Modal from '../components/common/Modal';
import { Truck, Plus, PackageCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('SUPPLIERS'); // SUPPLIERS or PO

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const [poForm, setPOForm] = useState({
    supplierId: '',
    productId: '',
    quantityOrdered: 10,
    unitCost: 500,
    notes: '',
  });

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      const [supRes, poRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/suppliers/po'),
        api.get('/products'),
      ]);
      setSuppliers(supRes.data);
      setPurchaseOrders(poRes.data);
      setProducts(prodRes.data);
      if (supRes.data.length > 0) setPOForm((prev) => ({ ...prev, supplierId: supRes.data[0].id }));
      if (prodRes.data.length > 0) setPOForm((prev) => ({ ...prev, productId: prodRes.data[0].id }));
    } catch (e) {
      console.error('Failed to fetch suppliers data:', e);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', supplierForm);
      setIsSupplierModalOpen(false);
      fetchSupplierData();
    } catch (e) {
      alert('Error creating supplier');
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplierId: poForm.supplierId,
        notes: poForm.notes,
        items: [
          {
            productId: poForm.productId,
            quantityOrdered: Number(poForm.quantityOrdered),
            unitCost: Number(poForm.unitCost),
          },
        ],
      };
      await api.post('/suppliers/po', payload);
      setIsPOModalOpen(false);
      fetchSupplierData();
    } catch (e) {
      alert('Error creating PO');
    }
  };

  const handleReceiveGRN = async (po) => {
    if (!confirm(`Confirm GRN receipt for PO ${po.poNumber}? Stock will be automatically added to inventory.`)) return;

    try {
      const payload = {
        items: po.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantityReceived: item.quantityOrdered,
        })),
      };

      await api.post(`/suppliers/po/${po.id}/receive`, payload);
      alert(`Goods Received! Inventory stock updated.`);
      fetchSupplierData();
    } catch (e) {
      alert('Failed to process GRN');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Suppliers & Purchasing (GRN)</h2>
          <p className="text-xs text-slate-400">Manage eco suppliers, POs, and stock replenishments</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Supplier</span>
          </button>

          <button
            onClick={() => setIsPOModalOpen(true)}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-slate-900/60 p-1 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'SUPPLIERS' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Suppliers Database ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('PO')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'PO' ? 'bg-brand-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
      </div>

      {/* Tab 1: Suppliers */}
      {activeTab === 'SUPPLIERS' ? (
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Phone & Email</th>
                <th className="p-3.5">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{s.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-300">{s.contactPerson || '-'}</td>
                  <td className="p-3.5">
                    <p className="font-mono text-slate-200">{s.phone}</p>
                    <p className="text-[10px] text-slate-400">{s.email}</p>
                  </td>
                  <td className="p-3.5 text-slate-400">{s.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tab 2: Purchase Orders & GRN */
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Order Items</th>
                <th className="p-3.5 text-right">Total Cost</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Receive Stock (GRN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3.5 font-mono font-bold text-emerald-400">{po.poNumber}</td>
                  <td className="p-3.5 text-white font-semibold">{po.supplier?.name}</td>
                  <td className="p-3.5">
                    {po.items?.map((i) => (
                      <span key={i.id} className="text-slate-300">
                        {i.product?.name} ({i.quantityOrdered} pcs)
                      </span>
                    ))}
                  </td>
                  <td className="p-3.5 text-right font-bold text-white">
                    {formatCurrency(po.totalAmount)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        po.status === 'RECEIVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {po.status === 'PENDING' ? (
                      <button
                        onClick={() => handleReceiveGRN(po)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Receive GRN</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Stock Restocked</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Supplier Modal */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="New Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Company Name</label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Contact Person</label>
            <input
              type="text"
              value={supplierForm.contactPerson}
              onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm">
            Save Supplier
          </button>
        </form>
      </Modal>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title="Create Purchase Order (PO)">
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Select Supplier</label>
            <select
              value={poForm.supplierId}
              onChange={(e) => setPOForm({ ...poForm, supplierId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Select Product to Restock</label>
            <select
              value={poForm.productId}
              onChange={(e) => setPOForm({ ...poForm, productId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.stockQuantity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Quantity to Order</label>
              <input
                type="number"
                min="1"
                required
                value={poForm.quantityOrdered}
                onChange={(e) => setPOForm({ ...poForm, quantityOrdered: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Unit Cost (LKR)</label>
              <input
                type="number"
                required
                value={poForm.unitCost}
                onChange={(e) => setPOForm({ ...poForm, unitCost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm">
            Generate Purchase Order
          </button>
        </form>
      </Modal>
    </div>
  );
}
