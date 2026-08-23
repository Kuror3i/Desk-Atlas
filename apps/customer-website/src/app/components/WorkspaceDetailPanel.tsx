import { X, MapPin, Users, Wifi, Monitor } from "lucide-react";
import { Link } from "react-router";
import { Workspace } from "../pages/WorkspaceDiscoveryPage";

interface WorkspaceDetailPanelProps {
  workspace: Workspace;
  onClose: () => void;
}

export function WorkspaceDetailPanel({ workspace, onClose }: WorkspaceDetailPanelProps) {
  const getStatusBadge = (status: Workspace["status"]) => {
    switch (status) {
      case "available":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Available
          </span>
        );
      case "reserved":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            Reserved
          </span>
        );
      case "occupied":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            Occupied
          </span>
        );
      case "unavailable":
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            Unavailable
          </span>
        );
    }
  };

  const getTypeLabel = (type: Workspace["type"]) => {
    switch (type) {
      case "zone-a":
        return "Zone A Desk";
      case "zone-b":
        return "Zone B Desk";
      case "meeting-room":
        return "Meeting Room";
      case "booth":
        return "Private Booth";
    }
  };

  const getAmenities = (type: Workspace["type"]) => {
    switch (type) {
      case "zone-a":
        return [
          { icon: Wifi, label: "High-Speed WiFi" },
          { icon: Users, label: "Shared Space" },
        ];
      case "zone-b":
        return [
          { icon: Wifi, label: "High-Speed WiFi" },
          { icon: Users, label: "Shared Space" },
        ];
      case "meeting-room":
        return [
          { icon: Wifi, label: "High-Speed WiFi" },
          { icon: Users, label: "4-8 People" },
          { icon: Monitor, label: "AV Equipment" },
        ];
      case "booth":
        return [
          { icon: Wifi, label: "High-Speed WiFi" },
          { icon: Users, label: "Private Space" },
          { icon: MapPin, label: "Focused Work" },
        ];
    }
  };

  const amenities = getAmenities(workspace.type);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-20">
      {/* Header with close button */}
      <div className="flex justify-between items-start p-4 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
          <p className="text-sm text-gray-600">{getTypeLabel(workspace.type)}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Featured Image */}
      <div className="relative">
        <img
          src={workspace.image}
          alt={workspace.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">{getStatusBadge(workspace.status)}</div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-600">{workspace.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
          <div className="space-y-2">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <amenity.icon className="w-4 h-4 text-teal-600" />
                <span>{amenity.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Rate</span>
            <span className="text-lg font-semibold text-gray-900">{workspace.rate}</span>
          </div>

          {workspace.status === "available" ? (
            <Link
              to="/reserve"
              state={{ workspace }}
              className="block w-full px-4 py-3 bg-teal-600 text-white text-center rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Reserve This Workspace
            </Link>
          ) : (
            <button
              disabled
              className="w-full px-4 py-3 bg-gray-300 text-gray-500 text-center rounded-lg cursor-not-allowed font-medium"
            >
              Not Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
