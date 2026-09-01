import { useMemo, useState } from "react";
import type { Workspace } from "../pages/WorkspaceDiscoveryPage";
import { Sparkles } from "lucide-react";

interface WorkspaceMapProps {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onSelectWorkspace: (workspace: Workspace) => void;
}

const SVG_PADDING = 48;

export function WorkspaceMap({
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
}: WorkspaceMapProps) {
  const [showRecommended, setShowRecommended] = useState(false);
  const [preference, setPreference] = useState("");

  const preferenceOptions = [
    { value: "", label: "Select Preference" },
    { value: "near-window", label: "Near the window" },
    { value: "near-cr", label: "Near the CR" },
    { value: "near-reception", label: "Near the reception" },
    { value: "quiet-area", label: "Quiet area" },
    { value: "private-area", label: "Private area" },
    { value: "near-meeting-rooms", label: "Near meeting rooms" },
  ];

  const recommendedWorkspaces = useMemo(() => {
    if (!showRecommended || !preference) return [];

    return workspaces
      .filter((workspace) => matchesPreference(workspace, preference))
      .map((workspace) => workspace.id);
  }, [preference, showRecommended, workspaces]);

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
    const labels = new Map<Workspace["type"], { x: number; y: number }>();

    for (const workspace of workspaces) {
      const current = labels.get(workspace.type);
      const nextX = workspace.x + workspace.width / 2;
      const nextY = Math.max(32, workspace.y - 20);

      if (!current || nextX < current.x) {
        labels.set(workspace.type, { x: nextX, y: nextY });
      }
    }

    return labels;
  }, [workspaces]);

  const isRecommended = (workspaceId: string) => recommendedWorkspaces.includes(workspaceId);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              <span className="text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="text-gray-700">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-400 rounded"></div>
              <span className="text-gray-700">Occupied</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRecommended}
                onChange={(event) => {
                  setShowRecommended(event.target.checked);
                  if (!event.target.checked) {
                    setPreference("");
                  }
                }}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show Recommended Workspaces</span>
            </label>

            {showRecommended && (
              <select
                value={preference}
                onChange={(event) => setPreference(event.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              >
                {preferenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {showRecommended && preference && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <p className="text-sm text-teal-800">
              Showing {recommendedWorkspaces.length} recommended workspace(s) for "
              {preferenceOptions.find((option) => option.value === preference)?.label}"
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-auto">
          <svg viewBox={`0 0 ${mapBounds.width} ${mapBounds.height}`} className="w-full min-h-[32rem]">
            <defs>
              <pattern id="customer-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>

            <rect width={mapBounds.width} height={mapBounds.height} fill="url(#customer-grid)" />

            {Array.from(zoneLabels.entries()).map(([zone, position]) => (
              <text
                key={zone}
                x={position.x}
                y={position.y}
                className="fill-gray-700 text-[18px] font-semibold"
                textAnchor="middle"
              >
                {getZoneLabel(zone)}
              </text>
            ))}

            {workspaces.map((workspace) => {
              const selected = selectedWorkspace?.id === workspace.id;
              const recommended = isRecommended(workspace.id);

              return (
                <g
                  key={workspace.id}
                  onClick={() => onSelectWorkspace(workspace)}
                  className="cursor-pointer"
                >
                  <rect
                    x={workspace.x}
                    y={workspace.y}
                    width={workspace.width}
                    height={workspace.height}
                    rx={workspace.type === "meeting-room" ? 14 : 10}
                    className={`${getStatusColor(workspace.status)} transition-colors`}
                    stroke={recommended ? "#7c3aed" : selected ? "#0f766e" : "#d1d5db"}
                    strokeWidth={recommended || selected ? 4 : 2}
                  />
                  <text
                    x={workspace.x + workspace.width / 2}
                    y={workspace.y + workspace.height / 2}
                    className="fill-white text-[13px] font-semibold pointer-events-none"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {getWorkspaceLabel(workspace)}
                  </text>
                  {recommended && (
                    <>
                      <circle
                        cx={workspace.x + workspace.width - 12}
                        cy={workspace.y + 12}
                        r="10"
                        fill="#7c3aed"
                      />
                      <text
                        x={workspace.x + workspace.width - 12}
                        y={workspace.y + 12}
                        className="fill-white text-[10px] pointer-events-none"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        *
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Click on any workspace to view details and reserve
      </p>
    </div>
  );
}

function getStatusColor(status: Workspace["status"]) {
  switch (status) {
    case "available":
      return "fill-green-500 hover:fill-green-600";
    case "reserved":
      return "fill-red-500 hover:fill-red-600";
    case "occupied":
      return "fill-gray-400 hover:fill-gray-500";
    case "unavailable":
      return "fill-yellow-500 hover:fill-yellow-600";
  }
}

function getZoneLabel(type: Workspace["type"]) {
  switch (type) {
    case "zone-a":
      return "Zone A";
    case "zone-b":
      return "Zone B";
    case "meeting-room":
      return "Meeting Rooms";
    case "booth":
      return "Private Booths";
  }
}

function getWorkspaceLabel(workspace: Workspace) {
  if (workspace.type === "meeting-room" || workspace.type === "booth") {
    return workspace.name;
  }

  return workspace.id;
}

function matchesPreference(workspace: Workspace, preference: string) {
  switch (preference) {
    case "near-window":
      return workspace.x > 700;
    case "near-cr":
      return workspace.y > 380;
    case "near-reception":
      return workspace.y < 180;
    case "quiet-area":
      return workspace.x < 260 || workspace.x > 900;
    case "private-area":
      return workspace.type === "meeting-room" || workspace.type === "booth";
    case "near-meeting-rooms":
      return workspace.type === "meeting-room" || workspace.type === "booth" || workspace.y > 360;
    default:
      return false;
  }
}
