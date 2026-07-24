import React, { useState, useEffect } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function Profile({ partnerName, handleLogout, triggerToast }) {
  const [partnerDetails, setPartnerDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dutyActive, setDutyActive] = useState(true);

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

  const getInitialsAvatar = (name) => {
    const letter = name ? name.charAt(0).toUpperCase() : 'P';
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-sky-500/25 mx-auto mb-3">
        {letter}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 py-4">
      {/* Profile Details */}
      <div className="text-center">
        {getInitialsAvatar(partnerName)}
        <h3 className="text-xl font-extrabold text-slate-900">{partnerName}</h3>
        {partnerDetails && (
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            @{partnerDetails.username} • {partnerDetails.phone}
          </div>
        )}
      </div>

      {/* Control Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100">
        
        {/* Dynamic Duty Toggle */}
        <div className={`flex items-center justify-between p-4 ${dutyActive ? 'bg-emerald-50/40' : 'bg-slate-50/40'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${dutyActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="block text-sm font-extrabold text-slate-900">Duty Status</span>
              <span className={`block text-xs font-bold ${dutyActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                {dutyActive ? 'On Duty • Accepting Jobs' : 'Off Duty • On Leave'}
              </span>
            </div>
          </div>
          <div>
            <span className={`inline-flex items-center px-3 py-1 text-xs font-extrabold rounded-xl uppercase tracking-wider ${
              dutyActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {dutyActive ? 'Active' : 'On Leave'}
            </span>
          </div>
        </div>

        {/* Log Out */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 text-red-600 hover:bg-red-50 font-bold text-sm transition-colors cursor-pointer text-left"
        >
          <LogOut size={18} />
          <span>Log Out Profile</span>
        </button>
      </div>
    </div>
  );
}
