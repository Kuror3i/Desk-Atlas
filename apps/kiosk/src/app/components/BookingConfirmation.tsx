import { Check, AlertTriangle } from 'lucide-react';

interface BookingConfirmationProps {
  isAlternativeAssigned: boolean;
  primaryDesk: string;
  assignedDesk: string;
  onClose: () => void;
}

export function BookingConfirmation({ isAlternativeAssigned, primaryDesk, assignedDesk, onClose }: BookingConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center">
          {isAlternativeAssigned ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-3xl font-semibold mb-4">Alternative Desk Assigned</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-left">
                <p className="text-yellow-900 mb-4">
                  Your primary choice <span className="font-semibold">{primaryDesk}</span> has been confirmed by another user who completed their cash payment.
                </p>
                <p className="text-yellow-900">
                  You have been automatically assigned to your alternative choice:
                </p>
                <p className="text-2xl font-bold text-yellow-900 mt-2 text-center">{assignedDesk}</p>
              </div>
              <p className="text-gray-600 mb-6">
                Your reservation is confirmed with the same date, time, and duration at the alternative desk.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-semibold mb-4">Reservation Confirmed!</h2>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <p className="text-green-900 mb-2">
                  Your primary choice has been confirmed:
                </p>
                <p className="text-2xl font-bold text-green-900">{assignedDesk}</p>
              </div>
              <p className="text-gray-600 mb-6">
                Your workspace is ready and confirmed.
              </p>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              ✉️ A confirmation email with all details has been sent to your registered email address.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
