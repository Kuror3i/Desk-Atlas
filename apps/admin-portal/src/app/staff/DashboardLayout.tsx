import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Activity,
  MapPin,
  Search,
  Monitor,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/staff', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/staff/reservations', label: 'Reservations', icon: Calendar },
    { path: '/staff/active-sessions', label: 'Active Sessions', icon: Activity },
    { path: '/staff/visitor-activity', label: 'Visitor Activity', icon: Users },
    { path: '/staff/workspace-status', label: 'Workspace Map', icon: MapPin },
    { path: '/staff/record-search', label: 'Record Search', icon: Search },
    { path: '/staff/kiosk-status', label: 'Kiosk Status', icon: Monitor },
    // Staff Assistant (RAG-based Q&A) removed from Version 1 nav per
    // Feature Scope and UCD Review, Section 6: "RAG-based staff assistant
    // — Remove/defer... adds document versioning, retrieval quality, API
    // cost, and evaluation risk." Component archived, not deleted, so it
    // can be reintroduced post-beta as scoped "limited grounded Q&A."
    { path: '/staff/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Staff Dashboard</h1>
          <p className="text-sm text-[#009689] font-medium mt-1">DeskAtlas</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#e0f2f1] text-[#009689]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e0f2f1] flex items-center justify-center">
                <span className="text-sm font-medium text-[#009689]">{user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'ST'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name ?? 'Staff User'}</p>
                <p className="text-xs text-gray-500">{user?.role === 'staff' ? (user?.name ? `${user.name.replace(/\s+/g,'.').toLowerCase()}@workspace.com` : 'staff@workspace.com') : 'staff@workspace.com'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
