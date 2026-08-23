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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm text-gray-900">{session.id}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><p className="font-medium text-gray-900">{session.name}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm font-medium text-gray-900">{session.workspace}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div><p className="text-sm text-gray-900">{session.startTime}</p><p className="text-xs text-gray-500">Ends {session.endTime}</p></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm text-gray-900">{session.duration}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm text-gray-700">{session.source}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><Circle className={`w-2 h-2 fill-current ${getStatusColor(session.status)}`} /><span className={`text-sm font-medium ${getStatusColor(session.status)}`}>{session.status}</span></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => setSelectedSession(session)} className="flex items-center gap-2 text-[#009689] hover:text-[#00796b] text-sm font-medium"><Eye className="w-4 h-4" />View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
