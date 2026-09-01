import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Modal from '../components/common/Modal';
import { Users, UserPlus, Phone, Mail, Award, History, Search } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      setIsAddModalOpen(false);
      setForm({ name: '', phone: '', email: '', address: '' });
      fetchCustomers();
    } catch (error) {
      alert('Error creating customer: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleViewHistory = async (id) => {
    try {
      const res = await api.get(`/customers/${id}/history`);
      setHistoryCustomer(res.data);
    } catch (e) {
      alert('Failed to load purchase history');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer & Loyalty System</h2>
          <p className="text-xs text-slate-400">Track eco-shoppers, purchase history & loyalty rewards</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="glass-panel border border-slate-800 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>
      </div>

      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Phone Number</th>
              <th className="p-3.5">Email / Address</th>
              <th className="p-3.5 text-center">Loyalty Points</th>
              <th className="p-3.5 text-right">Total Spent</th>
              <th className="p-3.5 text-right">History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-900/40 transition">
                <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span>{c.name}</span>
                </td>
                <td className="p-3.5 font-mono text-slate-300">{c.phone}</td>
                <td className="p-3.5 text-slate-400">
                  <p>{c.email || '-'}</p>
                  <p className="text-[10px] text-slate-500">{c.address}</p>
                </td>
                <td className="p-3.5 text-center">
                  <span className="bg-brand-500/10 text-emerald-400 border border-brand-500/20 px-2.5 py-1 rounded-full font-bold">
                    🏆 {c.loyaltyPoints} Pts
                  </span>
                </td>
                <td className="p-3.5 text-right font-bold text-emerald-400">
                  {formatCurrency(c.totalSpent)}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleViewHistory(c.id)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg flex items-center space-x-1 ml-auto"
                  >
                    <History className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Purchase Log</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Customer">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="Kusal Perera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
            <input
              type="text"
              required
              placeholder="0771234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="kusal@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Address</label>
            <input
              type="text"
              placeholder="Colombo 05"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm">
            Save Customer
          </button>
        </form>
      </Modal>

      {/* Customer Purchase History Modal */}
      {historyCustomer && (
        <Modal
          isOpen={Boolean(historyCustomer)}
          onClose={() => setHistoryCustomer(null)}
          title={`Purchase History: ${historyCustomer.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-slate-400">Total Spent to Date</p>
                <p className="text-base font-bold text-emerald-400">
                  {formatCurrency(historyCustomer.totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Loyalty Balance</p>
                <p className="text-base font-bold text-amber-400">
                  {historyCustomer.loyaltyPoints} Points
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {historyCustomer.sales?.map((sale) => (
                <div key={sale.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex justify-between font-semibold">
                    <span className="text-emerald-400">{sale.invoiceNumber}</span>
                    <span>{formatCurrency(sale.grandTotal)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(sale.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
