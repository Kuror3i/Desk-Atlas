import { useState } from 'react';
import { Search, Filter, Download, Calendar, Clock, DollarSign, User, Edit2, X } from 'lucide-react';
import {
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_BADGE,
  type ReservationStatus,
} from '../../lib/reservationStatus';

// Status values now match the single canonical model shared by every
// DeskAtlas interface (Feature Scope and UCD Review, Section 9). The
// previous local type used ad hoc labels ('pending', 'rescheduled') that
// did not exist on the Customer Website or Kiosk, which is exactly the
// inconsistency the review's Appendix B review question flags.
type Reservation = {
  id: string;
  user: string;
  email: string;
  space: string;
  date: string;
  time: string;
  duration: string;
  amount: string;
  status: ReservationStatus;
  refunded?: boolean;
};

const initialReservations: Reservation[] = [
  {
    id: 'RES-001',
    user: 'Sarah Johnson',
    email: 'sarah@example.com',
    space: 'Desk A5',
    date: 'May 11, 2026',
    time: '09:00 AM',
    duration: '4 hours',
    amount: '$20',
    status: RESERVATION_STATUS.CONFIRMED,
  },
  {
    id: 'RES-002',
    user: 'Mike Chen',
    email: 'mike@example.com',
    space: 'Meeting Room 2',
    date: 'May 11, 2026',
    time: '02:00 PM',
    duration: '2 hours',
    amount: '$50',
    status: RESERVATION_STATUS.PENDING_PAYMENT,
  },
  {
    id: 'RES-003',
    user: 'Emma Davis',
    email: 'emma@example.com',
    space: 'Desk B12',
    date: 'May 10, 2026',
    time: '10:00 AM',
    duration: 'Full Day',
    amount: '$45',
    status: RESERVATION_STATUS.COMPLETED,
  },
  {
    id: 'RES-004',
    user: 'James Wilson',
    email: 'james@example.com',
    space: 'Phone Booth 1',
    date: 'May 12, 2026',
    time: '11:00 AM',
    duration: '1 hour',
    amount: '$8',
    status: RESERVATION_STATUS.CONFIRMED,
  },
  {
    id: 'RES-005',
    user: 'Lisa Brown',
    email: 'lisa@example.com',
    space: 'Desk A12',
    date: 'May 9, 2026',
    time: '09:00 AM',
    duration: '8 hours',
    amount: '$40',
    status: RESERVATION_STATUS.CANCELLED,
    refunded: false,
  },
  {
    id: 'RES-006',
    user: 'David Park',
    email: 'david@example.com',
    space: 'Meeting Room 1',
    date: 'May 13, 2026',
    time: '03:00 PM',
    duration: '3 hours',
    amount: '$75',
    status: RESERVATION_STATUS.CONFIRMED, // rescheduling is an action, not a status (Review Section 9)
  },
  {
    id: 'RES-007',
    user: 'Anna Martinez',
    email: 'anna@example.com',
    space: 'Desk B5',
    date: 'May 8, 2026',
    time: '10:00 AM',
    duration: '6 hours',
    amount: '$30',
    status: RESERVATION_STATUS.CANCELLED,
    refunded: true,
  },
];

// Dot color kept local to this screen; the badge background/text now comes
// from RESERVATION_STATUS_BADGE so the same status always renders with the
// same colors on every DeskAtlas interface.
const statusDot: Record<ReservationStatus, string> = {
  [RESERVATION_STATUS.PENDING_PAYMENT]: 'bg-amber-500',
  [RESERVATION_STATUS.PAYMENT_UNDER_REVIEW]: 'bg-blue-500',
  [RESERVATION_STATUS.CONFIRMED]: 'bg-[#009689]',
  [RESERVATION_STATUS.CHECKED_IN]: 'bg-green-500',
  [RESERVATION_STATUS.COMPLETED]: 'bg-gray-500',
  [RESERVATION_STATUS.CANCELLED]: 'bg-red-500',
  [RESERVATION_STATUS.EXPIRED]: 'bg-orange-500',
};

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.space.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleMarkRefunded = (reservation: Reservation, refundStatus: boolean) => {
    setReservations(reservations.map(res =>
      res.id === reservation.id
        ? { ...res, refunded: refundStatus }
        : res
    ));
    alert(`Reservation ${reservation.id} marked as ${refundStatus ? 'Refunded' : 'Not Refunded'}`);
    setShowRefundModal(false);
    setSelectedReservation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            >
              <option value="all">All Status</option>
              {Object.values(RESERVATION_STATUS).map((status) => (
                <option key={status} value={status}>
                  {RESERVATION_STATUS_LABEL[status]}
                </option>
              ))}
            </select>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReservations.map((reservation, index) => (
          <div
            key={`reservation-${index}-${reservation.id}`}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
              {/* ID & Status */}
              <div className="lg:w-32 shrink-0">
                <p className="text-sm text-gray-600 mb-1">Booking ID</p>
                <p className="text-gray-900 font-semibold mb-2">{reservation.id}</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${RESERVATION_STATUS_BADGE[reservation.status]}`}>
                  <div className={`w-2 h-2 rounded-full ${statusDot[reservation.status]}`} />
                  <span className="text-xs font-medium">{RESERVATION_STATUS_LABEL[reservation.status]}</span>
                </div>
              </div>

              {/* User */}
              <div className="flex-1 lg:border-l lg:border-gray-200 lg:pl-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#009689] to-[#007d6f] rounded-lg flex items-center justify-center text-white font-semibold">
                    {reservation.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900 font-medium">{reservation.user}</p>
                    </div>
                    <p className="text-sm text-gray-600">{reservation.email}</p>
                  </div>
                </div>
              </div>

              {/* Space & Schedule */}
              <div className="lg:w-48 lg:border-l lg:border-gray-200 lg:pl-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-gray-900 font-medium">{reservation.space}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">{reservation.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">{reservation.time} - {reservation.duration}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="lg:w-32 lg:border-l lg:border-gray-200 lg:pl-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{reservation.amount}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Total Amount</p>
                {reservation.status === RESERVATION_STATUS.CANCELLED && (
                  <div className="mt-2">
                    {reservation.refunded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        ✓ Refunded
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowRefundModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium hover:bg-orange-100 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Mark Refunded
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReservations.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No reservations found</p>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Update Refund Status</h3>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedReservation(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  Mark this cancelled reservation as refunded to keep track of processed refunds.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Reservation ID</p>
                <p className="text-gray-900 font-medium">{selectedReservation.id}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="text-gray-900 font-medium">{selectedReservation.user}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-gray-900 font-medium">{selectedReservation.amount}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedReservation(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkRefunded(selectedReservation, true)}
                className="flex-1 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Mark as Refunded
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
