import { useState } from "react";
import { Workspace } from "../pages/WorkspaceDiscoveryPage";
import { Sparkles } from "lucide-react";

interface WorkspaceMapProps {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onSelectWorkspace: (workspace: Workspace) => void;
}

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

  // Define recommended workspaces based on preference
  const getRecommendedWorkspaces = (): string[] => {
    if (!showRecommended || !preference) return [];

    switch (preference) {
      case "near-window":
        return ["B4", "B8", "B12", "Meeting-3", "Booth-2"];
      case "near-cr":
        return ["A1", "A2", "B1", "B2"];
      case "near-reception":
        return ["A1", "A5", "A9", "B1", "B5"];
      case "quiet-area":
        return ["A10", "A11", "A12", "Booth-1", "Booth-2"];
      case "private-area":
        return ["Meeting-1", "Meeting-2", "Meeting-3", "Booth-1", "Booth-2"];
      case "near-meeting-rooms":
        return ["A12", "B12", "Meeting-1", "Meeting-2", "Meeting-3"];
      default:
        return [];
    }
  };

  const recommendedWorkspaces = getRecommendedWorkspaces();
  const isRecommended = (workspaceId: string) => recommendedWorkspaces.includes(workspaceId);

  const getStatusColor = (status: Workspace["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "reserved":
        return "bg-red-500 hover:bg-red-600";
      case "occupied":
        return "bg-gray-400 hover:bg-gray-500";
      case "unavailable":
        return "bg-yellow-500 hover:bg-yellow-600";
    }
  };

  const getWorkspaceById = (id: string) => {
    return workspaces.find((w) => w.id === id);
  };

  const renderDesk = (id: string) => {
    const workspace = getWorkspaceById(id);
    const status = workspace?.status || "available";
    const isSelected = selectedWorkspace?.id === id;
    const recommended = isRecommended(id);

    return (
      <button
        key={id}
        onClick={() => workspace && onSelectWorkspace(workspace)}
        className={`${getStatusColor(status)} ${
          isSelected ? "ring-4 ring-teal-600" : ""
        } ${
          recommended ? "ring-2 ring-purple-500 shadow-lg shadow-purple-300" : ""
        } text-white font-medium rounded-md w-14 h-14 flex items-center justify-center transition-all text-sm relative`}
      >
        {id}
        {recommended && (
          <Sparkles className="w-3 h-3 text-purple-200 absolute top-0.5 right-0.5" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      {/* Legend and Controls */}
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
                onChange={(e) => {
                  setShowRecommended(e.target.checked);
                  if (!e.target.checked) {
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
                onChange={(e) => setPreference(e.target.value)}
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
              Showing {recommendedWorkspaces.length} recommended workspace(s) for "{preferenceOptions.find(o => o.value === preference)?.label}"
            </p>
          </div>
        )}
      </div>

      {/* Workspace Map */}
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
        <div className="space-y-12">
          {/* Zone A and Zone B */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Zone A */}
            <div>
              <h3 className="text-center font-semibold text-gray-700 mb-4">Zone A</h3>
              <div className="space-y-2">
                <div className="flex gap-2 justify-center">
                  {renderDesk("A1")}
                  {renderDesk("A2")}
                  {renderDesk("A3")}
                  {renderDesk("A4")}
                </div>
                <div className="flex gap-2 justify-center">
                  {renderDesk("A5")}
                  {renderDesk("A6")}
                  {renderDesk("A7")}
                  {renderDesk("A8")}
                </div>
                <div className="flex gap-2 justify-center">
                  {renderDesk("A9")}
                  {renderDesk("A10")}
                  {renderDesk("A11")}
                  {renderDesk("A12")}
                </div>
              </div>
            </div>

            {/* Zone B */}
            <div>
              <h3 className="text-center font-semibold text-gray-700 mb-4">Zone B</h3>
              <div className="space-y-2">
                <div className="flex gap-2 justify-center">
                  {renderDesk("B1")}
                  {renderDesk("B2")}
                  {renderDesk("B3")}
                  {renderDesk("B4")}
                </div>
                <div className="flex gap-2 justify-center">
                  {renderDesk("B5")}
                  {renderDesk("B6")}
                  {renderDesk("B7")}
                  {renderDesk("B8")}
                </div>
                <div className="flex gap-2 justify-center">
                  {renderDesk("B9")}
                  {renderDesk("B10")}
                  {renderDesk("B11")}
                  {renderDesk("B12")}
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Rooms */}
          <div>
            <h3 className="text-center font-semibold text-gray-700 mb-4">Meeting Rooms</h3>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => {
                  const workspace = getWorkspaceById("Meeting-1");
                  workspace && onSelectWorkspace(workspace);
                }}
                className={`${getStatusColor(getWorkspaceById("Meeting-1")?.status || "available")} ${
                  selectedWorkspace?.id === "Meeting-1" ? "ring-4 ring-teal-600" : ""
                } ${
                  isRecommended("Meeting-1") ? "ring-2 ring-purple-500 shadow-lg shadow-purple-300" : ""
                } text-white font-medium rounded-md px-6 py-8 transition-all relative`}
              >
                Meeting 1
                {isRecommended("Meeting-1") && (
                  <Sparkles className="w-4 h-4 text-purple-200 absolute top-1 right-1" />
                )}
              </button>
              <button
                onClick={() => {
                  const workspace = getWorkspaceById("Meeting-2");
                  workspace && onSelectWorkspace(workspace);
                }}
                className={`${getStatusColor(getWorkspaceById("Meeting-2")?.status || "available")} ${
                  selectedWorkspace?.id === "Meeting-2" ? "ring-4 ring-teal-600" : ""
                } ${
                  isRecommended("Meeting-2") ? "ring-2 ring-purple-500 shadow-lg shadow-purple-300" : ""
                } text-white font-medium rounded-md px-6 py-8 transition-all relative`}
              >
                Meeting 2
                {isRecommended("Meeting-2") && (
                  <Sparkles className="w-4 h-4 text-purple-200 absolute top-1 right-1" />
                )}
              </button>
              <button
                onClick={() => {
                  const workspace = getWorkspaceById("Meeting-3");
                  workspace && onSelectWorkspace(workspace);
                }}
                className={`${getStatusColor(getWorkspaceById("Meeting-3")?.status || "available")} ${
                  selectedWorkspace?.id === "Meeting-3" ? "ring-4 ring-teal-600" : ""
                } ${
                  isRecommended("Meeting-3") ? "ring-2 ring-purple-500 shadow-lg shadow-purple-300" : ""
                } text-white font-medium rounded-md px-6 py-8 transition-all relative`}
              >
                Meeting 3
                {isRecommended("Meeting-3") && (
                  <Sparkles className="w-4 h-4 text-purple-200 absolute top-1 right-1" />
                )}
              </button>
              <button
                onClick={() => {
                  const workspace = getWorkspaceById("Booth-1");
                  workspace && onSelectWorkspace(workspace);
                }}
                className={`${getStatusColor(getWorkspaceById("Booth-1")?.status || "available")} ${
                  selectedWorkspace?.id === "Booth-1" ? "ring-4 ring-teal-600" : ""
                } ${
                  isRecommended("Booth-1") ? "ring-2 ring-purple-500 shadow-lg shadow-purple-300" : ""
                } text-white font-medium rounded-md px-6 py-8 transition-all relative`}
              >
                Booth 1
                {isRecommended("Booth-1") && (
                  <Sparkles className="w-4 h-4 text-purple-200 absolute top-1 right-1" />
                )}
              </button>
              <button
                onClick={() => {
                  const workspace = getWorkspaceById("Booth-2");
                  workspace && onSelectWorkspace(workspace);
                }}
                className={`${getStatusColor(getWorkspaceById("Booth-2")?.status || "available")} ${
                  selectedWorkspace?.id === "Booth-2" ? "ring-4 ring-teal-600" : ""
                } ${
                  isRecommended("Booth-2") ? "ring-2 ring-purple-500 shadow-lg shadow-purple-300" : ""
                } text-white font-medium rounded-md px-6 py-8 transition-all relative`}
              >
                Booth 2
                {isRecommended("Booth-2") && (
                  <Sparkles className="w-4 h-4 text-purple-200 absolute top-1 right-1" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Click on any workspace to view details and reserve
      </p>
    </div>
  );
}
