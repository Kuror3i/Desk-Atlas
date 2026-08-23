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
    } as Record<WorkspaceStatus, string>;
    return colors[status];
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Workspace Map</h1>
        <p className="text-gray-600 mt-1">Real-time workspace occupancy and availability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{workspaces.length}</p>
        </div>
      </div>

      {viewMode === 'map' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filteredWorkspaces.map((workspace) => (
              <div key={workspace.id} className={`relative h-20 rounded-lg border-2 ${getStatusColor(workspace.status)} transition-all cursor-pointer group`} title={`${workspace.name} - ${workspace.status}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <span className="text-xs font-medium text-gray-700">{workspace.id}</span>
                  <Circle className={`w-2 h-2 mt-1 ${workspace.status === 'available' ? 'text-green-500' : 'text-gray-500'} fill-current`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
