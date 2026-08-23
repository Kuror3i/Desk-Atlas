import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface ScheduleItem {
  date: string;
  timeSlot: string;
  duration: number;
  userName: string;
  status: 'active' | 'upcoming' | 'pending';
  paymentStatus?: 'paid' | 'pending-cash';
}

interface UpcomingScheduleViewProps {
  deskName: string;
  onContinue: () => void;
  buttonText?: string;
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

export function UpcomingScheduleView({ deskName, onContinue, buttonText = 'Continue to Booking' }: UpcomingScheduleViewProps) {
  const hasPendingBookings = mockSchedule.some(s => s.paymentStatus === 'pending-cash');

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold mb-2">Upcoming Schedule</h2>
        <p className="text-gray-600">Review current bookings for {deskName} before proceeding</p>
      </div>

      {hasPendingBookings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 mb-1">Pending Cash Payments</p>
              <p className="text-sm text-yellow-800">
                Some time slots below are pending cash payment confirmation. You can still book these times - if the pending user completes payment first, you'll automatically receive your alternative choice.
              </p>
            </div>
          </div>
        </div>
      )}

      {mockSchedule.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {mockSchedule.map((item, index) => {
            // Calculate end time
            const [startHour, startMinute] = item.timeSlot.split(':').map(Number);
            const endHour = startHour + item.duration;
            const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

            return (
              <div
                key={index}
                className={`p-5 rounded-xl border-2 ${
                  item.paymentStatus === 'pending-cash'
                    ? 'border-yellow-200 bg-yellow-50'
                    : item.status === 'active'
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 mt-0.5 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-lg">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.timeSlot} - {endTime}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Reserved for {item.duration} hour{item.duration !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 ${
                      item.paymentStatus === 'pending-cash'
                        ? 'bg-yellow-200 text-yellow-800'
                        : item.status === 'active'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-blue-200 text-blue-800'
                    }`}>
                      {item.paymentStatus === 'pending-cash' ? 'pending' : item.status}
                    </span>
                  </div>
                  {item.paymentStatus === 'pending-cash' && (
                    <p className="text-xs text-yellow-700 font-medium mt-1">
                      ⏳ Pending cash payment - Still available to book
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No upcoming bookings for this workspace</p>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full text-white py-4 rounded-xl text-lg font-medium transition-colors"
        style={{ backgroundColor: '#009689' }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        {buttonText}
      </button>
    </div>
  );
}
