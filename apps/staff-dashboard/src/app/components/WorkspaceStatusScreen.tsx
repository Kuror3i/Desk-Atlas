import { useState } from 'react';
import { LayoutGrid, List, Circle } from 'lucide-react';

type WorkspaceStatus = 'available' | 'reserved' | 'occupied' | 'unavailable';

interface Workspace {
  id: string;
  name: string;
  type: string;
  area: string;
  status: WorkspaceStatus;
  currentUser?: string;
  currentSession?: string;
  reservedFor?: string;
  reservationTime?: string;
}

export function WorkspaceStatusScreen() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const workspaces: Workspace[] = [
    { id: 'A-01', name: 'Desk A-01', type: 'Desk', area: 'Zone A', status: 'available' },
    { id: 'A-02', name: 'Desk A-02', type: 'Desk', area: 'Zone A', status: 'occupied', currentUser: 'John Doe', currentSession: 'SES-101' },
    { id: 'A-03', name: 'Desk A-03', type: 'Desk', area: 'Zone A', status: 'reserved', reservedFor: 'Jane Smith', reservationTime: '2:00 PM' },
    { id: 'A-04', name: 'Desk A-04', type: 'Desk', area: 'Zone A', status: 'available' },
    { id: 'A-05', name: 'Desk A-05', type: 'Desk', area: 'Zone A', status: 'occupied', currentUser: 'Alice Martinez', currentSession: 'SES-003' },
    { id: 'A-06', name: 'Desk A-06', type: 'Desk', area: 'Zone A', status: 'available' },
    { id: 'A-07', name: 'Desk A-07', type: 'Desk', area: 'Zone A', status: 'available' },
    { id: 'A-08', name: 'Desk A-08', type: 'Desk', area: 'Zone A', status: 'occupied', currentUser: 'Bob Wilson', currentSession: 'SES-105' },
    { id: 'A-09', name: 'Desk A-09', type: 'Desk', area: 'Zone A', status: 'available' },
    { id: 'A-10', name: 'Desk A-10', type: 'Desk', area: 'Zone A', status: 'available' },
    { id: 'A-11', name: 'Desk A-11', type: 'Desk', area: 'Zone A', status: 'reserved', reservedFor: 'Tom Brown', reservationTime: '3:30 PM' },
    { id: 'A-12', name: 'Desk A-12', type: 'Desk', area: 'Zone A', status: 'occupied', currentUser: 'Sarah Johnson', currentSession: 'SES-001' },
    { id: 'B-01', name: 'Desk B-01', type: 'Desk', area: 'Zone B', status: 'available' },
    { id: 'B-02', name: 'Desk B-02', type: 'Desk', area: 'Zone B', status: 'available' },
    { id: 'B-03', name: 'Desk B-03', type: 'Desk', area: 'Zone B', status: 'occupied', currentUser: 'Emily Chen', currentSession: 'SES-108' },
    { id: 'B-04', name: 'Desk B-04', type: 'Desk', area: 'Zone B', status: 'available' },
    { id: 'B-05', name: 'Desk B-05', type: 'Desk', area: 'Zone B', status: 'reserved', reservedFor: 'Emily Davis', reservationTime: '1:00 PM' },
    { id: 'B-06', name: 'Desk B-06', type: 'Desk', area: 'Zone B', status: 'available' },
    { id: 'MR-01', name: 'Meeting Room 1', type: 'Meeting Room', area: 'Main Floor', status: 'occupied', currentUser: 'Michael Chen', currentSession: 'SES-002' },
    { id: 'MR-02', name: 'Meeting Room 2', type: 'Meeting Room', area: 'Main Floor', status: 'available' },
    { id: 'MR-03', name: 'Meeting Room 3', type: 'Meeting Room', area: 'Main Floor', status: 'reserved', reservedFor: 'Lisa Anderson', reservationTime: '2:00 PM' },
    { id: 'PO-01', name: 'Private Office 1', type: 'Private Office', area: 'Executive', status: 'occupied', currentUser: 'Emily Davis', currentSession: 'SES-007' },
    { id: 'PO-02', name: 'Private Office 2', type: 'Private Office', area: 'Executive', status: 'occupied', currentUser: 'James Wilson', currentSession: 'SES-002' },
    { id: 'PO-03', name: 'Private Office 3', type: 'Private Office', area: 'Executive', status: 'unavailable' },
  ];

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const matchesType = filterType === 'all' || workspace.type === filterType;
    const matchesStatus = filterStatus === 'all' || workspace.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getStatusColor = (status: WorkspaceStatus) => {
    const colors = {
      available: 'bg-green-100 border-green-300 hover:bg-green-200',
      reserved: 'bg-[#b2dfdb] border-[#80cbc4] hover:bg-[#80cbc4]',
      occupied: 'bg-orange-100 border-orange-300 hover:bg-orange-200',
      unavailable: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
    };
    return colors[status];
  };

  const getStatusBadgeColor = (status: WorkspaceStatus) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-[#b2dfdb] text-[#00796b]',
      occupied: 'bg-orange-100 text-orange-800',
      unavailable: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const statusCounts = {
    available: workspaces.filter((w) => w.status === 'available').length,
    reserved: workspaces.filter((w) => w.status === 'reserved').length,
    occupied: workspaces.filter((w) => w.status === 'occupied').length,
    unavailable: workspaces.filter((w) => w.status === 'unavailable').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Workspace Map</h1>
        <p className="text-gray-600 mt-1">Real-time workspace occupancy and availability</p>
      </div>

      {/* Summary Cards */}
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

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689]"
            >
              <option value="all">All Types</option>
              <option value="Desk">Desks</option>
              <option value="Meeting Room">Meeting Rooms</option>
              <option value="Private Office">Private Offices</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689]"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* View Toggle */}
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

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filteredWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`relative h-20 rounded-lg border-2 ${getStatusColor(workspace.status)} transition-all cursor-pointer group`}
                title={`${workspace.name} - ${workspace.status}`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <span className="text-xs font-medium text-gray-700">{workspace.id}</span>
                  <Circle className={`w-2 h-2 mt-1 ${
                    workspace.status === 'available' ? 'text-green-500' :
                    workspace.status === 'reserved' ? 'text-[#009689]' :
                    workspace.status === 'occupied' ? 'text-orange-500' :
                    'text-gray-500'
                  } fill-current`} />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-gray-300">{workspace.type}</p>
                    <p className="text-gray-300 capitalize">{workspace.status}</p>
                    {workspace.currentUser && (
                      <p className="text-gray-300 mt-1">User: {workspace.currentUser}</p>
                    )}
                    {workspace.reservedFor && (
                      <p className="text-gray-300 mt-1">Reserved: {workspace.reservedFor}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
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

      {/* List View */}
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
                    {workspace.currentUser && (
                      <p className="text-sm text-gray-700">User: {workspace.currentUser}</p>
                    )}
                    {workspace.reservedFor && (
                      <p className="text-sm text-gray-700">Reserved for: {workspace.reservedFor} at {workspace.reservationTime}</p>
                    )}
                    {workspace.status === 'available' && (
                      <p className="text-sm text-gray-500">Ready for use</p>
                    )}
                    {workspace.status === 'unavailable' && (
                      <p className="text-sm text-gray-500">Not available</p>
                    )}
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
