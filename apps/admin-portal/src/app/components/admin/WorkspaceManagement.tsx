import { useState } from 'react';
import { MapPin, Edit, Trash2, DoorOpen, Layers, X, Copy } from 'lucide-react';

type RecommendationTag = 'Near Window' | 'Near CR' | 'Near Reception' | 'Quiet Area' | 'Private Area' | 'Near Meeting Rooms';

type Space = {
  id: string;
  name: string;
  type: 'desk' | 'meeting-room' | 'phone-booth';
  zone: string;
  capacity?: number;
  hourlyRate: number;
  dayRate: number;
  status: 'available' | 'occupied' | 'maintenance';
  recommendations?: RecommendationTag[];
};

const initialSpaces: Space[] = [
  {
    id: 'A1',
    name: 'Desk A1',
    type: 'desk',
    zone: 'Zone A',
    hourlyRate: 5,
    dayRate: 40,
    status: 'available',
  },
  {
    id: 'A2',
    name: 'Desk A2',
    type: 'desk',
    zone: 'Zone A',
    hourlyRate: 5,
    dayRate: 40,
    status: 'occupied',
  },
  {
    id: 'MR1',
    name: 'Meeting Room 1',
    type: 'meeting-room',
    zone: 'Meeting Rooms',
    capacity: 6,
    hourlyRate: 25,
    dayRate: 180,
    status: 'available',
  },
  {
    id: 'MR2',
    name: 'Meeting Room 2',
    type: 'meeting-room',
    zone: 'Meeting Rooms',
    capacity: 8,
    hourlyRate: 30,
    dayRate: 220,
    status: 'occupied',
  },
  {
    id: 'PB1',
    name: 'Phone Booth 1',
    type: 'phone-booth',
    zone: 'Zone A',
    capacity: 1,
    hourlyRate: 8,
    dayRate: 50,
    status: 'available',
  },
  {
    id: 'B3',
    name: 'Desk B3',
    type: 'desk',
    zone: 'Zone B',
    hourlyRate: 6,
    dayRate: 45,
    status: 'maintenance',
  },
];

const typeColors = {
  desk: 'from-[#009689] to-cyan-500',
  'meeting-room': 'from-purple-500 to-pink-500',
  'phone-booth': 'from-orange-500 to-amber-500',
};

const statusConfig = {
  available: {
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  occupied: {
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  maintenance: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
};

const availableTags: RecommendationTag[] = [
  'Near Window',
  'Near CR',
  'Near Reception',
  'Quiet Area',
  'Private Area',
  'Near Meeting Rooms',
];

const availableZones = ['Zone A', 'Zone B', 'Meeting Rooms'];

export function WorkspaceManagement() {
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    zone: '',
    hourlyRate: 0,
    dayRate: 0,
    capacity: 0,
    status: 'available' as Space['status'],
    recommendations: [] as RecommendationTag[],
  });

  const filteredSpaces = spaces.filter(
    (space) => selectedType === 'all' || space.type === selectedType
  );

  const stats = {
    total: spaces.length,
    available: spaces.filter((s) => s.status === 'available').length,
    occupied: spaces.filter((s) => s.status === 'occupied').length,
    maintenance: spaces.filter((s) => s.status === 'maintenance').length,
  };

  const handleEditClick = (space: Space) => {
    setSelectedSpace(space);
    setEditForm({
      name: space.name,
      zone: space.zone,
      hourlyRate: space.hourlyRate,
      dayRate: space.dayRate,
      capacity: space.capacity || 0,
      status: space.status,
      recommendations: space.recommendations || [],
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedSpace) return;

    if (!editForm.name.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    setSpaces(spaces.map(space =>
      space.id === selectedSpace.id
        ? {
            ...space,
            name: editForm.name,
            zone: editForm.zone,
            hourlyRate: editForm.hourlyRate,
            dayRate: editForm.dayRate,
            capacity: editForm.capacity > 0 ? editForm.capacity : undefined,
            status: editForm.status,
            recommendations: editForm.recommendations,
          }
        : space
    ));

    alert(`Workspace "${editForm.name}" updated successfully!`);
    setShowEditModal(false);
    setSelectedSpace(null);
  };

  const handleDeleteClick = (space: Space) => {
    setSelectedSpace(space);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedSpace) return;

    setSpaces(spaces.filter(space => space.id !== selectedSpace.id));
    alert(`Workspace "${selectedSpace.name}" has been deleted successfully`);
    setShowDeleteConfirm(false);
    setSelectedSpace(null);
  };

  const handleDuplicateClick = (space: Space) => {
    const duplicateNumber = spaces.filter(s => s.name.startsWith(space.name)).length + 1;
    const newSpace: Space = {
      ...space,
      id: `${space.id}-copy-${Date.now()}`,
      name: `${space.name} (Copy ${duplicateNumber})`,
    };

    setSpaces([...spaces, newSpace]);

    // Immediately open edit modal for the duplicated space
    setSelectedSpace(newSpace);
    setEditForm({
      name: newSpace.name,
      zone: newSpace.zone,
      hourlyRate: newSpace.hourlyRate,
      dayRate: newSpace.dayRate,
      capacity: newSpace.capacity || 0,
      status: newSpace.status,
      recommendations: newSpace.recommendations || [],
    });
    setShowEditModal(true);
  };

  const toggleRecommendation = (tag: RecommendationTag) => {
    setEditForm(prev => ({
      ...prev,
      recommendations: prev.recommendations.includes(tag)
        ? prev.recommendations.filter(t => t !== tag)
        : [...prev.recommendations, tag],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Layers className="w-8 h-8 text-[#009689] mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Spaces</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <DoorOpen className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Available</p>
          <p className="text-3xl font-bold text-gray-900">{stats.available}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <MapPin className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Occupied</p>
          <p className="text-3xl font-bold text-gray-900">{stats.occupied}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Edit className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Maintenance</p>
          <p className="text-3xl font-bold text-gray-900">{stats.maintenance}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              selectedType === 'all'
                ? 'bg-[#009689] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Spaces
          </button>
          <button
            onClick={() => setSelectedType('desk')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              selectedType === 'desk'
                ? 'bg-[#009689] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Desks
          </button>
          <button
            onClick={() => setSelectedType('meeting-room')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              selectedType === 'meeting-room'
                ? 'bg-[#009689] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Meeting Rooms
          </button>
          <button
            onClick={() => setSelectedType('phone-booth')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              selectedType === 'phone-booth'
                ? 'bg-[#009689] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Phone Booths
          </button>
        </div>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpaces.map((space, index) => (
          <div
            key={`space-${index}-${space.id}`}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${typeColors[space.type]} shadow-sm`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">{space.name}</h3>
                  <p className="text-sm text-gray-600">{space.zone}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig[space.status].color}`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig[space.status].dot}`} />
                <span className="text-sm font-medium capitalize">{space.status}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4 p-3 rounded-lg bg-gray-50">
              {space.capacity && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="text-gray-900 font-medium">{space.capacity} people</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="text-green-600 font-semibold">${space.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Day Rate:</span>
                <span className="text-green-600 font-semibold">${space.dayRate}/day</span>
              </div>
            </div>

            {space.recommendations && space.recommendations.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Recommendations:</p>
                <div className="flex flex-wrap gap-1">
                  {space.recommendations.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleEditClick(space)}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-[#e6f7f5] text-[#009689] rounded-lg hover:bg-[#ccefeb] transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => handleDuplicateClick(space)}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button
                onClick={() => handleDeleteClick(space)}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Workspace</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSpace(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Workspace Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Desk A1, Meeting Room 1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                />
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <select
                  value={editForm.zone}
                  onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                >
                  {availableZones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.hourlyRate}
                    onChange={(e) => setEditForm({ ...editForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="5.00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Rate ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.dayRate}
                    onChange={(e) => setEditForm({ ...editForm, dayRate: parseFloat(e.target.value) || 0 })}
                    placeholder="40.00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                  />
                </div>
              </div>

              {/* Capacity (for meeting rooms) */}
              {selectedSpace.type === 'meeting-room' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (people)
                  </label>
                  <input
                    type="number"
                    value={editForm.capacity}
                    onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="6"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Space['status'] })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendation Tags
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleRecommendation(tag)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editForm.recommendations.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select tags to help users find the perfect workspace
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSpace(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Delete Workspace</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedSpace(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this workspace? This action cannot be undone and will remove it from the workspace map.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Workspace Name</p>
                <p className="text-gray-900 font-medium">{selectedSpace.name}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Zone</p>
                <p className="text-gray-900 font-medium">{selectedSpace.zone}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="text-gray-900 font-medium capitalize">{selectedSpace.type.replace('-', ' ')}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedSpace(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
