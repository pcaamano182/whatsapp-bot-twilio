import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LayoutDashboard, ShoppingCart, LogOut, User } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Pedidos', icon: ShoppingCart },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo-icon">
                <ShoppingCart size={24} color="white" />
              </div>
              <h1 className="logo-text">FreshMarket</h1>
            </div>

            <nav className="nav">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${active ? 'active' : ''}`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                <User size={16} color="white" />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Admin'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
