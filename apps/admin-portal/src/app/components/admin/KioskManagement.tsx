import { useState } from 'react';
import { MonitorSmartphone, Edit2, X } from 'lucide-react';

type KioskAvailability = 'Online' | 'Offline' | 'Under Maintenance';
type AdminActionStatus = 'No Action Yet' | 'Action Noted' | 'Under Maintenance' | 'Resolved';
type DisplayStatus = 'Online' | 'Needs Attention' | 'Under Maintenance' | 'Offline';

type Kiosk = {
  id: string;
  name: string;
  location: string;
  displayStatus: DisplayStatus;
  availability: KioskAvailability;
  adminActionStatus: AdminActionStatus;
  lastUpdated: string;
  reportedBy: string;
  staffNote?: string;
  adminRemarks?: string;
};

const mockKiosks: Kiosk[] = [
  {
    id: 'K-001',
    name: 'Kiosk 1',
    location: 'Main Entrance',
    displayStatus: 'Online',
    availability: 'Online',
    adminActionStatus: 'No Action Yet',
    lastUpdated: '2 minutes ago',
    reportedBy: 'Staff User',
  },
  {
    id: 'K-002',
    name: 'Kiosk 2',
    location: 'Second Floor',
    displayStatus: 'Under Maintenance',
    availability: 'Under Maintenance',
    adminActionStatus: 'Under Maintenance',
    lastUpdated: '15 minutes ago',
    reportedBy: 'Staff User',
    staffNote: 'Touch screen not responding',
    adminRemarks: 'Technician dispatched',
  },
  {
    id: 'K-003',
    name: 'Kiosk 3',
    location: 'Reception Area',
    displayStatus: 'Online',
    availability: 'Online',
    adminActionStatus: 'Resolved',
    lastUpdated: '1 hour ago',
    reportedBy: 'Admin User',
  },
  {
    id: 'K-004',
    name: 'Kiosk 4',
    location: 'Third Floor',
    displayStatus: 'Online',
    availability: 'Online',
    adminActionStatus: 'No Action Yet',
    lastUpdated: '5 minutes ago',
    reportedBy: 'Staff User',
  },
  {
    id: 'K-005',
    name: 'Kiosk 5',
    location: 'Meeting Room Wing',
    displayStatus: 'Offline',
    availability: 'Offline',
    adminActionStatus: 'Action Noted',
    lastUpdated: '30 minutes ago',
    reportedBy: 'Staff User',
    staffNote: 'Power issue detected',
  },
];

const statusColors = {
  'Online': 'bg-green-100 text-green-700',
  'Needs Attention': 'bg-yellow-100 text-yellow-700',
  'Under Maintenance': 'bg-orange-100 text-orange-700',
  'Offline': 'bg-red-100 text-red-700',
};

const statusDotColors = {
  'Online': 'bg-green-500',
  'Needs Attention': 'bg-yellow-500',
  'Under Maintenance': 'bg-orange-500',
  'Offline': 'bg-red-500',
};

export function KioskManagement() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [updateForm, setUpdateForm] = useState({
    availability: 'Online' as KioskAvailability,
    adminActionStatus: 'No Action Yet' as AdminActionStatus,
    adminRemarks: '',
  });

  const stats = {
    online: mockKiosks.filter((k) => k.displayStatus === 'Online').length,
    needsAttention: mockKiosks.filter((k) => k.displayStatus === 'Needs Attention').length,
    underMaintenance: mockKiosks.filter((k) => k.displayStatus === 'Under Maintenance').length,
    offline: mockKiosks.filter((k) => k.displayStatus === 'Offline').length,
  };

  const handleUpdateClick = (kiosk: Kiosk) => {
    setSelectedKiosk(kiosk);
    setUpdateForm({
      availability: kiosk.availability,
      adminActionStatus: kiosk.adminActionStatus,
      adminRemarks: kiosk.adminRemarks || '',
    });
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = () => {
    alert(`Status updated for ${selectedKiosk?.name}`);
    setShowUpdateModal(false);
    setSelectedKiosk(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Kiosk Status</h2>
        <p className="text-gray-600 mt-1">Monitor and report kiosk/tablet operational status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${statusDotColors['Online']}`}></div>
            <p className="text-gray-700 font-medium">Online</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.online}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${statusDotColors['Under Maintenance']}`}></div>
            <p className="text-gray-700 font-medium">Maintenance</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.underMaintenance}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${statusDotColors['Needs Attention']}`}></div>
            <p className="text-gray-700 font-medium">Needs Attention</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.needsAttention}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${statusDotColors['Offline']}`}></div>
            <p className="text-gray-700 font-medium">Offline</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats.offline}</p>
        </div>
      </div>

      {/* Kiosk Status Cards */}
      <div className="space-y-4">
        {mockKiosks.map((kiosk) => (
          <div
            key={kiosk.id}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Left: Icon + Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <MonitorSmartphone className="w-6 h-6 text-gray-700" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{kiosk.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[kiosk.displayStatus]}`}>
                      {kiosk.displayStatus}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{kiosk.location}</p>

                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="text-gray-900 font-medium">{kiosk.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Reported By</p>
                      <p className="text-gray-900 font-medium">{kiosk.reportedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Kiosk ID</p>
                      <p className="text-gray-900 font-medium">{kiosk.id}</p>
                    </div>
                  </div>

                  {kiosk.staffNote && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-500 mb-1">Staff Note</p>
                      <p className="text-gray-900">{kiosk.staffNote}</p>
                    </div>
                  )}

                  {kiosk.adminRemarks && (
                    <div className="bg-blue-50 rounded-lg p-3 mt-2">
                      <p className="text-sm text-gray-500 mb-1">Admin Remarks</p>
                      <p className="text-gray-900">{kiosk.adminRemarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Update Button */}
              <button
                onClick={() => handleUpdateClick(kiosk)}
                className="flex items-center gap-2 px-4 py-2 bg-[#e6f7f5] text-[#009689] rounded-lg hover:bg-[#ccefeb] transition-colors font-medium ml-4"
              >
                <Edit2 className="w-4 h-4" />
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && selectedKiosk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update Kiosk Status</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-900 font-medium">{selectedKiosk.name}</p>
              <p className="text-sm text-gray-600">{selectedKiosk.location}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kiosk Availability
                </label>
                <select
                  value={updateForm.availability}
                  onChange={(e) => setUpdateForm({ ...updateForm, availability: e.target.value as KioskAvailability })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Action Status
                </label>
                <select
                  value={updateForm.adminActionStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, adminActionStatus: e.target.value as AdminActionStatus })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                >
                  <option value="No Action Yet">No Action Yet</option>
                  <option value="Action Noted">Action Noted</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Remarks (Optional)
                </label>
                <textarea
                  value={updateForm.adminRemarks}
                  onChange={(e) => setUpdateForm({ ...updateForm, adminRemarks: e.target.value })}
                  rows={3}
                  placeholder="Add notes or remarks..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUpdate}
                className="flex-1 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
