import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, User, KeyRound, AlertCircle } from 'lucide-react';

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(usernameOrEmail, password);
    if (result.success) {
      if (result.user.role === 'CASHIER') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  const fillDemoAccount = (user, pass) => {
    setUsernameOrEmail(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-brand-500/20 mx-auto">
            <Leaf className="w-9 h-9 text-slate-950" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">EcoLife POS</h2>
          <p className="text-xs text-slate-400">Sustainable Retail & Point of Sale System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                required
                placeholder="admin@ecopos.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to POS</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Preset Buttons */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2 text-center">
          <p className="text-[11px] text-slate-500 font-medium">Quick Demo Accounts (Click to Fill):</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillDemoAccount('admin@ecopos.com', 'Admin@123')}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-400 font-semibold rounded-lg"
            >
              Admin
            </button>
            <button
              onClick={() => fillDemoAccount('manager@ecopos.com', 'Manager@123')}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-400 font-semibold rounded-lg"
            >
              Manager
            </button>
            <button
              onClick={() => fillDemoAccount('cashier@ecopos.com', 'Cashier@123')}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-sky-400 font-semibold rounded-lg"
            >
              Cashier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
