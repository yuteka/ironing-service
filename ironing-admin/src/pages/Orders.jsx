import React, { useState, useEffect } from 'react';
import { 
  Search,
  ChevronLeft,
  ChevronRight, 
  Download, 
  Eye, 
  ClipboardList, 
  Bell, 
  UserCheck, 
  Shirt, 
  Sparkles, 
  Truck, 
  CheckCircle, 
  Clock,
  ArrowUpDown,
  User,
  ChevronDown,
  FileText,
  MapPin
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatPhone } from '../utils/formatPhone';
import SmartTooltip from '../components/SmartTooltip';

export default function Orders({ orders, setSelectedOrder, triggerBulkReady, partners, assignPartner, updateOrderStatus }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPageSize = 10;

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

  const getPageNumbers = (current, total) => {
    const pages = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  const statusMatch = (orderStatus, filterVal) => {
    if (filterVal === 'all') return true;
    if (!orderStatus) return false;
    const normOrder = orderStatus.toUpperCase().replace(/_/g, '').replace(/\s/g, '');
    const normFilter = filterVal.toUpperCase().replace(/_/g, '').replace(/\s/g, '');
    return normOrder === normFilter;
  };


  const getStatusLabel = (status) => {
    const map = {
      'CONFIRMED': 'Confirmed',
      'PICKUP_ASSIGNED': 'Pickup Assigned',
      'COLLECTED': 'Collected',
      'READY': 'Ready',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'REASSIGNMENT_NEEDED': 'Reassignment Needed',
      'Confirmed': 'Confirmed',
      'Pickup Assigned': 'Pickup Assigned',
      'Collected': 'Collected',
      'Ready': 'Ready',
      'Out for Delivery': 'Out for Delivery',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled',
      'Reassignment Needed': 'Reassignment Needed'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      'CONFIRMED': 'confirmed',
      'Confirmed': 'confirmed',
      'PICKUP_ASSIGNED': 'assigned',
      'Pickup Assigned': 'assigned',
      'COLLECTED': 'collected',
      'Collected': 'collected',
      'READY': 'ready',
      'Ready': 'ready',
      'OUT_FOR_DELIVERY': 'ready',
      'Out for Delivery': 'ready',
      'DELIVERED': 'delivered',
      'Delivered': 'delivered',
      'CANCELLED': 'pending',
      'Cancelled': 'pending',
      'REASSIGNMENT_NEEDED': 'pending',
      'Reassignment Needed': 'pending'
    };
    return map[status] || 'confirmed';
  };

  // Filter & Search Logic
  // Helper: format IDs with meaningful prefixes without hyphens
  const fmtBookingId = (id) => `BK2026${String(id).padStart(4, '0')}`;

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toString().includes(searchQuery) ||
      fmtBookingId(o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerNameSnapshot || o.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerPhone || o.customer?.phone || '').includes(searchQuery);

    const matchesStatus = statusMatch(o.status, filterStatus);

    return matchesSearch && matchesStatus;
  });

  // Sorting Logic (Always newest / most recent first)
  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalOrdersCount = sortedOrders.length;
  const totalOrdersPages = Math.ceil(totalOrdersCount / ordersPageSize);
  const indexOfLastOrder = currentPage * ordersPageSize;
  const indexOfFirstOrder = indexOfLastOrder - ordersPageSize;
  const currentPageOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Export Data Builder
  const getExportData = () => {
    const headers = ['S.No.', 'Booking ID', 'Customer Name', 'Phone', 'Status', 'Payment Status', 'Total Amount', 'Pickup Slot', 'Created Date'];
    const rows = sortedOrders.map((o, idx) => [
      idx + 1,
      fmtBookingId(o.id),
      o.customerNameSnapshot || o.customer?.name || '',
      o.customerPhone || o.customer?.phone || '',
      o.status,
      o.paymentStatus,
      o.totalAmount || 0,
      o.pickupSlot || '',
      new Date(o.createdAt).toLocaleDateString()
    ]);
    return { headers, rows };
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(`bookings_ledger_${new Date().toISOString().slice(0,10)}`, [headers, ...rows]);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('Bookings Ledger', `bookings_ledger_${new Date().toISOString().slice(0,10)}`, headers, rows);
  };

  const unreadyIds = orders.filter(o => statusMatch(o.status, 'Collected')).map(o => o.id);

  const statusKPIs = [
    { 
      label: 'Total Bookings', 
      value: 'all', 
      count: orders.length, 
      color: '#0ea5e9', 
      gradient: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
      bg: 'rgba(14, 165, 233, 0.08)', 
      icon: ClipboardList,
      desc: 'All system records'
    },
    { 
      label: 'New Requests', 
      value: 'Confirmed', 
      count: orders.filter(o => statusMatch(o.status, 'Confirmed')).length, 
      color: '#3b82f6', 
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      bg: 'rgba(59, 130, 246, 0.08)', 
      icon: Bell,
      desc: 'Awaiting scheduling'
    },
    { 
      label: 'Pickup Assigned', 
      value: 'Pickup Assigned', 
      count: orders.filter(o => statusMatch(o.status, 'Pickup Assigned')).length, 
      color: '#f59e0b', 
      gradient: 'linear-gradient(135deg, #f59e0b, #eab308)',
      bg: 'rgba(245, 158, 11, 0.08)', 
      icon: UserCheck,
      desc: 'Partner en route'
    },
    { 
      label: 'In Processing', 
      value: 'Collected', 
      count: orders.filter(o => statusMatch(o.status, 'Collected')).length, 
      color: '#8b5cf6', 
      gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
      bg: 'rgba(139, 92, 246, 0.08)', 
      icon: Shirt,
      desc: 'Washing & Ironing'
    },
    { 
      label: 'Ready to Ship', 
      value: 'Ready', 
      count: orders.filter(o => statusMatch(o.status, 'Ready')).length, 
      color: '#06b6d4', 
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      bg: 'rgba(6, 182, 212, 0.08)', 
      icon: Sparkles,
      desc: 'Care completed'
    },
    { 
      label: 'Out for Delivery', 
      value: 'Out for Delivery', 
      count: orders.filter(o => statusMatch(o.status, 'Out for Delivery')).length, 
      color: '#ec4899', 
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      bg: 'rgba(236, 72, 153, 0.08)', 
      icon: Truck,
      desc: 'Partner in transit'
    },
    { 
      label: 'Completed', 
      value: 'Delivered', 
      count: orders.filter(o => statusMatch(o.status, 'Delivered')).length, 
      color: '#10b981', 
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      bg: 'rgba(16, 185, 129, 0.08)', 
      icon: CheckCircle,
      desc: 'Successfully delivered'
    }
  ];

  // Helper to generate dynamic colored customer avatars
  const getAvatar = (name) => {
    const letter = name ? name.charAt(0).toUpperCase() : 'C';
    const colors = [
      'linear-gradient(135deg, #0EA5E9, #3B82F6)',
      'linear-gradient(135deg, #10B981, #059669)',
      'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      'linear-gradient(135deg, #EC4899, #BE185D)',
      'linear-gradient(135deg, #F59E0B, #D97706)'
    ];
    const index = (name || '').charCodeAt(0) % colors.length;
    return (
      <div style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: colors[index],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
        flexShrink: 0
      }}>
        {letter}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', overflow: 'visible', animation: 'fadeInPage 0.45s ease-out' }}>
      
      {/* Glow Orbs & CSS overrides */}
      <style>{`
        @keyframes fadeInPage {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(130px);
          z-index: 0;
          pointer-events: none;
          opacity: 0.1;
        }
        .bg-orb-blue {
          top: -20px;
          right: 8%;
          width: 320px;
          height: 320px;
          background: linear-gradient(135deg, #38bdf8, #0ea5e9);
        }
        .bg-orb-purple {
          bottom: 10%;
          left: 5%;
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #a78bfa, #8b5cf6);
        }
        .fintech-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
          border-radius: 18px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .kpi-card {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .kpi-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 28px -10px rgba(15, 23, 42, 0.12) !important;
        }
        .order-row {
          transition: background-color 0.15s ease;
          border-left: 3px solid transparent;
        }
        .order-row:hover {
          background-color: rgba(37, 99, 235, 0.03) !important;
          border-left: 3px solid #2563eb;
        }
        .id-chip {
          display: inline-block;
          font-family: 'SFMono-Regular', Consolas, Monaco, monospace;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .id-chip-blue   { color: #0284c7; }
        .id-chip-purple { color: #7c3aed; }
        .kpi-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .kpi-scroll-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
        }
        .kpi-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 10px;
        }
        .search-glass {
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .search-glass:focus-within {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }
      `}</style>

      {/* Floating Ambient Background */}
      <div className="bg-orb bg-orb-blue"></div>
      <div className="bg-orb bg-orb-purple"></div>

      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: 26, position: 'relative', zIndex: 100 }}>
        <div className="page-title-group">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', letterSpacing: '-0.01em', margin: 0 }}>
            Manage Bookings
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 4, fontWeight: 400 }}>
            Filter, assign, track, and export active customer laundry bookings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Bulk Ready Button Removed */}
          
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '10px 18px', 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                border: 'none',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)'
              }} 
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={15} />
              <span>Export Bookings</span>
              <ChevronDown size={14} />
            </button>
            
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', width: 160 }}>
                <button onClick={() => { handleExportExcel(); setShowExportMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  <FileText size={16} style={{ color: '#10b981' }}/> Excel (CSV)
                </button>
                <button onClick={() => { handleExportPDF(); setShowExportMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  <FileText size={16} style={{ color: '#ef4444' }}/> PDF Report
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI Clickable Filter Cards */}
      <div 
        className="kpi-scroll-container" 
        style={{ 
          display: 'flex', 
          gap: 10, 
          overflowX: 'auto', 
          paddingTop: 12,
          paddingBottom: 20,
          marginBottom: 8
        }}
      >
        {statusKPIs.map(kpi => {
          const isActive = filterStatus === kpi.value;
          return (
            <div 
              key={kpi.label}
              className="fintech-card kpi-card"
              onClick={() => setFilterStatus(kpi.value)}
              style={{ 
                minWidth: 135, 
                padding: '12px 14px', 
                flex: '1 1 auto', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: isActive ? `2px solid ${kpi.color}` : '1px solid rgba(255, 255, 255, 0.45)',
                boxShadow: isActive ? `0 10px 25px -5px ${kpi.bg}` : '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
                transform: isActive ? 'translateY(-3px)' : 'none',
                background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.75)'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '10px', background: kpi.bg, color: kpi.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                boxShadow: `0 4px 12px ${kpi.bg}`
              }}>
                <kpi.icon size={18} />
              </div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {kpi.label}
              </h3>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {kpi.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date Range & Status Filter and Search Controls Row */}
      <div className="fintech-card" style={{ padding: '16px 20px', marginBottom: 28, overflow: 'visible', zIndex: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            backgroundColor: 'rgba(255,255,255,0.8)', 
            border: '1px solid rgba(226, 232, 240, 0.8)', 
            padding: '10px 18px', 
            borderRadius: '12px', 
            flex: 1, 
            maxWidth: 400 
          }}
          className="search-glass"
          >
            <Search size={16} style={{ color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by ID, Name or Phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}
            />
          </div>
          
        </div>
      </div>

      {/* Orders List Card Table */}
      <div className="fintech-card" style={{ padding: 0 }}>
        <div className="card-header" style={{ 
          background: 'linear-gradient(to right, rgba(37, 99, 235, 0.03), transparent)', 
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '20px 24px' 
        }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Laundry Care Bookings
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              Live customer bookings queue and assignment ledger.
            </p>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '0.78rem', tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 40, paddingLeft: 14, paddingRight: 8 }}>#</th>
                  <th style={{ width: 140 }}>Booking ID</th>
                  <th style={{ width: 160 }}>Customer</th>
                  <th style={{ width: 130 }}>Phone</th>
                  <th style={{ width: 110 }}>Landmark</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Payment</th>
                  <th style={{ width: 90, textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 60, paddingRight: 14, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentPageOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontWeight: 600 }}>
                      No matching bookings found under this status.
                    </td>
                  </tr>
                ) : (
                  currentPageOrders.map((o, idx) => (
                    <tr key={o.id} className="order-row">
                      <td style={{ paddingLeft: 14, paddingRight: 8, color: '#94a3b8', fontWeight: 600, fontSize: '0.74rem' }}>{indexOfFirstOrder + idx + 1}</td>
                      <td style={{ paddingTop: 10, paddingBottom: 10 }}>
                        <span className="id-chip id-chip-blue notranslate" translate="no" style={{ fontSize: '0.75rem', fontWeight: 800 }}>{fmtBookingId(o.id)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: ['linear-gradient(135deg,#0EA5E9,#3B82F6)','linear-gradient(135deg,#10B981,#059669)','linear-gradient(135deg,#8B5CF6,#6D28D9)','linear-gradient(135deg,#EC4899,#BE185D)','linear-gradient(135deg,#F59E0B,#D97706)'][(o.customerNameSnapshot||'').charCodeAt(0) % 5],
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.72rem', flexShrink: 0
                          }}>
                            {(o.customerNameSnapshot || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem', lineHeight: 1.2 }}>
                              {o.customerNameSnapshot || 'Unknown'}
                            </div>
                            {o.customerPhone && (
                              <div className="notranslate" translate="no" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7', marginTop: 1, letterSpacing: '0.3px' }}>
                                CUS{String(o.customerPhone).slice(-4)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem' }}>
                        {formatPhone(o.customerPhone || o.customer?.phone)}
                      </td>
                      <td style={{ maxWidth: 95, overflow: 'hidden' }}>
                        <SmartTooltip
                          text={o.pickupLandmark || ''}
                          style={{ maxWidth: 88, fontSize: '0.74rem', color: '#B45309', fontWeight: 600 }}
                          icon={o.pickupLandmark ? <MapPin size={11} color="#B45309" /> : null}
                        />
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusClass(o.status)}`} style={{ fontWeight: 700, fontSize: '0.67rem', padding: '3px 8px' }}>
                          {getStatusLabel(o.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}`} style={{ fontWeight: 800, fontSize: '0.67rem', padding: '3px 8px' }}>
                          {o.paymentStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {o.totalAmount ? `₹${o.totalAmount.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ paddingRight: 14, textAlign: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '5px 8px', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto' }} 
                          onClick={() => setSelectedOrder(o)}
                          title="View Order Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalOrdersPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(248, 250, 252, 0.5)'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, totalOrdersCount)} of {totalOrdersCount} entries
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    background: currentPage === 1 ? 'transparent' : '#FFF',
                    color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-dark)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {getPageNumbers(currentPage, totalOrdersPages).map((pageNum, index) => {
                  if (pageNum === '...') {
                    return (
                      <span key={`dots-${index}`} style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        border: '1px solid',
                        borderColor: currentPage === pageNum ? 'var(--primary-dark)' : 'rgba(226, 232, 240, 0.8)',
                        background: currentPage === pageNum ? 'var(--primary-dark)' : '#FFF',
                        color: currentPage === pageNum ? '#FFF' : 'var(--text-dark)',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        minWidth: 32,
                        transition: 'all 0.2s'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalOrdersPages))}
                  disabled={currentPage === totalOrdersPages}
                  style={{
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    background: currentPage === totalOrdersPages ? 'transparent' : '#FFF',
                    color: currentPage === totalOrdersPages ? 'var(--text-muted)' : 'var(--text-dark)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: currentPage === totalOrdersPages ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: currentPage === totalOrdersPages ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
