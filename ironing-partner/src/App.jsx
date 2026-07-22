import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, LogOut, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Import Pages
import Login from './pages/Login';
import JobList from './pages/JobList';
import Profile from './pages/Profile';
import Workflow from './pages/Workflow';

const API_BASE = `http://${window.location.hostname}:3000/api`;

// --- MOCK DATA ---
const MOCK_JOBS = [
  {
    id: 1024,
    customerPhone: "919876543210",
    customer: { name: "Anand Kumar", phone: "919876543210", address: "Flat 402, Block A, Green Meadows Apartments", landmark: "Near Central Park", latitude: 12.9716, longitude: 77.5946 },
    status: "Pickup Assigned",
    paymentStatus: "Pending",
    pickupDate: "Today",
    pickupSlot: "Morning",
    clothCheckStatus: "None"
  },
  {
    id: 1023,
    customerPhone: "919812345678",
    customer: { name: "Priya Sharma", phone: "919812345678", address: "House 14, Road 3, Sector 5, HSR Layout", landmark: "Opposite SBI Bank", latitude: 12.9349, longitude: 77.6101 },
    status: "Pickup Assigned",
    paymentStatus: "Pending",
    pickupDate: "Today",
    pickupSlot: "Evening",
    clothCheckStatus: "None"
  }
];

const MOCK_CATALOG = [
  { itemType: 'Shirt', rate: 15 },
  { itemType: 'Pant', rate: 20 },
  { itemType: 'Saree', rate: 40 },
  { itemType: 'T-Shirt', rate: 15 },
  { itemType: 'Coat', rate: 50 }
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('partner_token') || '');
  const [partnerName, setPartnerName] = useState(localStorage.getItem('partner_name') || 'Partner');

  const [loading, setLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');

  const [jobs, setJobs] = useState([]);
  const [catalog, setCatalog] = useState(MOCK_CATALOG);
  const [activeJob, setActiveJob] = useState(null);
  const [workflowStep, setWorkflowStep] = useState('details');

  const [checkedIssues, setCheckedIssues] = useState([]);
  const [clothNote, setClothNote] = useState('');
  const [photoAdded, setPhotoAdded] = useState(false);

  const [quantities, setQuantities] = useState({
    'Shirt': 0, 'Pant': 0, 'Saree': 0, 'T-Shirt': 0, 'Coat': 0
  });
  const [itemNotes, setItemNotes] = useState({
    'Shirt': '', 'Pant': '', 'Saree': '', 'T-Shirt': '', 'Coat': ''
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // ─── Toast System ─────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Glassmorphic Confirm Modal ────────────────────────────
  const [confirmModal, setConfirmModal] = useState(null);
  // confirmModal = { message, onConfirm, confirmLabel, cancelLabel, danger }

  const showConfirm = (message, onConfirm, options = {}) => {
    setConfirmModal({
      message,
      onConfirm,
      confirmLabel: options.confirmLabel || 'Yes',
      cancelLabel: options.cancelLabel || 'No',
      danger: options.danger !== false
    });
  };

  // ─── Reschedule Modal ──────────────────────────────────────
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE}/catalog`, { headers: getHeaders() }).catch(() => null);
      if (!res) {
        setCatalog(MOCK_CATALOG);
      } else {
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(item => ({
            itemType: item.itemName,
            rate: item.rate
          }));
          setCatalog(mapped);
        } else if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      }
    } catch (e) {
      console.error('[Partner Catalog Fetch] Error:', e);
    }
  };

  useEffect(() => {
    if (token) {
      loadJobs();
      fetchCatalog();
    }
  }, [token]);

  // Poll payment status when waiting
  useEffect(() => {
    let intervalId;
    if (activeJob && workflowStep === 'waiting_payment') {
      intervalId = setInterval(async () => {
        if (isMockMode) return;
        try {
          const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}`, { headers: getHeaders() });
          if (res.ok) {
            const updated = await res.json();
            setActiveJob(updated);
            if (updated.paymentStatus === 'Paid') clearInterval(intervalId);
          }
        } catch (e) {
          console.error('Payment polling error:', e);
        }
      }, 3000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [activeJob, workflowStep, token, isMockMode]);

  // Background job polling every 15s
  useEffect(() => {
    let pollInterval;
    if (token) {
      pollInterval = setInterval(() => loadJobs(true), 15000);
    }
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [token]);

  const loadJobs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs`, { headers: getHeaders() }).catch(() => null);
      if (!res) {
        setIsMockMode(true);
        setJobs(MOCK_JOBS);
      } else {
        setIsMockMode(false);
        if (res.ok) {
          const freshJobs = await res.json();
          setJobs(prevJobs => {
            if (isBackground && freshJobs.length > prevJobs.length) {
              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
                audio.volume = 0.5;
                audio.play();
              } catch {}
            }
            return freshJobs;
          });
        } else if (res.status === 401 || res.status === 403) {
          handleLogout();
          triggerToast('Your account has been deactivated or put on leave.', 'error');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/partner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        localStorage.setItem('partner_token', data.token);
        localStorage.setItem('partner_name', data.name);
        setToken(data.token);
        setPartnerName(data.name);
      } else {
        const err = res ? await res.json().catch(() => null) : null;
        setLoginError(err?.error || 'Invalid username or password');
      }
    } catch {
      setLoginError('Authentication server unreachable');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_name');
    setToken('');
    setActiveJob(null);
  };

  // ─── WORKFLOW HANDLERS ─────────────────────────────────────
  const handleReached = async () => {
    if (isMockMode) { setWorkflowStep('count'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/reached`, {
        method: 'PUT', headers: getHeaders()
      });
      if (res.ok) setWorkflowStep('count');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleIssue = (issue) => {
    setCheckedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleClothCheckSubmit = async () => {
    if (checkedIssues.length === 0) {
      if (isMockMode) { setWorkflowStep('count'); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/cloth-check`, {
          method: 'POST', headers: getHeaders(),
          body: JSON.stringify({ issues: [], note: 'No issues found' })
        });
        if (res.ok) setWorkflowStep('count');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    } else {
      if (isMockMode) { setWorkflowStep('waiting_acceptance'); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/cloth-check`, {
          method: 'POST', headers: getHeaders(),
          body: JSON.stringify({
            issues: checkedIssues,
            note: clothNote,
            photoBase64: photoAdded ? 'data:image/jpeg;base64,mockbase64data' : ''
          })
        });
        if (res.ok) setWorkflowStep('waiting_acceptance');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  const forceMockCustomerAccept = () => setWorkflowStep('count');

  const adjustQty = (item, delta) => {
    setQuantities(prev => ({ ...prev, [item]: Math.max(0, prev[item] + delta) }));
  };

  const calculateTotal = () =>
    catalog.reduce((sum, item) => sum + quantities[item.itemType] * item.rate, 0);

  const handleSendPayment = async () => {
    const itemsData = catalog
      .map(item => ({ 
        itemType: item.itemType, 
        quantity: quantities[item.itemType], 
        rate: item.rate,
        note: itemNotes[item.itemType]
      }))
      .filter(i => i.quantity > 0);

    if (itemsData.length === 0) {
      triggerToast('Please count at least 1 item before proceeding.', 'error');
      return;
    }
    if (isMockMode) {
      setActiveJob({ ...activeJob, totalAmount: calculateTotal(), paymentStatus: 'Pending' });
      setWorkflowStep('waiting_payment');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/count`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ items: itemsData, damageNotes: clothNote })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJob(data.order);
        setWorkflowStep('waiting_payment');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCashCollected = async () => {
    if (isMockMode) { setActiveJob({ ...activeJob, paymentStatus: 'Paid' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/cash-received`, {
        method: 'POST', headers: getHeaders()
      });
      if (res.ok) setActiveJob({ ...activeJob, paymentStatus: 'Paid' });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const triggerMockOnlinePayment = async () => {
    if (isMockMode) { setActiveJob({ ...activeJob, paymentStatus: 'Paid' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payment/mock-pay/${activeJob.id}`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ paymentMethod: 'Razorpay' })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveJob(updated.order || { ...activeJob, paymentStatus: 'Paid' });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePicked = async () => {
    if (activeJob.paymentStatus !== 'Paid') {
      triggerToast('Cannot mark Picked. Payment is still pending.', 'error');
      return;
    }
    if (isMockMode) { setJobs(jobs.filter(j => j.id !== activeJob.id)); setActiveJob(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/picked`, {
        method: 'PUT', headers: getHeaders()
      });
      if (res.ok) { setActiveJob(null); await loadJobs(); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleMarkDelivered = async (jobId, enteredOtp) => {
    if (!enteredOtp || !enteredOtp.trim()) {
      triggerToast('OTP is required to complete delivery.', 'error');
      return;
    }
    if (isMockMode) { setJobs(jobs.filter(j => j.id !== jobId)); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs/${jobId}/delivered`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ otp: enteredOtp.trim() })
      });
      if (res.ok) {
        triggerToast('Order delivered successfully! Great work. 🎉', 'success');
        await loadJobs();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to verify OTP. Please try again.', 'error');
      }
    } catch (e) {
      triggerToast('Connection error. Please check your network.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── CAN'T MAKE IT ─────────────────────────────────────────
  const handleCantMakeIt = () => {
    showConfirm(
      'Cancel this assignment? The order will be automatically reassigned or returned to the admin pool.',
      async () => {
        setConfirmModal(null);
        if (isMockMode) {
          setJobs(jobs.filter(j => j.id !== activeJob.id));
          setActiveJob(null);
          triggerToast("Assignment cancelled. Order returned to pool.", 'info');
          return;
        }
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/cant-make-it`, {
            method: 'PUT', headers: getHeaders()
          });
          if (res.ok) {
            setActiveJob(null);
            await loadJobs();
            triggerToast("Assignment cancelled. Order has been reassigned.", 'info');
          }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
      },
      { confirmLabel: "Yes, Cancel It", cancelLabel: "No, Keep", danger: true }
    );
  };

  // ─── RESCHEDULE ────────────────────────────────────────────
  const openRescheduleModal = () => {
    // Set default to today's date
    const today = new Date().toISOString().split('T')[0];
    setRescheduleDate(today);
    setRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate) {
      triggerToast('Please select a new date.', 'error');
      return;
    }
    setRescheduleModal(false);
    if (isMockMode) {
      setActiveJob({ ...activeJob, pickupDate: rescheduleDate });
      triggerToast(`Pickup rescheduled to ${rescheduleDate}`, 'success');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/jobs/${activeJob.id}/reschedule`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ newDate: rescheduleDate })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveJob(updated);
        triggerToast(`Pickup rescheduled to ${rescheduleDate}. Customer notified on WhatsApp. ✅`, 'success');
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to reschedule.', 'error');
      }
    } catch (e) {
      triggerToast('Connection error during reschedule.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDERS ───────────────────────────────────────────────
  if (!token) {
    return (
      <Login
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
        loginError={loginError}
        loading={loading}
      />
    );
  }

  return (
    <>
      {/* ── Blue Toast Notification ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          minWidth: 260,
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(12px)',
          borderLeft: toast.type === 'error'
            ? '4px solid #EF4444'
            : toast.type === 'info'
              ? '4px solid #3B82F6'
              : '4px solid #0EA5E9',
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)',
          borderRadius: 12,
          padding: '14px 18px',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards'
        }}>
          <style>{`@keyframes toastIn { from { transform: translateX(-50%) translateY(-16px) scale(0.95); opacity:0; } to { transform: translateX(-50%) translateY(0) scale(1); opacity:1; } }`}</style>
          {toast.type === 'error' && <AlertTriangle size={17} style={{ color: '#EF4444', flexShrink: 0 }} />}
          {toast.type === 'info' && <Info size={17} style={{ color: '#60A5FA', flexShrink: 0 }} />}
          {toast.type === 'success' && <CheckCircle2 size={17} style={{ color: '#38BDF8', flexShrink: 0 }} />}
          <span style={{ letterSpacing: '0.2px', lineHeight: 1.4 }}>{toast.message}</span>
        </div>
      )}

      {/* ── Glassmorphic Confirm Modal ── */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
          animation: 'fadeIn 0.2s ease'
        }}>
          <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } } @keyframes scaleIn { from { transform: scale(0.92); opacity:0; } to { transform: scale(1); opacity:1; } }`}</style>
          <div style={{
            background: 'rgba(15, 23, 42, 0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '28px 24px',
            maxWidth: 340,
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: confirmModal.danger ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <AlertTriangle size={20} color={confirmModal.danger ? '#F87171' : '#60A5FA'} />
              </div>
              <p style={{ color: '#F1F5F9', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                {confirmModal.message}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#94A3B8',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                {confirmModal.cancelLabel}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10, border: 'none',
                  background: confirmModal.danger ? '#EF4444' : '#0EA5E9',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Date Modal ── */}
      {rescheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '28px 24px',
            maxWidth: 340,
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#F1F5F9', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                📅 Reschedule Pickup
              </h3>
              <button
                onClick={() => setRescheduleModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.5 }}>
              Select a new pickup date for <strong style={{ color: '#CBD5E1' }}>{activeJob?.customer?.name}</strong>.
              The customer will be notified on WhatsApp automatically.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New Pickup Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setRescheduleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(14, 165, 233, 0.4)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#F1F5F9',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRescheduleModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#94A3B8',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.4)'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Job Workflow ── */}
      {activeJob ? (
        <Workflow
          activeJob={activeJob}
          setActiveJob={setActiveJob}
          workflowStep={workflowStep}
          setWorkflowStep={setWorkflowStep}
          checkedIssues={checkedIssues}
          toggleIssue={toggleIssue}
          clothNote={clothNote}
          setClothNote={setClothNote}
          photoAdded={photoAdded}
          setPhotoAdded={setPhotoAdded}
          quantities={quantities}
          adjustQty={adjustQty}
          calculateTotal={calculateTotal}
          handleReached={handleReached}
          handleClothCheckSubmit={handleClothCheckSubmit}
          forceMockCustomerAccept={forceMockCustomerAccept}
          handleSendPayment={handleSendPayment}
          handleCashCollected={handleCashCollected}
          triggerMockOnlinePayment={triggerMockOnlinePayment}
          handlePicked={handlePicked}
          handleCantMakeIt={handleCantMakeIt}
          handleMarkDelivered={handleMarkDelivered}
          openRescheduleModal={openRescheduleModal}
          showConfirm={showConfirm}
          setConfirmModal={setConfirmModal}
          CATALOG={catalog}
          API_BASE={API_BASE}
          itemNotes={itemNotes}
          setItemNotes={setItemNotes}
        />
      ) : (
        <div className="mobile-layout">
          <div className="app-bar">
            <div>
              <div className="app-bar-subtitle">Welcome back,</div>
              <h1>{partnerName}</h1>
            </div>
            <button
              style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
              onClick={handleLogout}
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="content-area">
            {activeTab === 'jobs' && (
              <JobList
                jobs={jobs}
                loadJobs={loadJobs}
                setActiveJob={setActiveJob}
                setWorkflowStep={setWorkflowStep}
                setCheckedIssues={setCheckedIssues}
                setClothNote={setClothNote}
                setPhotoAdded={setPhotoAdded}
                setQuantities={setQuantities}
                setItemNotes={setItemNotes}
                handleMarkDelivered={handleMarkDelivered}
              />
            )}
            {activeTab === 'profile' && (
              <Profile 
                partnerName={partnerName} 
                handleLogout={handleLogout} 
                showConfirm={showConfirm}
                setConfirmModal={setConfirmModal}
                triggerToast={triggerToast}
              />
            )}
          </div>

          <nav className="bottom-nav">
            <div
              className={`nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              <ShoppingBag size={20} />
              <span>Active Tasks</span>
            </div>
            <div
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} />
              <span>My Profile</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
