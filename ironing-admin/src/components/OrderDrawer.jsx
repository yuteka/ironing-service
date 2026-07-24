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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200" onClick={() => setSelectedOrder(null)}>
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-extrabold text-slate-900">
            Booking Detail: BK2026{String(selectedOrder.id).padStart(4, '0')}
          </h3>
          <button 
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
            onClick={() => setSelectedOrder(null)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Customer Information */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Information
            </div>
            
            <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-extrabold text-lg uppercase shadow-xs">
                {selectedOrder.customerNameSnapshot ? String(selectedOrder.customerNameSnapshot).charAt(0) : 'U'}
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-base text-slate-900 leading-tight">
                  {selectedOrder.customerNameSnapshot || 'Unknown'}
                </div>
                <div className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold text-sky-700 bg-sky-100/80 border border-sky-200 rounded-md">
                  {selectedOrder.customer?.customerId ? String(selectedOrder.customer.customerId).replace('-', '') : `CUS${String(selectedOrder.customerPhone || selectedOrder.customer?.phone || '0000').slice(-4)}`}
                </div>
              </div>
            </div>

            <div className="space-y-2 px-1">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                <Phone size={15} className="text-sky-500" />
                <span>{formatPhone(selectedOrder.customerPhone || selectedOrder.customer?.phone)}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                <MapPin size={15} className="text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{selectedOrder.pickupAddress || 'No Address Provided'}</div>
                  {selectedOrder.pickupLandmark && (
                    <div className="text-xs text-slate-400 italic font-medium mt-0.5">
                      Landmark: {selectedOrder.pickupLandmark}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Progression */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Order Status Progression
            </div>

            <div className="space-y-4">
              {isProcessingPhase ? (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-sky-900 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-sky-600" />
                    <span>Ready Checklist (Item Count Confirmation)</span>
                  </div>
                  <p className="text-xs text-sky-700 font-medium">
                    Please verify the billing items and total below. Once verified, manually mark the order as ready. Then you can allocate a delivery partner.
                  </p>
                  <button 
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'READY')}
                  >
                    Confirm Item Count & Mark Ready
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {isDeliveryPhase ? 'Allocate Delivery Partner' : 'Allocate Pickup Partner'}
                  </label>
                  <select 
                    className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-sm outline-none transition-all ${
                      ['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(selectedOrder.status)
                        ? 'bg-slate-100 text-slate-500 border border-slate-300 cursor-not-allowed opacity-75'
                        : 'bg-white text-slate-900 border-2 border-sky-500 focus:ring-2 focus:ring-sky-200 cursor-pointer'
                    }`}
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
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                      <strong>Reason:</strong> {selectedOrder.partnerReleaseNote || selectedOrder.clothCheckNote}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">Set Progress Status</label>
                {['DELIVERED', 'CANCELLED'].includes(selectedOrder.status?.toUpperCase()) ? (
                  <div className={`p-3.5 rounded-xl font-extrabold text-sm border flex items-center justify-between ${
                    selectedOrder.status?.toUpperCase() === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                    <span>{statusLabels[selectedOrder.status?.toUpperCase()] || selectedOrder.status}</span>
                    <span className="text-xs font-extrabold">
                      {selectedOrder.status?.toUpperCase() === 'DELIVERED' ? '✓ Order Delivered (Locked)' : '✕ Order Cancelled (Locked)'}
                    </span>
                  </div>
                ) : (
                  <select 
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border-2 border-sky-500 rounded-xl font-extrabold text-sm cursor-pointer outline-none focus:ring-2 focus:ring-sky-200"
                    value={selectedOrder.status?.toUpperCase()}
                    onChange={e => updateOrderStatus(selectedOrder.id, e.target.value)}
                  >
                    {Object.keys(statusLabels)
                      .filter(st => st !== 'CANCELLED' || selectedOrder.status?.toUpperCase() === 'CANCELLED')
                      .map(st => {
                        const isCurrent = st === selectedOrder.status?.toUpperCase();
                        return (
                          <option 
                            key={st} 
                            value={st} 
                            disabled={!isCurrent}
                            className={isCurrent ? 'font-bold text-slate-900 bg-sky-50' : 'font-normal text-slate-400 bg-slate-50'}
                          >
                            {statusLabels[st]} {isCurrent ? ' (Active)' : ' (Locked)'}
                          </option>
                        );
                      })}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Billing details
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="space-y-2 divide-y divide-slate-200/60">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{item.quantity}x {item.itemType}</span>
                    <span className="font-bold text-slate-900">₹{(item.rate * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-sky-600 text-base">₹{parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cancel Order Action */}
          {role === 'admin' && selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
            <div className="pt-5 border-t border-slate-200">
              {!showCancelConfirm ? (
                <button 
                  className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-all ${
                    selectedOrder.status.toLowerCase() !== 'confirmed'
                      ? 'bg-slate-300 cursor-not-allowed opacity-60'
                      : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  }`}
                  disabled={selectedOrder.status.toLowerCase() !== 'confirmed'}
                  onClick={() => setShowCancelConfirm(true)}
                  title={selectedOrder.status.toLowerCase() !== 'confirmed' ? "Cancellation disabled after partner is assigned" : ""}
                >
                  Cancel Order
                </button>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-red-800 flex items-start gap-2 leading-snug">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Are you sure you want to cancel Order #{selectedOrder.id}? This will notify the customer via WhatsApp and release any assigned partners.</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      onClick={() => {
                        cancelOrder(selectedOrder.id);
                        setShowCancelConfirm(false);
                      }}
                    >
                      Yes, Cancel
                    </button>
                    <button 
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
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
