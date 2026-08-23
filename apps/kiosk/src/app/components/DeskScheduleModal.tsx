import { X } from 'lucide-react';
import type { Desk } from './WorkspaceMap';

interface DeskScheduleModalProps {
  desk: Desk;
  onClose: () => void;
  onBookNow: () => void;
  onBookReservation: () => void;
}

// Mock schedule data
interface ScheduleItem {
  date: string;
  timeSlot: string;
  duration: number;
  userName: string;
  status: 'active' | 'upcoming' | 'pending';
  paymentStatus?: 'paid' | 'pending-cash';
}

const mockSchedule: ScheduleItem[] = [
  {
    date: '2026-05-03',
    timeSlot: '09:00',
    duration: 4,
    userName: 'John Doe',
    status: 'active',
    paymentStatus: 'paid'
  },
  {
    date: '2026-05-04',
    timeSlot: '14:00',
    duration: 2,
    userName: 'Jane Smith',
    status: 'pending',
    paymentStatus: 'pending-cash'
  },
  {
    date: '2026-05-05',
    timeSlot: '10:00',
    duration: 8,
    userName: 'Bob Johnson',
    status: 'upcoming',
    paymentStatus: 'paid'
  },
  {
    date: '2026-05-06',
    timeSlot: '09:00',
    duration: 4,
    userName: 'Alice Cooper',
    status: 'pending',
    paymentStatus: 'pending-cash'
  }
];

export function DeskScheduleModal({ desk, onClose, onBookNow, onBookReservation }: DeskScheduleModalProps) {
  const isAvailableNow = desk.status === 'available' || desk.status === 'pending';
  const hasHourlyBooking = mockSchedule.some(s => s.status === 'active' && s.duration < 8);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-semibold mb-6">Space Details & Schedule</h2>

        {/* Desk Details */}
        <div className="space-y-4 mb-8 pb-8 border-b">
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Name</span>
            <span className="font-medium text-lg">{desk.name}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Type</span>
            <span className="font-medium text-lg capitalize">{desk.type.replace('-', ' ')}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Zone</span>
            <span className="font-medium text-lg">{desk.zone}</span>
          </div>

          <div className="py-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Current Status</span>
              <span className={`font-medium text-lg capitalize px-3 py-1 rounded-full ${
                desk.status === 'available' ? 'bg-green-100 text-green-700' :
                desk.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                desk.status === 'reserved' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {desk.status}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Pricing</span>
            <div className="text-right">
              <div className="font-medium text-lg">₱{desk.hourlyRate}/hr</div>
              <div className="text-sm text-gray-500">₱{desk.dayRate}/day</div>
            </div>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="space-y-3">
          {isAvailableNow && (
            <button
              onClick={onBookNow}
              className="w-full text-white py-4 px-6 rounded-xl text-lg font-medium transition-colors"
              style={{ backgroundColor: '#009689' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Book Now
            </button>
          )}

          {!isAvailableNow && hasHourlyBooking && (
            <button
              onClick={onBookNow}
              className="w-full text-white py-4 px-6 rounded-xl text-lg font-medium transition-colors"
              style={{ backgroundColor: '#009689' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Book Available Time Today
            </button>
          )}

          <button
            onClick={onBookReservation}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl text-lg font-medium transition-colors"
          >
            Book Reservation
          </button>
        </div>
      </div>
    </div>
  );
}
