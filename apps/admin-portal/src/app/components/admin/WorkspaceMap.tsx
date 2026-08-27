import { useEffect, useMemo, useState } from 'react';
import { MapPin, Info, X } from 'lucide-react';
import type { PublishedFloorMap } from '@deskatlas/domain';

type WorkspaceStatus = 'available' | 'pending' | 'reserved' | 'occupied';

type Workspace = {
  id: string;
  label: string;
  zone: string;
  status: WorkspaceStatus;
  type: 'desk' | 'meeting-room' | 'booth';
  x: number;
  y: number;
  width: number;
  height: number;
  rateLabel: string;
  capacity: number;
};

const SVG_PADDING = 48;

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
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => createFallbackWorkspaces());

  useEffect(() => {
    let active = true;

    fetch('/api/published-map', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? `Published map request failed with status ${response.status}`);
        }
        return body.published as PublishedFloorMap | null;
      })
      .then((published) => {
        if (!active || !published) return;
        const next = mapPublishedFloorToWorkspaces(published);
        if (next.length > 0) {
          setWorkspaces(next);
        }
      })
      .catch((error) => {
        console.warn('Unable to load admin published map preview', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = {
    available: workspaces.filter((workspace) => workspace.status === 'available').length,
    pending: workspaces.filter((workspace) => workspace.status === 'pending').length,
    reserved: workspaces.filter((workspace) => workspace.status === 'reserved').length,
    occupied: workspaces.filter((workspace) => workspace.status === 'occupied').length,
  };

  const mapBounds = useMemo(() => {
    if (workspaces.length === 0) {
      return { width: 1200, height: 720 };
    }

    const maxX = Math.max(...workspaces.map((workspace) => workspace.x + workspace.width));
    const maxY = Math.max(...workspaces.map((workspace) => workspace.y + workspace.height));

    return {
      width: Math.max(1200, maxX + SVG_PADDING),
      height: Math.max(720, maxY + SVG_PADDING),
    };
  }, [workspaces]);

  const zoneLabels = useMemo(() => {
    const labels = new Map<string, { x: number; y: number }>();

    for (const workspace of workspaces) {
      const current = labels.get(workspace.zone);
      const nextX = workspace.x + workspace.width / 2;
      const nextY = Math.max(32, workspace.y - 18);

      if (!current || nextX < current.x) {
        labels.set(workspace.zone, { x: nextX, y: nextY });
      }
    }

    return labels;
  }, [workspaces]);

  const handleWorkspaceClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workspace Map</h2>
        <p className="text-gray-600 mt-1">Monitor workspace availability and layout</p>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="overflow-auto">
          <svg viewBox={`0 0 ${mapBounds.width} ${mapBounds.height}`} className="w-full min-h-[32rem]">
            <defs>
              <pattern id="admin-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={mapBounds.width} height={mapBounds.height} fill="url(#admin-grid)" />

            {Array.from(zoneLabels.entries()).map(([zone, position]) => (
              <text
                key={zone}
                x={position.x}
                y={position.y}
                className="fill-gray-700 text-[18px] font-semibold"
                textAnchor="middle"
              >
                {zone}
              </text>
            ))}

            {workspaces.map((workspace) => (
              <g key={workspace.id} onClick={() => handleWorkspaceClick(workspace)} className="cursor-pointer">
                <rect
                  x={workspace.x}
                  y={workspace.y}
                  width={workspace.width}
                  height={workspace.height}
                  rx={workspace.type === 'meeting-room' || workspace.type === 'booth' ? 14 : 10}
                  className={`${getMapFill(workspace.status)} transition-all`}
                  style={{ filter: showRecommended && workspace.status === 'available' ? 'drop-shadow(0 0 8px rgba(59,130,246,0.45))' : undefined }}
                />
                <text
                  x={workspace.x + workspace.width / 2}
                  y={workspace.y + workspace.height / 2}
                  className="fill-white text-[13px] font-semibold pointer-events-none"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {workspace.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

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
                  selectedWorkspace.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : selectedWorkspace.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : selectedWorkspace.status === 'reserved'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                }`}>
                  {statusLabels[selectedWorkspace.status]}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedWorkspace.rateLabel}</p>
                    <p className="text-sm text-gray-700 mt-1">Capacity: {selectedWorkspace.capacity}</p>
                  </div>
                </div>
              </div>
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

function createFallbackWorkspaces(): Workspace[] {
  return [
    { id: 'A1', label: 'A1', zone: 'Zone A', status: 'available', type: 'desk', x: 200, y: 120, width: 72, height: 72, rateLabel: '$15/hour', capacity: 1 },
    { id: 'A2', label: 'A2', zone: 'Zone A', status: 'available', type: 'desk', x: 284, y: 120, width: 72, height: 72, rateLabel: '$15/hour', capacity: 1 },
    { id: 'A3', label: 'A3', zone: 'Zone A', status: 'pending', type: 'desk', x: 368, y: 120, width: 72, height: 72, rateLabel: '$15/hour', capacity: 1 },
    { id: 'B1', label: 'B1', zone: 'Zone B', status: 'available', type: 'desk', x: 820, y: 120, width: 72, height: 72, rateLabel: '$15/hour', capacity: 1 },
    { id: 'B2', label: 'B2', zone: 'Zone B', status: 'reserved', type: 'desk', x: 904, y: 120, width: 72, height: 72, rateLabel: '$15/hour', capacity: 1 },
    { id: 'M1', label: 'Meeting 1', zone: 'Meeting Rooms', status: 'available', type: 'meeting-room', x: 440, y: 420, width: 160, height: 100, rateLabel: '$60/hour', capacity: 6 },
  ];
}

function getMapFill(status: WorkspaceStatus) {
  switch (status) {
    case 'available':
      return 'fill-green-500';
    case 'pending':
      return 'fill-yellow-500';
    case 'reserved':
      return 'fill-red-500';
    case 'occupied':
      return 'fill-gray-400';
  }
}

function mapPublishedFloorToWorkspaces(published: PublishedFloorMap): Workspace[] {
  return published.elements
    .filter((element) => element.elementRole === 'WORKSPACE' && element.workspace)
    .map((element) => ({
      id: element.workspace!.workspaceInstanceId,
      label: element.workspace!.instanceCode,
      zone: readZone(element.style, element.workspace!.instanceCode, element.elementType),
      status: element.workspace!.isBookable ? 'available' : 'occupied',
      type: mapWorkspaceType(element.elementType),
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rateLabel:
        element.workspace!.pricingUnit === 'HOURLY'
          ? `$${element.workspace!.rateAmount}/hour`
          : `$${element.workspace!.rateAmount}`,
      capacity: element.workspace!.capacity,
    }));
}

function mapWorkspaceType(elementType: string): Workspace['type'] {
  if (elementType === 'meeting-room') return 'meeting-room';
  if (elementType === 'phone-booth') return 'booth';
  return 'desk';
}

function readZone(style: Record<string, string | number | boolean | null>, instanceCode: string, elementType: string) {
  if (typeof style.zone === 'string' && style.zone.length > 0) {
    return style.zone;
  }

  if (elementType === 'meeting-room' || elementType === 'phone-booth') {
    return 'Meeting Rooms';
  }

  return instanceCode.toUpperCase().includes('B') ? 'Zone B' : 'Zone A';
}
