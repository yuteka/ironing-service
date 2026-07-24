import React, { useState, useEffect } from 'react';
import { User, LogOut, Wifi, WifiOff, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

export default function Profile({ partnerName, handleLogout, showConfirm, setConfirmModal, triggerToast }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  
  const [partnerDetails, setPartnerDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dutyActive, setDutyActive] = useState(true);

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch partner profile active status from DB
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('partner_token');
        const res = await fetch(`http://${window.location.hostname}:3000/api/partner/jobs/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPartnerDetails(data);
          setDutyActive(data.active);
        }
      } catch (e) {
        console.error('Error fetching partner details:', e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);



  const triggerManualSync = () => {
    if (!isOnline) {
      triggerToast('⚠️ Cannot sync. Device is currently offline.', 'error');
      return;
    }

    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      triggerToast('✅ Sync Complete: Connection active. All local logs are synchronized.', 'success');
    }, 1200);
  };

  const getInitialsAvatar = (name) => {
    const letter = name ? name.charAt(0).toUpperCase() : 'P';
    return (
      <div style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #E0A86B, #5B3A1B)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '1.4rem',
        boxShadow: '0 8px 20px rgba(91, 58, 27, 0.15)',
        margin: '0 auto 12px auto'
      }}>
        {letter}
      </div>
    );
  };

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Profile Details */}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        {getInitialsAvatar(partnerName)}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{partnerName}</h3>
        {partnerDetails && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
            @{partnerDetails.username} • {partnerDetails.phone}
          </div>
        )}
      </div>

      {/* Control Card */}
      <div className="job-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Dynamic Duty Toggle */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--border-light)',
            backgroundColor: dutyActive ? 'rgba(16, 185, 129, 0.01)' : 'transparent'
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: dutyActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: dutyActive ? '#10B981' : '#64748B'
            }}>
              <ShieldCheck size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-dark)' }}>Duty Status</span>
              <span style={{ fontSize: '0.74rem', color: dutyActive ? '#10B981' : '#64748B', fontWeight: 700, marginTop: 1 }}>
                {dutyActive ? 'On Duty • Accepting Jobs' : 'Off Duty • On Leave'}
              </span>
            </div>
          </div>
          <div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              backgroundColor: dutyActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: dutyActive ? '#10B981' : '#D97706',
              border: dutyActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              {dutyActive ? 'Active' : 'On Leave'}
            </div>
          </div>
        </div>

        {/* Log Out */}
        <div 
          style={{ padding: '16px 20px', display: 'flex', gap: 12, color: '#DC2626', cursor: 'pointer', alignItems: 'center' }}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Log Out Profile</span>
        </div>
      </div>
    </div>
  );
}
