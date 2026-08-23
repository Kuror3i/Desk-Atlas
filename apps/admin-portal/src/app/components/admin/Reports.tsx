import { Download, Calendar, Users, DollarSign, FileText } from 'lucide-react';

const summaryMetrics = [
  {
    label: 'Total Reservations This Month',
    value: '847',
    icon: Calendar,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    label: 'Total Payments This Month',
    value: '$11,900',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
];

const reportCategories = [
  { id: 'workspace', name: 'Workspace Utilization', count: 15, icon: FileText },
  { id: 'reservations', name: 'Reservation History', count: 20, icon: Calendar },
  { id: 'payment', name: 'Payment Records', count: 8, icon: DollarSign },
  { id: 'booking-activity', name: 'Customer Booking Activity', count: 12, icon: Users },
  { id: 'cancellation', name: 'Cancellation & Rescheduling', count: 6, icon: FileText },
  { id: 'checkin', name: 'Check-in / Checkout Records', count: 4, icon: FileText },
];

const recentReports = [
  { id: 'RPT-001', name: 'Payment Records Summary - May 2026', date: '2026-05-13', type: 'Payment', status: 'ready' },
  { id: 'RPT-002', name: 'Workspace Utilization - May 2026', date: '2026-05-12', type: 'Workspace', status: 'ready' },
  { id: 'RPT-003', name: 'Customer Booking Activity - April 2026', date: '2026-05-10', type: 'Booking Activity', status: 'ready' },
  { id: 'RPT-004', name: 'Cancellation and Rescheduling Summary - May 2026', date: '2026-05-09', type: 'Booking Changes', status: 'ready' },
  { id: 'RPT-005', name: 'Check-in and Checkout Logs - May 2026', date: '2026-05-08', type: 'Check-in/Checkout', status: 'ready' },
];

const topUsers = [
  { name: 'Sarah Johnson', bookings: 28, spent: '$1,120' },
  { name: 'Mike Chen', bookings: 24, spent: '$960' },
  { name: 'Emma Davis', bookings: 22, spent: '$880' },
  { name: 'James Wilson', bookings: 19, spent: '$760' },
  { name: 'Lisa Brown', bookings: 17, spent: '$680' },
];

export function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Operational Reports</h2>
            <p className="text-sm text-gray-500 mt-1">Download and manage workspace operation reports</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
            <Download className="w-4 h-4" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaryMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={`metric-${index}-${metric.label}`}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${metric.bg}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div
              key={`category-${index}-${category.id}`}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#e6f7f5] rounded-lg">
                  <Icon className="w-6 h-6 text-[#009689]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count} reports available</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-gray-900 font-semibold text-lg mb-6">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Report ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Report Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Generated Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentReports.map((report, index) => (
                <tr key={`report-${index}-${report.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{report.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200 capitalize">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-1 text-[#009689] hover:text-[#007d6f] text-sm font-medium">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequent Bookers Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-gray-900 font-semibold text-lg mb-6">Frequent Bookers This Month</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total Bookings</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topUsers.map((user, index) => (
                <tr key={`user-${index}-${user.name}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#009689] to-[#007d6f] text-white font-bold shadow-sm">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900 font-medium">{user.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700">{user.bookings}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-green-600">{user.spent}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
