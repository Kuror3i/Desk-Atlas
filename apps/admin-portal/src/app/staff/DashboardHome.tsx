import { Calendar, Activity, MapPin, CheckCircle, Clock, LogOut, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RESERVATION_STATUS, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_BADGE } from '../lib/reservationStatus';

export function DashboardHome() {
  const summaryCards = [
    { label: "Today's Reservations", value: 24, icon: Calendar, color: 'bg-[#e0f2f1] text-[#009689]' },
    { label: 'Active Sessions', value: 18, icon: Activity, color: 'bg-green-50 text-green-700' },
    { label: 'Available Workspaces', value: 12, icon: MapPin, color: 'bg-teal-50 text-teal-700' },
    { label: 'Occupied Workspaces', value: 18, icon: CheckCircle, color: 'bg-orange-50 text-orange-700' },
    { label: 'Pending Arrivals', value: 3, icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Visitor Activities', value: 8, icon: Users, color: 'bg-purple-50 text-purple-700' },
  ];

  const todayReservations = [
    { name: 'Sarah Johnson', time: '9:00 AM - 5:00 PM', workspace: 'Desk A-12', status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CHECKED_IN], statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.CHECKED_IN] },
    { name: 'Michael Chen', time: '10:00 AM - 2:00 PM', workspace: 'Meeting Room 1', status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CONFIRMED], statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.CONFIRMED] },
    { name: 'Emily Davis', time: '1:00 PM - 6:00 PM', workspace: 'Desk B-5', status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.PENDING_PAYMENT], statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.PENDING_PAYMENT] },
    { name: 'James Wilson', time: '11:00 AM - 3:00 PM', workspace: 'Private Office 2', status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CHECKED_IN], statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.CHECKED_IN] },
  ];

  const activeSessions = [
    { name: 'Sarah Johnson', workspace: 'Desk A-12', checkedIn: '9:05 AM', status: 'Active' },
    { name: 'James Wilson', workspace: 'Private Office 2', checkedIn: '11:10 AM', status: 'Active' },
    { name: 'Alice Martinez', workspace: 'Desk C-8', checkedIn: '8:45 AM', status: 'Active' },
  ];

  const visitorLogs = [
    { name: 'David Brown', activity: 'Temporary Checkout', workspace: 'Desk A-12', time: '2:15 PM', statusColor: 'text-orange-600' },
    { name: 'Lisa Wang', activity: 'Check-in', workspace: 'Meeting Room 2', time: '1:45 PM', statusColor: 'text-[#009689]' },
    { name: 'Robert Kim', activity: 'Temporary Checkout', workspace: 'Desk B-8', time: '1:30 PM', statusColor: 'text-orange-600' },
    { name: 'Maria Santos', activity: 'Re-checkin', workspace: 'Desk C-5', time: '1:20 PM', statusColor: 'text-green-600' },
    { name: 'John Parker', activity: 'Checkout', workspace: 'Private Office 1', time: '12:50 PM', statusColor: 'text-gray-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Today, Friday May 15, 2026</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Reservations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Reservations</h2>
            <Link to="/staff/reservations" className="text-sm text-[#009689] hover:text-[#00796b] font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayReservations.map((reservation, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{reservation.name}</p>
                  <p className="text-sm text-gray-600">{reservation.time}</p>
                  <p className="text-sm text-gray-500">{reservation.workspace}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${reservation.statusColor}`}>
                  {reservation.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
            <Link to="/staff/active-sessions" className="text-sm text-[#009689] hover:text-[#00796b] font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {activeSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{session.name}</p>
                  <p className="text-sm text-gray-600">{session.workspace}</p>
                  <p className="text-sm text-gray-500">Checked in at {session.checkedIn}</p>
                </div>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitor Logs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Visitor Activity</h2>
              <p className="text-sm text-gray-500">Track guest activity and temporary movements</p>
            </div>
          </div>
          <Link to="/staff/visitor-activity" className="text-sm text-[#009689] hover:text-[#00796b] font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-2">
          {visitorLogs.map((log, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-200">
                  <LogOut className={`w-4 h-4 ${log.statusColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">{log.name}</p>
                    <span className={`text-sm font-medium ${log.statusColor}`}>{log.activity}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-600">{log.workspace}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{log.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/staff/record-search"
            className="flex items-center gap-3 p-4 bg-[#e0f2f1] rounded-lg hover:bg-[#b2dfdb] transition-colors"
          >
            <div className="w-10 h-10 bg-[#009689] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-gray-900">Search Reservation</span>
          </Link>
          <Link
            to="/staff/record-search"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-gray-900">Search Session</span>
          </Link>
          <Link
            to="/staff/kiosk-status"
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-gray-900">Kiosk Status</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
