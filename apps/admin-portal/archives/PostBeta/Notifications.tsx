import { useState } from 'react';
import { Bell, Check, X, Calendar, DollarSign, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

type NotificationType = 'reservation' | 'payment' | 'checkin' | 'cancellation' | 'rescheduled' | 'system';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'reservation',
    title: 'New Reservation',
    message: 'Sarah Johnson booked Meeting Room A for May 30, 2026',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'rescheduled',
    title: 'Booking Rescheduled',
    message: 'Mike Chen rescheduled Desk B5 from May 28 to May 31, 2026',
    time: '10 minutes ago',
    read: false,
  },
  {
    id: '3',
    type: 'cancellation',
    title: 'Booking Cancelled',
    message: 'John Smith cancelled reservation for Desk A5 on May 29',
    time: '30 minutes ago',
    read: false,
  },
  {
    id: '4',
    type: 'checkin',
    title: 'Customer Check-in',
    message: 'Emma Davis checked in at Desk B3',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '5',
    type: 'rescheduled',
    title: 'Booking Rescheduled',
    message: 'Lisa Brown rescheduled Meeting Room C from June 1 to June 3',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '6',
    type: 'cancellation',
    title: 'Booking Cancelled',
    message: 'James Wilson cancelled Phone Booth 2 reservation',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '7',
    type: 'system',
    title: 'System Update',
    message: 'Workspace status sync completed successfully',
    time: '3 hours ago',
    read: true,
  },
];

const notificationConfig = {
  reservation: {
    icon: Calendar,
    color: '#009689',
    bgColor: '#e6f7f5',
  },
  payment: {
    icon: DollarSign,
    color: '#10b981',
    bgColor: '#d1fae5',
  },
  checkin: {
    icon: UserCheck,
    color: '#009689',
    bgColor: '#e6f7f5',
  },
  cancellation: {
    icon: X,
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
  rescheduled: {
    icon: RefreshCw,
    color: '#8b5cf6',
    bgColor: '#f3e8ff',
  },
  system: {
    icon: AlertCircle,
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e6f7f5' }}>
              <Bell className="w-6 h-6" style={{ color: '#009689' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              filter === 'all'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={filter === 'all' ? { backgroundColor: '#009689' } : {}}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              filter === 'unread'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={filter === 'unread' ? { backgroundColor: '#009689' } : {}}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const config = notificationConfig[notification.type];
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#009689' }} />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                        <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
