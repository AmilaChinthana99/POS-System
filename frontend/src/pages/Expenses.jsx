import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Modal from '../components/common/Modal';
import { Receipt, Plus, DollarSign } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    amount: '',
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/categories'),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0) setForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
    } catch (e) {
      console.error('Failed to fetch expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', form);
      setIsModalOpen(false);
      setForm({ title: '', categoryId: categories[0]?.id || '', amount: '', notes: '' });
      fetchExpenses();
    } catch (e) {
      alert('Failed to record expense');
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Shop Expenses Log</h2>
          <p className="text-xs text-slate-400">Record operational costs (Rent, Utilities, Eco Packaging, Salaries)</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="glass-panel border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold">Total Expenses Logged</p>
          <h3 className="text-2xl font-extrabold text-rose-400">{formatCurrency(totalExpenseAmount)}</h3>
        </div>
        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
          <Receipt className="w-6 h-6" />
        </div>
      </div>

      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Title</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5 text-right">Amount (LKR)</th>
              <th className="p-3.5 text-right">Date & User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">
                  No expenses recorded
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3.5 font-bold text-white">
                    <p>{exp.title}</p>
                    <p className="text-[10px] text-slate-500">{exp.notes || '-'}</p>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                      {exp.category?.name}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-rose-400">
                    -{formatCurrency(exp.amount)}
                  </td>
                  <td className="p-3.5 text-right">
                    <p className="text-slate-200">{formatDate(exp.expenseDate)}</p>
                    <p className="text-[10px] text-slate-500">By {exp.user?.name}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Expense">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Expense Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Eco Kraft Paper Bags Supply"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Amount (LKR)</label>
            <input
              type="number"
              step="any"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-base"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <button type="submit" className="w-full py-3 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm">
            Record Expense Entry
          </button>
        </form>
      </Modal>
    </div>
  );
}
