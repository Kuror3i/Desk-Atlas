import { useState } from 'react';
import { Monitor, Circle, Edit2, Check, X } from 'lucide-react';

type KioskStatus = 'Online' | 'Offline' | 'Under Maintenance' | 'Needs Attention';

interface Kiosk {
  id: string;
  name: string;
  location: string;
  status: KioskStatus;
  lastUpdated: string;
  reportedBy: string;
  note: string;
}

export function KioskStatusScreen() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([
    {
      id: 'K-001',
      name: 'Kiosk 1',
      location: 'Main Entrance',
      status: 'Online',
      lastUpdated: '2 minutes ago',
      reportedBy: 'Staff User',
      note: '',
    },
    {
      id: 'K-002',
      name: 'Kiosk 2',
      location: 'Second Floor',
      status: 'Under Maintenance',
      lastUpdated: '15 minutes ago',
      reportedBy: 'Staff User',
      note: 'Touch screen not responding',
    },
    {
      id: 'K-003',
      name: 'Kiosk 3',
      location: 'Lobby',
      status: 'Online',
      lastUpdated: '1 minute ago',
      reportedBy: 'Staff User',
      note: '',
    },
    {
      id: 'K-004',
      name: 'Kiosk 4',
      location: 'Meeting Room Area',
      status: 'Online',
      lastUpdated: '5 minutes ago',
      reportedBy: 'Staff User',
      note: '',
    },
    {
      id: 'K-005',
      name: 'Kiosk 5',
      location: 'Private Office Wing',
      status: 'Offline',
      lastUpdated: '30 minutes ago',
      reportedBy: 'Staff User',
      note: 'Network connection lost',
    },
  ]);

  const [editingKiosk, setEditingKiosk] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<KioskStatus>('Online');
  const [editNote, setEditNote] = useState('');

  const handleEditStart = (kiosk: Kiosk) => {
    setEditingKiosk(kiosk.id);
    setEditStatus(kiosk.status);
    setEditNote(kiosk.note);
  };

  const handleSave = (kioskId: string) => {
    setKiosks(
      kiosks.map((k) =>
        k.id === kioskId
          ? {
              ...k,
              status: editStatus,
              note: editNote,
              lastUpdated: 'Just now',
              reportedBy: 'Staff User',
            }
          : k
      )
    );
    setEditingKiosk(null);
    setEditNote('');
  };

  const handleCancel = () => {
    setEditingKiosk(null);
    setEditNote('');
  };

  const getStatusColor = (status: KioskStatus) => {
    switch (status) {
      case 'Online':
        return 'text-green-600';
      case 'Offline':
        return 'text-red-600';
      case 'Under Maintenance':
        return 'text-orange-600';
      case 'Needs Attention':
        return 'text-yellow-600';
    }
  };

  const getStatusBadgeColor = (status: KioskStatus) => {
    switch (status) {
      case 'Online':
        return 'bg-green-100 text-green-800';
      case 'Offline':
        return 'bg-red-100 text-red-800';
      case 'Under Maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'Needs Attention':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const statusOptions: KioskStatus[] = ['Online', 'Offline', 'Under Maintenance', 'Needs Attention'];

  const statusCounts = {
    online: kiosks.filter((k) => k.status === 'Online').length,
    offline: kiosks.filter((k) => k.status === 'Offline').length,
    maintenance: kiosks.filter((k) => k.status === 'Under Maintenance').length,
    needsAttention: kiosks.filter((k) => k.status === 'Needs Attention').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Kiosk Status</h1>
        <p className="text-gray-600 mt-1">Monitor and report kiosk/tablet operational status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Circle className="w-3 h-3 text-green-500 fill-current" />
            <p className="text-sm text-gray-600">Online</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{statusCounts.online}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Circle className="w-3 h-3 text-orange-500 fill-current" />
            <p className="text-sm text-gray-600">Maintenance</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{statusCounts.maintenance}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Circle className="w-3 h-3 text-yellow-500 fill-current" />
            <p className="text-sm text-gray-600">Needs Attention</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{statusCounts.needsAttention}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Circle className="w-3 h-3 text-red-500 fill-current" />
            <p className="text-sm text-gray-600">Offline</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{statusCounts.offline}</p>
        </div>
      </div>

      {/* Kiosk List */}
      <div className="space-y-4">
        {kiosks.map((kiosk) => (
          <div key={kiosk.id} className="bg-white rounded-lg border border-gray-200 p-6">
            {editingKiosk === kiosk.id ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Monitor className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{kiosk.name}</h3>
                    <p className="text-sm text-gray-600">{kiosk.location}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as KioskStatus)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689]"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Add a short note about the issue or status..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave(kiosk.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#009689] text-white rounded-lg hover:bg-[#00796b] transition-colors font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-gray-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{kiosk.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(kiosk.status)}`}>
                        {kiosk.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{kiosk.location}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Last Updated</p>
                        <p className="text-gray-900 font-medium">{kiosk.lastUpdated}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reported By</p>
                        <p className="text-gray-900 font-medium">{kiosk.reportedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kiosk ID</p>
                        <p className="text-gray-900 font-medium font-mono">{kiosk.id}</p>
                      </div>
                    </div>

                    {kiosk.note && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Note</p>
                        <p className="text-sm text-gray-700">{kiosk.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleEditStart(kiosk)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#e0f2f1] text-[#009689] rounded-lg hover:bg-[#b2dfdb] transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Update Status
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-[#e0f2f1] border border-[#b2dfdb] rounded-lg p-6">
        <h3 className="font-semibold text-[#004d40] mb-2">About Kiosk Status Reporting</h3>
        <p className="text-sm text-[#00695c] mb-3">
          This feature allows staff to report and track the operational status of kiosk and tablet devices
          throughout the workspace. Updates made here are visible to both staff and admin users.
        </p>
        <div className="space-y-2 text-sm text-[#00695c]">
          <div className="flex items-start gap-2">
            <Circle className="w-3 h-3 text-green-600 fill-current mt-1 flex-shrink-0" />
            <div>
              <span className="font-medium">Online:</span> Kiosk is functioning normally and available for use
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Circle className="w-3 h-3 text-orange-600 fill-current mt-1 flex-shrink-0" />
            <div>
              <span className="font-medium">Under Maintenance:</span> Kiosk is being serviced or repaired
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Circle className="w-3 h-3 text-yellow-600 fill-current mt-1 flex-shrink-0" />
            <div>
              <span className="font-medium">Needs Attention:</span> Kiosk has a minor issue that needs review
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Circle className="w-3 h-3 text-red-600 fill-current mt-1 flex-shrink-0" />
            <div>
              <span className="font-medium">Offline:</span> Kiosk is not responding or unavailable
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
