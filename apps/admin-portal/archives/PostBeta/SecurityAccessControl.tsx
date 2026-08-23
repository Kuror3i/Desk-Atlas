import { useState } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle, Clock, User, DoorOpen, Key, Search, Download, Video, Bell } from 'lucide-react';

type AccessLevel = 'full' | 'business-hours' | 'restricted' | 'none';

type AccessZone = {
  id: string;
  name: string;
  floor: string;
  accessLevel: AccessLevel;
  activeUsers: number;
  capacity: number;
  status: 'secure' | 'active' | 'breach' | 'maintenance';
};

type SecurityLog = {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  zone: string;
  action: 'granted' | 'denied' | 'timeout' | 'forced';
  method: 'badge' | 'pin' | 'biometric' | 'admin-override';
  ipAddress?: string;
};

type AccessCredential = {
  id: string;
  userName: string;
  userType: 'member' | 'tenant' | 'staff' | 'visitor' | 'contractor';
  badgeNumber: string;
  accessLevel: AccessLevel;
  zones: string[];
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
};

const mockZones: AccessZone[] = [
  {
    id: 'Z001',
    name: 'Main Lobby',
    floor: 'Floor 1',
    accessLevel: 'full',
    activeUsers: 45,
    capacity: 100,
    status: 'active',
  },
  {
    id: 'Z002',
    name: 'Zone A - Hot Desks',
    floor: 'Floor 2',
    accessLevel: 'business-hours',
    activeUsers: 32,
    capacity: 50,
    status: 'active',
  },
  {
    id: 'Z003',
    name: 'Zone B - Private Offices',
    floor: 'Floor 2',
    accessLevel: 'restricted',
    activeUsers: 18,
    capacity: 25,
    status: 'secure',
  },
  {
    id: 'Z004',
    name: 'Meeting Rooms',
    floor: 'Floor 3',
    accessLevel: 'business-hours',
    activeUsers: 24,
    capacity: 40,
    status: 'active',
  },
  {
    id: 'Z005',
    name: 'Server Room',
    floor: 'Floor 3',
    accessLevel: 'restricted',
    activeUsers: 1,
    capacity: 5,
    status: 'secure',
  },
  {
    id: 'Z006',
    name: 'Rooftop Lounge',
    floor: 'Floor 4',
    accessLevel: 'business-hours',
    activeUsers: 8,
    capacity: 30,
    status: 'maintenance',
  },
];

const mockSecurityLogs: SecurityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-05-16 14:23:15',
    user: 'Sarah Johnson',
    userId: 'M-847',
    zone: 'Zone A - Hot Desks',
    action: 'granted',
    method: 'badge',
  },
  {
    id: 'LOG-002',
    timestamp: '2026-05-16 14:18:42',
    user: 'Mike Chen',
    userId: 'T-023',
    zone: 'Zone B - Private Offices',
    action: 'granted',
    method: 'biometric',
  },
  {
    id: 'LOG-003',
    timestamp: '2026-05-16 14:15:28',
    user: 'Unknown User',
    userId: 'UNKNOWN',
    zone: 'Server Room',
    action: 'denied',
    method: 'badge',
  },
  {
    id: 'LOG-004',
    timestamp: '2026-05-16 14:10:11',
    user: 'Emma Davis',
    userId: 'S-012',
    zone: 'Meeting Rooms',
    action: 'granted',
    method: 'pin',
  },
  {
    id: 'LOG-005',
    timestamp: '2026-05-16 14:05:33',
    user: 'Admin User',
    userId: 'ADM-001',
    zone: 'Server Room',
    action: 'granted',
    method: 'admin-override',
  },
  {
    id: 'LOG-006',
    timestamp: '2026-05-16 13:58:47',
    user: 'John Smith',
    userId: 'V-142',
    zone: 'Zone A - Hot Desks',
    action: 'timeout',
    method: 'badge',
  },
];

const mockCredentials: AccessCredential[] = [
  {
    id: 'CRED-001',
    userName: 'Sarah Johnson',
    userType: 'member',
    badgeNumber: 'BADGE-847',
    accessLevel: 'business-hours',
    zones: ['Main Lobby', 'Zone A', 'Meeting Rooms'],
    issueDate: 'Jan 15, 2026',
    expiryDate: 'Jan 15, 2027',
    status: 'active',
  },
  {
    id: 'CRED-002',
    userName: 'Mike Chen',
    userType: 'tenant',
    badgeNumber: 'BADGE-023',
    accessLevel: 'full',
    zones: ['Main Lobby', 'Zone A', 'Zone B', 'Meeting Rooms'],
    issueDate: 'Feb 10, 2026',
    expiryDate: 'Feb 10, 2027',
    status: 'active',
  },
  {
    id: 'CRED-003',
    userName: 'Emma Davis',
    userType: 'staff',
    badgeNumber: 'BADGE-012',
    accessLevel: 'full',
    zones: ['All Zones'],
    issueDate: 'Jan 5, 2026',
    expiryDate: 'Dec 31, 2026',
    status: 'active',
  },
  {
    id: 'CRED-004',
    userName: 'James Wilson',
    userType: 'visitor',
    badgeNumber: 'TEMP-142',
    accessLevel: 'restricted',
    zones: ['Main Lobby', 'Zone A'],
    issueDate: 'May 16, 2026',
    expiryDate: 'May 16, 2026',
    status: 'expired',
  },
  {
    id: 'CRED-005',
    userName: 'Lisa Brown',
    userType: 'contractor',
    badgeNumber: 'CONT-089',
    accessLevel: 'restricted',
    zones: ['Main Lobby', 'Rooftop Lounge'],
    issueDate: 'May 10, 2026',
    expiryDate: 'May 20, 2026',
    status: 'active',
  },
];

const zoneStatusConfig = {
  secure: {
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    icon: Shield,
  },
  active: {
    color: 'bg-[#ccefeb] text-[#007d6f] border-[#b3e7e0]',
    dot: 'bg-[#e6f7f5]0',
    icon: DoorOpen,
  },
  breach: {
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
  maintenance: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
    icon: Clock,
  },
};

const actionColors = {
  granted: 'bg-green-100 text-green-700 border-green-200',
  denied: 'bg-red-100 text-red-700 border-red-200',
  timeout: 'bg-orange-100 text-orange-700 border-orange-200',
  forced: 'bg-red-100 text-red-700 border-red-200',
};

const credentialStatusConfig = {
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-gray-100 text-gray-700 border-gray-200',
  suspended: 'bg-orange-100 text-orange-700 border-orange-200',
  revoked: 'bg-red-100 text-red-700 border-red-200',
};

const userTypeColors = {
  member: 'bg-[#ccefeb] text-[#007d6f]',
  tenant: 'bg-purple-100 text-purple-700',
  staff: 'bg-indigo-100 text-indigo-700',
  visitor: 'bg-orange-100 text-orange-700',
  contractor: 'bg-yellow-100 text-yellow-700',
};

export function SecurityAccessControl() {
  const [selectedTab, setSelectedTab] = useState<'zones' | 'logs' | 'credentials' | 'alerts'>('zones');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    totalZones: mockZones.length,
    secureZones: mockZones.filter((z) => z.status === 'secure').length,
    activeAccess: mockZones.reduce((sum, z) => sum + z.activeUsers, 0),
    deniedToday: mockSecurityLogs.filter((l) => l.action === 'denied').length,
  };

  const filteredLogs = mockSecurityLogs.filter((log) =>
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCredentials = mockCredentials.filter((cred) =>
    cred.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cred.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Shield className="w-8 h-8 text-[#009689] mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Zones</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalZones}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Lock className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Secure Zones</p>
          <p className="text-3xl font-bold text-gray-900">{stats.secureZones}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <DoorOpen className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Active Access</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeAccess}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Denied Today</p>
          <p className="text-3xl font-bold text-gray-900">{stats.deniedToday}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 px-6 pt-4">
          <div className="flex gap-6">
            <button
              onClick={() => setSelectedTab('zones')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                selectedTab === 'zones'
                  ? 'border-[#009689] text-[#009689] font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Access Zones
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                selectedTab === 'logs'
                  ? 'border-[#009689] text-[#009689] font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Security Logs
            </button>
            <button
              onClick={() => setSelectedTab('credentials')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                selectedTab === 'credentials'
                  ? 'border-[#009689] text-[#009689] font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Access Credentials
            </button>
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                selectedTab === 'alerts'
                  ? 'border-[#009689] text-[#009689] font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Security Alerts
            </button>
          </div>
        </div>

        {/* Access Zones Tab */}
        {selectedTab === 'zones' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockZones.map((zone, index) => {
                const StatusIcon = zoneStatusConfig[zone.status].icon;
                const occupancyPercent = Math.round((zone.activeUsers / zone.capacity) * 100);
                return (
                  <div
                    key={`zone-${index}-${zone.id}`}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-[#e6f7f5] rounded-lg">
                          <Shield className="w-6 h-6 text-[#009689]" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold text-lg">{zone.name}</h3>
                          <p className="text-sm text-gray-600">{zone.floor}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${zoneStatusConfig[zone.status].color}`}>
                        <div className={`w-2 h-2 rounded-full ${zoneStatusConfig[zone.status].dot}`} />
                        <span className="text-xs font-medium capitalize">{zone.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">Access Level</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{zone.accessLevel.replace('-', ' ')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">Occupancy</p>
                        <p className="text-sm font-medium text-gray-900">
                          {zone.activeUsers}/{zone.capacity} ({occupancyPercent}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#e6f7f5] text-[#009689] rounded-lg hover:bg-[#ccefeb] transition-colors text-sm">
                        <Video className="w-4 h-4" />
                        View Camera
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                        <Lock className="w-4 h-4" />
                        Lock Down
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security Logs Tab */}
        {selectedTab === 'logs' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search security logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">User</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Zone</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={`log-${index}-${log.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.user}</p>
                          <p className="text-xs text-gray-500">{log.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.zone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border capitalize ${actionColors[log.action]}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 capitalize">{log.method.replace('-', ' ')}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Access Credentials Tab */}
        {selectedTab === 'credentials' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
                <Key className="w-4 h-4" />
                Issue Credential
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredCredentials.map((cred, index) => (
                <div
                  key={`cred-${index}-${cred.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#009689] to-[#007d6f] rounded-lg flex items-center justify-center text-white font-bold">
                        {cred.userName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gray-900 font-semibold">{cred.userName}</h3>
                          <span className={`px-2.5 py-1 rounded text-xs font-medium ${userTypeColors[cred.userType]}`}>
                            {cred.userType}
                          </span>
                          <span className={`px-2.5 py-1 rounded text-xs font-medium border ${credentialStatusConfig[cred.status]}`}>
                            {cred.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Key className="w-4 h-4" />
                            <span className="font-mono">{cred.badgeNumber}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Access: </span>
                            <span className="capitalize">{cred.accessLevel.replace('-', ' ')}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Expires: </span>
                            {cred.expiryDate}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-600">Zones:</span>
                          {cred.zones.map((zone, zoneIndex) => (
                            <span
                              key={`zone-${index}-${zoneIndex}-${zone}`}
                              className="px-2 py-1 bg-[#e6f7f5] text-[#007d6f] rounded text-xs"
                            >
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 bg-[#e6f7f5] text-[#009689] rounded-lg hover:bg-[#ccefeb] transition-colors text-sm">
                        Edit
                      </button>
                      <button className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Alerts Tab */}
        {selectedTab === 'alerts' && (
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900 font-semibold">Unauthorized Access Attempt</h3>
                      <span className="text-sm text-gray-600">14:15:28</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Unknown badge attempted access to Server Room. Access denied. Security notified.
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                        View Details
                      </button>
                      <button className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900 font-semibold">Access Timeout</h3>
                      <span className="text-sm text-gray-600">13:58:47</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Visitor badge TEMP-142 has exceeded maximum duration in Zone A. Auto-logout initiated.
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                        View Details
                      </button>
                      <button className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#e6f7f5] border border-[#b3e7e0] rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#ccefeb] rounded-lg">
                    <Bell className="w-6 h-6 text-[#009689]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900 font-semibold">Credential Expiring Soon</h3>
                      <span className="text-sm text-gray-600">Today</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      4 visitor credentials will expire today. Review and extend or revoke access.
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors text-sm">
                        Review Credentials
                      </button>
                      <button className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
