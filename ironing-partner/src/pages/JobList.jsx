import React from 'react';
import { ShoppingBag, Phone, MapPin, ArrowRight, RefreshCw, Truck, Clock, User, Navigation } from 'lucide-react';

export default function JobList({ jobs, setActiveJob, setWorkflowStep, setQuantities, setItemNotes, setCheckedIssues, setClothNote, setPhotoAdded, loadJobs }) {
  const pickupsCount = jobs.filter(j => j.status?.toUpperCase() !== 'OUT_FOR_DELIVERY' && j.status !== 'Out for Delivery').length;
  const deliveriesCount = jobs.filter(j => j.status?.toUpperCase() === 'OUT_FOR_DELIVERY' || j.status === 'Out for Delivery').length;

  return (
    <div className="w-full space-y-5 pb-8">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Today's Tasks</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage and track active collection & delivery orders.
          </p>
        </div>
        <button 
          onClick={loadJobs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Summary Banners */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <ShoppingBag size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider">Pickups</div>
            <div className="text-base font-extrabold text-sky-900">{pickupsCount} Tasks</div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Truck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Deliveries</div>
            <div className="text-base font-extrabold text-emerald-900">{deliveriesCount} Tasks</div>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
            <ShoppingBag size={28} />
          </div>
          <div className="text-lg font-extrabold text-slate-900">All Clear!</div>
          <p className="text-xs font-medium text-slate-500">No jobs assigned for you today.</p>
        </div>
      ) : (
        jobs.map(job => {
          const isDelivery = job.status?.toUpperCase() === 'OUT_FOR_DELIVERY' || job.status === 'Out for Delivery';
          
          return (
            <div 
              key={job.id} 
              className={`bg-white border rounded-3xl p-5 shadow-xs transition-all ${
                isDelivery ? 'border-l-4 border-l-emerald-500 border-slate-200/80' : 'border-l-4 border-l-amber-500 border-slate-200/80'
              }`}
            >
              {/* Header inside Job Card */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">Order #{job.id}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold rounded-lg ${
                  isDelivery ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {isDelivery ? <Truck size={12} /> : <ShoppingBag size={12} />}
                  <span>{isDelivery ? 'DELIVERY' : 'COLLECTION'}</span>
                </span>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <User size={15} className="text-slate-400" />
                  <span>{job.customerNameSnapshot || job.customer?.name}</span>
                </div>
                
                <div className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                  <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{job.pickupAddress || job.customer?.address}</span>
                </div>

                {(job.pickupLandmark || job.customer?.landmark) && (
                  <div className="flex items-center gap-1.5 pl-6 text-xs font-bold text-amber-700">
                    <Navigation size={12} className="text-amber-500" />
                    <span>LM: {job.pickupLandmark || job.customer?.landmark}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock size={13} className="text-slate-400" />
                    <span>{job.pickupSlot || 'Anytime'}</span>
                  </div>
                  
                  <a 
                    href={`tel:${job.customerPhone || job.customer?.phone}`} 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    <Phone size={13} />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>
              
              {/* Actions Button */}
              {isDelivery ? (
                <button 
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => {
                    setActiveJob(job);
                    setWorkflowStep('delivery_details');
                  }}
                >
                  <span>Begin Delivery Route</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => {
                    setActiveJob(job);
                    setWorkflowStep('details');
                    setCheckedIssues([]);
                    setClothNote('');
                    setPhotoAdded(false);
                    setQuantities({ 'Shirt': 0, 'Pant': 0, 'Saree': 0, 'T-Shirt': 0, 'Coat': 0 });
                    setItemNotes({ 'Shirt': '', 'Pant': '', 'Saree': '', 'T-Shirt': '', 'Coat': '' });
                  }}
                >
                  <span>Begin Clothes Collection</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
