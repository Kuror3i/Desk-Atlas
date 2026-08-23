import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Login } from './auth/Login';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { StaffRouter } from './staff/StaffRouter';
import { StaffLogin } from './staff/StaffLogin';
import {
  LayoutDashboard,
  MapPin,
  Grid3x3,
  Calendar,
  MonitorSmartphone,
  Database,
  UsersRound,
  Bell,
  Wrench,
  Settings,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Overview } from './components/admin/Overview';
import { Reservations } from './components/admin/Reservations';
import { WorkspaceManagement } from './components/admin/WorkspaceManagement';
import { LayoutEditor } from './components/admin/LayoutEditor';
import { KioskManagement } from './components/admin/KioskManagement';
import { WorkspaceMap } from './components/admin/WorkspaceMap';
import { StaffManagement } from './components/admin/StaffManagement';
import { Reports } from './components/admin/Reports';
import { UserTypeSelection } from './components/UserTypeSelection';
import { AdminLogin } from './components/AdminLogin';
import { SystemSettings } from './components/admin/SystemSettings';
// The following were imported but never rendered, and duplicate scope the
// Feature Scope and UCD Review places out of bounds for Version 1:
// - VisitorLogs / MembersDatabase -> CRM-style customer database ("Required
//   customer account: Remove", "Customer loyalty/membership: Remove/defer",
//   Appendix A "Out of scope: Accounting, CRM... integrations"). Visitor
//   activity already lives in the Staff role (VisitorActivityScreen) - one
//   audit trail, not two (Architecture Guideline Section 4, audit_log).
// - SecurityAccessControl -> physical badge/biometric access control is a
//   different product entirely, not part of the reservation problem
//   statement (Review Section 3).
// - BillingPayments -> membership invoicing duplicates the payment-proof
//   review already in Reservations, and depends on a payment gateway the
//   client has not approved (Review Section 6, "Automated payment
//   confirmation: Remove").
// - Notifications -> "Full in-app notification center: Remove... Use email,
//   status badges, counters, and an action-required queue" (Review Section
//   6). Replaced below with a simple header counter.
// All are preserved (not deleted) in Admin/archives/PostBeta/.

type Page =
  | 'dashboard'
  | 'reservations'
  | 'kiosks'
  | 'workspace-map'
  | 'workspace-status'
  | 'workspace-setup'
  | 'staff'
  | 'reports'
  | 'settings';

type NavCategory = {
  id: string;
  label: string;
  items: {
    id: Page;
    label: string;
    icon: any;
  }[];
};

const navigationCategories: NavCategory[] = [
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reservations', label: 'Reservations', icon: Calendar },
      { id: 'kiosks', label: 'Kiosk Status', icon: MonitorSmartphone },
      { id: 'workspace-map', label: 'Workspace Map', icon: MapPin },
      { id: 'workspace-status', label: 'Workspace Status', icon: Grid3x3 },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      { id: 'workspace-setup', label: 'Layout Builder', icon: Wrench },
      { id: 'staff', label: 'Users', icon: UsersRound },
      { id: 'reports', label: 'Reports', icon: Database },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

function AdminShell() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['operations']);
  const { logout, user } = useAuth();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getCurrentPageLabel = () => {
    for (const category of navigationCategories) {
      const item = category.items.find((i) => i.id === currentPage);
      if (item) return item.label;
    }
    return 'Dashboard';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col relative overflow-hidden shadow-sm`}
      >
        {/* Logo & Toggle */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-5">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: '#009689' }}>
                  D
                </div>
                <div>
                  <h1 className="text-gray-900 font-semibold">Admin Portal</h1>
                  <p className="text-xs font-medium" style={{ color: '#009689' }}>DeskAtlas</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 mx-auto"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {navigationCategories.map((category, categoryIndex) => {
            const isExpanded = expandedCategories.includes(category.id);
            return (
              <div key={`category-${categoryIndex}-${category.id}`}>
                {sidebarOpen && (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    <span>{category.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                {(isExpanded || !sidebarOpen) && (
                  <div className="space-y-1 mt-1">
                    {category.items.map((item, itemIndex) => {
                      // Hide admin-only links (like 'staff' user management) when not admin
                      if (item.id === 'staff' && user?.role !== 'admin') return null;
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={`nav-${categoryIndex}-${itemIndex}-${item.id}`}
                          onClick={() => setCurrentPage(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActive
                              ? 'font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          style={isActive ? { backgroundColor: '#e6f7f5', color: '#009689' } : {}}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? '' : 'text-gray-500'}`} style={isActive ? { color: '#009689' } : {}} />
                          {sidebarOpen && <span className="text-sm">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#009689' }}>
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AD'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? 'Admin User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role ?? 'admin'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#009689' }}>
                AD
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-gray-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{getCurrentPageLabel()}</h1>
            <p className="text-sm font-medium" style={{ color: '#009689' }}>DeskAtlas</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 outline-none transition-all focus:border-[#009689] focus:ring-2"
                style={{ '--tw-ring-color': '#e6f7f5' } as React.CSSProperties}
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                3
              </span>
            </button>

            {/* Settings */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentPage === 'dashboard' && <Overview />}
          {currentPage === 'reservations' && <Reservations />}
          {currentPage === 'kiosks' && <KioskManagement />}
          {currentPage === 'workspace-map' && <WorkspaceMap />}
          {currentPage === 'workspace-status' && <WorkspaceManagement />}
          {currentPage === 'workspace-setup' && <LayoutEditor />}
          {currentPage === 'staff' && <StaffManagement />}
          {currentPage === 'reports' && <Reports />}
          {currentPage === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={[ 'staff' ]}>
                <StaffRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute allowedRoles={[ 'admin' ]}>
                <AdminShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
