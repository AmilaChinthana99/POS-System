import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, Save, Download, Database, Store } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    shopName: 'EcoLife Plastic-Free Market',
    tagline: 'Sustainable & Eco-Friendly Goods',
    address: '123 Green Street, Colombo 03, Sri Lanka',
    phone: '+94 11 234 5678',
    email: 'contact@ecolifemarket.lk',
    taxNumber: 'VAT-987654321',
    currencySymbol: 'Rs.',
    currencyCode: 'LKR',
    receiptFooterText: 'Thank you for shopping green! Every step counts.',
    defaultTaxRate: 8.0,
    enableLoyalty: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      alert('Settings updated successfully!');
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/settings/backup', '_blank');
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System & Shop Settings</h2>
        <p className="text-xs text-slate-400">Configure receipt headers, tax rates, LKR currency, and database backups</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Shop Details */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center space-x-2">
            <Store className="w-4 h-4" />
            <span>Store Header & Contact Information</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Shop Name</label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Store Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">VAT / Tax Reg Number</label>
              <input
                type="text"
                value={settings.taxNumber || ''}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Rates */}
        <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Tax & Currency Settings</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Currency Code</label>
              <input
                type="text"
                value={settings.currencyCode}
                onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="any"
                value={settings.defaultTaxRate}
                onChange={(e) => setSettings({ ...settings, defaultTaxRate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Receipt Footer Note</label>
            <input
              type="text"
              value={settings.receiptFooterText || ''}
              onChange={(e) => setSettings({ ...settings, receiptFooterText: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-brand-500 to-emerald-500 text-slate-950 font-bold rounded-xl text-sm shadow-xl transition flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save System Settings'}</span>
        </button>
      </form>

      {/* Database Backup Section */}
      <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-3">
        <h3 className="font-bold text-sm text-emerald-400 flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span>Database Backup & Export</span>
        </h3>
        <p className="text-xs text-slate-400">
          Download a complete JSON backup dump of all products, categories, users, customers, sales history, and expenses.
        </p>

        <button
          onClick={handleDownloadBackup}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-xl flex items-center space-x-2 transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download Complete DB JSON Dump</span>
        </button>
      </div>
    </div>
  );
}
