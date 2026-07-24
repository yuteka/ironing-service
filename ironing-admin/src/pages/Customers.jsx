import React, { useState, useEffect } from 'react';
import { 
  Eye, X, Phone, Navigation, Clock, Receipt, Coins, Activity, Search, Download, Send, 
  FileText, Truck, ArrowLeft, CreditCard, Calendar, User, MapPin, ShoppingBag, Package, 
  CheckCircle, ChevronDown, ChevronUp, Info, Wallet, Check, AlertCircle, XCircle, ExternalLink,
  ChevronLeft, ChevronRight, MessageSquare, Mail, Copy, Share2
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatPhone } from '../utils/formatPhone';
import SmartTooltip from '../components/SmartTooltip';

export default function Customers({ customers, loading, loadAllData, triggerToast, setConfirmModal, setSelectedOrder, API_BASE }) {
  const [selectedCust, setSelectedCust] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [profileTab, setProfileTab] = useState('bookings');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [custDirPage, setCustDirPage] = useState(1);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [shareModalData, setShareModalData] = useState(null);
  const profilePageSize = 10;
  const dirPageSize = 10;

  useEffect(() => {
    setBookingsPage(1);
    setTransactionsPage(1);
  }, [selectedCust]);

  useEffect(() => { setCustDirPage(1); }, [searchQuery]);

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

  const PaginationControls = ({ currentPage, totalPages, setPage }) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          Page {currentPage} of {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              border: '1px solid #e2e8f0',
              background: currentPage === 1 ? 'transparent' : '#FFF',
              color: currentPage === 1 ? '#94a3b8' : '#334155',
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

          {getPageNumbers(currentPage, totalPages).map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span key={`dots-${index}`} style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  ...
                </span>
              );
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  border: '1px solid',
                  borderColor: currentPage === pageNum ? '#2c7da0' : '#e2e8f0',
                  background: currentPage === pageNum ? '#2c7da0' : '#FFF',
                  color: currentPage === pageNum ? '#FFF' : '#334155',
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
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              border: '1px solid #e2e8f0',
              background: currentPage === totalPages ? 'transparent' : '#FFF',
              color: currentPage === totalPages ? '#94a3b8' : '#334155',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              opacity: currentPage === totalPages ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (selectedCust) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCust]);

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  // Add derived fields (totalSpend, isActive, lastOrderDate)
  const enhancedCustomers = customers.map(c => {
    const orders = c.orders || [];
    const totalSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    let isActive = false;
    let lastOrderDate = null;
    if (orders.length > 0) {
      const latestOrder = [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const latest = new Date(latestOrder.createdAt);
      lastOrderDate = latest;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (latest >= thirtyDaysAgo) isActive = true;
    }
    return { ...c, totalSpend, isActive, lastOrderDate };
  });

  const filteredCustomers = enhancedCustomers.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.landmark || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const totalDirCount = sortedCustomers.length;
  const totalDirPages = Math.ceil(totalDirCount / dirPageSize);
  const dirIndexStart = (custDirPage - 1) * dirPageSize;
  const dirIndexEnd = dirIndexStart + dirPageSize;
  const pagedCustomers = sortedCustomers.slice(dirIndexStart, dirIndexEnd);

  // Helper: format IDs with meaningful prefixes without hyphens
  const fmtCustId  = (phone) => `CUS${String(phone).slice(-4)}`;
  const fmtBookingId = (id)  => `BK2026${String(id).padStart(4, '0')}`;
  const fmtInvId   = (id)    => `INV2026${String(id).padStart(4, '0')}`;

  const getExportData = () => {
    const headers = ['S.No.', 'Customer ID', 'Full Name', 'Phone', 'Address', 'Landmark', 'Total Orders', 'Total Spend', 'Last Order', 'Status'];
    const rows = sortedCustomers.map((c, idx) => [
      idx + 1,
      fmtCustId(c.phone),
      c.name,
      c.phone,
      c.address,
      c.landmark || '',
      c.orders?.length || 0,
      c.totalSpend.toFixed(2),
      c.lastOrderDate ? c.lastOrderDate.toLocaleDateString('en-GB') : '',
      c.isActive ? 'Active' : 'Inactive'
    ]);
    return { headers, rows };
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(`customers_directory_${new Date().toISOString().slice(0,10)}`, [headers, ...rows]);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('Customers Directory', `customers_directory_${new Date().toISOString().slice(0,10)}`, headers, rows);
  };

  const getCustomerMetrics = (c) => {
    const orders = c.orders || [];
    const totalOrders = orders.length;
    // Case-insensitive match for backend status variations ('Delivered' vs 'DELIVERED')
    const isDelivered = (o) => (o.status || '').toLowerCase() === 'delivered';
    const isCancelled = (o) => (o.status || '').toLowerCase() === 'cancelled';

    const completed = orders.filter(isDelivered).length;
    const pending   = orders.filter(o => !isDelivered(o) && !isCancelled(o)).length;
    
    const totalPaid = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
    // Assume orders[0] is the oldest order if not explicitly sorted
    const firstOrderDate = orders.length > 0 ? new Date(orders[orders.length - 1].createdAt < orders[0].createdAt ? orders[orders.length - 1].createdAt : orders[0].createdAt) : new Date();
    const activeDays = orders.length > 0 ? Math.max(1, Math.ceil((new Date() - firstOrderDate) / (1000 * 60 * 60 * 24))) : 0;
    
    let lastOrderDateFormatted = 'Never';
    if (orders.length > 0) {
      const latestOrder = [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      lastOrderDateFormatted = new Date(latestOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const lastActive = orders.length > 0 ? firstOrderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
    
    return { totalOrders, completed, pending, totalPaid, lastActive, activeDays, orders, lastOrderDateFormatted };
  };

  const handleSendInvoice = async (orderId) => {
    setSendingInvoice(true);
    const currentApiBase = API_BASE || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:3000/api` : 'https://ironing-service.onrender.com/api');
    try {
      const res = await fetch(`${currentApiBase}/orders/${orderId}/send-invoice`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        triggerToast('Invoice sent successfully via WhatsApp!', 'success');
      } else {
        triggerToast('Failed to send invoice.', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Network error while sending invoice.', 'error');
    } finally {
      setSendingInvoice(false);
    }
  };

  const toggleOrderExpand = (id) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getStatusConfig = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') return { color: '#166534', bg: '#dcfce7', icon: <Check size={14} />, border: '#22c55e' };
    if (s === 'CANCELLED') return { color: '#991b1b', bg: '#fee2e2', icon: <X size={14} />, border: '#ef4444' };
    if (s === 'PICKUP ASSIGNED' || s === 'PICKUP_ASSIGNED') return { color: '#1e40af', bg: '#dbeafe', icon: <Truck size={14} />, border: '#3b82f6' };
    if (s === 'READY') return { color: '#166534', bg: '#dcfce7', icon: <Check size={14} />, border: '#22c55e' };
    return { color: '#b45309', bg: '#fef3c7', icon: <Clock size={14} />, border: '#f59e0b' };
  };

  const getPaymentStatusConfig = (status) => {
    if (status === 'Paid') return { color: '#166534', bg: '#dcfce7', icon: <Check size={14} /> };
    return { color: '#b45309', bg: '#fef3c7', icon: <Clock size={14} /> };
  };

  // --------------------------------------------------------
  // DIRECTORY VIEW (LIST)
  // --------------------------------------------------------
  if (!selectedCust) {
    return (
      <div className="w-full space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Monitor customer profile details, lifetime value, and order history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Export</span>
                <ChevronDown size={14} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => { handleExportExcel(); setShowExportMenu(false); }}
                  >
                    <FileText size={16} className="text-emerald-600" />
                    <span>Export to Excel (.xlsx)</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                  >
                    <FileText size={16} className="text-red-500" />
                    <span>Export to PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl max-w-md">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, address, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="fintech-card" style={{ padding: 0, boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ fontSize: '0.85rem', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ width: 65, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>S.No</th>
                    <th style={{ width: 220, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Customer Name</th>
                    <th style={{ width: 130, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Phone</th>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Landmark</th>
                    <th style={{ width: 120, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Total Orders</th>
                    <th style={{ width: 120, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Total Spend</th>
                    <th style={{ width: 130, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Last Order</th>
                    <th style={{ width: 150, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Status</th>
                    <th style={{ width: 100, padding: '16px 24px', color: '#64748b', fontWeight: 700 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 600 }}>
                        No customers found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    pagedCustomers.map((c, idx) => (
                      <tr key={c.phone} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#94a3b8' }}>#{dirIndexStart + idx + 1}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                              {String(c.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', whiteSpace: 'nowrap', lineHeight: 1 }}>
                                {c.name || 'Unknown User'}
                              </div>
                              {c.phone && (
                                <div className="notranslate" translate="no" style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', lineHeight: 1, letterSpacing: '0.5px' }}>
                                  {fmtCustId(c.phone)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{formatPhone(c.phone)}</td>
                        <td style={{ padding: '16px 24px', maxWidth: 125, overflow: 'hidden' }}>
                          <SmartTooltip
                            text={c.landmark || ''}
                            style={{ maxWidth: 110, fontSize: '0.82rem', color: '#B45309', fontWeight: 600 }}
                            icon={c.landmark ? <MapPin size={11} color="#B45309" /> : null}
                          />
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 800, color: '#0ea5e9' }}>{c.orders?.length || 0}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669' }}>₹{c.totalSpend.toFixed(2)}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          {c.lastOrderDate ? c.lastOrderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {c.isActive ? (
                            <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              Active
                            </span>
                          ) : (
                            <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '8px', color: '#3b82f6', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedCust(c)}>
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalDirPages >= 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Showing {dirIndexStart + 1} to {Math.min(dirIndexEnd, totalDirCount)} of {totalDirCount} customers
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    onClick={() => setCustDirPage(prev => Math.max(prev - 1, 1))}
                    disabled={custDirPage === 1}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: custDirPage === 1 ? 'transparent' : '#FFF',
                      color: custDirPage === 1 ? '#94a3b8' : '#334155',
                      padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                      cursor: custDirPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      opacity: custDirPage === 1 ? 0.5 : 1, transition: 'all 0.2s'
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  {getPageNumbers(custDirPage, totalDirPages).map((pageNum, index) => {
                    if (pageNum === '...') return <span key={`d-${index}`} style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#94a3b8' }}>...</span>;
                    return (
                      <button key={pageNum} onClick={() => setCustDirPage(pageNum)} style={{
                        border: '1px solid', borderColor: custDirPage === pageNum ? '#2c7da0' : '#e2e8f0',
                        background: custDirPage === pageNum ? '#2c7da0' : '#FFF',
                        color: custDirPage === pageNum ? '#FFF' : '#334155',
                        padding: '6px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                        cursor: 'pointer', minWidth: 32, transition: 'all 0.2s'
                      }}>{pageNum}</button>
                    );
                  })}
                  <button
                    onClick={() => setCustDirPage(prev => Math.min(prev + 1, totalDirPages))}
                    disabled={custDirPage === totalDirPages}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: custDirPage === totalDirPages ? 'transparent' : '#FFF',
                      color: custDirPage === totalDirPages ? '#94a3b8' : '#334155',
                      padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                      cursor: custDirPage === totalDirPages ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      opacity: custDirPage === totalDirPages ? 0.5 : 1, transition: 'all 0.2s'
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

  // --------------------------------------------------------
  // FULL SCREEN PROFILE VIEW (TOP-TO-BOTTOM CRM LAYOUT)
  // --------------------------------------------------------
  const metrics = getCustomerMetrics(selectedCust);

  return (
    <div style={{ animation: 'fadeInPage 0.3s ease-out', background: '#f8fafc', minHeight: '100vh', paddingBottom: 60 }}>
      
      {/* 1. CUSTOMER HEADER (TOP) */}
      <div className="crm-profile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button 
            onClick={() => setSelectedCust(null)}
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.8rem', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }}>
            {(selectedCust.name || 'U').charAt(0).toUpperCase()}
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{selectedCust.name || 'Unknown User'}</h1>
              <span style={{ padding: '4px 12px', background: selectedCust.isActive ? '#dcfce7' : '#f1f5f9', color: selectedCust.isActive ? '#166534' : '#475569', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${selectedCust.isActive ? '#bbf7d0' : '#e2e8f0'}` }}>
                {selectedCust.isActive ? 'Active Member' : 'Inactive'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} /> {formatPhone(selectedCust.phone)}
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#64748b', fontWeight: 600 }}>ID: {fmtCustId(selectedCust.phone)}</span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* 2. KPI CARDS (5 in one row) */}
        <div className="crm-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>

          {/* Total Orders */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 20px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Orders</div>
              <div style={{ color: '#3b82f6', background: '#eff6ff', padding: '6px', borderRadius: 10, display: 'flex', flexShrink: 0 }}>
                <ShoppingBag size={16} />
              </div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 8 }}>{metrics.totalOrders}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Lifetime engagement</div>
          </div>

          {/* Completed Orders */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 20px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</div>
              <div style={{ color: '#10b981', background: '#ecfdf5', padding: '6px', borderRadius: 10, display: 'flex', flexShrink: 0 }}>
                <CheckCircle size={16} />
              </div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 8 }}>{metrics.completed}</div>
            <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>Successfully delivered</div>
          </div>

          {/* Pending/Active Orders */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 20px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending/Active</div>
              <div style={{ color: '#f59e0b', background: '#fffbeb', padding: '6px', borderRadius: 10, display: 'flex', flexShrink: 0 }}>
                <Clock size={16} />
              </div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 8 }}>{metrics.pending}</div>
            <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>Currently processing</div>
          </div>

          {/* Total Spend */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 20px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Spend</div>
              <div style={{ color: '#8b5cf6', background: '#f5f3ff', padding: '6px', borderRadius: 10, display: 'flex', flexShrink: 0 }}>
                <Coins size={16} />
              </div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 8 }}>₹{(metrics.totalPaid || 0).toFixed(0)}</div>
            <div style={{ fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 600 }}>Lifetime value</div>
          </div>

          {/* Last Order Date */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 20px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Order</div>
              <div style={{ color: '#ec4899', background: '#fdf2f8', padding: '6px', borderRadius: 10, display: 'flex', flexShrink: 0 }}>
                <Calendar size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 8 }}>{metrics.lastOrderDateFormatted}</div>
            <div style={{ fontSize: '0.82rem', color: '#ec4899', fontWeight: 600 }}>Most recent booking</div>
          </div>

        </div>

        {/* 3. LANDMARK SECTION */}
        <div className="crm-address-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ background: '#fef3c7', padding: 12, borderRadius: '50%', color: '#d97706' }}>
              <Navigation size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Customer Landmark</div>
              <div 
                style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706', maxWidth: '600px', lineHeight: 1.4, cursor: 'help' }}
                title={selectedCust.landmark || 'No landmark provided.'}
              >
                {selectedCust.landmark || 'No landmark provided.'}
              </div>
            </div>
          </div>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${selectedCust.latitude && selectedCust.longitude ? `${selectedCust.latitude},${selectedCust.longitude}` : encodeURIComponent(selectedCust.address || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', 
              borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
          >
            <ExternalLink size={16} /> Open in Maps
          </a>
        </div>

        {/* TABS SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <button 
              onClick={() => setProfileTab('bookings')}
              style={{ 
                padding: '12px 0', 
                background: 'transparent', 
                border: 'none', 
                borderBottom: profileTab === 'bookings' ? '3px solid #0ea5e9' : '3px solid transparent',
                color: profileTab === 'bookings' ? '#0f172a' : '#64748b',
                fontWeight: profileTab === 'bookings' ? 800 : 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              Booking 
            </button>
            <button 
              onClick={() => setProfileTab('transactions')}
              style={{ 
                padding: '12px 0', 
                background: 'transparent', 
                border: 'none', 
                borderBottom: profileTab === 'transactions' ? '3px solid #0ea5e9' : '3px solid transparent',
                color: profileTab === 'transactions' ? '#0f172a' : '#64748b',
                fontWeight: profileTab === 'transactions' ? 800 : 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              Invoice 
            </button>
          </div>
        </div>

        {/* 4. BOOKING HISTORY (TABLE) */}
        {profileTab === 'bookings' && (() => {
          const sortedBookings = [...metrics.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const totalBkPages = Math.ceil(sortedBookings.length / profilePageSize);
          const bkStart = (bookingsPage - 1) * profilePageSize;
          const bkEnd = bkStart + profilePageSize;
          const pagedBookings = sortedBookings.slice(bkStart, bkEnd);
          return (
        <div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking ID</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {!metrics.orders || metrics.orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>No bookings found.</td>
                  </tr>
                ) : (
                  pagedBookings.map(o => {
                    const statusConf = getStatusConfig(o.status);
                    const dt = new Date(o.createdAt);
                    return (
                      <tr 
                        key={o.id} 
                        style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s', cursor: 'default' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          <span style={{ fontFamily: 'monospace', color: '#0284c7', fontSize: '0.85rem' }}>
                            {fmtBookingId(o.id)}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                          {o.items?.length > 0 ? o.items.reduce((sum, item) => sum + item.quantity, 0) + ' items' : '-'}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Truck size={12} style={{ color: '#64748b' }} />
                            </div>
                            <span style={{ fontSize: '0.9rem', color: o.partner ? '#334155' : '#94a3b8', fontWeight: o.partner ? 600 : 400 }}>
                              {o.partner ? o.partner.name : 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: statusConf.bg, color: statusConf.color, padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {statusConf.icon} {toTitleCase(o.status)}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                          {o.totalAmount ? `₹${o.totalAmount.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            </div>
            <PaginationControls currentPage={bookingsPage} totalPages={totalBkPages} setPage={setBookingsPage} />
          </div>
        </div>
          );
        })()}

        {/* 5. TRANSACTION LEDGER (TABLE) */}
        {profileTab === 'transactions' && (() => {
          const sortedTxns = [...metrics.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const totalTxPages = Math.ceil(sortedTxns.length / profilePageSize);
          const txStart = (transactionsPage - 1) * profilePageSize;
          const txEnd = txStart + profilePageSize;
          const pagedTxns = sortedTxns.slice(txStart, txEnd);
          return (
        <div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice ID</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gateway & Ref</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!metrics.orders || metrics.orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>No transactions found.</td>
                  </tr>
                ) : (
                  pagedTxns.map(o => {
                    const payConf = getPaymentStatusConfig(o.paymentStatus);
                    return (
                      <tr 
                        key={`tx-${o.id}`} 
                        style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          {o.paymentStatus === 'Paid' ? (
                            <span style={{ fontFamily: 'monospace', color: '#7c3aed', fontSize: '0.85rem' }}>
                              {fmtInvId(o.id)}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                          {new Date(o.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Wallet size={12} style={{ color: '#64748b' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{o.paymentMethod || 'N/A'}</div>
                              {o.razorpayPaymentId && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{o.razorpayPaymentId}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: payConf.bg, color: payConf.color, padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {payConf.icon} {toTitleCase(o.paymentStatus || 'Pending')}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: o.paymentStatus === 'Paid' ? '#166534' : '#0f172a', fontSize: '0.95rem' }}>
                          {o.totalAmount ? `₹${o.totalAmount.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 700, minHeight: 'auto' }}
                            onClick={() => setSelectedPaymentOrder(o)}
                            title="View Payment Details"
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            </div>
            <PaginationControls currentPage={transactionsPage} totalPages={totalTxPages} setPage={setTransactionsPage} />
          </div>
        </div>
          );
        })()}
        
      </div>

      {/* Payment Detail Modal / Drawer */}
      {selectedPaymentOrder && (() => {
        const amt = Number(selectedPaymentOrder.totalAmount || 0);
        const amtFormatted = amt.toFixed(2);
        const baseAmtFormatted = (amt / 1.05).toFixed(2);
        const taxAmtFormatted = (amt - (amt / 1.05)).toFixed(2);
        const custName = selectedPaymentOrder.customerNameSnapshot || selectedCust?.name || 'Customer';

        return (
          <div className="drawer-overlay" onClick={() => setSelectedPaymentOrder(null)}>
            <div className="drawer-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, overflowY: 'auto', padding: '24px 28px' }}>
              <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 18px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Payment Details
                  </h2>
                  <span className="notranslate" translate="no" style={{ fontSize: '0.78rem', color: selectedPaymentOrder.paymentStatus === 'Paid' ? '#7c3aed' : '#64748b', fontWeight: 800, fontFamily: 'monospace' }}>
                    {selectedPaymentOrder.paymentStatus === 'Paid' ? fmtInvId(selectedPaymentOrder.id) : `Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')} (Pending Payment)`}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedPaymentOrder(null)} 
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#64748b', padding: 6, display: 'flex', alignItems: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-body" style={{ padding: '20px 0 0 0' }}>
                {/* Payment Summary Box */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Status</span>
                    <span style={{ 
                      padding: '4px 12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      backgroundColor: selectedPaymentOrder.paymentStatus === 'Paid' ? '#ECFDF5' : '#FEF3C7', 
                      color: selectedPaymentOrder.paymentStatus === 'Paid' ? '#059669' : '#D97706', 
                      borderRadius: 6 
                    }}>
                      {selectedPaymentOrder.paymentStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Amount Billed</span>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A' }}>
                      ₹{amtFormatted}
                    </span>
                  </div>
                </div>

                {/* Transaction Meta Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Transaction Ref ID</span>
                    <span className="notranslate" translate="no" style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                      {selectedPaymentOrder.razorpayPaymentId || `pay_mock_${selectedPaymentOrder.id}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Booking Ref</span>
                    <span className="notranslate" translate="no" style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                      {fmtBookingId(selectedPaymentOrder.id)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Payment Method</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      Razorpay Online (UPI / Card / NetBanking)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Payment Date & Time</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      {new Date(selectedPaymentOrder.updatedAt || selectedPaymentOrder.createdAt || Date.now()).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Customer Name</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      {custName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Customer Phone</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      {selectedPaymentOrder.customerPhone || selectedCust?.phone ? formatPhone(selectedPaymentOrder.customerPhone || selectedCust?.phone) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Payment Link & Sharing Box */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Razorpay Payment Checkout Link
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#0ea5e9', fontWeight: 700, background: '#e0f2fe', padding: '2px 8px', borderRadius: 10 }}>Active</span>
                  </div>
                  
                  {(() => {
                    const currentApiBase = API_BASE || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:3000/api` : 'https://ironing-service.onrender.com/api');
                    const realRzpLink = selectedPaymentOrder.paymentLink || selectedPaymentOrder.razorpayPaymentLink || `${currentApiBase.replace(/\/api$/, '')}/pay/${selectedPaymentOrder.id}`;
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }}>
                          <span className="notranslate" translate="no" style={{ fontSize: '0.78rem', color: '#334155', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {realRzpLink}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(realRzpLink);
                              setCopiedId(`pay-${selectedPaymentOrder.id}`);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: 2, display: 'flex', alignItems: 'center' }}
                            title="Copy Payment Link"
                          >
                            {copiedId === `pay-${selectedPaymentOrder.id}` ? <Check size={16} style={{ color: '#16a34a' }} /> : <Copy size={16} />}
                          </button>
                        </div>

                        {/* Share Payment Link Button */}
                        <button 
                          onClick={() => setShareModalData({
                            type: 'payment',
                            order: selectedPaymentOrder,
                            url: realRzpLink,
                            text: `Hi ${custName}, here is your Razorpay payment link for Ironing Service Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')} (Total: ₹${amtFormatted}):\n${realRzpLink}`,
                            subject: `Razorpay Payment Link for Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')}`,
                            emailBody: `Hi ${custName},\n\nPlease complete your payment of ₹${amtFormatted} using the Razorpay link below:\n${realRzpLink}\n\nThank you,\nIroning Service`
                          })}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#0284c7', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}
                        >
                          <Share2 size={16} /> Share Payment Link
                        </button>
                      </>
                    );
                  })()}
                </div>

                {/* GST Tax Breakdown */}
                <div className="bg-slate-100/90 rounded-2xl p-4 mb-5 space-y-2 border border-slate-200/80">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Tax & Computation Breakdown
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Base Amount (Excl. Tax)</span>
                    <span>₹{baseAmtFormatted}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>GST (5%)</span>
                    <span>₹{taxAmtFormatted}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold border-t border-slate-300 pt-2 text-slate-900">
                    <span>Total Amount Billed</span>
                    <span>₹{amtFormatted}</span>
                  </div>
                </div>

                {/* Action Buttons: Download & Share Tax Invoice */}
                <div className="flex flex-col gap-2.5">
                  {/* Share Tax Invoice Button */}
                  {(() => {
                    const currentApiBase = API_BASE || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:3000/api` : 'https://ironing-service.onrender.com/api');
                    const invoiceUrl = `${currentApiBase.replace(/\/api$/, '')}/invoice/${selectedPaymentOrder.id}`;
                    return (
                      <>
                        {selectedPaymentOrder.paymentStatus === 'Paid' && (
                          <button
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                            onClick={() => {
                              window.open(invoiceUrl, '_blank');
                            }}
                          >
                            <Download size={16} /> Download Tax Invoice (PDF)
                          </button>
                        )}

                        <button 
                          onClick={() => setShareModalData({
                            type: 'invoice',
                            order: selectedPaymentOrder,
                            url: invoiceUrl,
                            text: `Hi ${custName}, here is your Tax Invoice PDF for Ironing Service Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')}:\n${invoiceUrl}`,
                            subject: `Tax Invoice for Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')}`,
                            emailBody: `Hi ${custName},\n\nPlease find your Tax Invoice for Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')} at the link below:\n${invoiceUrl}\n\nThank you,\nIroning Service`
                          })}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <Share2 size={16} /> Share Tax Invoice
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modern Compact Floating Popover Share Card Modal */}
      {shareModalData && (
        <div 
          onClick={() => setShareModalData(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px 22px',
              width: '100%',
              maxWidth: '300px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.22)',
              border: '1px solid #E2E8F0',
              boxSizing: 'border-box'
            }}
          >
            {/* Popover Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Share on
              </span>
              <button 
                onClick={() => setShareModalData(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Clean Vertically Stacked List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* WhatsApp */}
              <a 
                href={`https://api.whatsapp.com/send?phone=${(shareModalData.order.customerPhone || selectedCust?.phone || '').replace(/\D/g, '')}&text=${encodeURIComponent(shareModalData.text)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareModalData(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="30" height="30" viewBox="0 0 48 48">
                  <path fill="#4CAF50" d="M24 4C12.95 4 4 12.95 4 24c0 3.55.93 6.88 2.56 9.77L4 44l10.45-2.52C17.25 43.08 20.54 44 24 44c11.05 0 20-8.95 20-20S35.05 4 24 4z"/>
                  <path fill="#FFF" d="M35.1 30.6c-.6-.3-3.4-1.7-3.9-1.9-.5-.2-.9-.3-1.3.3-.4.6-1.5 1.9-1.8 2.3-.3.4-.7.4-1.3.1-.6-.3-2.6-1-5-3.1-1.9-1.7-3.1-3.8-3.5-4.4-.4-.6 0-.9.3-1.2.3-.3.6-.7.9-1.1.3-.4.4-.7.6-1.1.2-.4.1-.8 0-1.1-.1-.3-1.3-3.1-1.8-4.3-.5-1.1-1-1-1.3-1h-1.2c-.4 0-1.1.1-1.7.8-.6.6-2.3 2.2-2.3 5.4 0 3.2 2.3 6.3 2.7 6.7.3.4 4.6 7 11.2 9.8 1.6.7 2.8 1.1 3.8 1.4 1.6.5 3 .4 4.1.2 1.3-.2 3.4-1.4 3.9-2.7.5-1.3.5-2.5.3-2.7-.1-.2-.5-.3-1.1-.6z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* SMS */}
              <a 
                href={`sms:${(shareModalData.order.customerPhone || selectedCust?.phone || '').replace(/\D/g, '')}?body=${encodeURIComponent(shareModalData.text)}`}
                onClick={() => setShareModalData(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <Send size={15} />
                </div>
                <span>SMS</span>
              </a>

              {/* Gmail / Email */}
              <a 
                href={`https://mail.google.com/mail/u/0/?fs=1&tf=1&source=mailto&su=${encodeURIComponent(shareModalData.subject)}&body=${encodeURIComponent(shareModalData.emailBody)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (navigator.share) {
                    e.preventDefault();
                    navigator.share({
                      title: shareModalData.subject,
                      text: shareModalData.emailBody,
                      url: shareModalData.url
                    }).catch(() => {
                      window.open(`https://mail.google.com/mail/u/0/?fs=1&tf=1&source=mailto&su=${encodeURIComponent(shareModalData.subject)}&body=${encodeURIComponent(shareModalData.emailBody)}`, '_blank');
                    });
                  }
                  setShareModalData(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="30" height="30" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 23.5L42 10.5V36c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4V10.5l18 13z"/>
                  <path fill="#EA4335" d="M10 8h28c2.2 0 4 1.8 4 4v.5L24 24.5 6 12.5V12c0-2.2 1.8-4 4-4z"/>
                  <path fill="#FBBC04" d="M42 12.5L24 24.5 6 12.5V12c0-.7.2-1.4.6-2L24 22.5 41.4 10c.4.6.6 1.3.6 2v.5z"/>
                </svg>
                <span>Gmail / Email App</span>
              </a>

              {/* Copy Link */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareModalData.url);
                  setCopiedId(`modal-${shareModalData.order.id}`);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'none',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  {copiedId === `modal-${shareModalData.order.id}` ? <Check size={16} style={{ color: '#4ade80' }} /> : <Copy size={15} />}
                </div>
                <span>{copiedId === `modal-${shareModalData.order.id}` ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
