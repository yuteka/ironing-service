import React from 'react';
import { ShoppingBag, AlertCircle, DollarSign, Check } from 'lucide-react';

export default function MetricCards({ metrics }) {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div>
          <div className="metric-label">Active Orders</div>
          <div className="metric-value">{metrics.totalOrders}</div>
        </div>
        <div className="metric-icon-box">
          <ShoppingBag size={24} />
        </div>
      </div>
      <div className="metric-card">
        <div>
          <div className="metric-label">Unassigned</div>
          <div className="metric-value" style={{ color: '#EF4444' }}>{metrics.unassignedOrders}</div>
        </div>
        <div className="metric-icon-box" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          <AlertCircle size={24} />
        </div>
      </div>
      <div className="metric-card">
        <div>
          <div className="metric-label">Pending Payments</div>
          <div className="metric-value">{metrics.pendingPayments}</div>
        </div>
        <div className="metric-icon-box">
          <DollarSign size={24} />
        </div>
      </div>
      <div className="metric-card">
        <div>
          <div className="metric-label">Revenue Collected</div>
          <div className="metric-value" style={{ color: '#047857' }}>₹{metrics.revenueToday}</div>
        </div>
        <div className="metric-icon-box" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>
          <Check size={24} />
        </div>
      </div>
    </div>
  );
}
