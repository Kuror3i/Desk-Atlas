import { useState } from 'react';
import { Search, Filter, Eye, X } from 'lucide-react';
import { RESERVATION_STATUS, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_BADGE } from '../lib/reservationStatus';

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

  const reservations: Reservation[] = [
    {
      code: 'RES-2026-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      date: 'May 15, 2026',
      time: '9:00 AM - 5:00 PM',
      workspace: 'Desk A-12',
      alternatives: 'Desk A-10, Desk A-15',
      status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CHECKED_IN],
      statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.CHECKED_IN],
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
      status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CONFIRMED],
      statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.CONFIRMED],
      qrStatus: 'Valid',
    },
  ];

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.workspace.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || (filterStatus === 'today' && reservation.date === 'May 15, 2026');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reservations</h1>
        <p className="text-gray-600 mt-1">Monitor and manage reservation records</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
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

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-[#009689] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'today' ? 'bg-[#009689] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${reservation.statusColor}`}>{reservation.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${reservation.qrStatus === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{reservation.qrStatus}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => setSelectedReservation(reservation)} className="flex items-center gap-2 text-[#009689] hover:text-[#00796b] text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
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
