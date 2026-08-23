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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Visitor Activity</h1>
        <p className="text-gray-600 mt-1">Track guest movements and temporary checkouts</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
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

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <button onClick={() => setFilterActivity('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterActivity === 'all' ? 'bg-[#009689] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {filteredActivities.map((log) => {
            const Icon = getActivityIcon(log.activityType);
            return (
              <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No visitor activities found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
