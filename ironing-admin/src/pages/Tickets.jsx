import React, { useState, useEffect } from 'react';
import { Search, Download, MapPin, ChevronDown, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import CustomSelect from '../components/CustomSelect';
import { formatPhone } from '../utils/formatPhone';
import SmartTooltip from '../components/SmartTooltip';
export default function Tickets({ tickets, resolveTicket, role }) {
  const isAdmin = role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPageSize = 10;

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

  // Helper: format IDs with meaningful prefixes without hyphens
  const fmtTicketId = (id) => `TKT2026${String(id).padStart(4, '0')}`;
  const fmtBookingId  = (id) => `BK2026${String(id).padStart(4, '0')}`;

  // Filter & Search Logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toString().includes(searchQuery) ||
      fmtTicketId(t.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerPhone.includes(searchQuery) ||
      (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Sorting Logic (Open Tickets First, then Newest First)
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.status === 'Open' && b.status !== 'Open') return -1;
    if (a.status !== 'Open' && b.status === 'Open') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const totalTicketsCount = sortedTickets.length;
  const totalTicketsPages = Math.ceil(totalTicketsCount / ticketsPageSize);
  const indexOfLastTicket = currentPage * ticketsPageSize;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPageSize;
  const currentPageTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  // Export Data Builder
  const getExportData = () => {
    const headers = ['S.No.', 'Ticket ID', 'Customer Name', 'Phone', 'Address', 'Order ID', 'Category', 'Logged Date', 'Status'];
    const rows = sortedTickets.map((t, idx) => [
      idx + 1,
      fmtTicketId(t.id),
      t.customer?.name || 'Unknown',
      t.customerPhone || '',
      t.customer?.address || '',
      t.orderId ? fmtOrderId(t.orderId) : '',
      t.category,
      new Date(t.createdAt).toLocaleDateString(),
      t.status
    ]);
    return { headers, rows };
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(`tickets_ledger_${new Date().toISOString().slice(0,10)}`, [headers, ...rows]);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('Support Tickets Ledger', `tickets_ledger_${new Date().toISOString().slice(0,10)}`, headers, rows);
  };

  return (
    <div>
      <header className="page-header" style={{ position: 'relative', zIndex: 100 }}>
        <div className="page-title-group">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', letterSpacing: '-0.01em', margin: 0 }}>
            Support Center
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 4, fontWeight: 400 }}>
            Manage customer queries, complaints, and cloth damage/missing reports.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} />
            <span>Export</span>
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
      </header>

      {/* Filter and Search Controls Row */}
      <div className="data-card" style={{ padding: 18, marginBottom: 20, overflow: 'visible', zIndex: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-slate)', border: '1px solid var(--border-light)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', flex: 1, maxWidth: 350 }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by ID, name, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <CustomSelect 
                options={[
                  { label: 'All Tickets', value: 'all' },
                  { label: 'Open', value: 'Open' },
                  { label: 'Resolved', value: 'Resolved' }
                ]}
                value={filterStatus}
                onChange={setFilterStatus}
                width={120}
              />
            </div>
          </div>

        </div>
      </div>

      <div className="data-card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="custom-table-wrapper">
            <style>{`
              .id-chip {
                display: inline-block;
                font-family: 'SFMono-Regular', Consolas, Monaco, monospace;
                font-size: 0.76rem;
                font-weight: 700;
                letter-spacing: 0.3px;
                white-space: nowrap;
              }
              .id-chip-amber { color: #b45309; }
              .id-chip-blue  { color: #0284c7; }
            `}</style>
            <table className="custom-table" style={{ fontSize: '0.78rem', tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 36, paddingLeft: 14, paddingRight: 8 }}>#</th>
                  <th style={{ width: 110 }}>Ticket ID</th>
                  <th style={{ width: 130 }}>Customer</th>
                  <th style={{ width: 140 }}>Landmark</th>
                  <th style={{ width: 110 }}>Order</th>
                  <th style={{ width: 150 }}>Category</th>
                  <th style={{ width: 85 }}>Logged Date</th>
                  <th style={{ width: 75, textAlign: 'center' }}>Status</th>
                  {isAdmin && <th style={{ width: 70, paddingRight: 14, textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentPageTickets.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No matching tickets found.
                    </td>
                  </tr>
                ) : (
                  currentPageTickets.map((t, idx) => (
                    <tr key={t.id}>
                      <td style={{ paddingLeft: 14, paddingRight: 8, color: '#94a3b8', fontWeight: 600, fontSize: '0.74rem' }}>{indexOfFirstTicket + idx + 1}</td>
                      <td style={{ paddingTop: 10, paddingBottom: 10 }}>
                        <span className="id-chip id-chip-amber notranslate" translate="no" style={{ fontSize: '0.72rem' }}>
                          {fmtTicketId(t.id)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem', lineHeight: 1.2 }}>{t.customer?.name || 'Loading...'}</div>
                        <div className="notranslate" translate="no" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginTop: 2 }}>{formatPhone(t.customerPhone)}</div>
                      </td>
                      <td style={{ maxWidth: 140, overflow: 'hidden' }}>
                        <SmartTooltip
                          text={t.customer?.landmark || ''}
                          style={{ maxWidth: 126, fontSize: '0.73rem', color: '#B45309', fontWeight: 700 }}
                          icon={t.customer?.landmark ? <MapPin size={11} color="#B45309" /> : null}
                        />
                      </td>
                      <td>
                        <span className="id-chip id-chip-blue notranslate" translate="no" style={{ fontSize: '0.72rem' }}>
                          {t.orderId ? fmtBookingId(t.orderId) : '-'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.78rem' }}>
                          {t.category === 'ClothMissing' ? 'Missing Cloth' : 
                           t.category === 'ClothDamage' ? 'Damaged Cloth' : t.category}
                        </div>
                        {t.issue && (
                          <div style={{ marginTop: 2 }}>
                            <SmartTooltip
                              text={`"${t.issue}"`}
                              style={{ 
                                fontSize: '0.72rem', 
                                color: 'var(--text-muted)', 
                                fontStyle: 'italic', 
                                maxWidth: 135,
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${t.status === 'Resolved' ? 'badge-paid' : 'badge-pending'}`} style={{ fontWeight: 700, fontSize: '0.67rem', padding: '3px 8px' }}>
                          {t.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ paddingRight: 14, textAlign: 'center' }}>
                          {t.status === 'Open' ? (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '5px 8px', fontSize: '0.72rem', borderRadius: '6px', minHeight: 'auto' }}
                              onClick={() => resolveTicket(t.id)}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalTicketsPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: '1px solid var(--border-light)',
              background: 'rgba(248, 250, 252, 0.5)'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Showing {indexOfFirstTicket + 1} to {Math.min(indexOfLastTicket, totalTicketsCount)} of {totalTicketsCount} entries
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    border: '1px solid var(--border-light)',
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

                {getPageNumbers(currentPage, totalTicketsPages).map((pageNum, index) => {
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
                        borderColor: currentPage === pageNum ? 'var(--primary-dark)' : 'var(--border-light)',
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalTicketsPages))}
                  disabled={currentPage === totalTicketsPages}
                  style={{
                    border: '1px solid var(--border-light)',
                    background: currentPage === totalTicketsPages ? 'transparent' : '#FFF',
                    color: currentPage === totalTicketsPages ? 'var(--text-muted)' : 'var(--text-dark)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: currentPage === totalTicketsPages ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: currentPage === totalTicketsPages ? 0.5 : 1,
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
