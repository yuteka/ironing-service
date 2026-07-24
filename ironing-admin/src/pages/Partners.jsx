import React, { useState } from 'react';
import { UserPlus, Trash2, Search, Download, Coffee, Check, X, Phone, Users, ShieldAlert, Award, Smile, ChevronDown, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatPhone } from '../utils/formatPhone';
export default function Partners({ 
  partners, 
  newPartner, 
  setNewPartner, 
  createPartnerAccount, 
  deletePartner, 
  togglePartnerActive,
  grantPartnerLeave,
  role,
  triggerToast,
  setConfirmModal
}) {
  const isAdmin = role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaveResult, setLeaveResult] = useState(null); // { partnerName, totalOrders, reassigned, backToPool }
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter & Search Logic
  const filteredPartners = partners.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone || '').includes(searchQuery) ||
      (p.username || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Sorting Logic (Alphabetically by Name)
  const sortedPartners = [...filteredPartners].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Export Data Builder
  const getExportData = () => {
    const headers = ['S.No.', 'Partner ID', 'Full Name', 'Phone', 'Login Username', 'Account Status'];
    const rows = sortedPartners.map((p, idx) => [
      idx + 1,
      p.id,
      p.name || '',
      p.phone || '',
      p.username || '',
      p.active ? 'Active' : 'Inactive'
    ]);
    return { headers, rows };
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(`partners_directory_${new Date().toISOString().slice(0,10)}`, [headers, ...rows]);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('Partners Directory', `partners_directory_${new Date().toISOString().slice(0,10)}`, headers, rows);
  };

  const handleSubmitPartner = async (e) => {
    e.preventDefault();
    await createPartnerAccount(e);
    setDrawerOpen(false);
  };

  const getAvatar = (name) => {
    const letter = name ? name.charAt(0).toUpperCase() : 'P';
    const colors = [
      'linear-gradient(135deg, #0ea5e9, #2563eb)', // Blue
      'linear-gradient(135deg, #10b981, #059669)', // Green
      'linear-gradient(135deg, #8b5cf6, #7c3aed)', // Purple
      'linear-gradient(135deg, #ec4899, #db2777)', // Pink
      'linear-gradient(135deg, #f59e0b, #d97706)'  // Orange
    ];
    const index = (name || '').charCodeAt(0) % colors.length;
    return (
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: colors[index],
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '1.2rem',
        boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
        marginBottom: 8
      }}>
        {letter}
      </div>
    );
  };

  // Metrics
  const totalCount = partners.length;
  const activeCount = partners.filter(p => p.active).length;
  const leaveCount = partners.filter(p => !p.active).length;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 relative z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Delivery & Pickup Partners</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure partner logs, monitor active fleet service state, and manage leave shifts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add Partner</span>
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
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

      {/* Search Bar & Filters */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl max-w-md">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search partners by name, username, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table Layout of Partners */}
      {sortedPartners.length === 0 ? (
        <div className="data-card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShieldAlert size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <div style={{ fontWeight: 600 }}>No matching delivery partners found.</div>
        </div>
      ) : (
        <div className="card-body" style={{ padding: 0 }}>
          <div className="custom-table-wrapper" style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(248, 250, 252, 0.3)' }}>
                  <th style={{ width: 65, paddingLeft: 24 }}>S.No</th>
                  <th style={{ width: 250 }}>Partner Profile</th>
                  <th style={{ width: 150 }}>Contact</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 180, textAlign: 'center', paddingRight: 24 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPartners.map((p, idx) => (
                  <tr key={p.id} className="fin-row" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', paddingLeft: 24 }}>#{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {getAvatar(p.name)}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                          <div style={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', lineHeight: 1 }}>{p.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', background: 'rgba(2, 132, 199, 0.12)', padding: '3px 6px', borderRadius: 4, lineHeight: 1, letterSpacing: '0.5px' }}>
                            @{p.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{formatPhone(p.phone)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        fontSize: '0.72rem', 
                        fontWeight: 800, 
                        letterSpacing: '0.03em', 
                        backgroundColor: p.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                        color: p.active ? '#10B981' : '#D97706', 
                        borderRadius: '6px',
                        display: 'inline-block',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {p.active ? 'Active' : 'On Leave'}
                      </span>
                    </td>
                    <td style={{ paddingRight: 24, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                        {isAdmin && (
                          <>
                            {p.active ? (
                              <button
                                className="btn"
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: 700, 
                                  borderRadius: '8px',
                                  background: 'rgba(245, 158, 11, 0.06)',
                                  border: '1px solid rgba(245, 158, 11, 0.15)',
                                  color: '#D97706',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  setConfirmModal({
                                    title: 'Grant Leave',
                                    message: `Are you sure you want to grant leave to ${p.name}? All their active orders will be reassigned.`,
                                    confirmText: 'Yes, Grant Leave',
                                    danger: true,
                                    onConfirm: async () => {
                                      const result = await grantPartnerLeave(p.id);
                                      if (result) setLeaveResult({ partnerName: p.name, ...result });
                                    }
                                  });
                                }}
                                title="Mark on leave"
                              >
                                <Coffee size={14} /> Leave
                              </button>
                            ) : (
                              <button
                                className="btn"
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: 700, 
                                  borderRadius: '8px',
                                  background: 'rgba(16, 185, 129, 0.06)',
                                  border: '1px solid rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  setConfirmModal({
                                    title: 'Activate Partner',
                                    message: `Are you sure you want to mark ${p.name} as Active?`,
                                    confirmText: 'Yes, Activate',
                                    danger: false,
                                    onConfirm: async () => {
                                      await togglePartnerActive(p.id, p.active);
                                    }
                                  });
                                }}
                                title="Activate partner"
                              >
                                <Check size={14} /> Active
                              </button>
                            )}
                            <button
                              className="btn"
                              style={{ 
                                padding: '6px', 
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.06)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                color: '#EF4444',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => deletePartner(p.id)}
                              title="Delete Partner"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Partner Drawer (Sliding sidebar) */}
      {drawerOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '420px',
            height: '100vh',
            backgroundColor: '#ffffff',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideOutDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            borderLeft: '1px solid var(--border-light)'
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
              Add New Pickup Partner
            </h3>
            <button 
              onClick={() => {
                setNewPartner({ name: '', phone: '', username: '', password: '' });
                setDrawerOpen(false);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmitPartner} style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Anand Sharma"
                value={newPartner.name}
                onChange={e => setNewPartner({ ...newPartner, name: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                pattern="[A-Za-z\s]+"
                title="Full Name must only contain letters and spaces."
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number <span style={{ color: '#EF4444' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 9876543210"
                value={newPartner.phone}
                onChange={e => setNewPartner({ ...newPartner, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                pattern="[0-9]{10}"
                title="Phone Number must be exactly 10 digits long."
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Login Username <span style={{ color: '#EF4444' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. anand123"
                value={newPartner.username}
                onChange={e => setNewPartner({ ...newPartner, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                pattern="[a-zA-Z0-9_]+"
                title="Username must only contain letters, numbers, and underscores (no spaces)."
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password <span style={{ color: '#EF4444' }}>*</span></label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Min 6 characters"
                value={newPartner.password}
                onChange={e => setNewPartner({ ...newPartner, password: e.target.value })}
                minLength="6"
                title="Password must be at least 6 characters long."
                required 
              />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setNewPartner({ name: '', phone: '', username: '', password: '' });
                  setDrawerOpen(false);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Drawer Overlay Backdrop */}
      {drawerOpen && (
        <div 
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.35)',
            zIndex: 999,
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* ── Leave Result Summary Modal ── */}
      {leaveResult && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '28px 26px',
            maxWidth: 400, width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Coffee size={24} color="#FBBF24" />
              <div>
                <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1rem' }}>
                  Leave Granted — {leaveResult.partnerName}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: 2 }}>
                  {leaveResult.totalOrders} active order{leaveResult.totalOrders !== 1 ? 's' : ''} processed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {leaveResult.reassigned?.length > 0 && (
                <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38BDF8', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>
                    <Check size={15} />
                    {leaveResult.reassigned.length} Orders Auto-Reassigned
                  </div>
                  {leaveResult.reassigned.map(r => (
                    <div key={r.orderId} style={{ color: '#CBD5E1', fontSize: '0.8rem', paddingLeft: 22 }}>
                      Order #{r.orderId} → {r.assignedTo}
                    </div>
                  ))}
                </div>
              )}
              {leaveResult.backToPool?.length > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FBBF24', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>
                    <ShieldAlert size={15} />
                    {leaveResult.backToPool.length} Orders Returned to Unassigned Pool
                  </div>
                  {leaveResult.backToPool.map(r => (
                    <div key={r.orderId} style={{ color: '#CBD5E1', fontSize: '0.8rem', paddingLeft: 22 }}>
                      Order #{r.orderId} — no active partner available
                    </div>
                  ))}
                </div>
              )}
              {leaveResult.totalOrders === 0 && (
                <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>
                  No active orders were assigned to this partner.
                </div>
              )}
            </div>

            <button
              onClick={() => setLeaveResult(null)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
