import React, { useState, useEffect } from 'react';
import { X, Phone, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { formatPhone } from '../utils/formatPhone';

export default function OrderDrawer({ 
  selectedOrder, 
  setSelectedOrder, 
  partners,
  orders = [],
  assignPartner, 
  updateOrderStatus, 
  cancelOrder, 
  isMockMode, 
  token, 
  API_BASE,
  role 
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    setShowCancelConfirm(false);
  }, [selectedOrder]);

  if (!selectedOrder) return null;

  const isDeliveryPhase = ['READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) || (selectedOrder.status === 'REASSIGNMENT_NEEDED' && selectedOrder.readyAt != null);
  const isProcessingPhase = ['COLLECTED'].includes(selectedOrder.status) || (selectedOrder.status === 'REASSIGNMENT_NEEDED' && selectedOrder.readyAt == null && selectedOrder.pickedAt != null);

  const getPartnerActiveCount = (partnerId) => {
    return orders.filter(o => o.partnerId === partnerId && !['Delivered', 'Cancelled', 'DELIVERED', 'CANCELLED'].includes(o.status)).length;
  };

  const getAvailableStatuses = (currentStatus, readyAt) => {
    const statusMap = {
      'CONFIRMED': ['CONFIRMED', 'PICKUP_ASSIGNED', 'CANCELLED'],
      'PICKUP_ASSIGNED': ['PICKUP_ASSIGNED', 'COLLECTED', 'REASSIGNMENT_NEEDED', 'CANCELLED'],
      'COLLECTED': ['COLLECTED', 'READY', 'CANCELLED'],
      'READY': ['READY', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['OUT_FOR_DELIVERY', 'DELIVERED', 'REASSIGNMENT_NEEDED', 'CANCELLED'],
      'REASSIGNMENT_NEEDED': readyAt 
          ? ['REASSIGNMENT_NEEDED', 'OUT_FOR_DELIVERY', 'CANCELLED'] 
          : ['REASSIGNMENT_NEEDED', 'PICKUP_ASSIGNED', 'COLLECTED', 'CANCELLED'],
      'DELIVERED': ['DELIVERED'],
      'CANCELLED': ['CANCELLED']
    };
    return statusMap[currentStatus] || [currentStatus];
  };

  const availableStatuses = getAvailableStatuses(selectedOrder.status?.toUpperCase(), selectedOrder.readyAt);

  const statusLabels = {
    'CONFIRMED': 'Confirmed',
    'PICKUP_ASSIGNED': 'Pickup Assigned',
    'COLLECTED': 'Collected',
    'READY': 'Ready',
    'OUT_FOR_DELIVERY': 'Out for Delivery',
    'DELIVERED': 'Delivered',
    'REASSIGNMENT_NEEDED': 'Reassignment Needed',
    'CANCELLED': 'Cancelled'
  };

  // Aggregated item notes if individual item notes exist
  const itemNotesSummary = (selectedOrder.items || [])
    .filter(item => item.note && item.note.trim())
    .map(item => `${item.itemType}: ${item.note.trim()}`)
    .join(' • ');

  const isReassignmentNote = (note) => {
    if (!note) return false;
    const lower = note.toLowerCase();
    return lower.includes('leave') || lower.includes('reassign') || lower.includes('offline');
  };

  const partnerAssignmentNote = isReassignmentNote(selectedOrder.clothCheckNote) ? selectedOrder.clothCheckNote : null;
  const garmentIssuesNote = (!isReassignmentNote(selectedOrder.clothCheckNote) && selectedOrder.clothCheckNote && selectedOrder.clothCheckNote.trim() !== 'No issues found') 
    ? selectedOrder.clothCheckNote 
    : null;

  return (
    <div className="drawer-overlay" onClick={() => setSelectedOrder(null)}>
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Booking Detail: BK2026{String(selectedOrder.id).padStart(4, '0')}</h3>
          <button 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            onClick={() => setSelectedOrder(null)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ marginBottom: 24 }}>
            <div className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Customer Information
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              {/* Profile Block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: 'var(--bg-slate)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                  {selectedOrder.customerNameSnapshot ? String(selectedOrder.customerNameSnapshot).charAt(0) : 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0F172A', marginBottom: 2 }}>{selectedOrder.customerNameSnapshot || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 12, display: 'inline-block', fontWeight: 600, border: '1px solid #bae6fd' }}>
                    {selectedOrder.customer?.customerId ? String(selectedOrder.customer.customerId).replace('-', '') : `CUS${String(selectedOrder.customerPhone || selectedOrder.customer?.phone || '0000').slice(-4)}`}
                  </div>
                </div>
              </div>

              {/* Contact Info Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  <Phone size={15} style={{ color: '#0ea5e9' }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {formatPhone(selectedOrder.customerPhone || selectedOrder.customer?.phone)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 8, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  <MapPin size={15} style={{ color: '#0ea5e9', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500, color: '#334155' }}>{selectedOrder.pickupAddress || 'No Address Provided'}</div>
                    {selectedOrder.pickupLandmark && (
                      <div style={{ fontStyle: 'italic', fontSize: '0.85rem', marginTop: 2, color: '#94a3b8' }}>
                        Landmark: {selectedOrder.pickupLandmark}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px 0' }}>
            <div className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Order Status Progression
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="form-group">
                {isProcessingPhase ? (
                  <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.85rem', color: '#1E3A8A', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={16} /> Ready Checklist (Item Count Confirmation)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: 12 }}>
                      Please verify the billing items and total below. Once verified, manually mark the order as ready. Then you can allocate a delivery partner.
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'READY')}
                    >
                      Confirm Item Count & Mark Ready
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      {isDeliveryPhase ? 'Allocate Delivery Partner' : 'Allocate Pickup Partner'}
                    </label>
                    <select 
                      className="form-input"
                      value={selectedOrder.partner?.id || selectedOrder.partnerId || ''}
                      onChange={e => assignPartner(selectedOrder.id, e.target.value)}
                      disabled={['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(selectedOrder.status)}
                    >
                      <option value="">-- Choose Partner --</option>
                      {partners.filter(p => p.active && !(selectedOrder.status === 'REASSIGNMENT_NEEDED' && selectedOrder.clothCheckNote && selectedOrder.clothCheckNote.includes(p.name))).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getPartnerActiveCount(p.id)} active jobs)
                        </option>
                      ))}
                    </select>
                    {selectedOrder.status === 'REASSIGNMENT_NEEDED' && (selectedOrder.partnerReleaseNote || selectedOrder.clothCheckNote) && (
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '6px 10px', borderRadius: 6, border: '1px solid #FECACA' }}>
                        <strong>Reason:</strong> {selectedOrder.partnerReleaseNote || selectedOrder.clothCheckNote}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Set Progress Status</label>
                {['DELIVERED', 'CANCELLED'].includes(selectedOrder.status?.toUpperCase()) ? (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem',
                    backgroundColor: selectedOrder.status?.toUpperCase() === 'DELIVERED' ? '#ECFDF5' : '#FEF2F2',
                    color: selectedOrder.status?.toUpperCase() === 'DELIVERED' ? '#059669' : '#DC2626',
                    border: `1px solid ${selectedOrder.status?.toUpperCase() === 'DELIVERED' ? '#A7F3D0' : '#FECACA'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <span>{statusLabels[selectedOrder.status?.toUpperCase()] || selectedOrder.status}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: selectedOrder.status?.toUpperCase() === 'DELIVERED' ? '#047857' : '#B91C1C' }}>
                      {selectedOrder.status?.toUpperCase() === 'DELIVERED' ? '✓ Order Delivered (Locked)' : '✕ Order Cancelled (Locked)'}
                    </span>
                  </div>
                ) : (
                  <select 
                    className="form-input"
                    value={selectedOrder.status?.toUpperCase()}
                    onChange={e => updateOrderStatus(selectedOrder.id, e.target.value)}
                  >
                    {Object.keys(statusLabels)
                      .filter(st => st !== 'CANCELLED' || selectedOrder.status?.toUpperCase() === 'CANCELLED')
                      .map(st => (
                      <option 
                        key={st} 
                        value={st} 
                        disabled={st !== selectedOrder.status?.toUpperCase()}
                      >
                        {statusLabels[st]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>



          <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px 0' }}>
            <div className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Billing details
            </div>
            
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              <div>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', marginBottom: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: 6 }}>Item</th>
                      <th style={{ textAlign: 'center', paddingBottom: 6 }}>Qty</th>
                      <th style={{ textAlign: 'right', paddingBottom: 6 }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px dotted var(--border-light)' }}>
                        <td style={{ padding: '6px 0' }}>
                          <div>{item.itemType}</div>
                          {item.note && (
                            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: 2 }}>
                              ⚠️ Note: {item.note}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '6px 0' }}>₹{item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginTop: 12 }}>
                  <span>Bill Total:</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <span className={`badge ${selectedOrder.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>
                    Payment: {selectedOrder.paymentStatus}
                  </span>
                  {selectedOrder.paymentMethod && (
                    <span className="badge badge-assigned">
                      Via: {selectedOrder.paymentMethod}
                    </span>
                  )}
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <a 
                      href={isMockMode ? '#' : `${API_BASE}/orders/${selectedOrder.id}/invoice?token=${token}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => {
                        if (isMockMode) {
                          e.preventDefault();
                          alert('[Mock Mode] Invoice download mock triggered. In live mode, this returns the compiled PDF Kit invoice.');
                        }
                      }}
                    >
                      Download PDF Invoice
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Cloth checking and counting has not been done yet by the partner.
              </div>
            )}
          </div>

          {/* Premium Order Timeline Tracking */}
          <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px 0' }}>
            <div className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Order Timeline & Audit Log
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 20 }}>
              {/* Visual line */}
              <div style={{
                position: 'absolute',
                left: 6,
                top: 4,
                bottom: 4,
                width: 2,
                background: 'linear-gradient(to bottom, #e2e8f0, #f1f5f9)'
              }} />

              {/* Step 1: Created */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#0284c7', border: '3px solid #ffffff', boxShadow: '0 0 0 2px #0284c7' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Order Placed</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>

              {/* Step 2: Pickup Assigned */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: selectedOrder.assignedPickupAt ? '#0ea5e9' : '#e2e8f0', border: '3px solid #ffffff', boxShadow: `0 0 0 2px ${selectedOrder.assignedPickupAt ? '#0ea5e9' : '#e2e8f0'}` }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedOrder.assignedPickupAt ? '#0F172A' : '#94a3b8' }}>Pickup Assigned</span>
                {selectedOrder.assignedPickupAt ? (
                  <>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Partner: <strong style={{ color: '#0F172A' }}>{selectedOrder.partner?.name || 'N/A'}</strong></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.assignedPickupAt).toLocaleString()}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Pending</span>
                )}
              </div>

              {/* Step 3: Collected */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: selectedOrder.pickedAt ? '#6366f1' : '#e2e8f0', border: '3px solid #ffffff', boxShadow: `0 0 0 2px ${selectedOrder.pickedAt ? '#6366f1' : '#e2e8f0'}` }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedOrder.pickedAt ? '#0F172A' : '#94a3b8' }}>Clothes Collected</span>
                {selectedOrder.pickedAt ? (
                  <>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Collected by: <strong style={{ color: '#0F172A' }}>{selectedOrder.Partner_Order_pickedByPartnerIdToPartner?.name || selectedOrder.partner?.name || 'N/A'}</strong></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.pickedAt).toLocaleString()}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Pending</span>
                )}
              </div>

              {/* Step 4: Ready */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: selectedOrder.readyAt ? '#f59e0b' : '#e2e8f0', border: '3px solid #ffffff', boxShadow: `0 0 0 2px ${selectedOrder.readyAt ? '#f59e0b' : '#e2e8f0'}` }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedOrder.readyAt ? '#0F172A' : '#94a3b8' }}>Ironing Completed (Ready)</span>
                {selectedOrder.readyAt ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.readyAt).toLocaleString()}</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Pending</span>
                )}
              </div>

              {/* Step 5: Out for Delivery */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: selectedOrder.assignedDeliveryAt ? '#10b981' : '#e2e8f0', border: '3px solid #ffffff', boxShadow: `0 0 0 2px ${selectedOrder.assignedDeliveryAt ? '#10b981' : '#e2e8f0'}` }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedOrder.assignedDeliveryAt ? '#0F172A' : '#94a3b8' }}>Out for Delivery</span>
                {selectedOrder.assignedDeliveryAt ? (
                  <>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery Partner: <strong style={{ color: '#0F172A' }}>{selectedOrder.partner?.name || 'N/A'}</strong></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.assignedDeliveryAt).toLocaleString()}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Pending</span>
                )}
              </div>

              {/* Step 6: Delivered */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: selectedOrder.deliveredAt ? '#059669' : '#e2e8f0', border: '3px solid #ffffff', boxShadow: `0 0 0 2px ${selectedOrder.deliveredAt ? '#059669' : '#e2e8f0'}` }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedOrder.deliveredAt ? '#059669' : '#94a3b8' }}>Delivered Successfully {selectedOrder.deliveredAt && '✓'}</span>
                {selectedOrder.deliveredAt ? (
                  <>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered by: <strong style={{ color: '#0F172A' }}>{selectedOrder.Partner_Order_deliveredByPartnerIdToPartner?.name || selectedOrder.partner?.name || 'N/A'}</strong></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.deliveredAt).toLocaleString()}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Pending</span>
                )}
              </div>
            </div>
          </div>

          {role === 'admin' && selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
            <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px 0', marginTop: 10 }}>
              {!showCancelConfirm ? (
                <button 
                  className="btn btn-danger" 
                  style={{ 
                    width: '100%',
                    opacity: selectedOrder.status.toLowerCase() !== 'confirmed' ? 0.5 : 1,
                    cursor: selectedOrder.status.toLowerCase() !== 'confirmed' ? 'not-allowed' : 'pointer'
                  }}
                  disabled={selectedOrder.status.toLowerCase() !== 'confirmed'}
                  onClick={() => setShowCancelConfirm(true)}
                  title={selectedOrder.status.toLowerCase() !== 'confirmed' ? "Cancellation disabled after partner is assigned" : ""}
                >
                  Cancel Order
                </button>
              ) : (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#991B1B', marginBottom: 10, lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                    <span>Are you sure you want to cancel Order #{selectedOrder.id}? This will notify the customer via WhatsApp and release any assigned partners.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      className="btn btn-danger" 
                      style={{ flex: 1, minHeight: '34px', padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        cancelOrder(selectedOrder.id);
                        setShowCancelConfirm(false);
                      }}
                    >
                      Yes, Cancel
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, minHeight: '34px', padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      No, Keep
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
