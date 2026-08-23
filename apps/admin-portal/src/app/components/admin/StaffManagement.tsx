import { useState } from 'react';
import { UsersRound, Plus, Edit, UserX, Clock, CheckCircle, X, ArrowLeft, Mail, User, Shield, KeyRound } from 'lucide-react';

type Role = 'Staff' | 'Admin';

type StaffAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
  joinedDate: string;
  lastLogin: string;
};

const initialAccounts: StaffAccount[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@deskatlas.com',
    role: 'Admin',
    lastActive: '2 mins ago',
    joinedDate: 'January 2024',
    lastLogin: 'Friday, May 28, 2026 2:15 PM',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@deskatlas.com',
    role: 'Staff',
    lastActive: '15 mins ago',
    joinedDate: 'February 2024',
    lastLogin: 'Thursday, May 27, 2026 4:30 PM',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@deskatlas.com',
    role: 'Staff',
    lastActive: '1 hour ago',
    joinedDate: 'March 2024',
    lastLogin: 'Wednesday, May 26, 2026 11:20 AM',
  },
  {
    id: '4',
    name: 'Emma Davis',
    email: 'emma@deskatlas.com',
    role: 'Admin',
    lastActive: '2 days ago',
    joinedDate: 'April 2024',
    lastLogin: 'Monday, May 24, 2026 8:45 AM',
  },
];

export function StaffManagement() {
  const [accounts, setAccounts] = useState<StaffAccount[]>(initialAccounts);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedAccount, setSelectedAccount] = useState<StaffAccount | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Staff' as Role, password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<StaffAccount | null>(null);

  const stats = {
    total: accounts.length,
    admins: accounts.filter((a) => a.role === 'Admin').length,
  };

  const handleAddAccount = () => {
    setFormData({ name: '', email: '', role: 'Staff', password: '' });
    setNewPassword('');
    setView('add');
  };

  const handleEditAccount = (account: StaffAccount) => {
    setSelectedAccount(account);
    setFormData({ name: account.name, email: account.email, role: account.role, password: '' });
    setNewPassword('');
    setView('edit');
  };

  const handleSaveAccount = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (view === 'add') {
      if (!formData.password.trim()) {
        alert('Please enter a temporary password');
        return;
      }

      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Call server endpoint to create staff (server sets auth_user_id)
      const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
      const devUid = `dev-${Date.now()}`;
      fetch(`${apiBase}/admin/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth-uid': devUid,
        },
        body: JSON.stringify({ role: formData.role.toLowerCase(), display_name: formData.name }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.ok && data.user) {
            const newAccount: StaffAccount = {
              id: data.user.staff_account_id ?? `${Date.now()}`,
              name: data.user.display_name ?? formData.name,
              email: formData.email,
              role: formData.role,
              lastActive: 'Just now',
              joinedDate: monthYear,
              lastLogin: 'Never',
            };
            setAccounts([...accounts, newAccount]);
            alert(`Account created successfully!`);
          } else {
            console.error('Create staff failed', data);
            alert('Failed to create staff account');
          }
        })
        .catch((err) => {
          console.error(err);
          alert('Error creating staff account');
        });
    } else {
      setAccounts(accounts.map(acc =>
        acc.id === selectedAccount?.id
          ? { ...acc, name: formData.name, email: formData.email, role: formData.role }
          : acc
      ));
      alert(`Account updated successfully!`);
    }

    setView('list');
    setSelectedAccount(null);
    setFormData({ name: '', email: '', role: 'Staff', password: '' });
  };

  const handleDeleteClick = (account: StaffAccount) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      setAccounts(accounts.filter(acc => acc.id !== accountToDelete.id));
      alert(`Account "${accountToDelete.name}" has been deleted successfully`);
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    }
  };

  const handleResetPassword = () => {
    if (!newPassword.trim()) {
      alert('Please enter a new password');
      return;
    }
    alert(`Password reset successfully for ${selectedAccount?.name}\n\nNew Password: ${newPassword}`);
    setNewPassword('');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedAccount(null);
    setFormData({ name: '', email: '', role: 'Staff', password: '' });
  };

  // List View
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <UsersRound className="w-8 h-8 text-[#009689] mb-2" />
            <p className="text-sm text-gray-600 mb-1">Total Accounts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: '#f3e8ff' }}>
              <UsersRound className="w-5 h-5 text-purple-700" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Admins</p>
            <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-gray-900 font-semibold text-lg">Users</h3>
              <p className="text-sm text-gray-500 mt-1">Manage staff and admin accounts</p>
            </div>
            <button
              onClick={handleAddAccount}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#009689' }}
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#009689' }}>
                  {account.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold text-lg">{account.name}</h3>
                  <p className="text-sm text-gray-600">{account.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{account.role}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(account);
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <UserX className="w-5 h-5 text-red-600" />
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">Last Active</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{account.lastActive}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">Joined</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{account.joinedDate}</p>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleEditAccount(account)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#e6f7f5] text-[#009689] rounded-lg hover:bg-[#ccefeb] transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Account
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Add/Edit Account View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-lg">
              {view === 'add' ? 'Add Account' : 'Edit Account'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {view === 'add' ? 'Create a new staff account' : selectedAccount?.name}
            </p>
          </div>
          <button
            onClick={handleSaveAccount}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white hover:opacity-90 transition-opacity font-medium"
            style={{ backgroundColor: '#009689' }}
          >
            <CheckCircle className="w-4 h-4" />
            {view === 'add' ? 'Create Account' : 'Update Account'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-[#009689]" />
              <h4 className="text-gray-900 font-semibold">Basic Info</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@deskatlas.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all appearance-none bg-white"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.role === 'Admin'
                    ? 'Admin users have full access to the admin portal'
                    : 'Staff users have limited access to staff functions'}
                </p>
              </div>

              {view === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter temporary password"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This temporary password will be provided to the user for their first login
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Password Reset */}
          {view === 'edit' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <KeyRound className="w-5 h-5 text-[#009689]" />
                <h4 className="text-gray-900 font-semibold">Reset Password</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    You cannot view the current password. Enter a new password to reset.
                  </p>
                </div>

                <button
                  onClick={handleResetPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Activity */}
        {view === 'edit' && selectedAccount && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h4 className="text-gray-900 font-semibold mb-6" style={{ color: '#009689' }}>Activity</h4>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Joined on</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAccount.joinedDate}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-1">Last login on</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAccount.lastLogin}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-1">Last active</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAccount.lastActive}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && accountToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Delete Account</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setAccountToDelete(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this account? This action cannot be undone.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Account Name</p>
                <p className="text-gray-900 font-medium">{accountToDelete.name}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-gray-900 font-medium">{accountToDelete.email}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="text-gray-900 font-medium">{accountToDelete.role}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setAccountToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
