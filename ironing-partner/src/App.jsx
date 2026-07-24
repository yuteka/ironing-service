import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, LogOut, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Import Pages
import Login from './pages/Login';
import JobList from './pages/JobList';
import Profile from './pages/Profile';
import Workflow from './pages/Workflow';

const API_BASE = import.meta.env.VITE_API_BASE || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3000/api`
    : 'https://ironing-service.onrender.com/api');

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
          if (data && data.length > 0) {
            const mapped = data.map(item => ({
              itemType: item.itemName,
              rate: item.rate
            }));
            setCatalog(mapped);
          } else {
            setCatalog(MOCK_CATALOG);
          }
        } else if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      }
    } catch (e) {
      console.error('[Partner Catalog Fetch] Error:', e);
      setCatalog(MOCK_CATALOG);
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
      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 min-w-64 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md border-l-4 shadow-2xl rounded-2xl p-4 text-white font-bold text-xs flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error' ? 'border-l-red-500' : toast.type === 'info' ? 'border-l-sky-500' : 'border-l-emerald-500'
        }`}>
          {toast.type === 'error' && <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />}
          {toast.type === 'info' && <Info size={18} className="text-sky-400 flex-shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-sky-400 flex-shrink-0" />}
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmModal.danger ? 'bg-red-500/10 text-red-400' : 'bg-sky-500/10 text-sky-400'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <p className="text-sm font-bold text-slate-100 leading-snug">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 px-3 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelLabel}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 px-3 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                  confirmModal.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Date Modal ── */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100">
                📅 Reschedule Pickup
              </h3>
              <button
                onClick={() => setRescheduleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
              Select a new pickup date for <strong className="text-slate-200">{activeJob?.customer?.name}</strong>.
              The customer will be notified on WhatsApp automatically.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                New Pickup Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setRescheduleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-sky-500/40 rounded-xl text-slate-100 font-bold text-sm outline-none focus:border-sky-500 transition-all dark-calendar"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setRescheduleModal(false)}
                className="flex-1 py-2.5 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                className="flex-1 py-2.5 bg-gradient-to-tr from-sky-600 to-sky-400 hover:from-sky-700 hover:to-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
        <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
          {/* Header Bar */}
          <div className="bg-white border-b border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Welcome back,</div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{partnerName}</h1>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="p-5 flex-1 max-w-lg mx-auto w-full">
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

          {/* Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-6 py-2 flex justify-around items-center z-40 shadow-lg">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
                activeTab === 'jobs' ? 'text-sky-600 font-extrabold' : 'text-slate-400 font-semibold hover:text-slate-600'
              }`}
            >
              <ShoppingBag size={20} />
              <span className="text-[11px]">Active Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile' ? 'text-sky-600 font-extrabold' : 'text-slate-400 font-semibold hover:text-slate-600'
              }`}
            >
              <User size={20} />
              <span className="text-[11px]">My Profile</span>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
