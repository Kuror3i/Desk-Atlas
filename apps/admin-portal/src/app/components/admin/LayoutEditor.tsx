import { useState, useRef } from 'react';
import { Plus, Save, Trash2, Edit2, Copy, X, MapPin, Upload, Grid3x3, Trash } from 'lucide-react';

type SpaceType = 'desk' | 'meeting-room' | 'phone-booth';

type FloorSpace = {
  id: string;
  type: SpaceType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  zone: string;
  hourlyRate: number;
  dayRate: number;
};

type ZoneArea = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type TemplateType = 'upload' | 'blank' | 'zones';

const spaceColors = {
  desk: 'bg-[#009689]',
  'meeting-room': 'bg-purple-500',
  'phone-booth': 'bg-orange-500',
};

const spaceLabels = {
  desk: 'Desk',
  'meeting-room': 'Meeting Room',
  'phone-booth': 'Phone Booth',
};

const initialSpaces: FloorSpace[] = [
  { id: '1', type: 'desk', x: 100, y: 100, width: 80, height: 60, label: 'A1', zone: 'Zone A', hourlyRate: 5, dayRate: 40 },
  { id: '2', type: 'desk', x: 200, y: 100, width: 80, height: 60, label: 'A2', zone: 'Zone A', hourlyRate: 5, dayRate: 40 },
  { id: '3', type: 'meeting-room', x: 100, y: 200, width: 150, height: 100, label: 'Meeting 1', zone: 'Meeting Rooms', hourlyRate: 25, dayRate: 180 },
];

const availableZones = ['Zone A', 'Zone B', 'Meeting Rooms'];

export function LayoutEditor() {
  const [step, setStep] = useState<'template' | 'builder'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [spaces, setSpaces] = useState<FloorSpace[]>([]);
  const [zones, setZones] = useState<ZoneArea[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<SpaceType>('desk');
  const [draggingSpace, setDraggingSpace] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingSpace, setEditingSpace] = useState<FloorSpace | null>(null);
  const [editForm, setEditForm] = useState({
    label: '',
    zone: '',
    hourlyRate: 0,
    dayRate: 0,
  });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkWorkspaceInZone = (workspace: FloorSpace): string | null => {
    if (selectedTemplate !== 'zones' || zones.length === 0) return null;

    // Calculate center point of workspace
    const centerX = workspace.x + workspace.width / 2;
    const centerY = workspace.y + workspace.height / 2;

    // Check which zone contains the workspace center
    for (const zone of zones) {
      if (
        centerX >= zone.x &&
        centerX <= zone.x + zone.width &&
        centerY >= zone.y &&
        centerY <= zone.y + zone.height
      ) {
        return zone.name;
      }
    }

    return null;
  };

  const handleAddSpace = () => {
    const initialX = 300;
    const initialY = 200;
    const width = addingType === 'desk' ? 80 : addingType === 'phone-booth' ? 70 : 150;
    const height = addingType === 'desk' ? 60 : addingType === 'phone-booth' ? 70 : 100;

    const newSpace: FloorSpace = {
      id: `space-${Date.now()}`,
      type: addingType,
      x: initialX,
      y: initialY,
      width,
      height,
      label: `${spaceLabels[addingType]} ${spaces.length + 1}`,
      zone: addingType === 'meeting-room' ? 'Meeting Rooms' : 'Zone A',
      hourlyRate: addingType === 'desk' ? 5 : addingType === 'phone-booth' ? 8 : 25,
      dayRate: addingType === 'desk' ? 40 : addingType === 'phone-booth' ? 50 : 180,
    };

    // Auto-detect zone if using zone template
    if (selectedTemplate === 'zones') {
      const detectedZone = checkWorkspaceInZone(newSpace);
      if (detectedZone) {
        newSpace.zone = detectedZone;
      }
    }

    setSpaces([...spaces, newSpace]);
    setSelectedSpace(newSpace.id);
  };

  const handleMouseDown = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingSpace(spaceId);
    setSelectedSpace(spaceId);
    setDragOffset({
      x: e.clientX - rect.left - space.x,
      y: e.clientY - rect.top - space.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingSpace || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    setSpaces(spaces.map(space =>
      space.id === draggingSpace
        ? { ...space, x: Math.max(0, newX), y: Math.max(0, newY) }
        : space
    ));
  };

  const handleMouseUp = () => {
    if (draggingSpace && selectedTemplate === 'zones') {
      // Auto-assign zone based on position
      const workspace = spaces.find(s => s.id === draggingSpace);
      if (workspace) {
        const detectedZone = checkWorkspaceInZone(workspace);
        if (detectedZone && detectedZone !== workspace.zone) {
          setSpaces(spaces.map(s =>
            s.id === draggingSpace
              ? { ...s, zone: detectedZone }
              : s
          ));
        }
      }
    }
    setDraggingSpace(null);
  };

  const handleEditClick = (space: FloorSpace) => {
    setEditingSpace(space);
    setEditForm({
      label: space.label,
      zone: space.zone,
      hourlyRate: space.hourlyRate,
      dayRate: space.dayRate,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingSpace) return;

    if (!editForm.label.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    setSpaces(spaces.map(space =>
      space.id === editingSpace.id
        ? {
            ...space,
            label: editForm.label,
            zone: editForm.zone,
            hourlyRate: editForm.hourlyRate,
            dayRate: editForm.dayRate,
          }
        : space
    ));

    alert(`${editForm.label} updated successfully!`);
    setShowEditModal(false);
    setEditingSpace(null);
  };

  const handleDuplicate = (space: FloorSpace) => {
    const newSpace: FloorSpace = {
      ...space,
      id: `space-${Date.now()}`,
      x: space.x + 20,
      y: space.y + 20,
      label: `${space.label} Copy`,
    };

    // Auto-detect zone if using zone template
    if (selectedTemplate === 'zones') {
      const detectedZone = checkWorkspaceInZone(newSpace);
      if (detectedZone) {
        newSpace.zone = detectedZone;
      }
    }

    setSpaces([...spaces, newSpace]);
    setSelectedSpace(newSpace.id);
  };

  const handleDeleteClick = (space: FloorSpace) => {
    setEditingSpace(space);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!editingSpace) return;
    setSpaces(spaces.filter(space => space.id !== editingSpace.id));
    setSelectedSpace(null);
    setShowDeleteConfirm(false);
    setEditingSpace(null);
    alert(`${editingSpace.label} has been deleted`);
  };

  const handleSaveLayout = () => {
    alert(`Layout saved successfully!\n\n${spaces.length} workspaces configured`);
  };

  const handleCanvasClick = () => {
    setSelectedSpace(null);
  };

  const handleTemplateSelect = (template: TemplateType) => {
    setSelectedTemplate(template);

    if (template === 'zones') {
      // Create default zones
      setZones([
        { id: 'zone-1', name: 'Zone A', x: 50, y: 50, width: 200, height: 140, color: 'rgba(0, 150, 137, 0.1)' },
        { id: 'zone-2', name: 'Zone B', x: 280, y: 50, width: 200, height: 140, color: 'rgba(147, 51, 234, 0.1)' },
        { id: 'zone-3', name: 'Meeting Rooms', x: 50, y: 220, width: 430, height: 100, color: 'rgba(249, 115, 22, 0.1)' },
      ]);
    }

    setStep('builder');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
  };

  const handleAddZone = () => {
    if (!newZoneName.trim()) {
      alert('Please enter a zone name');
      return;
    }

    const colors = [
      'rgba(0, 150, 137, 0.1)',
      'rgba(147, 51, 234, 0.1)',
      'rgba(249, 115, 22, 0.1)',
      'rgba(59, 130, 246, 0.1)',
      'rgba(236, 72, 153, 0.1)',
    ];

    const newZone: ZoneArea = {
      id: `zone-${Date.now()}`,
      name: newZoneName,
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      color: colors[zones.length % colors.length],
    };

    setZones([...zones, newZone]);
    setNewZoneName('');
    setShowAddZoneModal(false);
  };

  const handleDeleteZone = (zoneId: string) => {
    if (confirm('Are you sure you want to delete this zone?')) {
      setZones(zones.filter(z => z.id !== zoneId));
    }
  };

  // Template Selection Step
  if (step === 'template') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Layout Template</h2>
          <p className="text-gray-600 mt-1">Select how you want to create your floor plan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Floor Plan */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-[#009689] hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Floor Plan</h3>
              <p className="text-sm text-gray-600">
                Upload an image of your existing floor plan to use as a visual guide
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                handleImageUpload(e);
                handleTemplateSelect('upload');
              }}
              className="hidden"
            />
          </div>

          {/* Blank Canvas */}
          <div
            onClick={() => handleTemplateSelect('blank')}
            className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-[#009689] hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <Grid3x3 className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blank Canvas</h3>
              <p className="text-sm text-gray-600">
                Start with a clean slate and place workspaces freely
              </p>
            </div>
          </div>

          {/* Zone Template */}
          <div
            onClick={() => handleTemplateSelect('zones')}
            className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-[#009689] hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#e6f7f5] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#ccefeb] transition-colors">
                <MapPin className="w-8 h-8 text-[#009689]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zone Template</h3>
              <p className="text-sm text-gray-600">
                Start with pre-defined zones to organize your workspaces
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout Builder Step
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Add Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={addingType}
              onChange={(e) => setAddingType(e.target.value as SpaceType)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-[#009689] transition-all"
            >
              <option value="desk">Desk</option>
              <option value="meeting-room">Meeting Room</option>
              <option value="phone-booth">Phone Booth</option>
            </select>

            <button
              onClick={handleAddSpace}
              className="flex items-center gap-2 px-4 py-2 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add to Floor Plan
            </button>

            {selectedTemplate === 'zones' && (
              <button
                onClick={() => setShowAddZoneModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Zone
              </button>
            )}

            {selectedTemplate === 'upload' && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Change Floor Plan
                </button>
                {backgroundImage && (
                  <button
                    onClick={handleRemoveBackground}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    Remove
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Right: Save Button */}
          <button
            onClick={handleSaveLayout}
            className="flex items-center gap-2 px-6 py-2 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Save className="w-4 h-4" />
            Save Layout
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Click and drag workspaces to position them. Click on a workspace to select it and use the action buttons to edit, duplicate, or delete.
          {selectedTemplate === 'zones' && (
            <span className="block mt-2">
              <strong>✨ Auto-Zone Detection:</strong> When you drag a workspace into a zone area, it will automatically be labeled with that zone's name!
            </span>
          )}
        </p>
      </div>

      {/* Canvas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          ref={canvasRef}
          className="relative bg-gray-50 cursor-default"
          style={{ height: '600px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {/* Background Image or Grid */}
          {backgroundImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(#00968944 1px, transparent 1px), linear-gradient(90deg, #00968944 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          )}

          {/* Zones */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="absolute border-2 border-dashed rounded-lg group"
              style={{
                left: `${zone.x}px`,
                top: `${zone.y}px`,
                width: `${zone.width}px`,
                height: `${zone.height}px`,
                backgroundColor: zone.color,
                borderColor: zone.color.replace('0.1', '0.5'),
              }}
            >
              <div className="absolute -top-8 left-0 flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-md border border-gray-200">
                <p className="text-sm font-semibold text-gray-900">{zone.name}</p>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
          ))}

          {/* Spaces */}
          {spaces.map((space) => (
            <div
              key={space.id}
              className={`absolute ${spaceColors[space.type]} text-white rounded-lg shadow-lg cursor-move transition-all ${
                selectedSpace === space.id ? 'ring-4 ring-blue-400' : ''
              } ${draggingSpace === space.id ? 'opacity-70' : 'hover:shadow-xl'}`}
              style={{
                left: `${space.x}px`,
                top: `${space.y}px`,
                width: `${space.width}px`,
                height: `${space.height}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, space.id)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSpace(space.id);
              }}
            >
              <div className="h-full flex flex-col items-center justify-center p-2">
                <MapPin className="w-4 h-4 mb-1" />
                <p className="text-xs font-semibold text-center break-words">{space.label}</p>
                <p className="text-xs opacity-90">{space.zone}</p>
              </div>

              {/* Action Buttons (shown when selected) */}
              {selectedSpace === space.id && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-lg p-1 border border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(space);
                    }}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(space);
                    }}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(space);
                    }}
                    className="p-2 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {spaces.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No workspaces yet</p>
                <p className="text-gray-400 text-sm mt-2">Click "Add to Floor Plan" to start building your layout</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Workspaces</p>
          <p className="text-2xl font-bold text-gray-900">{spaces.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Desks</p>
          <p className="text-2xl font-bold text-gray-900">{spaces.filter(s => s.type === 'desk').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Meeting Rooms</p>
          <p className="text-2xl font-bold text-gray-900">{spaces.filter(s => s.type === 'meeting-room').length}</p>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Workspace</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSpace(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
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

              {/* Type Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="text-gray-900 font-medium capitalize">{editingSpace.type.replace('-', ' ')}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSpace(null);
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
      {showDeleteConfirm && editingSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Delete Workspace</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEditingSpace(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this workspace from the layout? This action cannot be undone.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Workspace</p>
                <p className="text-gray-900 font-medium">{editingSpace.label}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Zone</p>
                <p className="text-gray-900 font-medium">{editingSpace.zone}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEditingSpace(null);
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

      {/* Add Zone Modal */}
      {showAddZoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add Zone</h3>
              <button
                onClick={() => {
                  setShowAddZoneModal(false);
                  setNewZoneName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g., Zone C, Quiet Area, Collaboration Space"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddZone();
                    }
                  }}
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  Zones help organize your workspace layout. You can drag and position the zone area after creating it.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddZoneModal(false);
                  setNewZoneName('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddZone}
                className="flex-1 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Add Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
