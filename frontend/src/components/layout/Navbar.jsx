import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOfflineSales, syncOfflineSalesWithBackend } from '../../services/offlineSync';
import { Leaf, Wifi, WifiOff, RefreshCw, LogOut, User, Store } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(getOfflineSales().length);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setOfflineCount(getOfflineSales().length);
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      const result = await syncOfflineSalesWithBackend();
      alert(`Synced ${result.count} offline sales successfully!`);
      setOfflineCount(0);
    } catch (e) {
      alert('Failed to sync offline sales: ' + (e.message || 'Server unreachable'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Leaf className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg tracking-tight text-white">EcoLife</h1>
            <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-medium">
              POS System
            </span>
          </div>
          <p className="text-xs text-slate-400">Plastic-Free & Sustainable Market</p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center space-x-4">
        {/* Branch Pill */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <Store className="w-4 h-4 text-emerald-400" />
          <span>{user?.branch?.name || 'Colombo Main Branch'}</span>
        </div>

        {/* Network Online / Offline Status */}
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </span>
          )}
        </div>

        {/* Offline Queue Sync Button */}
        {offlineCount > 0 && (
          <button
            onClick={handleSync}
            disabled={!isOnline || syncing}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold px-3 py-1.5 rounded-xl text-xs shadow-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync {offlineCount} Offline Sales</span>
          </button>
        )}
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white leading-none">{user?.name || 'User'}</p>
            <p className="text-[10px] text-brand-400 font-medium capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl border border-slate-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
