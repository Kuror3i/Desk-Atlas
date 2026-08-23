import { useState } from 'react';
import { Search, Filter, Eye, X } from 'lucide-react';

interface Reservation {
  code: string;
  name: string;
  email: string;
  date: string;
  time: string;
  workspace: string;
  alternatives: string;
  status: string;
  statusColor: string;
  qrStatus: string;
  rescheduledDate?: string;
  cancelledDate?: string;
}

export function ReservationsScreen() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const reservations = [
    {
      code: 'RES-2026-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      date: 'May 15, 2026',
      time: '9:00 AM - 5:00 PM',
      workspace: 'Desk A-12',
      alternatives: 'Desk A-10, Desk A-15',
      status: 'Checked In',
      statusColor: 'bg-green-100 text-green-800',
      qrStatus: 'Valid',
    },
    {
      code: 'RES-2026-002',
      name: 'Michael Chen',
      email: 'mchen@email.com',
      date: 'May 15, 2026',
      time: '10:00 AM - 2:00 PM',
      workspace: 'Meeting Room 1',
      alternatives: 'Meeting Room 2',
      status: 'Confirmed',
      statusColor: 'bg-[#b2dfdb] text-[#00796b]',
      qrStatus: 'Valid',
    },
    {
      code: 'RES-2026-003',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      date: 'May 15, 2026',
      time: '1:00 PM - 6:00 PM',
      workspace: 'Desk B-5',
      alternatives: 'Desk B-3, Desk B-7',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800',
      qrStatus: 'Pending',
    },
    {
      code: 'RES-2026-004',
      name: 'James Wilson',
      email: 'jwilson@email.com',
      date: 'May 15, 2026',
      time: '11:00 AM - 3:00 PM',
      workspace: 'Private Office 2',
      alternatives: 'Private Office 3',
      status: 'Checked In',
      statusColor: 'bg-green-100 text-green-800',
      qrStatus: 'Valid',
    },
    {
      code: 'RES-2026-005',
      name: 'Alice Martinez',
      email: 'alice.m@email.com',
      date: 'May 15, 2026',
      time: '8:00 AM - 12:00 PM',
      workspace: 'Desk C-8',
      alternatives: 'Desk C-6',
      status: 'Checked In',
      statusColor: 'bg-green-100 text-green-800',
      qrStatus: 'Valid',
    },
    {
      code: 'RES-2026-006',
      name: 'Robert Taylor',
      email: 'rtaylor@email.com',
      date: 'May 16, 2026',
      time: '9:00 AM - 1:00 PM',
      workspace: 'Desk A-20',
      alternatives: 'Desk A-18',
      status: 'Rescheduled',
      statusColor: 'bg-purple-100 text-purple-800',
      qrStatus: 'Valid',
      rescheduledDate: 'May 14, 2026 at 3:45 PM',
    },
    {
      code: 'RES-2026-007',
      name: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      date: 'May 16, 2026',
      time: '2:00 PM - 6:00 PM',
      workspace: 'Meeting Room 3',
      alternatives: 'Meeting Room 4',
      status: 'Confirmed',
      statusColor: 'bg-[#b2dfdb] text-[#00796b]',
      qrStatus: 'Valid',
    },
    {
      code: 'RES-2026-008',
      name: 'David Brown',
      email: 'dbrown@email.com',
      date: 'May 15, 2026',
      time: '3:00 PM - 7:00 PM',
      workspace: 'Desk D-12',
      alternatives: '-',
      status: 'No Show',
      statusColor: 'bg-red-100 text-red-800',
      qrStatus: 'Valid',
    },
    {
      code: 'RES-2026-009',
      name: 'Jessica White',
      email: 'jwhite@email.com',
      date: 'May 16, 2026',
      time: '10:00 AM - 4:00 PM',
      workspace: 'Desk B-15',
      alternatives: 'Desk B-12',
      status: 'Cancelled',
      statusColor: 'bg-gray-100 text-gray-800',
      qrStatus: 'Valid',
      cancelledDate: 'May 13, 2026 at 11:20 AM',
    },
  ];

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.workspace.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'today' && reservation.date === 'May 15, 2026') ||
      (filterStatus === 'upcoming' && reservation.date !== 'May 15, 2026') ||
      (filterStatus === 'checked-in' && reservation.status === 'Checked In') ||
      (filterStatus === 'pending' && reservation.status === 'Pending') ||
      (filterStatus === 'no-show' && reservation.status === 'No Show') ||
      (filterStatus === 'cancelled' && reservation.status === 'Cancelled');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reservations</h1>
        <p className="text-gray-600 mt-1">Monitor and manage reservation records</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, code, or workspace..."
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
              onClick={() => setFilterStatus('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'today'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'upcoming'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilterStatus('checked-in')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'checked-in'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Checked In
            </button>
            <button
              onClick={() => setFilterStatus('no-show')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'no-show'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No Show
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'cancelled'
                  ? 'bg-[#009689] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservation Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-900">{reservation.code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.name}</p>
                      <p className="text-sm text-gray-500">{reservation.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{reservation.date}</p>
                      <p className="text-sm text-gray-500">{reservation.time}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reservation.workspace}</p>
                      <p className="text-xs text-gray-500">Alt: {reservation.alternatives}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${reservation.statusColor}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.qrStatus === 'Valid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {reservation.qrStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
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

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No reservations found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Reservation Details</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedReservation.code}</p>
              </div>
              <button
                onClick={() => setSelectedReservation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${selectedReservation.statusColor}`}>
                  {selectedReservation.status}
                </span>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedReservation.qrStatus === 'Valid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  QR: {selectedReservation.qrStatus}
                </span>
              </div>

              {/* User Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">User Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Name</span>
                    <span className="text-sm font-medium text-gray-900">{selectedReservation.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium text-gray-900">{selectedReservation.email}</span>
                  </div>
                </div>
              </div>

              {/* Reservation Schedule */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Schedule</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm font-medium text-gray-900">{selectedReservation.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time</span>
                    <span className="text-sm font-medium text-gray-900">{selectedReservation.time}</span>
                  </div>
                </div>
              </div>

              {/* Rescheduled Information */}
              {selectedReservation.status === 'Rescheduled' && selectedReservation.rescheduledDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Rescheduled Information</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700 font-medium">Rescheduled On</span>
                      <span className="text-sm font-medium text-purple-900">{selectedReservation.rescheduledDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled Information */}
              {selectedReservation.status === 'Cancelled' && selectedReservation.cancelledDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Cancellation Information</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">Cancelled On</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReservation.cancelledDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Workspace Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Workspace</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Preferred Workspace</span>
                    <span className="text-sm font-medium text-gray-900">{selectedReservation.workspace}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600">Alternative Spaces</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{selectedReservation.alternatives}</span>
                  </div>
                </div>
              </div>

              {/* Reservation Reference */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Reference</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reservation Code</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{selectedReservation.code}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedReservation(null)}
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
