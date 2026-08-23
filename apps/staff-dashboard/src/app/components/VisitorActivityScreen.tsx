import { useState } from 'react';
import { Search, Filter, LogOut, LogIn, Users } from 'lucide-react';

type ActivityType = 'checkin' | 'recheckin' | 'temporary-checkout' | 'checkout';

interface VisitorActivity {
  id: string;
  name: string;
  activity: string;
  activityType: ActivityType;
  workspace: string;
  time: string;
  statusColor: string;
}

export function VisitorActivityScreen() {
  const [filterActivity, setFilterActivity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activities: VisitorActivity[] = [
    {
      id: 'ACT-001',
      name: 'David Brown',
      activity: 'Temporary Checkout',
      activityType: 'temporary-checkout',
      workspace: 'Desk A-12',
      time: '2:15 PM',
      statusColor: 'text-orange-600',
    },
    {
      id: 'ACT-002',
      name: 'Lisa Wang',
      activity: 'Check-in',
      activityType: 'checkin',
      workspace: 'Meeting Room 2',
      time: '1:45 PM',
      statusColor: 'text-[#009689]',
    },
    {
      id: 'ACT-003',
      name: 'Robert Kim',
      activity: 'Temporary Checkout',
      activityType: 'temporary-checkout',
      workspace: 'Desk B-8',
      time: '1:30 PM',
      statusColor: 'text-orange-600',
    },
    {
      id: 'ACT-004',
      name: 'Maria Santos',
      activity: 'Re-checkin',
      activityType: 'recheckin',
      workspace: 'Desk C-5',
      time: '1:20 PM',
      statusColor: 'text-green-600',
    },
    {
      id: 'ACT-005',
      name: 'John Parker',
      activity: 'Checkout',
      activityType: 'checkout',
      workspace: 'Private Office 1',
      time: '12:50 PM',
      statusColor: 'text-gray-600',
    },
    {
      id: 'ACT-006',
      name: 'Sarah Mitchell',
      activity: 'Temporary Checkout',
      activityType: 'temporary-checkout',
      workspace: 'Desk D-3',
      time: '12:30 PM',
      statusColor: 'text-orange-600',
    },
    {
      id: 'ACT-007',
      name: 'Tom Bradley',
      activity: 'Re-checkin',
      activityType: 'recheckin',
      workspace: 'Desk A-20',
      time: '12:15 PM',
      statusColor: 'text-green-600',
    },
    {
      id: 'ACT-008',
      name: 'Emma Taylor',
      activity: 'Check-in',
      activityType: 'checkin',
      workspace: 'Meeting Room 3',
      time: '11:45 AM',
      statusColor: 'text-[#009689]',
    },
    {
      id: 'ACT-009',
      name: 'Alex Chen',
      activity: 'Temporary Checkout',
      activityType: 'temporary-checkout',
      workspace: 'Desk B-15',
      time: '11:30 AM',
      statusColor: 'text-orange-600',
    },
    {
      id: 'ACT-010',
      name: 'Rachel Green',
      activity: 'Re-checkin',
      activityType: 'recheckin',
      workspace: 'Private Office 2',
      time: '11:00 AM',
      statusColor: 'text-green-600',
    },
  ];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.workspace.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterActivity === 'all' ||
      (filterActivity === 'checkin' && activity.activityType === 'checkin') ||
      (filterActivity === 'recheckin' && activity.activityType === 'recheckin') ||
      (filterActivity === 'temporary-checkout' && activity.activityType === 'temporary-checkout') ||
      (filterActivity === 'checkout' && activity.activityType === 'checkout');

    return matchesSearch && matchesFilter;
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'checkin':
        return LogIn;
      case 'recheckin':
        return LogIn;
      case 'temporary-checkout':
        return LogOut;
      case 'checkout':
        return LogOut;
      default:
        return Users;
    }
  };

  const activityCounts = {
    checkin: activities.filter((a) => a.activityType === 'checkin').length,
    recheckin: activities.filter((a) => a.activityType === 'recheckin').length,
    temporaryCheckout: activities.filter((a) => a.activityType === 'temporary-checkout').length,
    checkout: activities.filter((a) => a.activityType === 'checkout').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Visitor Activity</h1>
        <p className="text-gray-600 mt-1">Track guest movements and temporary checkouts</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <LogIn className="w-5 h-5 text-[#009689]" />
            <p className="text-sm text-gray-600">Check-in</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{activityCounts.checkin}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <LogIn className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Re-checkin</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{activityCounts.recheckin}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <LogOut className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-600">Temporary Checkout</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{activityCounts.temporaryCheckout}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <LogOut className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-600">Checkout</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{activityCounts.checkout}</p>
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
              placeholder="Search by name, workspace, or activity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689] focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <button
              onClick={() => setFilterActivity('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActivity === 'all'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActivity('checkin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActivity === 'checkin'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Check-in
            </button>
            <button
              onClick={() => setFilterActivity('recheckin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActivity === 'recheckin'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Re-checkin
            </button>
            <button
              onClick={() => setFilterActivity('temporary-checkout')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActivity === 'temporary-checkout'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Temporary Checkout
            </button>
            <button
              onClick={() => setFilterActivity('checkout')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActivity === 'checkout'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {filteredActivities.map((log) => {
            const Icon = getActivityIcon(log.activityType);
            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-gray-200">
                    <Icon className={`w-5 h-5 ${log.statusColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">{log.name}</p>
                      <span className={`text-sm font-medium ${log.statusColor}`}>{log.activity}</span>
                    </div>
                    <p className="text-sm text-gray-600">{log.workspace}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{log.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No visitor activities found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-purple-900 mb-2">Activity Tags</h3>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Check-in:</strong> Member or guest enters and begins session</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Re-checkin:</strong> Member returns after temporary absence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Temporary Checkout:</strong> Member temporarily leaves workspace</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Checkout:</strong> Member or guest ends session and leaves</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
