import React from 'react';
import { ShoppingBag, AlertCircle, DollarSign, Check } from 'lucide-react';

export default function MetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Active Orders */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Active Orders</div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalOrders}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <ShoppingBag size={24} />
        </div>
      </div>

      {/* Unassigned */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Unassigned</div>
          <div className="text-2xl font-extrabold text-red-600">{metrics.unassignedOrders}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pending Payments</div>
          <div className="text-2xl font-extrabold text-amber-600">{metrics.pendingPayments}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <DollarSign size={24} />
        </div>
      </div>

      {/* Revenue Collected */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Revenue Collected</div>
          <div className="text-2xl font-extrabold text-emerald-700">₹{metrics.revenueToday}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Check size={24} />
        </div>
      </div>
    </div>
  );
}
