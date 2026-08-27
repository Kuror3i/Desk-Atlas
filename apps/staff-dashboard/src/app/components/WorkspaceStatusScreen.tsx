import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { fetchPublishedMap } from '../lib/publishedMapApi';

type WorkspaceStatus = 'available' | 'reserved' | 'occupied' | 'unavailable';

interface WorkspaceRecord {
  id: string;
  name: string;
  type: string;
  area: string;
  status: WorkspaceStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  rateLabel: string;
}

const SVG_PADDING = 48;

export function WorkspaceStatusScreen() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(() => createFallbackRecords());

  useEffect(() => {
    let active = true;

    fetchPublishedMap()
      .then(({ published }) => {
        if (!active) return;
        const next = mapPublishedFloorToRecords(published);
        if (next.length > 0) {
          setWorkspaces(next);
        }
      })
      .catch((error) => {
        console.warn('Unable to load staff published map preview', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const matchesType = filterType === 'all' || workspace.type === filterType;
    const matchesStatus = filterStatus === 'all' || workspace.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const mapBounds = useMemo(() => {
    if (filteredWorkspaces.length === 0) {
      return { width: 1200, height: 720 };
    }

    const maxX = Math.max(...filteredWorkspaces.map((workspace) => workspace.x + workspace.width));
    const maxY = Math.max(...filteredWorkspaces.map((workspace) => workspace.y + workspace.height));

    return {
      width: Math.max(1200, maxX + SVG_PADDING),
      height: Math.max(720, maxY + SVG_PADDING),
    };
  }, [filteredWorkspaces]);

  const zoneLabels = useMemo(() => {
    const labels = new Map<string, { x: number; y: number }>();

    for (const workspace of filteredWorkspaces) {
      const current = labels.get(workspace.area);
      const nextX = workspace.x + workspace.width / 2;
      const nextY = Math.max(32, workspace.y - 18);

      if (!current || nextX < current.x) {
        labels.set(workspace.area, { x: nextX, y: nextY });
      }
    }

    return labels;
  }, [filteredWorkspaces]);

  const statusCounts = {
    available: workspaces.filter((workspace) => workspace.status === 'available').length,
    reserved: workspaces.filter((workspace) => workspace.status === 'reserved').length,
    occupied: workspaces.filter((workspace) => workspace.status === 'occupied').length,
    unavailable: workspaces.filter((workspace) => workspace.status === 'unavailable').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Workspace Map</h1>
        <p className="text-gray-600 mt-1">Real-time workspace occupancy and availability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{statusCounts.available}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#009689] rounded-full"></div>
            <p className="text-sm text-gray-600">Reserved</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{statusCounts.reserved}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <p className="text-sm text-gray-600">Occupied</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{statusCounts.occupied}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <p className="text-sm text-gray-600">Unavailable</p>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{statusCounts.unavailable}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689]"
            >
              <option value="all">All Types</option>
              <option value="Desk">Desks</option>
              <option value="Meeting Room">Meeting Rooms</option>
              <option value="Private Booth">Private Booths</option>
            </select>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689]"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'map' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-hidden">
          <div className="overflow-auto">
            <svg viewBox={`0 0 ${mapBounds.width} ${mapBounds.height}`} className="w-full min-h-[32rem]">
              <defs>
                <pattern id="staff-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={mapBounds.width} height={mapBounds.height} fill="url(#staff-grid)" />

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

              {filteredWorkspaces.map((workspace) => (
                <g key={workspace.id}>
                  <rect
                    x={workspace.x}
                    y={workspace.y}
                    width={workspace.width}
                    height={workspace.height}
                    rx={workspace.type === 'Meeting Room' || workspace.type === 'Private Booth' ? 14 : 10}
                    className={`${getStatusFill(workspace.status)} transition-colors`}
                    stroke="#d1d5db"
                    strokeWidth="2"
                  />
                  <text
                    x={workspace.x + workspace.width / 2}
                    y={workspace.y + workspace.height / 2}
                    className="fill-white text-[13px] font-semibold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {workspace.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#b2dfdb] border-2 border-[#80cbc4] rounded"></div>
              <span className="text-sm text-gray-600">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 border-2 border-orange-300 rounded"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Unavailable</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkspaces.map((workspace) => (
                <tr key={workspace.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{workspace.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700">{workspace.type}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700">{workspace.area}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(workspace.status)}`}>
                      {workspace.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700">Capacity: {workspace.capacity}</p>
                    <p className="text-sm text-gray-500">{workspace.rateLabel}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getStatusFill(status: WorkspaceStatus) {
  switch (status) {
    case 'available':
      return 'fill-green-500';
    case 'reserved':
      return 'fill-[#80cbc4]';
    case 'occupied':
      return 'fill-orange-400';
    case 'unavailable':
      return 'fill-gray-400';
  }
}

function getStatusBadgeColor(status: WorkspaceStatus) {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'reserved':
      return 'bg-[#b2dfdb] text-[#00796b]';
    case 'occupied':
      return 'bg-orange-100 text-orange-800';
    case 'unavailable':
      return 'bg-gray-100 text-gray-800';
  }
}

function createFallbackRecords(): WorkspaceRecord[] {
  return [
    { id: 'A1', name: 'Desk A1', type: 'Desk', area: 'Zone A', status: 'available', x: 200, y: 120, width: 72, height: 72, capacity: 1, rateLabel: '$15/hour' },
    { id: 'A2', name: 'Desk A2', type: 'Desk', area: 'Zone A', status: 'available', x: 284, y: 120, width: 72, height: 72, capacity: 1, rateLabel: '$15/hour' },
    { id: 'A3', name: 'Desk A3', type: 'Desk', area: 'Zone A', status: 'occupied', x: 368, y: 120, width: 72, height: 72, capacity: 1, rateLabel: '$15/hour' },
    { id: 'B1', name: 'Desk B1', type: 'Desk', area: 'Zone B', status: 'available', x: 820, y: 120, width: 72, height: 72, capacity: 1, rateLabel: '$15/hour' },
    { id: 'B2', name: 'Desk B2', type: 'Desk', area: 'Zone B', status: 'reserved', x: 904, y: 120, width: 72, height: 72, capacity: 1, rateLabel: '$15/hour' },
    { id: 'MR1', name: 'Meeting Room 1', type: 'Meeting Room', area: 'Meeting Rooms', status: 'available', x: 440, y: 420, width: 160, height: 100, capacity: 6, rateLabel: '$60/hour' },
  ];
}

function mapPublishedFloorToRecords(
  published: Awaited<ReturnType<typeof fetchPublishedMap>>['published']
): WorkspaceRecord[] {
  return published.elements
    .filter((element) => element.elementRole === 'WORKSPACE' && element.workspace)
    .map((element) => {
      const workspace = element.workspace!;
      return {
        id: workspace.instanceCode,
        name: workspace.displayName,
        type: mapWorkspaceType(element.elementType),
        area: readZoneName(element.style, workspace.instanceCode),
        status: workspace.isBookable ? 'available' : 'unavailable',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        capacity: workspace.capacity,
        rateLabel: workspace.pricingUnit === 'HOURLY' ? `$${workspace.rateAmount}/hour` : `$${workspace.rateAmount}`,
      };
    });
}

function mapWorkspaceType(elementType: string): string {
  if (elementType === 'meeting-room') return 'Meeting Room';
  if (elementType === 'phone-booth') return 'Private Booth';
  return 'Desk';
}

function readZoneName(style: Record<string, string | number | boolean | null>, instanceCode: string): string {
  if (typeof style.zone === 'string' && style.zone.length > 0) {
    return style.zone;
  }

  return instanceCode.toUpperCase().startsWith('B') ? 'Zone B' : 'Zone A';
}
