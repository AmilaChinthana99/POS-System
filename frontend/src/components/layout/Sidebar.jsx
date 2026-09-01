import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RotateCcw,
  Users,
  Truck,
  BarChart3,
  Receipt,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'CASHIER';

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'POS Terminal',
      path: '/pos',
      icon: ShoppingCart,
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      highlight: true,
    },
    {
      title: 'Inventory & Stock',
      path: '/inventory',
      icon: Package,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Returns & Refunds',
      path: '/returns',
      icon: RotateCcw,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Customers & Loyalty',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      title: 'Suppliers & PO',
      path: '/suppliers',
      icon: Truck,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Expenses',
      path: '/expenses',
      icon: Receipt,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between py-6 px-4 z-20 shrink-0">
      <div className="space-y-6">
        {/* Role Badge Indicator */}
        <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Role: {role}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
        </div>

        {/* Navigation Menu Links */}
        <nav className="space-y-1.5">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-lg shadow-brand-500/20'
                      : item.highlight
                      ? 'text-emerald-400 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Eco Footer Tag */}
      <div className="px-3 py-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-center">
        <p className="text-[11px] text-emerald-400 font-medium">🌱 100% Eco-Friendly POS</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Zero Single-Use Plastic Policy</p>
      </div>
    </aside>
  );
}
