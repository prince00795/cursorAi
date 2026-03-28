import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, User, FileText, BookOpen, PhoneCall, LogOut,
  Sprout, Menu, X, Users, Settings,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  isAdmin?: boolean;
}

export default function Layout({ isAdmin = false }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const farmerNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड', exact: false as const },
    { to: '/schemes', icon: BookOpen, label: 'Schemes', labelHi: 'योजनाएं', exact: false as const },
    { to: '/applications', icon: FileText, label: 'My Applications', labelHi: 'मेरे आवेदन', exact: false as const },
    { to: '/profile', icon: User, label: 'Profile', labelHi: 'प्रोफ़ाइल', exact: false as const },
  ];

  const adminNav = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड', exact: true as const },
    { to: '/admin/farmers', icon: Users, label: 'Farmers', labelHi: 'किसान', exact: false as const },
    { to: '/admin/calls', icon: PhoneCall, label: 'Call Assistant', labelHi: 'कॉल सहायक', exact: false as const },
    { to: '/admin/schemes', icon: Settings, label: 'Schemes', labelHi: 'योजनाएं', exact: false as const },
  ];

  const navItems = isAdmin ? adminNav : farmerNav;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-800 text-white flex flex-col
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-700">
          <div className="w-10 h-10 bg-earth-400 rounded-full flex items-center justify-center">
            <Sprout className="w-6 h-6 text-brand-900" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Kisan Sahayak</h1>
            <p className="text-brand-300 text-xs hindi">किसान सहायक</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-200 hover:bg-brand-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <div>{item.label}</div>
                <div className="text-xs opacity-70 hindi">{item.labelHi}</div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-brand-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-brand-300">{user?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-200 hover:text-white hover:bg-brand-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-brand-600" />
            <span className="font-semibold text-brand-800">Kisan Sahayak</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
