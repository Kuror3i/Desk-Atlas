import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Calendar,
  Activity,
  MapPin,
  Search,
  Monitor,
  MessageSquare,
  Users,
  Settings,
  LogOut
} from 'lucide-react';

export function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/reservations', label: 'Reservations', icon: Calendar },
    { path: '/dashboard/active-sessions', label: 'Active Sessions', icon: Activity },
    { path: '/dashboard/visitor-activity', label: 'Visitor Activity', icon: Users },
    { path: '/dashboard/workspace-status', label: 'Workspace Map', icon: MapPin },
    { path: '/dashboard/record-search', label: 'Record Search', icon: Search },
    { path: '/dashboard/kiosk-status', label: 'Kiosk Status', icon: Monitor },
    { path: '/dashboard/staff-assistant', label: 'Staff Assistant', icon: MessageSquare },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
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
                <span className="text-sm font-medium text-[#009689]">ST</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Staff User</p>
                <p className="text-xs text-gray-500">staff@workspace.com</p>
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
