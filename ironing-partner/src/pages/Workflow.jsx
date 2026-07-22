import React, { useState } from 'react';
import { 
  Phone, 
  Navigation, 
  Check, 
  Camera, 
  AlertTriangle, 
  RefreshCw, 
  Minus, 
  Plus
} from 'lucide-react';

export default function Workflow({
  activeJob,
  setActiveJob,
  workflowStep,
  setWorkflowStep,
  checkedIssues,
  toggleIssue,
  clothNote,
  setClothNote,
  photoAdded,
  setPhotoAdded,
  quantities,
  adjustQty,
  calculateTotal,
  handleReached,
  handleClothCheckSubmit,
  forceMockCustomerAccept,
  handleSendPayment,
  handleCashCollected,
  triggerMockOnlinePayment,
  handlePicked,
  handleCantMakeIt,
  handleMarkDelivered,
  openRescheduleModal,
  showConfirm,
  setConfirmModal,
  CATALOG,
  API_BASE,
  itemNotes,
  setItemNotes
}) {
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');

  return (
    <div className="mobile-layout">
      <div className="app-bar">
        <div>
          <div className="app-bar-subtitle">Active Job</div>
          <h1>Order #{activeJob.id}</h1>
        </div>
        <button 
          style={{ padding: '6px 12px', border: 'none', background: 'rgba(91, 58, 27, 0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 600 }}
          onClick={() => showConfirm(
            'Exit this job view? Your progress is saved.',
            () => { setConfirmModal(null); setActiveJob(null); },
            { confirmLabel: 'Yes, Exit', cancelLabel: 'Stay', danger: false }
          )}
        >
          Exit
        </button>
      </div>

      <div className="content-area">
        {/* STEP 1: JOB DETAILS */}
        {workflowStep === 'details' && (
          <div>
            <div className="job-card" style={{ marginBottom: 24 }}>
              <div className="job-customer">{activeJob.customer?.name}</div>
              <div className="job-address">
                <strong>Pickup Address:</strong><br />
                {activeJob.customer?.address}
                {activeJob.customer?.landmark && (
                  <div style={{ fontStyle: 'italic', color: 'var(--primary-dark)', marginTop: 4 }}>
                    Landmark: {activeJob.customer.landmark}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a 
                  href={`tel:${activeJob.customer?.phone}`} 
                  className="btn-mobile btn-mobile-secondary"
                  style={{ textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <Phone size={18} />
                  <span>Call Customer</span>
                </a>
                
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${activeJob.customer?.latitude},${activeJob.customer?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mobile btn-mobile-secondary"
                  style={{ textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <Navigation size={18} />
                  <span>Google Maps Directions</span>
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn-mobile btn-mobile-primary" onClick={handleReached}>
                <Check size={20} />
                <span>I Have Reached</span>
              </button>

              <button className="btn-mobile btn-mobile-danger" style={{ background: 'transparent' }} onClick={handleCantMakeIt}>
                Can't Make It Today
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CLOTH CHECK CHECKLIST */}
        {workflowStep === 'cloth_check' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Cloth Condition Check</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Inspect clothes before count. Tick any pre-existing damages.
              </p>
            </div>

            <div className="checklist-group">
              {['Button Missing', 'Torn / Hole', 'Stain Marks', 'Already Burnt', 'Color Faded'].map(issue => (
                <div key={issue} className="checklist-item" onClick={() => toggleIssue(issue)}>
                  <div className={`checklist-checkbox ${checkedIssues.includes(issue) ? 'checked' : ''}`}>
                    {checkedIssues.includes(issue) && <Check size={14} />}
                  </div>
                  <span className="checklist-item-label">{issue}</span>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Inspect Notes (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Back pocket torn"
                value={clothNote}
                onChange={e => setClothNote(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <button 
                type="button" 
                className="btn-mobile btn-mobile-secondary" 
                onClick={() => setPhotoAdded(!photoAdded)}
                style={{ border: photoAdded ? '2px solid #059669' : 'none' }}
              >
                <Camera size={18} />
                <span>{photoAdded ? 'Photo Attached ✓' : 'Take Condition Photo'}</span>
              </button>
            </div>

            <button className="btn-mobile btn-mobile-primary" onClick={handleClothCheckSubmit}>
              {checkedIssues.length === 0 ? 'No Damage - Proceed' : 'Submit Damage Report'}
            </button>
          </div>
        )}

        {/* STEP 3: WAITING CUSTOMER ACCEPTANCE */}
        {workflowStep === 'waiting_acceptance' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ display: 'inline-flex', padding: 16, backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '50%', marginBottom: 18 }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Damage Report Sent</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24 }}>
              Waiting for the customer to review and accept the reported cloth condition issues on WhatsApp.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn-mobile btn-mobile-primary" onClick={forceMockCustomerAccept}>
                <RefreshCw size={18} />
                <span>Refresh / Simulate Acceptance</span>
              </button>
              <button className="btn-mobile btn-mobile-secondary" onClick={() => setWorkflowStep('cloth_check')}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: COUNT CLOTHES (STRIPPED PRICING + DAMAGE NOTES) */}
        {workflowStep === 'count' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Item Count Tally</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Tally the exact quantities collected from the customer.
              </p>
            </div>

            <div className="counter-list">
              {CATALOG.map(item => (
                <div key={item.itemType} className="counter-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="counter-item-label" style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.itemType}</div>
                    </div>
                    <div className="counter-controls">
                      <button className="counter-btn" onClick={() => adjustQty(item.itemType, -1)}>
                        <Minus size={16} />
                      </button>
                      <span className="counter-value">{quantities[item.itemType]}</span>
                      <button className="counter-btn" onClick={() => adjustQty(item.itemType, 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {quantities[item.itemType] > 0 && (
                    <div className="form-group" style={{ marginTop: 8, marginBottom: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500, marginBottom: 4, display: 'block', textAlign: 'left' }}>
                        {item.itemType} Damage Notes (Optional)
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ width: '100%', display: 'block', padding: '8px 12px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        placeholder="e.g. collar torn, stain mark"
                        value={itemNotes[item.itemType] || ''}
                        onChange={e => setItemNotes({ ...itemNotes, [item.itemType]: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <button className="btn-mobile btn-mobile-primary" onClick={handleSendPayment}>
                <span>Complete Pickup</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: WAITING FOR CUSTOMER PAYMENT (LIVE SPINNING LOADER) */}
        {workflowStep === 'waiting_payment' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            {activeJob.paymentStatus !== 'Paid' ? (
              <>
                <div 
                  className="animate-spin" 
                  style={{ 
                    display: 'inline-block', 
                    border: '4px solid rgba(44, 125, 160, 0.1)', 
                    borderLeftColor: 'var(--primary-dark)', 
                    borderRadius: '50%', 
                    width: 44, 
                    height: 44, 
                    marginBottom: 20 
                  }} 
                />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-dark)' }}>
                  Awaiting Customer Payment
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24 }}>
                  Order #{activeJob.id} pickup logged. We have sent the bill breakdown and payment link to the customer's WhatsApp.
                </p>
                
                <div style={{ padding: 14, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.4, marginBottom: 20 }}>
                  This screen will automatically update once the payment is captured.
                </div>
              </>
            ) : (
              <>
                <div 
                  style={{ 
                    display: 'inline-flex', 
                    padding: 16, 
                    backgroundColor: '#D1FAE5', 
                    color: '#065F46', 
                    borderRadius: '50%', 
                    marginBottom: 20 
                  }}
                >
                  <Check size={36} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#065F46', marginBottom: 8 }}>
                  Payment Confirmed!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24 }}>
                  Payment received successfully. You may now collect the clothes, hand over the physical items, and leave.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  <button className="btn-mobile btn-mobile-primary" onClick={handlePicked}>
                    <Check size={20} />
                    <span>Mark Clothes Picked & Back to List</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 6: DELIVERY DETAILS (NO PRICES) */}
        {workflowStep === 'delivery_details' && (
          <div>
            <div className="job-card" style={{ marginBottom: 24 }}>
              <div className="job-customer">{activeJob.customer?.name}</div>
              <div className="job-address">
                <strong>Delivery Address:</strong><br />
                {activeJob.customer?.address}
                {activeJob.customer?.landmark && (
                  <div style={{ fontStyle: 'italic', color: 'var(--primary-dark)', marginTop: 4 }}>
                    Landmark: {activeJob.customer.landmark}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                <strong style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>Items to Deliver:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeJob.items && activeJob.items.length > 0 ? (
                    activeJob.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                        <span>{item.itemType}</span>
                        <span style={{ fontWeight: 600 }}>x {item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No items logged.</div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <a 
                  href={`tel:${activeJob.customer?.phone}`} 
                  className="btn-mobile btn-mobile-secondary"
                  style={{ textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <Phone size={18} />
                  <span>Call Customer</span>
                </a>
                
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${activeJob.customer?.latitude},${activeJob.customer?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mobile btn-mobile-secondary"
                  style={{ textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <Navigation size={18} />
                  <span>Google Maps Directions</span>
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ 
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 4,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: 8, textAlign: 'left' }}>
                  Secure Delivery OTP
                </label>
                <input 
                  type="text" 
                  maxLength={4}
                  className="form-input" 
                  placeholder="Enter 4-Digit OTP"
                  value={deliveryOtpInput}
                  onChange={e => setDeliveryOtpInput(e.target.value)}
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    letterSpacing: '0.5rem', 
                    padding: '10px',
                    borderColor: 'var(--primary-light)'
                  }}
                />
              </div>

              <button 
                className="btn-mobile btn-mobile-primary" 
                style={{ backgroundColor: '#10B981' }} 
                onClick={async () => {
                  await handleMarkDelivered(activeJob.id, deliveryOtpInput);
                  setActiveJob(null);
                }}
              >
                <Check size={20} />
                <span>Verify OTP & Complete Delivery</span>
              </button>

              <button 
                className="btn-mobile btn-mobile-danger" 
                style={{ background: 'transparent', border: '1px solid #DC2626', color: '#DC2626', marginTop: 8 }} 
                onClick={handleCantMakeIt}
              >
                Can't Make It Today
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
