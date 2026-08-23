import {
  Calendar,
  Clock,
  CheckCircle,
  DoorOpen,
  UserCheck,
  XCircle,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { MockReservations } from '../MockReservations';

const dashboardMetrics = [
  {
    label: "Today's Reservations",
    value: '24',
    icon: Calendar,
    color: '#009689',
  },
  {
    label: 'Pending Reservations',
    value: '7',
    icon: Clock,
    color: '#f59e0b',
  },
  {
    label: 'Available Workspaces',
    value: '42',
    icon: CheckCircle,
    color: '#10b981',
  },
  {
    label: 'Occupied Workspaces',
    value: '78',
    icon: DoorOpen,
    color: '#6366f1',
  },
  {
    label: "Today's Check-ins",
    value: '18',
    icon: UserCheck,
    color: '#009689',
  },
  {
    label: 'Booking Cancellations',
    value: '2',
    icon: XCircle,
    color: '#ef4444',
  },
  {
    label: 'Rescheduled Booking',
    value: '5',
    icon: RefreshCw,
    color: '#8b5cf6',
  },
  {
    label: 'Average Booking Duration',
    value: '4.2 hrs',
    icon: Clock,
    color: '#009689',
  },
  {
    label: 'Peak Booking Hours',
    value: '10-3 PM',
    icon: Calendar,
    color: '#8b5cf6',
  },
];

const activityFeed = [
  {
    id: 1,
    type: 'check-in',
    message: 'Customer checked in at Desk A5',
    time: '2 minutes ago',
    icon: UserCheck,
    iconColor: '#009689',
  },
  {
    id: 2,
    type: 'reservation',
    message: 'Reservation confirmed for Meeting Room B',
    time: '5 minutes ago',
    icon: Calendar,
    iconColor: '#009689',
  },
  {
    id: 3,
    type: 'workspace',
    message: 'Workspace A3 marked as occupied',
    time: '12 minutes ago',
    icon: DoorOpen,
    iconColor: '#6366f1',
  },
  {
    id: 4,
    type: 'cancellation',
    message: 'Booking cancelled by customer - Desk C7',
    time: '18 minutes ago',
    icon: XCircle,
    iconColor: '#ef4444',
  },
  {
    id: 5,
    type: 'admin',
    message: 'Admin updated workspace layout configuration',
    time: '25 minutes ago',
    icon: Activity,
    iconColor: '#6b7280',
  },
  {
    id: 6,
    type: 'check-in',
    message: 'Customer checked in at Hot Desk B12',
    time: '32 minutes ago',
    icon: UserCheck,
    iconColor: '#009689',
  },
  {
    id: 7,
    type: 'reservation',
    message: 'New reservation for Private Office D',
    time: '45 minutes ago',
    icon: Calendar,
    iconColor: '#009689',
  },
  {
    id: 8,
    type: 'workspace',
    message: 'Workspace F8 marked as available',
    time: '1 hour ago',
    icon: CheckCircle,
    iconColor: '#10b981',
  },
];

export function Overview() {
  return (
    <div className="space-y-8">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: metric.color }} />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: '#009689' }} />
            <h2 className="text-lg font-semibold text-gray-900">Live Activity Feed</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time updates on reservations and workspace activity
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {activityFeed.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${activity.iconColor}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: activity.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm">{activity.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-4">
                <button
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#009689' }}
                >
                  View all activity →
                </button>

                <MockReservations />
              </div>
            </div>
      </div>
    </div>
  );
}
