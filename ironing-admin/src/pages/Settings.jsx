import React, { useState, useEffect } from 'react';
import { Shield, CreditCard, Building, UserPlus, ToggleLeft, ToggleRight, Tag, Eye, EyeOff, Edit2, Save, X, AlertTriangle, Trash2, Lock, KeyRound, Crown, User2, Hash } from 'lucide-react';
import Catalog from './Catalog';

export default function Settings({ API_BASE, token, role, currentAdminId, handleLogout, isMockMode, triggerToast, catalog, setCatalog, saveCatalog }) {
  const [activeSubTab, setActiveSubTab] = useState('business');
  
  // Settings Form State
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstPercentage, setGstPercentage] = useState(5.0);
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  
  // Keys State
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  
  // Lock & Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Mask/Visibility Toggle States
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);

  // Admins State
  const [admins, setAdmins] = useState([]);
  const [newAdminForm, setNewAdminForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'SUB_ADMIN'
  });
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const togglePasswordVisibility = (id) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const [loading, setLoading] = useState(false);
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);

  // Unified Admin Edit Modal States
  const [editAdminModal, setEditAdminModal] = useState(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editUsernameInput, setEditUsernameInput] = useState('');
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState(null);

  const handleUpdateAdminDetails = async (e) => {
    e.preventDefault();
    if (!editNameInput.trim()) {
      triggerToast('Name is required.', 'error');
      return;
    }
    const trimmedUsername = editUsernameInput.trim().toLowerCase().replace(/\s+/g, '');
    if (trimmedUsername.length < 3) {
      triggerToast('Username must be at least 3 characters.', 'error');
      return;
    }
    if (editPasswordInput && editPasswordInput.length < 6) {
      triggerToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (isMockMode) {
      setAdmins(prev => prev.map(a => {
        if (a.id === editAdminModal.id) {
          const updated = { ...a, name: editNameInput.trim(), username: trimmedUsername };
          if (editPasswordInput) {
            updated.password = editPasswordInput;
          }
          return updated;
        }
        return a;
      }));
      triggerToast('Admin details updated successfully!', 'success');
      setEditAdminModal(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings/admins/${editAdminModal.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editNameInput.trim(),
          username: trimmedUsername,
          password: editPasswordInput || undefined
        })
      });
      if (res.ok) {
        triggerToast('Admin details updated successfully!', 'success');
        await fetchAdmins();
        setEditAdminModal(null);
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to update admin details.', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Error updating admin details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!deleteConfirmAdmin) return;
    if (isMockMode) {
      setAdmins(prev => prev.filter(a => a.id !== deleteConfirmAdmin.id));
      triggerToast('Sub-admin account permanently deleted.', 'success');
      setDeleteConfirmAdmin(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings/admins/${deleteConfirmAdmin.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        triggerToast('Staff account permanently deleted.', 'success');
        if (deleteConfirmAdmin.id === currentAdminId && handleLogout) {
          handleLogout();
        } else {
          await fetchAdmins();
        }
        setDeleteConfirmAdmin(null);
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

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const fetchSettings = async () => {
    if (isMockMode) return;
    try {
      const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBusinessName(data.businessName || '');
        setBusinessAddress(data.businessAddress || '');
        setGstNumber(data.gstNumber || '');
        setGstPercentage(data.gstPercentage || 5.0);
        setSupportPhone(data.supportPhone || '');
        setSupportEmail(data.supportEmail || '');
        setRazorpayKeyId(data.razorpayKeyId || '');
        setRazorpayKeySecret(data.razorpayKeySecret || '');
        setRazorpayWebhookSecret(data.razorpayWebhookSecret || '');
        setWhatsappToken(data.whatsappToken || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdmins = async () => {
    if (isMockMode) return;
    try {
      const res = await fetch(`${API_BASE}/settings/admins`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, [isMockMode]);

  const handleTabChange = (tab) => {
    setActiveSubTab(tab);
    setIsEditing(false);
    setShowCancelConfirm(false);
    setShowSaveConfirm(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setShowCancelConfirm(false);
    setShowSaveConfirm(false);
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    await fetchSettings();
    setIsEditing(false);
    setShowCancelConfirm(false);
  };

  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    if (isMockMode) {
      triggerToast('Mock Mode: settings update simulated.', 'info');
      setIsEditing(false);
      setShowSaveConfirm(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          businessName,
          businessAddress,
          gstNumber,
          gstPercentage: parseFloat(gstPercentage),
          supportPhone,
          supportEmail,
          razorpayKeyId,
          razorpayKeySecret,
          razorpayWebhookSecret,
          whatsappToken
        })
      });
      if (res.ok) {
        triggerToast('Settings saved successfully!', 'success');
        await fetchSettings();
        setIsEditing(false);
      } else {
        triggerToast('Failed to save settings.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error saving settings.', 'error');
    } finally {
      setLoading(false);
      setShowSaveConfirm(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    handleSaveClick();
  };

  const handlePhoneChange = (val) => {
    const sanitized = val.replace(/[^0-9]/g, '').slice(0, 10);
    setSupportPhone(sanitized);
  };

  const handleGstChange = (val) => {
    const sanitized = val.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    if (parseFloat(sanitized) > 100) return;
    setGstPercentage(sanitized);
  };

  const handleBusinessNameChange = (val) => {
    const sanitized = val.replace(/[^a-zA-Z\s&'-.]/g, '');
    setBusinessName(sanitized);
  };

  const handleGstNumberChange = (val) => {
    const sanitized = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstNumber(sanitized);
  };

  const handleKeyChange = (val, setter) => {
    setter(val);
  };

  const handleTokenChange = (val, setter) => {
    setter(val);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();

    const existingSuperAdmin = admins.some(a => a.role === 'SUPER_ADMIN');
    const existingSubAdmin = admins.some(a => a.role === 'SUB_ADMIN');

    if (newAdminForm.role === 'SUPER_ADMIN' && existingSuperAdmin) {
      triggerToast('A Super Admin account already exists. Please delete the current Super Admin to add a new one.', 'error');
      return;
    }

    if (newAdminForm.role === 'SUB_ADMIN' && existingSubAdmin) {
      triggerToast('A Sub Admin account already exists. Please delete the current Sub Admin to add a new one.', 'error');
      return;
    }

    if (isMockMode) {
      triggerToast('Mock Mode: simulated new admin registration.', 'info');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings/admins`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newAdminForm)
      });
      if (res.ok) {
        triggerToast('Administrator account registered successfully!', 'success');
        setNewAdminForm({ username: '', password: '', name: '', role: 'SUB_ADMIN' });
        await fetchAdmins();
        setStaffDrawerOpen(false);
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to add administrator.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error registering administrator.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminActive = async (adminId) => {
    if (isMockMode) return;
    try {
      const res = await fetch(`${API_BASE}/settings/admins/${adminId}/toggle`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        await fetchAdmins();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to toggle account status.', 'error');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete staff member "${adminName}"?`);
    if (!confirm) return;

    if (isMockMode) {
      triggerToast('Mock Mode: simulated staff account deletion.', 'info');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/settings/admins/${adminId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        triggerToast('Staff account permanently deleted.', 'success');
        await fetchAdmins();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to delete account.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error deleting staff account.', 'error');
    }
  };

  const subAdminsCount = admins.filter(adm => adm.role === 'SUB_ADMIN').length;

  return (
    <div>
      <header className="page-header">
        <div className="page-title-group">
          <h1>System Configuration Settings</h1>
          <p>Configure company metadata, Razorpay keys, and manage administrator access.</p>
        </div>
      </header>

      {/* Settings Navigation Bar */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-light)', marginBottom: 24, paddingBottom: 8 }}>
        <button 
          className={`btn ${activeSubTab === 'business' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => handleTabChange('business')}
        >
          <Building size={16} />
          <span>Business details</span>
        </button>
        <button 
          className={`btn ${activeSubTab === 'keys' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => handleTabChange('keys')}
        >
          <CreditCard size={16} />
          <span>Payments & WhatsApp Keys</span>
        </button>
        <button 
          className={`btn ${activeSubTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => handleTabChange('catalog')}
        >
          <Tag size={16} />
          <span>Price Catalog</span>
        </button>
        <button 
          className={`btn ${activeSubTab === 'admins' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
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
        <div className="data-card" style={{ maxWidth: activeSubTab === 'admins' ? '100%' : '700px' }}>
          <div className="card-body">
            {/* TAB 1: BUSINESS PROFILE */}
            {activeSubTab === 'business' && (
              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Company Profile Details</h3>
                  <div>
                    {!isEditing ? (
                      <button className="btn btn-primary" type="button" onClick={handleStartEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Edit2 size={14} />
                        <span>Edit Settings</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {showCancelConfirm ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.06)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', animation: 'slideIn 0.2s ease-out' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>Discard changes?</span>
                            <button className="btn btn-danger" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={handleConfirmCancel}>Yes</button>
                            <button className="btn btn-secondary" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => setShowCancelConfirm(false)}>No</button>
                          </div>
                        ) : showSaveConfirm ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.06)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', animation: 'slideIn 0.2s ease-out' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Save changes?</span>
                            <button className="btn btn-primary" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto', backgroundColor: '#10B981', borderColor: '#10B981' }} onClick={handleConfirmSave}>Yes, Save</button>
                            <button className="btn btn-secondary" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => setShowSaveConfirm(false)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button className="btn btn-secondary" type="button" onClick={handleCancelClick} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                              <X size={14} />
                              <span>Cancel</span>
                            </button>
                            <button className="btn btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
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
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.06)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', marginBottom: 20, fontSize: '0.82rem', color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={14} />
                    <span>Profile settings are locked. Click "Edit Settings" at the top right to modify values.</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={businessName}
                    onChange={e => handleBusinessNameChange(e.target.value)}
                    placeholder="e.g. Ironing Service Ltd"
                    required
                    disabled={!isEditing}
                    style={{
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN / Tax Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={gstNumber}
                    onChange={e => handleGstNumberChange(e.target.value)}
                    placeholder="e.g. 33AAAAA1111A1Z1"
                    pattern="[A-Z0-9]{15}"
                    title="Please enter a valid 15-character alphanumeric GSTIN."
                    disabled={!isEditing}
                    style={{
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={gstPercentage}
                    onChange={e => handleGstChange(e.target.value)}
                    placeholder="e.g. 5.0"
                    required
                    disabled={!isEditing}
                    style={{
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Support Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={supportPhone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="e.g. 9876543210"
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit support phone number."
                    required
                    disabled={!isEditing}
                    style={{
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Support Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    placeholder="e.g. support@ironingservice.com"
                    required
                    disabled={!isEditing}
                    style={{
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Address</label>
                  <textarea 
                    className="form-input" 
                    style={{ 
                      minHeight: '100px', 
                      resize: 'vertical',
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                    value={businessAddress}
                    onChange={e => setBusinessAddress(e.target.value)}
                    placeholder="Official address to print on receipts"
                    required
                    disabled={!isEditing}
                  />
                </div>
              </form>
            )}

            {/* TAB 2: KEYS & SECRETS */}
            {activeSubTab === 'keys' && (
              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Razorpay & WhatsApp Access Keys</h3>
                  <div>
                    {!isEditing ? (
                      <button className="btn btn-primary" type="button" onClick={handleStartEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Edit2 size={14} />
                        <span>Edit Keys</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {showCancelConfirm ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.06)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', animation: 'slideIn 0.2s ease-out' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>Discard changes?</span>
                            <button className="btn btn-danger" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={handleConfirmCancel}>Yes</button>
                            <button className="btn btn-secondary" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => setShowCancelConfirm(false)}>No</button>
                          </div>
                        ) : showSaveConfirm ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.06)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', animation: 'slideIn 0.2s ease-out' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Save changes?</span>
                            <button className="btn btn-primary" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto', backgroundColor: '#10B981', borderColor: '#10B981' }} onClick={handleConfirmSave}>Yes, Save</button>
                            <button className="btn btn-secondary" type="button" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => setShowSaveConfirm(false)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button className="btn btn-secondary" type="button" onClick={handleCancelClick} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
                              <X size={14} />
                              <span>Cancel</span>
                            </button>
                            <button className="btn btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
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
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.06)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', marginBottom: 20, fontSize: '0.82rem', color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={14} />
                    <span>API keys are locked. Click "Edit Keys" at the top right to modify values.</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Razorpay Key ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={razorpayKeyId}
                    onChange={e => handleKeyChange(e.target.value, setRazorpayKeyId)}
                    placeholder="rzp_test_..."
                    disabled={!isEditing}
                    style={{
                      backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                      color: !isEditing ? '#64748B' : '#0F172A',
                      border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                      cursor: !isEditing ? 'not-allowed' : 'text',
                      opacity: !isEditing ? 0.75 : 1,
                      fontWeight: !isEditing ? 600 : 700
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Razorpay Key Secret</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showKeySecret ? "text" : "password"} 
                      className="form-input" 
                      style={{ 
                        paddingRight: '40px',
                        backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                        color: !isEditing ? '#64748B' : '#0F172A',
                        border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                        cursor: !isEditing ? 'not-allowed' : 'text',
                        opacity: !isEditing ? 0.75 : 1,
                        fontWeight: !isEditing ? 600 : 700
                      }}
                      value={razorpayKeySecret}
                      onChange={e => handleKeyChange(e.target.value, setRazorpayKeySecret)}
                      placeholder={isEditing ? "Enter Key Secret" : "••••••••••••••••"}
                      disabled={!isEditing}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    >
                      {showKeySecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Razorpay Webhook Secret</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showWebhookSecret ? "text" : "password"} 
                      className="form-input" 
                      style={{ 
                        paddingRight: '40px',
                        backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                        color: !isEditing ? '#64748B' : '#0F172A',
                        border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                        cursor: !isEditing ? 'not-allowed' : 'text',
                        opacity: !isEditing ? 0.75 : 1,
                        fontWeight: !isEditing ? 600 : 700
                      }}
                      value={razorpayWebhookSecret}
                      onChange={e => handleKeyChange(e.target.value, setRazorpayWebhookSecret)}
                      placeholder={isEditing ? "Enter Webhook Secret" : "••••••••••••••••"}
                      disabled={!isEditing}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    >
                      {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Cloud Access Token</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <textarea 
                      className="form-input" 
                      style={{ 
                        minHeight: '80px', 
                        fontFamily: 'monospace', 
                        fontSize: '0.8rem', 
                        paddingRight: '40px',
                        lineHeight: 1.5,
                        wordBreak: 'break-all',
                        WebkitTextSecurity: showWhatsappToken ? 'none' : 'disc',
                        backgroundColor: !isEditing ? '#F1F5F9' : '#FFFFFF',
                        color: !isEditing ? '#64748B' : '#0F172A',
                        border: !isEditing ? '1px solid #CBD5E1' : '2px solid #0284c7',
                        cursor: !isEditing ? 'not-allowed' : 'text',
                        opacity: !isEditing ? 0.75 : 1,
                        fontWeight: !isEditing ? 600 : 700
                      }}
                      value={whatsappToken}
                      onChange={e => handleTokenChange(e.target.value, setWhatsappToken)}
                      placeholder="Paste Meta WhatsApp System User Access Token here"
                      disabled={!isEditing}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowWhatsappToken(!showWhatsappToken)}
                      style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                    >
                      {showWhatsappToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: USER & STAFF MANAGEMENT */}
            {activeSubTab === 'admins' && (
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Administrative Accounts
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
                      Manage store owner and staff operator accounts for system access.
                    </p>
                  </div>

                  {role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => setStaffDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>
                      <UserPlus size={16} />
                      <span>Add New Staff Account</span>
                    </button>
                  )}
                </div>

                {/* Staff Table */}
                <div className="custom-table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%' }}>
                  <table className="custom-table" style={{ fontSize: '0.82rem', width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ width: '5%', padding: '14px 16px', textAlign: 'left' }}>#</th>
                        <th style={{ width: '15%', padding: '14px 16px', textAlign: 'left' }}>Admin ID</th>
                        <th style={{ width: '25%', padding: '14px 16px', textAlign: 'left' }}>Name</th>
                        <th style={{ width: '18%', padding: '14px 16px', textAlign: 'left' }}>Role</th>
                        <th style={{ width: '17%', padding: '14px 16px', textAlign: 'left' }}>Username</th>
                        <th style={{ width: '12%', padding: '14px 16px', textAlign: 'left' }}>Joined Date</th>
                        <th style={{ width: '8%', padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                            No staff accounts found.
                          </td>
                        </tr>
                      ) : (
                        admins.map((adm, idx) => {
                          const isSuperAdmin = adm.role === 'SUPER_ADMIN';
                          return (
                            <tr
                              key={adm.id}
                              style={{ borderBottom: '1px solid #f1f5f9' }}
                            >
                              <td style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <span className="notranslate" translate="no" style={{ fontFamily: 'monospace', fontWeight: 800, color: '#7c3aed', fontSize: '0.78rem' }}>
                                  ADM-{String(adm.id).padStart(4, '0')}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: isSuperAdmin ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'linear-gradient(135deg, #64748b, #475569)',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
                                  }}>
                                    {(adm.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                                    {adm.name}
                                    {adm.id === currentAdminId && (
                                      <span style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>You</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ 
                                  padding: '5px 12px', 
                                  borderRadius: 6, 
                                  fontSize: '0.75rem', 
                                  fontWeight: 800, 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 5,
                                  backgroundColor: isSuperAdmin ? '#E0F2FE' : '#F1F5F9',
                                  color: isSuperAdmin ? '#0369A1' : '#475569',
                                  border: `1px solid ${isSuperAdmin ? '#BAE6FD' : '#E2E8F0'}`
                                }}>
                                  {isSuperAdmin && <Crown size={13} style={{ color: '#f59e0b' }} />}
                                  {isSuperAdmin ? 'Super Admin' : 'Sub Admin'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span className="notranslate" translate="no" style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                  @{adm.username}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.82rem' }}>
                                {new Date(adm.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                  {role === 'admin' && (
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', minHeight: 'auto' }}
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmAdmin(adm); }}
                                      title="Delete Account"
                                    >
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  )}
                                </div>
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
        </div>
      )}

      {/* Overlay Backdrop */}
      {staffDrawerOpen && (
        <div 
          onClick={() => setStaffDrawerOpen(false)}
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

      {/* Add Staff Drawer (Sliding sidebar) */}
      {staffDrawerOpen && (
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
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserPlus size={22} style={{ color: 'var(--primary-dark)' }} /> Add New Staff
            </h2>
            <button 
              onClick={() => setStaffDrawerOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-slate)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {(() => {
              const hasSuperAdmin = admins.some(a => a.role === 'SUPER_ADMIN');
              const hasSubAdmin = admins.some(a => a.role === 'SUB_ADMIN');

              return (
                <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {hasSuperAdmin && hasSubAdmin && (
                    <div style={{ backgroundColor: '#FFFBEB', color: '#B45309', padding: '12px 14px', borderRadius: 8, fontSize: '0.8rem', border: '1px solid #FEF3C7', fontWeight: 600, lineHeight: 1.5 }}>
                      ⚠️ <strong>Slots Full:</strong> The system allows exactly 1 Super Admin and 1 Sub Admin. To add a new admin, delete the existing account first.
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Ramesh K"
                      value={newAdminForm.name}
                      onChange={e => setNewAdminForm({ ...newAdminForm, name: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                      pattern="[A-Za-z\s]+"
                      title="Name must contain letters and spaces only."
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Username <span style={{ color: '#EF4444' }}>*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. ramesh123"
                      value={newAdminForm.username}
                      onChange={e => setNewAdminForm({ ...newAdminForm, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                      pattern="[a-zA-Z0-9_]+"
                      title="Username must contain letters, numbers and underscores only (no spaces)."
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Password <span style={{ color: '#EF4444' }}>*</span></label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Min 6 chars"
                      value={newAdminForm.password}
                      onChange={e => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      minLength="6"
                      title="Password must be at least 6 characters."
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Role Category <span style={{ color: '#EF4444' }}>*</span></label>
                    <select 
                      className="form-input"
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

                  <div style={{ marginTop: 24 }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} 
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
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
          zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '24px 28px', maxWidth: 420, width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0', animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Delete {deleteConfirmAdmin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub Admin'}?
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Confirm permanent deletion</p>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to delete staff account <strong style={{ color: '#0f172a' }}>"{deleteConfirmAdmin.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteConfirmAdmin(null)}
                style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDeleteAdmin}
                disabled={loading}
                style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
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
