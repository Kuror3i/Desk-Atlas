import { useState } from 'react';

export type DeskStatus = 'available' | 'pending' | 'reserved' | 'occupied';

export interface Desk {
  id: string;
  name: string;
  type: 'desk' | 'meeting-room' | 'phone-booth';
  zone: string;
  status: DeskStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  hourlyRate: number;
  dayRate: number;
}

interface WorkspaceMapProps {
  desks: Desk[];
  onDeskClick: (desk: Desk) => void;
  selectedDeskId?: string;
  highlightedDeskIds?: string[];
}

const statusColors: Record<DeskStatus, string> = {
  available: 'fill-green-500 hover:fill-green-600',
  pending: 'fill-yellow-500 hover:fill-yellow-600',
  reserved: 'fill-red-500 hover:fill-red-600',
  occupied: 'fill-gray-400'
};

export function WorkspaceMap({ desks, onDeskClick, selectedDeskId, highlightedDeskIds = [] }: WorkspaceMapProps) {
  const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Map Legend */}
      <div className="flex gap-6 justify-center px-4 py-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span className="text-sm">Occupied</span>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="flex-1 bg-white rounded-lg shadow-lg p-8 overflow-auto">
        <svg viewBox="0 0 1000 700" className="w-full h-full">
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="1000" height="700" fill="url(#grid)" />

          {/* Zone labels */}
          <text x="100" y="40" className="fill-gray-600 text-2xl font-medium">Zone A</text>
          <text x="600" y="40" className="fill-gray-600 text-2xl font-medium">Zone B</text>
          <text x="100" y="400" className="fill-gray-600 text-2xl font-medium">Meeting Rooms</text>

          {/* Desks and Rooms */}
          {desks.map((desk) => {
            const isSelected = desk.id === selectedDeskId;
            const isHighlighted = highlightedDeskIds.includes(desk.id);
            const isHovered = hoveredDesk === desk.id;
            const canClick = desk.status === 'available' || desk.status === 'pending';

            return (
              <g
                key={desk.id}
                onMouseEnter={() => canClick && setHoveredDesk(desk.id)}
                onMouseLeave={() => setHoveredDesk(null)}
                onClick={() => canClick && onDeskClick(desk)}
                className={canClick ? 'cursor-pointer' : 'cursor-not-allowed'}
              >
                <rect
                  x={desk.x}
                  y={desk.y}
                  width={desk.width}
                  height={desk.height}
                  className={`${statusColors[desk.status]} transition-all duration-200 ${
                    isSelected || isHighlighted ? 'stroke-purple-600 stroke-4' : 'stroke-gray-300 stroke-2'
                  }`}
                  rx="4"
                  style={{
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: `${desk.x + desk.width / 2}px ${desk.y + desk.height / 2}px`
                  }}
                />
                <text
                  x={desk.x + desk.width / 2}
                  y={desk.y + desk.height / 2}
                  className="fill-white text-sm font-medium pointer-events-none"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {desk.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
