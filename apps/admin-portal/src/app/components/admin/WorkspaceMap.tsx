import { useState } from 'react';
import { MapPin, Info, X } from 'lucide-react';

type WorkspaceStatus = 'available' | 'pending' | 'reserved' | 'occupied';

type Workspace = {
  id: string;
  label: string;
  zone: string;
  status: WorkspaceStatus;
  type: 'desk' | 'meeting-room' | 'booth';
};

const mockWorkspaces: Workspace[] = [
  // Zone A
  { id: 'A1', label: 'A1', zone: 'Zone A', status: 'available', type: 'desk' },
  { id: 'A2', label: 'A2', zone: 'Zone A', status: 'available', type: 'desk' },
  { id: 'A3', label: 'A3', zone: 'Zone A', status: 'pending', type: 'desk' },
  { id: 'A4', label: 'A4', zone: 'Zone A', status: 'available', type: 'desk' },
  { id: 'A5', label: 'A5', zone: 'Zone A', status: 'reserved', type: 'desk' },
  { id: 'A6', label: 'A6', zone: 'Zone A', status: 'available', type: 'desk' },
  { id: 'A7', label: 'A7', zone: 'Zone A', status: 'pending', type: 'desk' },
  { id: 'A8', label: 'A8', zone: 'Zone A', status: 'occupied', type: 'desk' },
  { id: 'A9', label: 'A9', zone: 'Zone A', status: 'available', type: 'desk' },
  { id: 'A10', label: 'A10', zone: 'Zone A', status: 'available', type: 'desk' },
  { id: 'A11', label: 'A11', zone: 'Zone A', status: 'pending', type: 'desk' },
  { id: 'A12', label: 'A12', zone: 'Zone A', status: 'available', type: 'desk' },

  // Zone B
  { id: 'B1', label: 'B1', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B2', label: 'B2', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B3', label: 'B3', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B4', label: 'B4', zone: 'Zone B', status: 'reserved', type: 'desk' },
  { id: 'B5', label: 'B5', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B6', label: 'B6', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B7', label: 'B7', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B8', label: 'B8', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B9', label: 'B9', zone: 'Zone B', status: 'available', type: 'desk' },
  { id: 'B10', label: 'B10', zone: 'Zone B', status: 'pending', type: 'desk' },
  { id: 'B11', label: 'B11', zone: 'Zone B', status: 'pending', type: 'desk' },
  { id: 'B12', label: 'B12', zone: 'Zone B', status: 'available', type: 'desk' },

  // Meeting Rooms
  { id: 'M1', label: 'Meeting 1', zone: 'Meeting Rooms', status: 'available', type: 'meeting-room' },
  { id: 'M2', label: 'Meeting 2', zone: 'Meeting Rooms', status: 'reserved', type: 'meeting-room' },
  { id: 'M3', label: 'Meeting 3', zone: 'Meeting Rooms', status: 'available', type: 'meeting-room' },
  { id: 'B1', label: 'Booth 1', zone: 'Meeting Rooms', status: 'available', type: 'booth' },
  { id: 'B2', label: 'Booth 2', zone: 'Meeting Rooms', status: 'available', type: 'booth' },
];

const statusColors = {
  available: 'bg-green-500 hover:bg-green-600',
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  reserved: 'bg-red-500 hover:bg-red-600',
  occupied: 'bg-gray-400 hover:bg-gray-500',
};

const statusLabels = {
  available: 'Available',
  pending: 'Pending',
  reserved: 'Reserved',
  occupied: 'Occupied',
};

export function WorkspaceMap() {
  const [showRecommended, setShowRecommended] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  const zoneAWorkspaces = mockWorkspaces.filter((w) => w.zone === 'Zone A');
  const zoneBWorkspaces = mockWorkspaces.filter((w) => w.zone === 'Zone B');
  const meetingRooms = mockWorkspaces.filter((w) => w.zone === 'Meeting Rooms');

  const stats = {
    available: mockWorkspaces.filter((w) => w.status === 'available').length,
    pending: mockWorkspaces.filter((w) => w.status === 'pending').length,
    reserved: mockWorkspaces.filter((w) => w.status === 'reserved').length,
    occupied: mockWorkspaces.filter((w) => w.status === 'occupied').length,
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workspace Map</h2>
        <p className="text-gray-600 mt-1">Monitor workspace availability and layout</p>
      </div>

      {/* Legend and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-700 font-medium">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-700 font-medium">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-700 font-medium">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400"></div>
              <span className="text-sm text-gray-700 font-medium">Occupied</span>
            </div>
          </div>

          <button
            onClick={() => setShowRecommended(!showRecommended)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showRecommended
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Show Recommended Workspaces
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <p className="text-sm text-gray-600">Reserved</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.reserved}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <p className="text-sm text-gray-600">Occupied</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.occupied}</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="space-y-12">
          {/* Zones */}
          <div className="grid grid-cols-2 gap-16">
            {/* Zone A */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Zone A</h3>
              <div className="grid grid-cols-4 gap-3">
                {zoneAWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceClick(workspace)}
                    className={`aspect-square rounded-lg ${statusColors[workspace.status]} text-white font-semibold text-sm flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
                      showRecommended && workspace.status === 'available' ? 'ring-4 ring-blue-400' : ''
                    }`}
                  >
                    {workspace.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone B */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Zone B</h3>
              <div className="grid grid-cols-4 gap-3">
                {zoneBWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceClick(workspace)}
                    className={`aspect-square rounded-lg ${statusColors[workspace.status]} text-white font-semibold text-sm flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
                      showRecommended && workspace.status === 'available' ? 'ring-4 ring-blue-400' : ''
                    }`}
                  >
                    {workspace.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting Rooms */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Meeting Rooms</h3>
            <div className="flex justify-center gap-4">
              {meetingRooms.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleWorkspaceClick(workspace)}
                  className={`w-32 h-20 rounded-lg ${statusColors[workspace.status]} text-white font-semibold text-sm flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
                    showRecommended && workspace.status === 'available' ? 'ring-4 ring-blue-400' : ''
                  }`}
                >
                  {workspace.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Details Modal */}
      {selectedWorkspace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${statusColors[selectedWorkspace.status].split(' ')[0]}`}></div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedWorkspace.label}</h3>
              </div>
              <button
                onClick={() => setSelectedWorkspace(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Zone</p>
                <p className="text-gray-900 font-medium">{selectedWorkspace.zone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <p className="text-gray-900 font-medium capitalize">{selectedWorkspace.type.replace('-', ' ')}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  selectedWorkspace.status === 'available' ? 'bg-green-100 text-green-700' :
                  selectedWorkspace.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedWorkspace.status === 'reserved' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {statusLabels[selectedWorkspace.status]}
                </span>
              </div>

              {selectedWorkspace.status === 'reserved' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Reserved by</p>
                      <p className="text-sm text-blue-700 mt-1">John Doe</p>
                      <p className="text-xs text-blue-600 mt-1">Today, 2:00 PM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedWorkspace.status === 'occupied' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Currently occupied</p>
                      <p className="text-sm text-gray-700 mt-1">Sarah Johnson</p>
                      <p className="text-xs text-gray-600 mt-1">Checked in at 9:30 AM</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedWorkspace(null)}
              className="w-full mt-6 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
