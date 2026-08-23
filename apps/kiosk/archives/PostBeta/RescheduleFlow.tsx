import { useState } from 'react';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { WorkspaceMap, type Desk } from './WorkspaceMap';
import { CalendlyStyleReservation } from './CalendlyStyleReservation';

interface RescheduleFlowProps {
  originalBooking: {
    deskId: string;
    deskName: string;
    total: number;
    bookingId?: string;
    reservationId?: string;
  };
  allDesks: Desk[];
  onBack: () => void;
  onComplete: () => void;
}

export function RescheduleFlow({ originalBooking, allDesks, onBack, onComplete }: RescheduleFlowProps) {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [showReservationFlow, setShowReservationFlow] = useState(false);

  // Get original desk to find its zone
  const originalDesk = allDesks.find(d => d.id === originalBooking.deskId);

  // Filter desks by same zone for similar pricing
  const eligibleDesks = allDesks.filter(desk => {
    if (!originalDesk) return false;

    // Must be in same zone
    return (
      desk.zone === originalDesk.zone &&
      (desk.status === 'available' || desk.status === 'pending')
    );
  });

  const handleDeskClick = (desk: Desk) => {
    setSelectedDesk(desk);
  };

  const handleProceedToReschedule = () => {
    setShowReservationFlow(true);
  };

  if (showReservationFlow && selectedDesk) {
    return (
      <CalendlyStyleReservation
        desk={selectedDesk}
        allDesks={allDesks}
        onBack={onComplete}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={selectedDesk ? () => setSelectedDesk(null) : onBack}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Reschedule Booking</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!selectedDesk ? (
          <>
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Select a new workspace</p>
                  <p className="text-sm text-blue-800">
                    You can reschedule to any workspace in {originalDesk?.zone} to maintain similar pricing.
                    Available spaces are shown below.
                  </p>
                </div>
              </div>
            </div>

            {/* Original Booking Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">
                Current booking: <span className="font-medium">{originalBooking.deskName}</span>
              </p>
            </div>

            {/* Interactive Map */}
            <WorkspaceMap
              desks={eligibleDesks}
              onDeskClick={handleDeskClick}
              highlightedDeskIds={[originalBooking.deskId]}
            />

            {eligibleDesks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No eligible workspaces available for rescheduling.</p>
              </div>
            )}
          </>
        ) : (
          /* Desk Confirmation */
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-3xl font-semibold mb-6 text-center">Confirm New Space</h2>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Space</span>
                  <span className="font-medium">{selectedDesk.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Zone</span>
                  <span className="font-medium">{selectedDesk.zone}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium capitalize">{selectedDesk.type.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between py-2 border-t pt-4">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-medium">₱{selectedDesk.hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Day Rate</span>
                  <span className="font-medium">₱{selectedDesk.dayRate}/day</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToReschedule}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Proceed to Select Date & Time
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
