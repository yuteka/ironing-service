import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Ticket, 
  Tag, 
  LogOut, 
  AlertCircle,
  DollarSign,
  Settings,
  Truck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isMockMode, handleLogout, role }) {
  const isAdmin = role === 'admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShoppingBag size={20} />
        </div>
        <span className="brand-name">Ironing Service</span>
      </div>

      <ul className="sidebar-menu">
        <li 
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard className="menu-icon" />
          <span>Dashboard</span>
        </li>
        <li 
          className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag className="menu-icon" />
          <span>Manage Bookings</span>
        </li>
        <li 
          className={`menu-item ${activeTab === 'partners' ? 'active' : ''}`}
          onClick={() => setActiveTab('partners')}
        >
          <Truck className="menu-icon" />
          <span>Pickup Partners</span>
        </li>
        <li 
          className={`menu-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Users className="menu-icon" />
          <span>Manage Customers</span>
        </li>
        <li 
          className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <DollarSign className="menu-icon" />
          <span>Manage Payments</span>
        </li>
        <li 
          className={`menu-item ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <Ticket className="menu-icon" />
          <span>Support Tickets</span>
        </li>
        <li 
          className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="menu-icon" />
          <span>System Settings</span>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="profile-card" style={{ marginBottom: 16 }}>
          <div className="profile-avatar">{isAdmin ? 'A' : 'S'}</div>
          <div className="profile-info">
            <div className="profile-name">{isAdmin ? 'Administrator' : 'Sub-Admin'}</div>
            <div className="profile-role">{isAdmin ? 'Store Owner' : 'Staff Operator'}</div>
          </div>
        </div>
        <button 
          className="menu-item" 
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
          onClick={handleLogout}
        >
          <LogOut className="menu-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
