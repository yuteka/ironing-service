import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Ticket, 
  LogOut, 
  DollarSign,
  Settings,
  Truck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isMockMode, handleLogout, role }) {
  const isAdmin = role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Manage Bookings', icon: ShoppingBag },
    { id: 'partners', label: 'Pickup Partners', icon: Truck },
    { id: 'customers', label: 'Manage Customers', icon: Users },
    { id: 'payments', label: 'Manage Payments', icon: DollarSign },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 flex flex-col justify-between p-4 shadow-sm z-30 flex-shrink-0">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <ShoppingBag size={20} />
          </div>
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">Ironing Service</span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-100/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-sky-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
            {isAdmin ? 'A' : 'S'}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-xs text-slate-900 truncate">{isAdmin ? 'Administrator' : 'Sub-Admin'}</div>
            <div className="text-[11px] font-semibold text-slate-500 truncate">{isAdmin ? 'Store Owner' : 'Staff Operator'}</div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-all cursor-pointer"
        >
          <LogOut size={18} className="text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
