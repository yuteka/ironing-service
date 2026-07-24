import React, { useState, useEffect } from 'react';
import { Building, CreditCard, Tag, Shield, Edit2, Save, X, Lock, Eye, EyeOff, UserPlus, Crown, Trash2, AlertTriangle } from 'lucide-react';
import Catalog from './Catalog';

export default function Settings({ 
  settings, 
  setSettings, 
  catalog, 
  setCatalog, 
  saveSettings, 
  saveCatalog, 
  triggerToast, 
  role,
  API_BASE,
  currentAdminId
}) {
  const [activeSubTab, setActiveSubTab] = useState('business');
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '');
  const [gstPercentage, setGstPercentage] = useState(settings.gstPercentage || '5.0');
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone || '');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || '');
  const [businessAddress, setBusinessAddress] = useState(settings.businessAddress || '');

  // API Keys state
  const [razorpayKeyId, setRazorpayKeyId] = useState(settings.razorpayKeyId || '');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(settings.razorpayKeySecret || '');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState(settings.razorpayWebhookSecret || '');
  const [whatsappToken, setWhatsappToken] = useState(settings.whatsappToken || '');

  // Toggle Visibility Secrets
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);

  // Admins List State
  const [admins, setAdmins] = useState([]);
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', username: '', password: '', role: 'SUB_ADMIN' });

  // Sync state when props update
  useEffect(() => {
    setBusinessName(settings.businessName || '');
    setGstNumber(settings.gstNumber || '');
    setGstPercentage(settings.gstPercentage || '5.0');
    setSupportPhone(settings.supportPhone || '');
    setSupportEmail(settings.supportEmail || '');
    setBusinessAddress(settings.businessAddress || '');
    setRazorpayKeyId(settings.razorpayKeyId || '');
    setRazorpayKeySecret(settings.razorpayKeySecret || '');
    setRazorpayWebhookSecret(settings.razorpayWebhookSecret || '');
    setWhatsappToken(settings.whatsappToken || '');
  }, [settings]);

  // Load admins list when switching to admins tab
  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error('Error fetching admins:', e);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'admins') {
      fetchAdmins();
    }
  }, [activeSubTab]);

  const handleTabChange = (tabKey) => {
    if (isEditing) {
      if (!window.confirm("You have unsaved changes. Switch tabs without saving?")) {
        return;
      }
      setIsEditing(false);
    }
    setActiveSubTab(tabKey);
    setShowSaveConfirm(false);
    setShowCancelConfirm(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setShowSaveConfirm(false);
    setShowCancelConfirm(false);
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
    setShowSaveConfirm(false);
  };

  const handleConfirmCancel = () => {
    setIsEditing(false);
    setShowCancelConfirm(false);
    // Reset to last saved state
    setBusinessName(settings.businessName || '');
    setGstNumber(settings.gstNumber || '');
    setGstPercentage(settings.gstPercentage || '5.0');
    setSupportPhone(settings.supportPhone || '');
    setSupportEmail(settings.supportEmail || '');
    setBusinessAddress(settings.businessAddress || '');
    setRazorpayKeyId(settings.razorpayKeyId || '');
    setRazorpayKeySecret(settings.razorpayKeySecret || '');
    setRazorpayWebhookSecret(settings.razorpayWebhookSecret || '');
    setWhatsappToken(settings.whatsappToken || '');
    triggerToast('Changes discarded.', 'info');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShowSaveConfirm(true);
    setShowCancelConfirm(false);
  };

  const handleConfirmSave = () => {
    saveSettings({
      businessName,
      gstNumber,
      gstPercentage,
      supportPhone,
      supportEmail,
      businessAddress,
      razorpayKeyId,
      razorpayKeySecret,
      razorpayWebhookSecret,
      whatsappToken
    });
    setIsEditing(false);
    setShowSaveConfirm(false);
  };

  // Input Handlers with Strict Validation Rule Enforcement
  const handleBusinessNameChange = (val) => {
    setBusinessName(val);
  };

  const handleGstNumberChange = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length <= 15) {
      setGstNumber(clean);
    }
  };

  const handleGstChange = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setGstPercentage(clean);
  };

  const handlePhoneChange = (val) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length <= 10) {
      setSupportPhone(clean);
    }
  };

  const handleKeyChange = (val, setter) => {
    setter(val.trim());
  };

  const handleTokenChange = (val, setter) => {
    setter(val.replace(/\s+/g, ''));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminForm)
      });
      if (res.ok) {
        triggerToast('New staff account registered successfully!', 'success');
        setNewAdminForm({ name: '', username: '', password: '', role: 'SUB_ADMIN' });
        setStaffDrawerOpen(false);
        fetchAdmins();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to create staff account.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error connecting to backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!deleteConfirmAdmin) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/${deleteConfirmAdmin.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerToast(`Account deleted successfully.`, 'success');
        setDeleteConfirmAdmin(null);
        fetchAdmins();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to delete account.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error deleting staff account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="space-y-1 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration Settings</h1>
        <p className="text-xs font-semibold text-slate-500">Configure company metadata, Razorpay keys, and manage administrator access.</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 overflow-x-auto">
        <button 
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'business'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
          onClick={() => handleTabChange('business')}
        >
          <Building size={16} />
          <span>Business Details</span>
        </button>

        <button 
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'keys'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
          onClick={() => handleTabChange('keys')}
        >
          <CreditCard size={16} />
          <span>Payments & WhatsApp Keys</span>
        </button>

        <button 
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
          onClick={() => handleTabChange('catalog')}
        >
          <Tag size={16} />
          <span>Price Catalog</span>
        </button>

        <button 
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'admins'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
          onClick={() => handleTabChange('admins')}
        >
          <Shield size={16} />
          <span>Super Admins & Staff</span>
        </button>
      </div>

      {activeSubTab === 'catalog' ? (
        <Catalog 
          catalog={catalog}
          setCatalog={setCatalog}
          saveCatalog={saveCatalog}
        />
      ) : (
        <div className={`bg-white border border-slate-200/80 rounded-3xl p-7 shadow-xs ${activeSubTab === 'admins' ? 'w-full' : 'max-w-3xl'}`}>
          {/* TAB 1: BUSINESS PROFILE */}
          {activeSubTab === 'business' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">Company Profile Details</h3>
                <div>
                  {!isEditing ? (
                    <button 
                      type="button" 
                      onClick={handleStartEdit} 
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Edit2 size={14} />
                      <span>Edit Settings</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {showCancelConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-bold text-red-600">Discard changes?</span>
                          <button type="button" className="px-2.5 py-1 bg-red-600 text-white font-bold text-[11px] rounded-lg cursor-pointer" onClick={handleConfirmCancel}>Yes</button>
                          <button type="button" className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer" onClick={() => setShowCancelConfirm(false)}>No</button>
                        </div>
                      ) : showSaveConfirm ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-bold text-emerald-700">Save changes?</span>
                          <button type="button" className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg cursor-pointer" onClick={handleConfirmSave}>Yes, Save</button>
                          <button type="button" className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer" onClick={() => setShowSaveConfirm(false)}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={handleCancelClick} className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                          <button type="submit" className="inline-flex items-center gap-1 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                            <Save size={14} />
                            <span>Save Changes</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="p-3.5 bg-sky-50 border border-sky-200/80 rounded-2xl text-xs font-bold text-sky-800 flex items-center gap-2.5">
                  <Lock size={16} className="text-sky-600 flex-shrink-0" />
                  <span>Profile settings are locked. Click "Edit Settings" at top right to modify values.</span>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Business Name</label>
                <input 
                  type="text" 
                  value={businessName}
                  onChange={e => handleBusinessNameChange(e.target.value)}
                  placeholder="e.g. Ironing Service Ltd"
                  required
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">GSTIN / Tax Number</label>
                <input 
                  type="text" 
                  value={gstNumber}
                  onChange={e => handleGstNumberChange(e.target.value)}
                  placeholder="e.g. 33AAAAA1111A1Z1"
                  pattern="[A-Z0-9]{15}"
                  title="Please enter a valid 15-character alphanumeric GSTIN."
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Rate (%)</label>
                <input 
                  type="text" 
                  value={gstPercentage}
                  onChange={e => handleGstChange(e.target.value)}
                  placeholder="e.g. 5.0"
                  required
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Support Phone Number</label>
                <input 
                  type="text" 
                  value={supportPhone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 9876543210"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit support phone number."
                  required
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Support Email Address</label>
                <input 
                  type="email" 
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  placeholder="e.g. support@ironingservice.com"
                  required
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Business Address</label>
                <textarea 
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="Official address to print on receipts"
                  required
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>
            </form>
          )}

          {/* TAB 2: KEYS & SECRETS */}
          {activeSubTab === 'keys' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">Razorpay & WhatsApp Access Keys</h3>
                <div>
                  {!isEditing ? (
                    <button 
                      type="button" 
                      onClick={handleStartEdit} 
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Edit2 size={14} />
                      <span>Edit Keys</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {showCancelConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-bold text-red-600">Discard changes?</span>
                          <button type="button" className="px-2.5 py-1 bg-red-600 text-white font-bold text-[11px] rounded-lg cursor-pointer" onClick={handleConfirmCancel}>Yes</button>
                          <button type="button" className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer" onClick={() => setShowCancelConfirm(false)}>No</button>
                        </div>
                      ) : showSaveConfirm ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-bold text-emerald-700">Save changes?</span>
                          <button type="button" className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg cursor-pointer" onClick={handleConfirmSave}>Yes, Save</button>
                          <button type="button" className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer" onClick={() => setShowSaveConfirm(false)}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={handleCancelClick} className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer">
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                          <button type="submit" className="inline-flex items-center gap-1 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                            <Save size={14} />
                            <span>Save Changes</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="p-3.5 bg-sky-50 border border-sky-200/80 rounded-2xl text-xs font-bold text-sky-800 flex items-center gap-2.5">
                  <Lock size={16} className="text-sky-600 flex-shrink-0" />
                  <span>API keys are locked. Click "Edit Keys" at top right to modify values.</span>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Razorpay Key ID</label>
                <input 
                  type="text" 
                  value={razorpayKeyId}
                  onChange={e => handleKeyChange(e.target.value, setRazorpayKeyId)}
                  placeholder="rzp_test_..."
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                    !isEditing
                      ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Razorpay Key Secret</label>
                <div className="relative flex items-center">
                  <input 
                    type={showKeySecret ? "text" : "password"} 
                    value={razorpayKeySecret}
                    onChange={e => handleKeyChange(e.target.value, setRazorpayKeySecret)}
                    placeholder={isEditing ? "Enter Key Secret" : "••••••••••••••••"}
                    disabled={!isEditing}
                    className={`w-full pl-4 pr-10 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                      !isEditing
                        ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showKeySecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Razorpay Webhook Secret</label>
                <div className="relative flex items-center">
                  <input 
                    type={showWebhookSecret ? "text" : "password"} 
                    value={razorpayWebhookSecret}
                    onChange={e => handleKeyChange(e.target.value, setRazorpayWebhookSecret)}
                    placeholder={isEditing ? "Enter Webhook Secret" : "••••••••••••••••"}
                    disabled={!isEditing}
                    className={`w-full pl-4 pr-10 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
                      !isEditing
                        ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">WhatsApp Cloud Access Token</label>
                <div className="relative flex items-start">
                  <textarea 
                    value={whatsappToken}
                    onChange={e => handleTokenChange(e.target.value, setWhatsappToken)}
                    placeholder="Paste Meta WhatsApp System User Access Token here"
                    disabled={!isEditing}
                    rows={3}
                    className={`w-full pl-4 pr-10 py-3 rounded-xl font-mono text-xs outline-none transition-all break-all ${
                      !isEditing
                        ? 'bg-slate-100/80 text-slate-500 border border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200'
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowWhatsappToken(!showWhatsappToken)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showWhatsappToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: USER & STAFF MANAGEMENT */}
          {activeSubTab === 'admins' && (
            <div className="space-y-6">
              {/* Header Row */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Administrative Accounts
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Manage store owner and staff operator accounts for system access.
                  </p>
                </div>

                {role === 'admin' && (
                  <button 
                    onClick={() => setStaffDrawerOpen(true)} 
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus size={16} />
                    <span>Add New Staff Account</span>
                  </button>
                )}
              </div>

              {/* Staff Table */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Admin ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-slate-400 font-semibold">
                          No staff accounts found.
                        </td>
                      </tr>
                    ) : (
                      admins.map((adm, idx) => {
                        const isSuperAdmin = adm.role === 'SUPER_ADMIN';
                        return (
                          <tr key={adm.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-mono font-extrabold text-purple-700 text-[11px]">
                              ADM-{String(adm.id).padStart(4, '0')}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-extrabold text-xs shadow-xs ${
                                  isSuperAdmin ? 'bg-gradient-to-tr from-sky-600 to-sky-400' : 'bg-slate-600'
                                }`}>
                                  {(adm.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  {adm.name}
                                  {adm.id === currentAdminId && (
                                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">You</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                                isSuperAdmin ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {isSuperAdmin && <Crown size={12} className="text-amber-500" />}
                                {isSuperAdmin ? 'Super Admin' : 'Sub Admin'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-sky-600">
                              @{adm.username}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-500">
                              {new Date(adm.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {role === 'admin' && (
                                <button
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                                  onClick={() => setDeleteConfirmAdmin(adm)}
                                  title="Delete Account"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
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
          )}
        </div>
      )}

      {/* Overlay Backdrop */}
      {staffDrawerOpen && (
        <div 
          onClick={() => setStaffDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      {/* Add Staff Drawer (Sliding sidebar) */}
      {staffDrawerOpen && (
        <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus size={20} className="text-sky-600" />
              <span>Add New Staff</span>
            </h2>
            <button 
              onClick={() => setStaffDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {(() => {
              const hasSuperAdmin = admins.some(a => a.role === 'SUPER_ADMIN');
              const hasSubAdmin = admins.some(a => a.role === 'SUB_ADMIN');

              return (
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  {hasSuperAdmin && hasSubAdmin && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 leading-relaxed">
                      ⚠️ <strong>Slots Full:</strong> The system allows exactly 1 Super Admin and 1 Sub Admin. To add a new admin, delete the existing account first.
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-slate-900 font-bold text-sm outline-none transition-all" 
                      placeholder="e.g. Ramesh K"
                      value={newAdminForm.name}
                      onChange={e => setNewAdminForm({ ...newAdminForm, name: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                      pattern="[A-Za-z\s]+"
                      title="Name must contain letters and spaces only."
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Username <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-slate-900 font-bold text-sm outline-none transition-all" 
                      placeholder="e.g. ramesh123"
                      value={newAdminForm.username}
                      onChange={e => setNewAdminForm({ ...newAdminForm, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                      pattern="[a-zA-Z0-9_]+"
                      title="Username must contain letters, numbers and underscores only (no spaces)."
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password <span className="text-red-500">*</span></label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-slate-900 font-bold text-sm outline-none transition-all" 
                      placeholder="Min 6 chars"
                      value={newAdminForm.password}
                      onChange={e => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      minLength="6"
                      title="Password must be at least 6 characters."
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Role Category <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-slate-900 font-bold text-sm outline-none transition-all cursor-pointer"
                      value={newAdminForm.role}
                      onChange={e => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                    >
                      <option value="SUB_ADMIN" disabled={hasSubAdmin}>
                        Sub Admin (Manager) {hasSubAdmin ? '(Slot Full - 1/1)' : '(Available)'}
                      </option>
                      <option value="SUPER_ADMIN" disabled={hasSuperAdmin}>
                        Super Admin (Owner) {hasSuperAdmin ? '(Slot Full - 1/1)' : '(Available)'}
                      </option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button 
                      className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer" 
                      type="submit" 
                      disabled={loading || (hasSuperAdmin && hasSubAdmin)}
                    >
                      <UserPlus size={16} />
                      Register Account
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Sub-Admin Confirmation Modal */}
      {deleteConfirmAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete {deleteConfirmAdmin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub Admin'}?
                </h3>
                <p className="text-xs font-medium text-slate-500">Confirm permanent deletion</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Are you sure you want to delete staff account <strong className="text-slate-900">"{deleteConfirmAdmin.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => setDeleteConfirmAdmin(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDeleteAdmin}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
