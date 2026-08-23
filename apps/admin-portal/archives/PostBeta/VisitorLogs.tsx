import { useState } from 'react';
import { Search, Download, UserCheck, Clock, Building2, User, Calendar, LogIn, LogOut } from 'lucide-react';

type VisitorLog = {
  id: string;
  visitorName: string;
  company?: string;
  purpose: 'meeting' | 'delivery' | 'interview' | 'tour' | 'event' | 'maintenance' | 'other';
  hostName: string;
  hostEmail: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  status: 'checked-in' | 'checked-out' | 'expected';
  badge?: string;
  notes?: string;
};

const mockVisitorLogs: VisitorLog[] = [
  {
    id: 'VIS-001',
    visitorName: 'John Anderson',
    company: 'TechCorp Solutions',
    purpose: 'meeting',
    hostName: 'Sarah Johnson',
    hostEmail: 'sarah@cowork.com',
    checkInTime: '09:15 AM',
    date: 'May 16, 2026',
    status: 'checked-in',
    badge: 'BADGE-045',
    notes: 'Partnership discussion',
  },
  {
    id: 'VIS-002',
    visitorName: 'Emily Davis',
    company: 'StartupXYZ',
    purpose: 'interview',
    hostName: 'Mike Chen',
    hostEmail: 'mike@cowork.com',
    checkInTime: '10:00 AM',
    checkOutTime: '11:30 AM',
    date: 'May 16, 2026',
    status: 'checked-out',
    badge: 'BADGE-046',
    notes: 'Senior Developer Position',
  },
  {
    id: 'VIS-003',
    visitorName: 'Robert Martinez',
    purpose: 'delivery',
    hostName: 'Reception',
    hostEmail: 'reception@cowork.com',
    checkInTime: '08:30 AM',
    checkOutTime: '08:45 AM',
    date: 'May 16, 2026',
    status: 'checked-out',
    notes: 'Office supplies delivery',
  },
  {
    id: 'VIS-004',
    visitorName: 'Lisa Thompson',
    company: 'Design Studio Co',
    purpose: 'tour',
    hostName: 'Emma Davis',
    hostEmail: 'emma@cowork.com',
    checkInTime: '02:00 PM',
    date: 'May 16, 2026',
    status: 'expected',
    notes: 'Potential new tenant',
  },
  {
    id: 'VIS-005',
    visitorName: 'David Park',
    company: 'Event Solutions',
    purpose: 'event',
    hostName: 'Admin User',
    hostEmail: 'admin@cowork.com',
    checkInTime: '11:00 AM',
    checkOutTime: '03:00 PM',
    date: 'May 15, 2026',
    status: 'checked-out',
    badge: 'BADGE-042',
    notes: 'Networking event setup',
  },
  {
    id: 'VIS-006',
    visitorName: 'Maria Garcia',
    purpose: 'maintenance',
    hostName: 'Facilities',
    hostEmail: 'facilities@cowork.com',
    checkInTime: '07:00 AM',
    checkOutTime: '09:30 AM',
    date: 'May 15, 2026',
    status: 'checked-out',
    notes: 'HVAC maintenance check',
  },
];

const purposeColors = {
  meeting: 'bg-[#ccefeb] text-[#007d6f] border-[#b3e7e0]',
  delivery: 'bg-orange-100 text-orange-700 border-orange-200',
  interview: 'bg-purple-100 text-purple-700 border-purple-200',
  tour: 'bg-green-100 text-green-700 border-green-200',
  event: 'bg-pink-100 text-pink-700 border-pink-200',
  maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusConfig = {
  'checked-in': {
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    icon: LogIn,
  },
  'checked-out': {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-500',
    icon: LogOut,
  },
  expected: {
    color: 'bg-[#ccefeb] text-[#007d6f] border-[#b3e7e0]',
    dot: 'bg-[#e6f7f5]0',
    icon: Clock,
  },
};

export function VisitorLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  const filteredLogs = mockVisitorLogs.filter((log) => {
    const matchesSearch =
      log.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesPurpose = purposeFilter === 'all' || log.purpose === purposeFilter;

    return matchesSearch && matchesStatus && matchesPurpose;
  });

  const stats = {
    totalToday: mockVisitorLogs.filter((v) => v.date === 'May 16, 2026').length,
    checkedIn: mockVisitorLogs.filter((v) => v.status === 'checked-in').length,
    expected: mockVisitorLogs.filter((v) => v.status === 'expected').length,
    totalThisWeek: mockVisitorLogs.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <UserCheck className="w-8 h-8 text-[#009689] mb-2" />
          <p className="text-sm text-gray-600 mb-1">Visitors Today</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalToday}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <LogIn className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Currently Checked In</p>
          <p className="text-3xl font-bold text-gray-900">{stats.checkedIn}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Clock className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Expected Today</p>
          <p className="text-3xl font-bold text-gray-900">{stats.expected}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">This Week</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalThisWeek}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="checked-in">Checked In</option>
              <option value="checked-out">Checked Out</option>
              <option value="expected">Expected</option>
            </select>

            {/* Purpose Filter */}
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            >
              <option value="all">All Purposes</option>
              <option value="meeting">Meeting</option>
              <option value="delivery">Delivery</option>
              <option value="interview">Interview</option>
              <option value="tour">Tour</option>
              <option value="event">Event</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Visitor Logs Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLogs.map((log, index) => {
          const StatusIcon = statusConfig[log.status].icon;
          return (
            <div
              key={`visitor-${index}-${log.id}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                {/* Visitor Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#009689] to-[#007d6f] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {log.visitorName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <p className="text-gray-900 font-semibold">{log.visitorName}</p>
                          </div>
                          {log.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <p className="text-sm text-gray-600">{log.company}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${statusConfig[log.status].color}`}>
                            <div className={`w-2 h-2 rounded-full ${statusConfig[log.status].dot}`} />
                            <span className="text-xs font-medium capitalize">{log.status.replace('-', ' ')}</span>
                          </div>
                          <div className={`inline-flex px-3 py-1 rounded-lg border text-xs font-medium capitalize ${purposeColors[log.purpose]}`}>
                            {log.purpose}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ml-15">
                    {/* Date */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600">Date</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{log.date}</p>
                    </div>

                    {/* Check In */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <LogIn className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-600">Check In</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{log.checkInTime}</p>
                    </div>

                    {/* Check Out */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <LogOut className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-gray-600">Check Out</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.checkOutTime || <span className="text-gray-400">—</span>}
                      </p>
                    </div>

                    {/* Host */}
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-4 h-4 text-[#009689]" />
                        <p className="text-xs text-gray-600">Host</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{log.hostName}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(log.badge || log.notes) && (
                    <div className="mt-3 p-3 rounded-lg bg-[#e6f7f5] border border-blue-100 ml-15">
                      <div className="flex items-start gap-3">
                        {log.badge && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#009689] font-semibold">Badge:</span>
                            <span className="text-xs text-[#007d6f] font-mono bg-white px-2 py-1 rounded border border-[#b3e7e0]">
                              {log.badge}
                            </span>
                          </div>
                        )}
                        {log.notes && (
                          <div className="flex-1">
                            <span className="text-xs text-[#009689] font-semibold">Notes: </span>
                            <span className="text-xs text-[#007d6f]">{log.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="lg:w-32 flex lg:flex-col gap-2">
                  {log.status === 'checked-in' && (
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                      <LogOut className="w-4 h-4" />
                      Check Out
                    </button>
                  )}
                  {log.status === 'expected' && (
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                      <LogIn className="w-4 h-4" />
                      Check In
                    </button>
                  )}
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLogs.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No visitor logs found</p>
        </div>
      )}
    </div>
  );
}
