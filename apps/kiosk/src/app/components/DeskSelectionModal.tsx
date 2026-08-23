import { X } from 'lucide-react';
import type { Desk } from './WorkspaceMap';

interface DeskSelectionModalProps {
  desk: Desk;
  onClose: () => void;
  onBookNow: () => void;
  onBookReservation: () => void;
}

export function DeskSelectionModal({ desk, onClose, onBookNow, onBookReservation }: DeskSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-semibold mb-6">Space Details</h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Name</span>
            <span className="font-medium text-lg">{desk.name}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Type</span>
            <span className="font-medium text-lg capitalize">{desk.type.replace('-', ' ')}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Zone</span>
            <span className="font-medium text-lg">{desk.zone}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-lg capitalize text-green-600">{desk.status}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Hourly Rate</span>
            <span className="font-medium text-lg">₱{desk.hourlyRate}/hr</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Day Rate</span>
            <span className="font-medium text-lg">₱{desk.dayRate}/day</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onBookNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl text-lg font-medium transition-colors"
          >
            Book Now
          </button>

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
