import { useEffect, useState } from 'react';
import type { AdminReportsSnapshot } from '@deskatlas/domain';
import { Download, Calendar, Users, DollarSign, FileText } from 'lucide-react';
import { downloadAdminReport, fetchAdminReportsSnapshot } from '../../lib/adminReportsApi';

const metricAppearance = [
  {
    label: 'Total Reservations This Month',
    icon: Calendar,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    label: 'Total Payments This Month',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
] as const;

const categoryIcons = {
  workspace: FileText,
  reservations: Calendar,
  payment: DollarSign,
  'booking-activity': Users,
  cancellation: FileText,
  checkin: FileText,
} as const;

function createInitialSnapshot(): AdminReportsSnapshot {
  return {
    summaryMetrics: metricAppearance.map((metric) => ({
      label: metric.label,
      value: metric.label === 'Total Payments This Month' ? 'PHP 0.00' : '0',
      rawValue: 0,
    })),
    reportCategories: [
      { id: 'workspace', name: 'Workspace Utilization', count: 0, exportType: 'workspace' },
      { id: 'reservations', name: 'Reservation History', count: 0, exportType: 'reservations' },
      { id: 'payment', name: 'Payment Records', count: 0, exportType: 'payment' },
      { id: 'booking-activity', name: 'Customer Booking Activity', count: 0, exportType: 'booking-activity' },
      { id: 'cancellation', name: 'Cancellation & Rescheduling', count: 0, exportType: 'cancellation' },
      { id: 'checkin', name: 'Check-in / Checkout Records', count: 0, exportType: 'checkin' },
    ],
    recentReports: [],
    topUsers: [],
    defaultExportType: 'operations-summary',
    generatedAt: '',
  };
}

export function Reports() {
  const [snapshot, setSnapshot] = useState<AdminReportsSnapshot>(createInitialSnapshot);

  useEffect(() => {
    fetchAdminReportsSnapshot()
      .then(setSnapshot)
      .catch((error) => {
        console.error('Failed to load admin reports', error);
      });
  }, []);

  const handleDownload = async (exportType: AdminReportsSnapshot['defaultExportType']) => {
    try {
      await downloadAdminReport(exportType);
    } catch (error) {
      console.error('Failed to download report', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Operational Reports</h2>
            <p className="text-sm text-gray-500 mt-1">Download and manage workspace operation reports</p>
          </div>
          <button
            onClick={() => handleDownload(snapshot.defaultExportType)}
            className="flex items-center gap-2 px-4 py-2 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors"
          >
            <Download className="w-4 h-4" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {snapshot.summaryMetrics.map((metric, index) => {
          const appearance = metricAppearance.find((entry) => entry.label === metric.label) ?? metricAppearance[0];
          const Icon = appearance.icon;
          return (
            <div
              key={`metric-${index}-${metric.label}`}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${appearance.bg}`}>
                  <Icon className={`w-5 h-5 ${appearance.color}`} />
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
        {snapshot.reportCategories.map((category, index) => {
          const Icon = categoryIcons[category.id];
          return (
            <div
              key={`category-${index}-${category.id}`}
              onClick={() => handleDownload(category.exportType)}
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
              {snapshot.recentReports.map((report, index) => (
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
                    <button
                      onClick={() => handleDownload(report.exportType)}
                      className="flex items-center gap-1 text-[#009689] hover:text-[#007d6f] text-sm font-medium"
                    >
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
              {snapshot.topUsers.map((user, index) => (
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
