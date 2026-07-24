import React from 'react';
import { ShoppingBag, RefreshCw, MapPin, User, Clock, Phone, ArrowRight, Truck, Navigation } from 'lucide-react';

export default function JobList({ 
  jobs, 
  loadJobs, 
  setActiveJob, 
  setWorkflowStep, 
  setCheckedIssues, 
  setClothNote, 
  setPhotoAdded, 
  setQuantities,
  setItemNotes,
  handleMarkDelivered
}) {
  const pickupsCount = jobs.filter(j => {
    const s = j.status?.toUpperCase();
    return s !== 'OUT_FOR_DELIVERY';
  }).length;
  
  const deliveriesCount = jobs.filter(j => {
    const s = j.status?.toUpperCase();
    return s === 'OUT_FOR_DELIVERY';
  }).length;

  return (
    <div>
      <style>{`
        .partner-job-card {
          background: #ffffff;
          border: 1px solid rgba(224, 168, 107, 0.15);
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px -4px rgba(91, 58, 27, 0.04);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .partner-job-card:active {
          transform: scale(0.98);
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }
      `}</style>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Today's Tasks</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
            Manage and track active collection & delivery orders.
          </p>
        </div>
        <button 
          style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 4, color: '#E0A86B', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          onClick={loadJobs}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Summary Bubble pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingBag size={15} style={{ color: '#3B82F6' }} />
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Pickups</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1D4ED8' }}>{pickupsCount} Tasks</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={15} style={{ color: '#10B981' }} />
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Deliveries</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>{deliveriesCount} Tasks</div>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--white)', borderRadius: 20, border: '1px solid var(--border-light)', boxShadow: 'var(--card-shadow)' }}>
          <ShoppingBag size={36} style={{ color: '#E0A86B', marginBottom: 12, opacity: 0.6 }} />
          <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.05rem' }}>All Clear!</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>No jobs assigned for you today.</div>
        </div>
      ) : (
        jobs.map(job => {
          const isDelivery = job.status?.toUpperCase() === 'OUT_FOR_DELIVERY' || job.status === 'Out for Delivery';
          
          return (
            <div 
              key={job.id} 
              className="partner-job-card"
              style={{
                borderLeft: isDelivery ? '4px solid #10B981' : '4px solid #E0A86B'
              }}
            >
              {/* Header inside Job Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Order #{job.id}</span>
                <span 
                  style={{
                    backgroundColor: isDelivery ? 'rgba(16, 185, 129, 0.08)' : 'rgba(224, 168, 107, 0.08)',
                    color: isDelivery ? '#10B981' : '#E0A86B',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isDelivery ? <Truck size={12} /> : <ShoppingBag size={12} />}
                  <span>{isDelivery ? 'DELIVERY' : 'COLLECTION'}</span>
                </span>
              </div>

              {/* Customer details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{job.customerNameSnapshot || job.customer?.name}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>{job.pickupAddress || job.customer?.address}</span>
                </div>

                {(job.pickupLandmark || job.customer?.landmark) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 20 }}>
                    <Navigation size={10} style={{ color: '#E0A86B' }} />
                    <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>LM: {job.pickupLandmark || job.customer?.landmark}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTop: '1px dashed rgba(224, 168, 107, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{job.pickupSlot || 'Anytime'}</span>
                  </div>
                  
                  <a href={`tel:${job.customerPhone || job.customer?.phone}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#3B82F6', fontSize: '0.78rem', fontWeight: 700 }}>
                    <Phone size={12} />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>
              
              {/* Actions Button */}
              {isDelivery ? (
                <button 
                  className="btn-mobile btn-mobile-primary"
                  style={{ minHeight: 46, padding: '10px 14px', fontSize: '0.88rem', backgroundColor: '#10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
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
                  className="btn-mobile btn-mobile-primary"
                  style={{ minHeight: 46, padding: '10px 14px', fontSize: '0.88rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
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
