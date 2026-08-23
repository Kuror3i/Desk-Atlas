import { useState } from 'react';
import { Search, Filter, Plus, Users, Building2, Tag, Calendar, Clock, DollarSign, X } from 'lucide-react';

type MembershipType = 'individual' | 'corporate' | 'team';
type MembershipStatus = 'active' | 'inactive' | 'expired' | 'trial';
type MemberTag = 'vip' | 'student' | 'corporate' | 'premium' | 'trial' | 'delinquent' | 'frequent-visitor' | 'partner-tenant';

type Member = {
  id: string;
  name: string;
  email: string;
  type: MembershipType;
  status: MembershipStatus;
  membershipStartDate: string;
  membershipExpirationDate: string;
  tags: MemberTag[];
  totalReservations: number;
  totalSpent: number;
  adminNotes?: string;
  company?: string;
};

const mockMembers: Member[] = [
  {
    id: 'M001',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    type: 'individual',
    status: 'active',
    membershipStartDate: '2024-01-15',
    membershipExpirationDate: '2025-01-15',
    tags: ['vip', 'frequent-visitor'],
    totalReservations: 142,
    totalSpent: 5680,
    adminNotes: 'Prefers quiet zones',
  },
  {
    id: 'M002',
    name: 'Mike Chen',
    email: 'mike@techcorp.com',
    type: 'corporate',
    status: 'active',
    membershipStartDate: '2023-11-01',
    membershipExpirationDate: '2024-11-01',
    tags: ['corporate', 'premium'],
    company: 'TechCorp Inc.',
    totalReservations: 89,
    totalSpent: 12450,
  },
  {
    id: 'M003',
    name: 'Emma Davis',
    email: 'emma@student.edu',
    type: 'individual',
    status: 'active',
    membershipStartDate: '2024-03-10',
    membershipExpirationDate: '2024-09-10',
    tags: ['student'],
    totalReservations: 34,
    totalSpent: 890,
    adminNotes: 'Student discount applied',
  },
  {
    id: 'M004',
    name: 'James Wilson',
    email: 'james@startup.io',
    type: 'team',
    status: 'trial',
    membershipStartDate: '2024-05-01',
    membershipExpirationDate: '2024-05-15',
    tags: ['trial', 'partner-tenant'],
    company: 'Startup Inc.',
    totalReservations: 12,
    totalSpent: 450,
  },
  {
    id: 'M005',
    name: 'Lisa Brown',
    email: 'lisa@example.com',
    type: 'individual',
    status: 'expired',
    membershipStartDate: '2023-06-01',
    membershipExpirationDate: '2024-06-01',
    tags: [],
    totalReservations: 67,
    totalSpent: 2340,
    adminNotes: 'Renewal reminder sent',
  },
  {
    id: 'M006',
    name: 'Robert Taylor',
    email: 'robert@example.com',
    type: 'individual',
    status: 'inactive',
    membershipStartDate: '2023-09-15',
    membershipExpirationDate: '2024-09-15',
    tags: ['delinquent'],
    totalReservations: 23,
    totalSpent: 780,
    adminNotes: 'Payment overdue - suspended',
  },
];

const statusColors = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  trial: 'bg-[#ccefeb] text-[#007d6f] border-[#b3e7e0]',
};

const tagColors = {
  'vip': 'bg-purple-100 text-purple-700',
  'student': 'bg-cyan-100 text-cyan-700',
  'corporate': 'bg-[#ccefeb] text-[#007d6f]',
  'premium': 'bg-indigo-100 text-indigo-700',
  'trial': 'bg-yellow-100 text-yellow-700',
  'delinquent': 'bg-red-100 text-red-700',
  'frequent-visitor': 'bg-green-100 text-green-700',
  'partner-tenant': 'bg-orange-100 text-orange-700',
};

export function MembersDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockMembers.length,
    active: mockMembers.filter((m) => m.status === 'active').length,
    corporate: mockMembers.filter((m) => m.type === 'corporate').length,
    expiringsSoon: mockMembers.filter((m) => {
      const daysUntilExpiry = Math.floor(
        (new Date(m.membershipExpirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length,
  };

  const getDaysRemaining = (expirationDate: string) => {
    const days = Math.floor(
      (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Users className="w-8 h-8 text-[#009689] mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Members</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Members</p>
          <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Building2 className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Corporate Tenants</p>
          <p className="text-3xl font-bold text-gray-900">{stats.corporate}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Calendar className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
          <p className="text-3xl font-bold text-gray-900">{stats.expiringsSoon}</p>
          <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Member</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Membership Period</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Tags</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Activity</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member, index) => {
                const daysRemaining = getDaysRemaining(member.membershipExpirationDate);
                const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;

                return (
                  <tr key={`member-${index}-${member.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        {member.company && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {member.company}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize text-gray-700">{member.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${statusColors[member.status]}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {new Date(member.membershipStartDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className={isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            Expires: {new Date(member.membershipExpirationDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isExpiringSoon && (
                          <p className="text-xs text-orange-600 mt-1">{daysRemaining} days remaining</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.tags.length > 0 ? (
                          member.tags.map((tag, tagIndex) => (
                            <span
                              key={`tag-${index}-${tagIndex}-${tag}`}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tagColors[tag]}`}
                            >
                              {tag.replace('-', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p>{member.totalReservations} bookings</p>
                        <p className="text-green-600 font-medium">${member.totalSpent.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-[#009689] hover:text-[#007d6f] text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Member Details</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedMember.name}</h4>
                <p className="text-sm text-gray-600">{selectedMember.email}</p>
                {selectedMember.company && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Building2 className="w-4 h-4" />
                    {selectedMember.company}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Member ID</p>
                  <p className="font-semibold text-gray-900">{selectedMember.id}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedMember.type}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedMember.membershipStartDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Expiration</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedMember.membershipExpirationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Tags</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.tags.map((tag, tagIndex) => (
                    <span
                      key={`modal-tag-${tagIndex}-${tag}`}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${tagColors[tag]}`}
                    >
                      {tag.replace('-', ' ')}
                      <button className="hover:bg-black/10 rounded p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button className="px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900">
                    + Add Tag
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Activity Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#e6f7f5] rounded-lg">
                    <p className="text-sm text-[#007d6f] mb-1">Total Reservations</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedMember.totalReservations}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-green-900">${selectedMember.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedMember.adminNotes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Admin Notes</h4>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedMember.adminNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
