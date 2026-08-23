import { useState } from 'react';
import { Search, Filter, Eye, Circle, X } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  workspace: string;
  startTime: string;
  duration: string;
  status: string;
  source: string;
  qrStatus: string;
  endTime: string;
}

export function ActiveSessionsScreen() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const sessions = [
    {
      id: 'SES-001',
      name: 'Sarah Johnson',
      workspace: 'Desk A-12',
      startTime: '9:05 AM',
      duration: '6h 30m',
      status: 'Active',
      source: 'Online Reservation',
      qrStatus: 'Valid',
      endTime: '5:00 PM',
    },
    {
      id: 'SES-002',
      name: 'James Wilson',
      workspace: 'Private Office 2',
      startTime: '11:10 AM',
      duration: '3h 45m',
      status: 'Active',
      source: 'Online Reservation',
      qrStatus: 'Valid',
      endTime: '3:00 PM',
    },
    {
      id: 'SES-003',
      name: 'Alice Martinez',
      workspace: 'Desk C-8',
      startTime: '8:45 AM',
      duration: '3h 15m',
      status: 'Near End',
      source: 'Walk-in',
      qrStatus: 'Valid',
      endTime: '12:00 PM',
    },
    {
      id: 'SES-004',
      name: 'Robert Chen',
      workspace: 'Meeting Room 1',
      startTime: '10:15 AM',
      duration: '3h 50m',
      status: 'Active',
      source: 'Walk-in',
      qrStatus: 'Valid',
      endTime: '2:00 PM',
    },
    {
      id: 'SES-005',
      name: 'Maria Garcia',
      workspace: 'Desk B-15',
      startTime: '9:30 AM',
      duration: '6h 25m',
      status: 'Active',
      source: 'Online Reservation',
      qrStatus: 'Valid',
      endTime: '6:00 PM',
    },
    {
      id: 'SES-006',
      name: 'John Smith',
      workspace: 'Desk D-5',
      startTime: '2:00 PM',
      duration: '55m',
      status: 'Recently Started',
      source: 'Walk-in',
      qrStatus: 'Valid',
      endTime: '6:00 PM',
    },
    {
      id: 'SES-007',
      name: 'Emily Davis',
      workspace: 'Private Office 1',
      startTime: '1:05 PM',
      duration: '1h 50m',
      status: 'Active',
      source: 'Online Reservation',
      qrStatus: 'Valid',
      endTime: '5:00 PM',
    },
  ];

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.workspace.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && session.status === 'Active') ||
      (filterStatus === 'recent' && session.status === 'Recently Started') ||
      (filterStatus === 'near-end' && session.status === 'Near End');

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'text-green-600';
    if (status === 'Near End') return 'text-orange-600';
    if (status === 'Recently Started') return 'text-[#009689]';
    return 'text-gray-600';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Active Sessions</h1>
        <p className="text-gray-600 mt-1">Monitor current workspace usage in real-time</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Active</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{sessions.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Recently Started</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {sessions.filter((s) => s.status === 'Recently Started').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Near End</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {sessions.filter((s) => s.status === 'Near End').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Average Duration</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">3h 40m</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, session ID, or workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689] focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active Now
            </button>
            <button
              onClick={() => setFilterStatus('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'recent'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recently Started
            </button>
            <button
              onClick={() => setFilterStatus('near-end')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'near-end'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Near End
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-900">{session.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{session.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{session.workspace}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{session.startTime}</p>
                      <p className="text-xs text-gray-500">Ends {session.endTime}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{session.duration}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700">{session.source}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Circle className={`w-2 h-2 fill-current ${getStatusColor(session.status)}`} />
                      <span className={`text-sm font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="flex items-center gap-2 text-[#009689] hover:text-[#00796b] text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No active sessions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedSession.id}</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Circle className={`w-3 h-3 fill-current ${getStatusColor(selectedSession.status)}`} />
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedSession.status === 'Active' ? 'bg-green-100 text-green-800' :
                    selectedSession.status === 'Near End' ? 'bg-orange-100 text-orange-800' :
                    'bg-[#b2dfdb] text-[#00796b]'
                  }`}>
                    {selectedSession.status}
                  </span>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedSession.qrStatus === 'Valid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  QR: {selectedSession.qrStatus}
                </span>
              </div>

              {/* User Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">User Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSession.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session Source</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSession.source}</span>
                  </div>
                </div>
              </div>

              {/* Session Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Session Timeline</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Start Time</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSession.startTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">End Time</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSession.endTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSession.duration}</span>
                  </div>
                </div>
              </div>

              {/* Workspace Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Workspace</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assigned Workspace</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSession.workspace}</span>
                  </div>
                </div>
              </div>

              {/* Session Reference */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Reference</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session ID</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{selectedSession.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
