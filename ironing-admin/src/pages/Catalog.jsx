import React, { useState } from 'react';
import { Edit2, X, Plus, Trash2 } from 'lucide-react';

export default function Catalog({ catalog, saveCatalog }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [hasDirtyEdits, setHasDirtyEdits] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem({ id: `new-${Date.now()}`, itemName: '', rate: '0' });
    setDrawerOpen(true);
    setHasDirtyEdits(false);
  };

  const handleOpenEdit = (item) => {
    setEditingItem({ id: item.id, itemName: item.itemName, rate: String(item.rate) });
    setDrawerOpen(true);
    setHasDirtyEdits(false);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleDrawerSubmit = (e) => {
    e.preventDefault();
    if (!editingItem || editingItem.itemName.trim() === '') return;


    const parsedRate = parseFloat(editingItem.rate);
    const finalRate = isNaN(parsedRate) || parsedRate < 0 ? 0 : parsedRate;
    const isNew = typeof editingItem.id === 'string' && editingItem.id.startsWith('new-');

    let updatedList = [];
    if (isNew) {
      updatedList = [...catalog, {
        itemName: editingItem.itemName.trim(),
        rate: finalRate,
        active: true
      }];
    } else {
      updatedList = catalog.map(c => c.id === editingItem.id ? {
        ...c,
        itemName: editingItem.itemName.trim(),
        rate: finalRate
      } : c);
    }

    saveCatalog(updatedList);
    setDrawerOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id, name) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete "${name}" from the Price Catalog?`);
    if (!confirm) return;

    const updatedList = catalog.filter(c => c.id !== id);
    saveCatalog(updatedList);
  };

  // Block invalid rate input characters
  const handleKeyDown = (e) => {
    const invalidKeys = ['-', '+', 'e', 'E', '.', ','];
    if (invalidKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <style>{`
        @keyframes slideOutDrawer {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <header className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-group">
          <h1>Price Catalog</h1>
          <p>Modify service charges for clothing items. Changes automatically apply to bot responses.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} />
            <span>Add Clothes Item</span>
          </button>
        </div>
      </header>

      <div className="data-card" style={{ maxWidth: 750 }}>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>S.No.</th>
                  <th>Item Description</th>
                  <th>Rate (INR)</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>₹</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                          {parseFloat(item.rate || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-paid">Active</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                          onClick={() => handleDeleteItem(item.id, item.itemName)}
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {catalog.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No items in catalog. Click "Add Clothes Item" to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit/Add Drawer */}
      {drawerOpen && editingItem && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '450px',
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
          {/* Drawer Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
              {typeof editingItem.id === 'string' && editingItem.id.startsWith('new-') ? 'Add Clothes Item' : 'Edit Clothes Item'}
            </h3>
            <button 
              onClick={handleCloseDrawer}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <form 
            onSubmit={handleDrawerSubmit} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div className="form-group">
              <label className="form-label">Item Description <span style={{ color: '#EF4444' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                value={editingItem.itemName}
                onChange={e => {
                  setEditingItem({ ...editingItem, itemName: e.target.value });
                  setHasDirtyEdits(true);
                }}
                placeholder="e.g. Silk Saree"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rate (INR) <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontWeight: 600, color: 'var(--text-muted)', zIndex: 1 }}>₹</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  className="form-input" 
                  style={{ paddingLeft: 28 }}
                  value={editingItem.rate}
                  onKeyDown={handleKeyDown}
                  onChange={e => {
                    let sanitized = e.target.value.replace(/[^0-9]/g, '');
                    if (sanitized.length > 1 && sanitized.startsWith('0')) {
                      sanitized = sanitized.replace(/^0+/, '') || '0';
                    }
                    setEditingItem({ ...editingItem, rate: sanitized });
                    setHasDirtyEdits(true);
                  }}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Bottom Actions inside Drawer */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={handleCloseDrawer}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Overlay Backdrop */}
      {drawerOpen && (
        <div 
          onClick={handleCloseDrawer}
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
    </div>
  );
}
