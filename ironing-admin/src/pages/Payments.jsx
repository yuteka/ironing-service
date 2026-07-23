import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, DollarSign, Receipt, CreditCard, Activity, Copy, Check, Eye, ChevronDown, FileText, ChevronLeft, ChevronRight, X, MessageSquare, Send, Mail, Share2, ExternalLink } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatPhone } from '../utils/formatPhone';

export default function Payments({ payments, orders = [], loading, loadAllData, gstPercentage = 5.0, setSelectedOrder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
  const [shareModalData, setShareModalData] = useState(null);
  const paymentsPageSize = 10;

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

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

  // Helper: format IDs with meaningful prefixes without hyphens
  const fmtBookingId = (id) => `BK2026${String(id).padStart(4, '0')}`;
  const fmtInvId   = (id) => `INV2026${String(id).padStart(4, '0')}`;
  const fmtCustId  = (phone) => `CUS${String(phone).slice(-4)}`;

  // Filter & Search Logic for Invoices (Orders)
  const filteredInvoices = orders.filter(o => {
    const matchesSearch = (o.customerNameSnapshot || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerPhone || '').includes(searchQuery) ||
      o.id.toString().includes(searchQuery) ||
      fmtInvId(o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      fmtBookingId(o.id).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Sorting logic for Invoices (Newest First)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalInvoicesCount = sortedInvoices.length;
  const totalInvoicesPages = Math.ceil(totalInvoicesCount / paymentsPageSize);
  const indexOfLastInvoice = currentPage * paymentsPageSize;
  const indexOfFirstInvoice = indexOfLastInvoice - paymentsPageSize;
  const currentPageInvoices = sortedInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);

  // Calculate Metrics
  const totalRevenue = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalTax = payments.reduce((sum, p) => {
    const total = p.totalAmount || 0;
    return sum + (total - (total / (1 + (gstPercentage / 100))));
  }, 0);
  const transactionCount = payments.length;

  const pendingPaymentsList = orders.filter(o => o.paymentStatus !== 'Paid' && o.status?.toUpperCase() !== 'CANCELLED');
  const pendingCount = pendingPaymentsList.length;
  const pendingAmount = pendingPaymentsList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Export Data Builder
  const getExportData = () => {
    const headers = ['S.No.', 'Invoice Number', 'Transaction Ref ID', 'Customer Name', 'Phone', 'Tax Paid', 'Total Bill', 'Method', 'Captured Date'];
    const rows = sortedInvoices.map((p, idx) => {
      const total = p.totalAmount || 0;
      const tax = total - (total / (1 + (gstPercentage / 100)));
      return [
        idx + 1,
        `INV2026${String(p.id).padStart(4, '0')}`,
        p.razorpayPaymentId || `pay_mock_${p.id}`,
        p.customer?.name || '',
        p.customer?.phone || '',
        tax.toFixed(2),
        total.toFixed(2),
        'Razorpay Web',
        new Date(p.updatedAt).toLocaleDateString()
      ];
    });
    return { headers, rows };
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(`payments_ledger_${new Date().toISOString().slice(0,10)}`, [headers, ...rows]);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('Payments Ledger', `payments_ledger_${new Date().toISOString().slice(0,10)}`, headers, rows);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      
      {/* Dynamic Blurred Background Orbs */}
      <style>{`
        @keyframes fadeInPage {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(130px);
          z-index: 0;
          pointer-events: none;
          opacity: 0.12;
        }
        .bg-orb-blue {
          top: -20px;
          right: 10%;
          width: 320px;
          height: 320px;
          background: linear-gradient(135deg, #38bdf8, #0ea5e9);
        }
        .bg-orb-purple {
          bottom: 20%;
          left: 5%;
          width: 280px;
          height: 280px;
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
        .metric-glow-card {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.45);
        }
        .metric-glow-card:hover {
          transform: translateY(-5px) scale(1.01);
          border-color: rgba(14, 165, 233, 0.35);
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);
        }
        .fin-row {
          transition: all 0.2s ease;
        }
        .fin-row:hover {
          background-color: rgba(241, 245, 249, 0.75) !important;
        }
        .pulse-indicator {
          width: 10px;
          height: 10px;
          background-color: #10b981;
          border-radius: 50%;
          animation: pulseGlow 2s infinite;
        }
        .btn-premium {
          transition: all 0.25s ease;
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px -4px rgba(14, 165, 233, 0.4);
        }
        .search-glass {
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .search-glass:focus-within {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }
        .subtab-btn {
          padding: 12px 24px;
          font-size: 0.92rem;
          font-weight: 700;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* Floating Ambient Background */}
      <div className="bg-orb bg-orb-blue"></div>
      <div className="bg-orb bg-orb-purple"></div>

      {/* Page Header */}
      <header className="page-header" style={{ position: 'relative', zIndex: 100, marginBottom: 26 }}>
        <div className="page-title-group">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', letterSpacing: '-0.01em', margin: 0 }}>
            Payment Transactions
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 4, fontWeight: 400 }}>
            A list of your recent sales and payments
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary btn-premium" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '10px 18px', 
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)'
              }} 
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={15} />
              <span>Export Ledger</span>
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



      {/* Filter and Search Controls Row */}
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
            maxWidth: 420
          }}
          className="search-glass"
          >
            <Search size={16} style={{ color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search customer, transaction ID, invoice..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}
            />
          </div>

        </div>
      </div>

      {/* Sub-Tab Panel Views */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* PANEL A: INVOICES BILLING RECORDS */}
          <div className="fintech-card" style={{ padding: 0, animation: 'fadeInPage 0.25s ease-out' }}>
            <div className="card-header" style={{ 
              background: 'linear-gradient(to right, rgba(14, 165, 233, 0.05), transparent)', 
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
              padding: '22px 24px' 
            }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.015em' }}>
                  Invoices & Sales Registry
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                  Audited ledger records and computed GST invoices.
                </p>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.78rem', tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(248, 250, 252, 0.3)' }}>
                      <th style={{ width: 36, paddingLeft: 14, paddingRight: 8 }}>#</th>
                      <th style={{ width: 110 }}>Invoice ID</th>
                      <th style={{ width: 110 }}>Booking ID</th>
                      <th style={{ width: 140 }}>Customer</th>
                      <th style={{ width: 120 }}>Phone</th>
                      <th style={{ width: 100 }}>Billing Date</th>
                      <th style={{ width: 85, textAlign: 'right' }}>GST ({gstPercentage}%)</th>
                      <th style={{ width: 85, textAlign: 'right' }}>Total</th>
                      <th style={{ width: 85, textAlign: 'center' }}>Status</th>
                      <th style={{ width: 50, textAlign: 'center' }}>View</th>
                      <th style={{ width: 70, textAlign: 'center', paddingRight: 14 }}>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontWeight: 600 }}>
                          No invoices logged.
                        </td>
                      </tr>
                    ) : (
                      currentPageInvoices.map((o, idx) => {
                        const total = o.totalAmount || 0;
                        const tax = total - (total / (1 + (gstPercentage / 100)));
                        
                        return (
                          <tr key={o.id} className="fin-row" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                            <td style={{ fontWeight: 600, color: 'var(--text-muted)', paddingLeft: 14, paddingRight: 8 }}>{indexOfFirstInvoice + idx + 1}</td>
                            <td style={{ paddingTop: 10, paddingBottom: 10 }}>
                              {o.paymentStatus === 'Paid' ? (
                                <span className="notranslate" translate="no" style={{ 
                                  fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                                  color: '#7c3aed', 
                                  fontWeight: 800,
                                  fontSize: '0.72rem'
                                }}>
                                  {fmtInvId(o.id)}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
                              )}
                            </td>
                            <td style={{ paddingTop: 10, paddingBottom: 10 }}>
                              <span className="notranslate" translate="no" style={{ 
                                fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                                color: '#0284c7', 
                                fontWeight: 800,
                                fontSize: '0.72rem'
                              }}>
                                {fmtBookingId(o.id)}
                              </span>
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
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{o.customerNameSnapshot || 'Unknown User'}</div>
                                  {o.customerPhone && (
                                    <div className="notranslate" translate="no" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7', lineHeight: 1, letterSpacing: '0.3px' }}>
                                      {fmtCustId(o.customerPhone)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem' }}>
                              {o.customerPhone ? formatPhone(o.customerPhone) : ''}
                            </td>
                            <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '0.78rem' }}>
                              ₹{tax.toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 900, color: '#0F172A', fontSize: '0.82rem' }}>
                              ₹{total.toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ 
                                padding: '3px 8px', 
                                fontSize: '0.67rem', 
                                fontWeight: 800, 
                                letterSpacing: '0.03em', 
                                backgroundColor: o.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                                color: o.paymentStatus === 'Paid' ? '#059669' : '#d97706', 
                                borderRadius: '6px',
                                display: 'inline-block',
                                textAlign: 'center'
                              }}>
                                {o.paymentStatus.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ 
                                  padding: '5px 8px', 
                                  borderRadius: '6px', 
                                  display: 'inline-flex', 
                                  alignItems: 'center',
                                  minHeight: 'auto'
                                }} 
                                onClick={() => setSelectedPaymentOrder(o)}
                                title="Inspect Payment Details"
                              >
                                <Eye size={14} />
                              </button>
                            </td>
                            <td style={{ paddingRight: 14, textAlign: 'center' }}>
                              {o.paymentStatus === 'Paid' ? (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ 
                                    padding: '5px 8px', 
                                    borderRadius: '6px', 
                                    display: 'inline-flex', 
                                    alignItems: 'center',
                                    minHeight: 'auto'
                                  }} 
                                  onClick={() => {
                                    window.open(`http://${window.location.hostname}:3000/api/orders/${o.id}/invoice`, '_blank');
                                  }}
                                  title="Download Invoice"
                                >
                                  <Download size={14} />
                                </button>
                              ) : (
                                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalInvoicesPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'rgba(248, 250, 252, 0.5)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Showing {indexOfFirstInvoice + 1} to {Math.min(indexOfLastInvoice, totalInvoicesCount)} of {totalInvoicesCount} entries
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

                  {getPageNumbers(currentPage, totalInvoicesPages).map((pageNum, index) => {
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalInvoicesPages))}
                    disabled={currentPage === totalInvoicesPages}
                    style={{
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: currentPage === totalInvoicesPages ? 'transparent' : '#FFF',
                      color: currentPage === totalInvoicesPages ? 'var(--text-muted)' : 'var(--text-dark)',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: currentPage === totalInvoicesPages ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: currentPage === totalInvoicesPages ? 0.5 : 1,
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

      {/* Payment Detail Modal / Drawer */}
      {selectedPaymentOrder && (
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
                    {selectedPaymentOrder.paymentStatus?.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Amount Billed</span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A' }}>
                    ₹{selectedPaymentOrder.totalAmount?.toFixed(2)}
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
                    {new Date(selectedPaymentOrder.updatedAt || selectedPaymentOrder.createdAt).toLocaleString('en-IN', {
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
                    {selectedPaymentOrder.customerNameSnapshot || 'Unknown Customer'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Customer Phone</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {selectedPaymentOrder.customerPhone ? formatPhone(selectedPaymentOrder.customerPhone) : 'N/A'}
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
                  const realRzpLink = selectedPaymentOrder.paymentLink || selectedPaymentOrder.razorpayPaymentLink || `http://${window.location.hostname}:3000/api/payment/mock-checkout/${selectedPaymentOrder.id}`;
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
                          text: `Hi ${selectedPaymentOrder.customerNameSnapshot || 'Customer'}, here is your Razorpay payment link for Ironing Service Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')} (Total: ₹${selectedPaymentOrder.totalAmount?.toFixed(2)}):\n${realRzpLink}`,
                          subject: `Razorpay Payment Link for Booking BK2026${String(selectedPaymentOrder.id).padStart(4, '0')}`,
                          emailBody: `Hi ${selectedPaymentOrder.customerNameSnapshot || 'Customer'},\n\nPlease complete your payment of ₹${selectedPaymentOrder.totalAmount?.toFixed(2)} using the Razorpay link below:\n${realRzpLink}\n\nThank you,\nIroning Service`
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
              <div style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10, letterSpacing: '0.04em' }}>
                  Tax & Computation Breakdown
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6, color: '#475569' }}>
                  <span>Base Amount (Excl. Tax)</span>
                  <span>₹{(selectedPaymentOrder.totalAmount / (1 + (gstPercentage / 100))).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6, color: '#475569' }}>
                  <span>GST ({gstPercentage}%)</span>
                  <span>₹{(selectedPaymentOrder.totalAmount - (selectedPaymentOrder.totalAmount / (1 + (gstPercentage / 100)))).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 800, borderTop: '1px solid #CBD5E1', paddingTop: 8, marginTop: 8, color: '#0F172A' }}>
                  <span>Total Amount Billed</span>
                  <span>₹{selectedPaymentOrder.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons: Download & Share Tax Invoice */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Share Tax Invoice Button */}
                {(() => {
                  const currentApiBase = API_BASE || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:3000/api` : 'https://ironing-service.onrender.com/api');
                  const invoiceUrl = `${currentApiBase}/orders/${selectedPaymentOrder.id}/invoice`;
                  const custName = selectedPaymentOrder.customerNameSnapshot || 'Customer';
                  return (
                    <>
                      {selectedPaymentOrder.paymentStatus === 'Paid' && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}
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
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#10B981', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
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
      )}

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
                href={`https://api.whatsapp.com/send?phone=${(shareModalData.order.customerPhone || '').replace(/\D/g, '')}&text=${encodeURIComponent(shareModalData.text)}`}
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
                href={`sms:${(shareModalData.order.customerPhone || '').replace(/\D/g, '')}?body=${encodeURIComponent(shareModalData.text)}`}
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
