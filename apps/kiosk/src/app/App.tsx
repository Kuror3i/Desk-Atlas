import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { WorkspaceMap, type Desk } from './components/WorkspaceMap';
import { DeskScheduleModal } from './components/DeskScheduleModal';
import { BookNowFlow } from './components/BookNowFlow';
import { CalendlyStyleReservation } from './components/CalendlyStyleReservation';
import { QRScanFlow } from './components/QRScanFlow';
import { ReferenceCodeFlow } from './components/ReferenceCodeFlow';
import { fetchPublishedMap } from './lib/publishedMapApi';
import type { Floor } from '@deskatlas/domain';

// Mock workspace data
const fallbackDesks: Desk[] = [
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
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [flowState, setFlowState] = useState<FlowState>('map');
  const [desks, setDesks] = useState<Desk[]>(fallbackDesks);
  const [mapLoadState, setMapLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState('');
  const [mapReloadToken, setMapReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setMapLoadState('loading');
    setMapError('');

    fetchPublishedMap(selectedFloorId || undefined)
      .then(({ floors: nextFloors, published }) => {
        if (!isMounted) return;
        setFloors(nextFloors);
        setSelectedFloorId((current) => current || published.floor.id);
        const publishedDesks = mapPublishedFloorMapToDesks(published);
        setDesks(publishedDesks);
        setSelectedDesk(null);
        setMapLoadState('ready');
      })
      .catch((error) => {
        if (!isMounted) return;
        console.warn('Unable to load kiosk published map', error);
        setMapLoadState('error');
        setMapError(error instanceof Error ? error.message : 'Unable to load the kiosk workspace map.');
      });

    return () => {
      isMounted = false;
    };
  }, [mapReloadToken, selectedFloorId]);

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
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 mb-1">Floor</label>
                <select
                  value={selectedFloorId}
                  onChange={(event) => setSelectedFloorId(event.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#009689]"
                  disabled={floors.length === 0 || mapLoadState === 'loading'}
                >
                  {floors.length === 0 ? (
                    <option value="">Default Floor</option>
                  ) : (
                    floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
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
            {mapLoadState === 'loading' && (
              <div className="bg-white rounded-2xl border border-teal-200 p-8 text-center">
                <p className="text-lg font-semibold text-teal-900">Loading published workspace map...</p>
                <p className="text-sm text-teal-700 mt-2">DeskAtlas is fetching the latest kiosk floor geometry.</p>
              </div>
            )}

            {mapLoadState === 'error' && (
              <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4">
                <div>
                  <p className="text-lg font-semibold text-red-900">Published map unavailable</p>
                  <p className="text-sm text-red-700 mt-2">{mapError}</p>
                </div>
                <button
                  onClick={() => setMapReloadToken((current) => current + 1)}
                  className="px-5 py-3 rounded-xl text-white font-medium"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  Retry Map Load
                </button>
              </div>
            )}

            {mapLoadState === 'ready' && desks.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-lg font-semibold text-gray-900">No published workspaces on this floor</p>
                <p className="text-sm text-gray-600 mt-2">
                  Select another floor or wait for Admin to publish workspace geometry for this floor.
                </p>
              </div>
            )}

            {mapLoadState === 'ready' && desks.length > 0 && (
              <WorkspaceMap
                desks={desks}
                onDeskClick={handleDeskClick}
                selectedDeskId={selectedDesk?.id}
              />
            )}
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
        <BookNowFlow desk={selectedDesk} allDesks={desks} onBack={handleBackToMap} />
      )}

      {flowState === 'book-reservation' && selectedDesk && (
        <CalendlyStyleReservation
          desk={selectedDesk}
          allDesks={desks}
          onBack={handleBackToMap}
        />
      )}

      {flowState === 'qr-scan' && (
        <QRScanFlow
          onBack={handleBackToMap}
          allDesks={desks}
          onSwitchToReferenceCode={handleReferenceCode}
        />
      )}

      {flowState === 'reference-code' && (
        <ReferenceCodeFlow onBack={handleBackToMap} allDesks={desks} />
      )}
    </div>
  );
}

function mapPublishedFloorMapToDesks(
  published: Awaited<ReturnType<typeof fetchPublishedMap>>["published"]
): Desk[] {
  return published.elements
    .filter((element) => element.elementRole === 'WORKSPACE' && element.workspace)
    .map((element) => {
      const workspace = element.workspace!;
      return {
        id: workspace.instanceCode,
        workspaceInstanceId: workspace.workspaceInstanceId,
        name: workspace.displayName,
        type: mapDeskType(element.elementType),
        zone: getDeskZone(element, workspace.instanceCode),
        status: workspace.isBookable ? 'available' : 'reserved',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        hourlyRate: workspace.rateAmount,
        dayRate: workspace.rateAmount * 8,
      };
    });
}

function mapDeskType(elementType: string): Desk['type'] {
  if (elementType === 'meeting-room') return 'meeting-room';
  if (elementType === 'phone-booth') return 'phone-booth';
  return 'desk';
}

function getDeskZone(
  element: Awaited<ReturnType<typeof fetchPublishedMap>>["published"]["elements"][number],
  instanceCode: string
): string {
  if (typeof element.style.zone === 'string' && element.style.zone.length > 0) {
    return element.style.zone;
  }

  if (element.elementType === 'meeting-room' || element.elementType === 'phone-booth') {
    return 'Meeting Rooms';
  }

  return instanceCode.toUpperCase().startsWith('B') ? 'Zone B' : 'Zone A';
}
