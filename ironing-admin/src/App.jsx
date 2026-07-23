import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info as InfoIcon } from 'lucide-react';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Partners from './pages/Partners';
import Tickets from './pages/Tickets';
import Catalog from './pages/Catalog';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Settings from './pages/Settings';

// Import Components
import Sidebar from './components/Sidebar';
import OrderDrawer from './components/OrderDrawer';

const API_BASE = import.meta.env.VITE_API_BASE || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3000/api`
    : 'https://ironing-service.onrender.com/api');

// --- MOCK DATA FOR RUNNING WITHOUT BACKEND CONNECTED ---
const MOCK_METRICS = {
  totalOrders: 14,
  pendingPayments: 3,
  unassignedOrders: 2,
  revenueToday: 2450
};

const MOCK_ORDERS = [
  {
    id: 1024,
    customerPhone: "919876543210",
    customer: { name: "Anand Kumar", phone: "919876543210", address: "Flat 402, Block A, Green Meadows Apartments", landmark: "Near Central Park" },
    status: "Confirmed",
    paymentStatus: "Pending",
    paymentMethod: null,
    totalAmount: null,
    pickupDate: "Today",
    pickupSlot: "Morning",
    createdAt: new Date().toISOString()
  },
  {
    id: 1023,
    customerPhone: "919812345678",
    customer: { name: "Priya Sharma", phone: "919812345678", address: "House 14, Road 3, Sector 5, HSR Layout", landmark: "Opposite SBI Bank" },
    status: "Pickup Assigned",
    paymentStatus: "Pending",
    paymentMethod: null,
    totalAmount: null,
    partner: { id: 1, name: "Ramesh Kumar" },
    pickupDate: "Today",
    pickupSlot: "Evening",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 1022,
    customerPhone: "919765432109",
    customer: { name: "Vijay Singh", phone: "919765432109", address: "Plot 88, Jubilee Hills", landmark: "Beside Cafe Coffee Day" },
    status: "Collected",
    paymentStatus: "Paid",
    paymentMethod: "Razorpay",
    totalAmount: 180,
    partner: { id: 2, name: "Suresh Babu" },
    pickupDate: "Tomorrow",
    pickupSlot: "Afternoon",
    items: [
      { id: 1, itemType: "Shirt", quantity: 4, rate: 15, subtotal: 60 },
      { id: 2, itemType: "Pant", quantity: 6, rate: 20, subtotal: 120 }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 1021,
    customerPhone: "919988776655",
    customer: { name: "Deepa Nair", phone: "919988776655", address: "Apt 205, Windshield residency", landmark: "Metro Station gate 2" },
    status: "Delivered",
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    totalAmount: 95,
    partner: { id: 1, name: "Ramesh Kumar" },
    pickupDate: "Today",
    pickupSlot: "Morning",
    items: [
      { id: 3, itemType: "Saree", quantity: 1, rate: 40, subtotal: 40 },
      { id: 4, itemType: "T-Shirt", quantity: 1, rate: 15, subtotal: 15 },
      { id: 5, itemType: "Pant", quantity: 2, rate: 20, subtotal: 40 }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const MOCK_PARTNERS = [
  { id: 31, name: "Abi", phone: "5678904321", username: "abi", active: true },
  { id: 33, name: "Neo", phone: "6369591821", username: "neo", active: true }
];

const MOCK_TICKETS = [
  { id: 301, customerPhone: "919876543210", category: "Delay", status: "Open", createdAt: new Date().toISOString() },
  { id: 302, customerPhone: "919812345678", category: "ClothDamage", status: "Resolved", createdAt: new Date(Date.now() - 86400000).toISOString() }
];

const MOCK_CATALOG = [
  { id: 1, itemName: "Shirt", rate: 15, active: true },
  { id: 2, itemName: "Pant", rate: 20, active: true },
  { id: 3, itemName: "Saree", rate: 40, active: true },
  { id: 4, itemName: "T-Shirt", rate: 15, active: true },
  { id: 5, itemName: "Coat", rate: 50, active: true }
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [role, setRole] = useState(localStorage.getItem('admin_role') || 'admin');
  const [currentAdminId, setCurrentAdminId] = useState(Number(localStorage.getItem('admin_id')) || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  // Core Data States
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [metrics, setMetrics] = useState(MOCK_METRICS);

  // Selected Order Drawer State
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Partner Create Form state
  const [newPartner, setNewPartner] = useState({ name: '', phone: '', username: '', password: '' });
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  // Custom Toast State
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null); // { title: string, message: string, onConfirm: () => void }

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    // Auto-dismiss after 4 seconds
    setTimeout(() => setToast(null), 4000);
  };

  // Headers helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Fetch initial data
  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // Handle SSE for real-time updates
  useEffect(() => {
    if (!token || isMockMode) return;
    
    const eventSource = new EventSource(`${API_BASE}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'orders_updated') {
           fetchOrders(); 
        }
      } catch(e) {}
    };
    
    return () => {
      eventSource.close();
    };
  }, [token, isMockMode]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const healthRes = await fetch(`http://${window.location.hostname}:3000/health`).catch(() => null);
      if (!healthRes) {
        console.warn('Backend server unreachable. Enabling client-side Mock Mode.');
        setIsMockMode(true);
        setOrders(MOCK_ORDERS);
        setPartners(MOCK_PARTNERS);
        setTickets(MOCK_TICKETS);
        setCatalog(MOCK_CATALOG);
        setPayments(MOCK_ORDERS.filter(o => o.paymentStatus === 'Paid'));
        setCustomers([
          { phone: '919876543210', name: 'Anand Kumar', address: 'Flat 402, Green Meadows', landmark: 'Central Park', totalOrders: 1, orders: [MOCK_ORDERS[0]] }
        ]);
        calculateMockMetrics(MOCK_ORDERS);
      } else {
        setIsMockMode(false);
        await Promise.all([
          fetchOrders(),
          fetchPartners(),
          fetchTickets(),
          fetchCatalog(),
          fetchPayments(),
          fetchCustomers(),
          fetchSettings()
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateMockMetrics = (ordersList) => {
    const unassigned = ordersList.filter(o => !o.partner).length;
    const pendingPay = ordersList.filter(o => o.paymentStatus !== 'Paid').length;
    const paidRevenue = ordersList
      .filter(o => o.paymentStatus === 'Paid' && o.totalAmount)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    setMetrics({
      totalOrders: ordersList.length,
      pendingPayments: pendingPay,
      unassignedOrders: unassigned,
      revenueToday: paidRevenue
    });
  };

  const handleAuthError = (res) => {
    if (res && (res.status === 401 || res.status === 403)) {
      handleLogout();
      triggerToast('Session expired. Please log in again.', 'error');
      return true;
    }
    return false;
  };

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/orders`, { headers: getHeaders() }).catch(() => null);
    if (handleAuthError(res)) return;
    if (res && res.ok) {
      const data = await res.json();
      setOrders(data);
      const unassigned = data.filter(o => !o.partnerId).length;
      const pendingPay = data.filter(o => o.paymentStatus !== 'Paid').length;
      const revenue = data
        .filter(o => o.paymentStatus === 'Paid' && o.totalAmount)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setMetrics({
        totalOrders: data.length,
        pendingPayments: pendingPay,
        unassignedOrders: unassigned,
        revenueToday: revenue
      });
    }
  };

  const fetchPartners = async () => {
    const res = await fetch(`${API_BASE}/partners`, { headers: getHeaders() }).catch(() => null);
    if (handleAuthError(res)) return;
    if (res && res.ok) {
      const data = await res.json();
      setPartners(data);
    }
  };

  const fetchTickets = async () => {
    const res = await fetch(`${API_BASE}/tickets`, { headers: getHeaders() }).catch(() => null);
    if (handleAuthError(res)) return;
    if (res && res.ok) {
      const data = await res.json();
      setTickets(data);
    }
  };

  const fetchCatalog = async () => {
    if (isMockMode) {
      setCatalog(MOCK_CATALOG);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/catalog`, { headers: getHeaders() }).catch(() => null);
      if (handleAuthError(res)) return;
      if (res && res.ok) {
        setCatalog(await res.json());
      }
    } catch (e) {
      console.error('Error fetching catalog:', e);
    }
  };

  const saveCatalog = async (updatedItems) => {
    if (isMockMode) {
      triggerToast('Mock Mode: Catalog prices simulated save.', 'info');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/catalog`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ items: updatedItems })
      });
      if (res.ok) {
        triggerToast('Catalog prices saved successfully!', 'success');
        await fetchCatalog();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to save catalog', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error saving catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoAssign = async () => {
    if (isMockMode) {
      // Mock logic: assign all Confirmed orders with null partnerId to first active partner
      const activeP = partners.find(p => p.active);
      if (!activeP) {
        triggerToast('No active partners online to simulate auto-assign.', 'error');
        return;
      }
      const updatedList = orders.map(o => {
        if (o.status === 'Confirmed' && (!o.partnerId && !o.partner)) {
          return { ...o, partnerId: activeP.id, partner: activeP, status: 'Pickup Assigned' };
        }
        return o;
      });
      setOrders(updatedList);
      calculateMockMetrics(updatedList);
      triggerToast('Mock Mode: Automatically assigned unassigned orders.', 'success');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/auto-assign`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message || 'Auto-assignment completed successfully!', 'success');
        await loadAllData();
      } else {
        triggerToast(data.error || 'Failed to auto-assign orders.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error connecting to auto-assign service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (isMockMode) {
      setPayments(MOCK_ORDERS.filter(o => o.paymentStatus === 'Paid'));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/payments`, { headers: getHeaders() }).catch(() => null);
      if (handleAuthError(res)) return;
      if (res && res.ok) {
        setPayments(await res.json());
      }
    } catch (e) {
      console.error('Error fetching payments:', e);
    }
  };

  const fetchCustomers = async () => {
    if (isMockMode) {
      const mapped = MOCK_ORDERS.map(o => ({
        phone: o.customer.phone,
        name: o.customer.name,
        address: o.customer.address,
        landmark: o.customer.landmark || '',
        totalOrders: 1,
        orders: [o]
      }));
      setCustomers(mapped);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/customers`, { headers: getHeaders() }).catch(() => null);
      if (handleAuthError(res)) return;
      if (res && res.ok) {
        setCustomers(await res.json());
      }
    } catch (e) {
      console.error('Error fetching customers:', e);
    }
  };

  const fetchSettings = async () => {
    if (isMockMode) return;
    try {
      const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() }).catch(() => null);
      if (handleAuthError(res)) return;
      if (res && res.ok) {
        setSettings(await res.json());
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  // --- ACTIONS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_role', data.role);
        if (data.id) localStorage.setItem('admin_id', data.id);
        setToken(data.token);
        setRole(data.role);
        if (data.id) setCurrentAdminId(data.id);
      } else {
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          console.log('[Mock App] Offline login bypass granted for admin.');
          localStorage.setItem('admin_token', 'mock_admin_token');
          localStorage.setItem('admin_role', 'admin');
          setToken('mock_admin_token');
          setRole('admin');
        } else if (loginForm.username === 'subadmin' && loginForm.password === 'subadmin123') {
          console.log('[Mock App] Offline login bypass granted for subadmin.');
          localStorage.setItem('admin_token', 'mock_subadmin_token');
          localStorage.setItem('admin_role', 'subadmin');
          setToken('mock_subadmin_token');
          setRole('subadmin');
        } else {
          setLoginError('Invalid username or password');
        }
      }
    } catch (err) {
      setLoginError('Could not reach authorization server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    setToken('');
    setRole('admin');
    setActiveTab('dashboard');
  };

  const assignPartner = async (orderId, partnerId) => {
    if (isMockMode) {
      const partnerObj = MOCK_PARTNERS.find(p => p.id === parseInt(partnerId));
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, partner: partnerObj, partnerId: partnerObj.id, status: 'Pickup Assigned' };
        }
        return o;
      });
      setOrders(updatedList);
      calculateMockMetrics(updatedList);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, partner: partnerObj, partnerId: partnerObj.id, status: 'Pickup Assigned' });
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ partnerId })
      });
      if (res.ok) {
        await fetchOrders();
        const refreshed = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getHeaders() });
        if (refreshed.ok) setSelectedOrder(await refreshed.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (isMockMode) {
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, status: newStatus };
        }
        return o;
      });
      setOrders(updatedList);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchOrders();
        const refreshed = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getHeaders() });
        if (refreshed.ok) setSelectedOrder(await refreshed.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (isMockMode) {
      const updatedList = orders.map(o => {
        if (o.id === orderId) return { ...o, status: 'Cancelled' };
        return o;
      });
      setOrders(updatedList);
      calculateMockMetrics(updatedList);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'Cancelled' });
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        await fetchOrders();
        const refreshed = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getHeaders() });
        if (refreshed.ok) setSelectedOrder(await refreshed.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createPartnerAccount = async (e) => {
    e.preventDefault();
    if (isMockMode) {
      const partner = {
        id: Date.now(),
        name: newPartner.name,
        phone: newPartner.phone,
        username: newPartner.username,
        active: true
      };
      setPartners([...partners, partner]);
      setNewPartner({ name: '', phone: '', username: '', password: '' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partners`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newPartner)
      });
      if (res.ok) {
        await fetchPartners();
        setNewPartner({ name: '', phone: '', username: '', password: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create partner');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deletePartner = async (partnerId) => {
    setConfirmModal({
      title: 'Remove Pickup Partner',
      message: 'Are you sure you want to remove this partner account? Access will be immediately revoked.',
      onConfirm: async () => {
        if (isMockMode) {
          setPartners(partners.filter(p => p.id !== partnerId));
          return;
        }

        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/partners/${partnerId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          if (res.ok) {
            await fetchPartners();
            triggerToast('Partner account removed successfully.', 'success');
          }
        } catch (error) {
          console.error(error);
          triggerToast('Error removing partner.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const togglePartnerActive = async (partnerId, currentStatus) => {
    if (isMockMode) {
      setPartners(partners.map(p => p.id === partnerId ? { ...p, active: !currentStatus } : p));
      return;
    }

    setLoading(true);
    try {
      await fetch(`${API_BASE}/partners/${partnerId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ active: !currentStatus })
      });
      await fetchPartners();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const grantPartnerLeave = async (partnerId) => {
    if (isMockMode) {
      // Mock: just mark inactive, no real reassign
      setPartners(partners.map(p => p.id === partnerId ? { ...p, active: false } : p));
      triggerToast('Mock Mode: Partner marked as on leave.', 'info');
      return { totalOrders: 0, reassigned: [], backToPool: [] };
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partners/${partnerId}/grant-leave`, {
        method: 'PUT',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        await fetchPartners();
        await fetchOrders();
        const msg = `Leave granted for ${data.partnerName}. ${data.reassigned?.length || 0} order(s) reassigned, ${data.backToPool?.length || 0} returned to pool.`;
        triggerToast(msg, 'success');
        return data;
      } else {
        triggerToast(data.error || 'Failed to grant leave.', 'error');
        return null;
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error granting leave.', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resolveTicket = async (ticketId) => {
    if (isMockMode) {
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'Resolved' } : t));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/resolve`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const triggerBulkReady = async () => {
    const unreadyIds = orders
      .filter(o => o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Cancelled')
      .map(o => o.id);
    
    if (unreadyIds.length === 0) {
      triggerToast('No eligible orders to mark Ready.', 'info');
      return;
    }

    setConfirmModal({
      title: 'Mark Orders as Ready',
      message: `Are you sure you want to mark ${unreadyIds.length} order(s) as Ready? This will automatically allocate a delivery partner and send OTP messages via WhatsApp.`,
      confirmText: 'Yes, Mark Ready',
      danger: false,
      onConfirm: async () => {
        if (isMockMode) {
          const updated = orders.map(o => {
            if (unreadyIds.includes(o.id)) return { ...o, status: 'Ready' };
            return o;
          });
          setOrders(updated);
          return;
        }

        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/orders/bulk-ready`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ orderIds: unreadyIds })
          });
          if (res.ok) {
            await fetchOrders();
            triggerToast(`Successfully marked ${unreadyIds.length} orders as Ready!`, 'success');
          }
        } catch (error) {
          console.error(error);
          triggerToast('Failed to mark orders as Ready.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // --- RENDERS ---
  if (!token) {
    return (
      <Login 
        loginForm={loginForm} 
        setLoginForm={setLoginForm} 
        handleLogin={handleLogin} 
        loginError={loginError} 
        loading={loading} 
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMockMode={isMockMode} 
        handleLogout={handleLogout} 
        role={role}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            metrics={metrics} 
            orders={orders} 
            setSelectedOrder={setSelectedOrder} 
            triggerBulkReady={triggerBulkReady} 
            setActiveTab={setActiveTab} 
            loading={loading} 
            loadAllData={loadAllData} 
            partners={partners}
            assignPartner={assignPartner}
            updateOrderStatus={updateOrderStatus}
            triggerAutoAssign={triggerAutoAssign}
          />
        )}

        {activeTab === 'orders' && (
          <Orders 
            orders={orders} 
            setSelectedOrder={setSelectedOrder} 
            triggerBulkReady={triggerBulkReady} 
            partners={partners}
            assignPartner={assignPartner}
            updateOrderStatus={updateOrderStatus}
          />
        )}

        {activeTab === 'partners' && (
          <Partners 
            partners={partners} 
            newPartner={newPartner} 
            setNewPartner={setNewPartner} 
            createPartnerAccount={createPartnerAccount} 
            deletePartner={deletePartner} 
            togglePartnerActive={togglePartnerActive}
            grantPartnerLeave={grantPartnerLeave}
            role={role}
            triggerToast={triggerToast}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'tickets' && (
          <Tickets 
            tickets={tickets} 
            resolveTicket={resolveTicket} 
            role={role}
          />
        )}

        {activeTab === 'payments' && (
          <Payments 
            payments={payments} 
            orders={orders}
            loading={loading} 
            loadAllData={loadAllData} 
            gstPercentage={settings?.gstPercentage || 5.0}
            setSelectedOrder={setSelectedOrder}
          />
        )}

        {activeTab === 'customers' && (
          <Customers 
            customers={customers} 
            loading={loading} 
            loadAllData={loadAllData} 
            triggerToast={triggerToast}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            API_BASE={API_BASE} 
            token={token} 
            role={role}
            currentAdminId={currentAdminId}
            handleLogout={handleLogout}
            isMockMode={isMockMode} 
            triggerToast={triggerToast}
            catalog={catalog}
            setCatalog={setCatalog}
            saveCatalog={saveCatalog}
          />
        )}
      </main>

      <OrderDrawer 
        selectedOrder={selectedOrder} 
        setSelectedOrder={setSelectedOrder} 
        partners={partners} 
        orders={orders}
        assignPartner={assignPartner} 
        updateOrderStatus={updateOrderStatus} 
        cancelOrder={cancelOrder} 
        isMockMode={isMockMode} 
        token={token} 
        API_BASE={API_BASE} 
        role={role}
        triggerToast={triggerToast}
        setConfirmModal={setConfirmModal}
      />

      {/* Floating Glassmorphism Toast Alerts */}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: toast.type === 'error' 
              ? '4px solid #EF4444' 
              : toast.type === 'info' 
                ? 'rgba(59, 130, 246, 0.95)' 
                : '4px solid #0EA5E9', // Success themed to blue
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 1px 1px rgba(255, 255, 255, 0.05) inset',
            borderRadius: '12px',
            padding: '16px 22px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <style>{`
            @keyframes toastSlideIn {
              from { transform: translateY(-24px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
          {toast.type === 'error' && <AlertTriangle size={18} style={{ color: '#EF4444' }} />}
          {toast.type === 'info' && <InfoIcon size={18} style={{ color: '#3B82F6' }} />}
          {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#38BDF8' }} />}
          <span style={{ letterSpacing: '0.2px' }}>{toast.message}</span>
        </div>
      )}

      {/* Custom Glassmorphism Confirmation Dialog Overlay */}
      {confirmModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            animation: 'fadeInOverlay 0.2s ease-out'
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.15), 0 0 1px 1px rgba(255, 255, 255, 0.2) inset',
              animation: 'popModalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes popModalIn {
                from { transform: scale(0.92) translateY(12px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
              }
            `}</style>
            
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} style={{ color: confirmModal.danger !== false ? '#EF4444' : '#F59E0B' }} />
              <span>{confirmModal.title}</span>
            </h4>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24, marginTop: 0 }}>
              {confirmModal.message}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.85rem' }} 
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button 
                className={confirmModal.danger !== false ? "btn btn-danger" : "btn btn-primary"} 
                style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.85rem' }}
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
