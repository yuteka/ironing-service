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
    <div className="w-full space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Price Catalog</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Modify service charges for clothing items. Changes automatically apply to bot responses.
          </p>
        </div>
        <div>
          <button 
            onClick={handleOpenAdd} 
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Clothes Item</span>
          </button>
        </div>
      </header>

      {/* Data Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden max-w-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                <th className="px-6 py-4 w-20">S.No.</th>
                <th className="px-6 py-4">Item Description</th>
                <th className="px-6 py-4">Rate (INR)</th>
                <th className="px-6 py-4 w-32">Status</th>
                <th className="px-6 py-4 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catalog.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.itemName}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-base">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-semibold text-sm">₹</span>
                      <span>{parseFloat(item.rate || 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-extrabold text-emerald-700 bg-emerald-100/80 rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id, item.itemName)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium italic">
                    No items in catalog. Click "Add Clothes Item" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Drawer */}
      {drawerOpen && editingItem && (
        <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-extrabold text-slate-900">
              {typeof editingItem.id === 'string' && editingItem.id.startsWith('new-') ? 'Add Clothes Item' : 'Edit Clothes Item'}
            </h3>
            <button 
              onClick={handleCloseDrawer}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
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
            className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto"
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Item Description <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-400" 
                value={editingItem.itemName}
                onChange={e => {
                  setEditingItem({ ...editingItem, itemName: e.target.value });
                  setHasDirtyEdits(true);
                }}
                placeholder="e.g. Silk Saree"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rate (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-bold text-slate-400 text-sm">₹</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl text-slate-900 font-extrabold text-sm outline-none transition-all placeholder:text-slate-400" 
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
            <div className="mt-auto pt-6 border-t border-slate-200 flex gap-3">
              <button 
                type="button" 
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                onClick={handleCloseDrawer}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}
    </div>
  );
}
