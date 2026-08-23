import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { WorkspaceMap, type Desk } from './components/WorkspaceMap';
import { DeskScheduleModal } from './components/DeskScheduleModal';
import { BookNowFlow } from './components/BookNowFlow';
import { CalendlyStyleReservation } from './components/CalendlyStyleReservation';
import { QRScanFlow } from './components/QRScanFlow';
import { ReferenceCodeFlow } from './components/ReferenceCodeFlow';

// Mock workspace data
const mockDesks: Desk[] = [
  // Zone A - Individual Desks (3 rows x 4 columns)
  { id: 'A1', name: 'A1', type: 'desk', zone: 'Zone A', status: 'available', x: 200, y: 100, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A2', name: 'A2', type: 'desk', zone: 'Zone A', status: 'available', x: 280, y: 100, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A3', name: 'A3', type: 'desk', zone: 'Zone A', status: 'pending', x: 360, y: 100, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A4', name: 'A4', type: 'desk', zone: 'Zone A', status: 'available', x: 440, y: 100, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },

  { id: 'A5', name: 'A5', type: 'desk', zone: 'Zone A', status: 'reserved', x: 200, y: 180, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A6', name: 'A6', type: 'desk', zone: 'Zone A', status: 'available', x: 280, y: 180, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A7', name: 'A7', type: 'desk', zone: 'Zone A', status: 'available', x: 360, y: 180, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A8', name: 'A8', type: 'desk', zone: 'Zone A', status: 'occupied', x: 440, y: 180, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },

  { id: 'A9', name: 'A9', type: 'desk', zone: 'Zone A', status: 'available', x: 200, y: 260, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A10', name: 'A10', type: 'desk', zone: 'Zone A', status: 'available', x: 280, y: 260, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A11', name: 'A11', type: 'desk', zone: 'Zone A', status: 'pending', x: 360, y: 260, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },
  { id: 'A12', name: 'A12', type: 'desk', zone: 'Zone A', status: 'available', x: 440, y: 260, width: 70, height: 70, hourlyRate: 5, dayRate: 40 },

  // Zone B - Individual Desks (3 rows x 4 columns)
  { id: 'B1', name: 'B1', type: 'desk', zone: 'Zone B', status: 'available', x: 830, y: 100, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B2', name: 'B2', type: 'desk', zone: 'Zone B', status: 'available', x: 910, y: 100, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B3', name: 'B3', type: 'desk', zone: 'Zone B', status: 'available', x: 990, y: 100, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B4', name: 'B4', type: 'desk', zone: 'Zone B', status: 'reserved', x: 1070, y: 100, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },

  { id: 'B5', name: 'B5', type: 'desk', zone: 'Zone B', status: 'available', x: 830, y: 180, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B6', name: 'B6', type: 'desk', zone: 'Zone B', status: 'available', x: 910, y: 180, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B7', name: 'B7', type: 'desk', zone: 'Zone B', status: 'available', x: 990, y: 180, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B8', name: 'B8', type: 'desk', zone: 'Zone B', status: 'available', x: 1070, y: 180, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },

  { id: 'B9', name: 'B9', type: 'desk', zone: 'Zone B', status: 'available', x: 830, y: 260, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B10', name: 'B10', type: 'desk', zone: 'Zone B', status: 'pending', x: 910, y: 260, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B11', name: 'B11', type: 'desk', zone: 'Zone B', status: 'pending', x: 990, y: 260, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },
  { id: 'B12', name: 'B12', type: 'desk', zone: 'Zone B', status: 'available', x: 1070, y: 260, width: 70, height: 70, hourlyRate: 6, dayRate: 45 },

  // Meeting Rooms
  { id: 'MR1', name: 'Meeting 1', type: 'meeting-room', zone: 'Meeting Rooms', status: 'available', x: 280, y: 450, width: 150, height: 110, hourlyRate: 25, dayRate: 180 },
  { id: 'MR2', name: 'Meeting 2', type: 'meeting-room', zone: 'Meeting Rooms', status: 'reserved', x: 445, y: 450, width: 150, height: 110, hourlyRate: 25, dayRate: 180 },
  { id: 'MR3', name: 'Meeting 3', type: 'meeting-room', zone: 'Meeting Rooms', status: 'available', x: 610, y: 450, width: 150, height: 110, hourlyRate: 30, dayRate: 220 },

  // Phone Booths
  { id: 'PB1', name: 'Booth 1', type: 'phone-booth', zone: 'Meeting Rooms', status: 'available', x: 775, y: 450, width: 150, height: 110, hourlyRate: 8, dayRate: 50 },
  { id: 'PB2', name: 'Booth 2', type: 'phone-booth', zone: 'Meeting Rooms', status: 'available', x: 940, y: 450, width: 150, height: 110, hourlyRate: 8, dayRate: 50 },
];

type FlowState = 'map' | 'book-now' | 'book-reservation' | 'qr-scan' | 'reference-code';

export default function App() {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [flowState, setFlowState] = useState<FlowState>('map');

  const handleDeskClick = (desk: Desk) => {
    setSelectedDesk(desk);
  };

  const handleCloseModal = () => {
    setSelectedDesk(null);
  };

  const handleBookNow = () => {
    setFlowState('book-now');
  };

  const handleBookReservation = () => {
    setFlowState('book-reservation');
  };

  const handleBackToMap = () => {
    setFlowState('map');
    setSelectedDesk(null);
  };

  const handleScanQR = () => {
    setFlowState('qr-scan');
  };

  const handleReferenceCode = () => {
    setFlowState('reference-code');
  };

  return (
    <div className="size-full bg-gray-100">
      {flowState === 'map' && (
        <>
          {/* Header */}
          <div className="h-24 bg-white border-b shadow-sm flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#009689' }}>
                DA
              </div>
              <div>
                <h1 className="text-2xl font-semibold">DeskAtlas</h1>
                <p className="text-sm text-gray-600">Self-Service Kiosk</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleScanQR}
                className="flex items-center gap-3 text-white px-6 py-3 rounded-xl transition-colors"
                style={{ backgroundColor: '#009689' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <QrCode className="w-6 h-6" />
                <span className="text-lg font-medium">Scan QR</span>
              </button>
              <button
                onClick={handleReferenceCode}
                className="flex items-center gap-3 text-white px-6 py-3 rounded-xl transition-colors"
                style={{ backgroundColor: '#009689' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span className="text-lg font-medium">Enter Reference Code</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="h-[calc(100%-6rem)] p-8">
            <WorkspaceMap
              desks={mockDesks}
              onDeskClick={handleDeskClick}
              selectedDeskId={selectedDesk?.id}
            />
          </div>

          {/* Desk Schedule Modal */}
          {selectedDesk && flowState === 'map' && (
            <DeskScheduleModal
              desk={selectedDesk}
              onClose={handleCloseModal}
              onBookNow={handleBookNow}
              onBookReservation={handleBookReservation}
            />
          )}
        </>
      )}

      {flowState === 'book-now' && selectedDesk && (
        <BookNowFlow desk={selectedDesk} allDesks={mockDesks} onBack={handleBackToMap} />
      )}

      {flowState === 'book-reservation' && selectedDesk && (
        <CalendlyStyleReservation
          desk={selectedDesk}
          allDesks={mockDesks}
          onBack={handleBackToMap}
        />
      )}

      {flowState === 'qr-scan' && (
        <QRScanFlow
          onBack={handleBackToMap}
          allDesks={mockDesks}
          onSwitchToReferenceCode={handleReferenceCode}
        />
      )}

      {flowState === 'reference-code' && (
        <ReferenceCodeFlow onBack={handleBackToMap} allDesks={mockDesks} />
      )}
    </div>
  );
}
