import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Filter, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { WorkspaceMap } from "../components/WorkspaceMap";
import { WorkspaceDetailPanel } from "../components/WorkspaceDetailPanel";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export interface Workspace {
  id: string;
  name: string;
  type: "zone-a" | "zone-b" | "meeting-room" | "booth";
  status: "available" | "reserved" | "occupied" | "unavailable";
  description: string;
  rate: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function WorkspaceDiscoveryPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    time: "09:00",
    duration: "4",
    availableOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const timeSlots = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  const generateWorkspaces = (): Workspace[] => {
    const workspaces: Workspace[] = [];
    const statuses: Workspace["status"][] = ["available", "reserved", "occupied", "unavailable"];

    // Zone A desks (A1-A12)
    for (let i = 1; i <= 12; i++) {
      workspaces.push({
        id: `A${i}`,
        name: `Zone A - Desk ${i}`,
        type: "zone-a",
        status: i === 3 ? "unavailable" : i === 5 ? "reserved" : i === 8 ? "occupied" : i === 11 ? "unavailable" : "available",
        description: "Shared workspace with high-speed WiFi and power outlets",
        rate: "$15/day",
        image: "https://images.unsplash.com/photo-1562664348-2188b99b5157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    }

    // Zone B desks (B1-B12)
    for (let i = 1; i <= 12; i++) {
      workspaces.push({
        id: `B${i}`,
        name: `Zone B - Desk ${i}`,
        type: "zone-b",
        status: i === 4 ? "reserved" : i === 10 ? "unavailable" : i === 11 ? "unavailable" : "available",
        description: "Shared workspace with high-speed WiFi and power outlets",
        rate: "$15/day",
        image: "https://images.unsplash.com/photo-1562664348-2188b99b5157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    }

    // Meeting rooms
    workspaces.push(
      {
        id: "Meeting-1",
        name: "Meeting Room 1",
        type: "meeting-room",
        status: "available",
        description: "Private room for 4-8 people with AV equipment",
        rate: "$60/hour",
        image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      {
        id: "Meeting-2",
        name: "Meeting Room 2",
        type: "meeting-room",
        status: "reserved",
        description: "Private room for 4-8 people with AV equipment",
        rate: "$60/hour",
        image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      {
        id: "Meeting-3",
        name: "Meeting Room 3",
        type: "meeting-room",
        status: "available",
        description: "Private room for 4-8 people with AV equipment",
        rate: "$60/hour",
        image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      {
        id: "Booth-1",
        name: "Booth 1",
        type: "booth",
        status: "available",
        description: "Private booth for focused work",
        rate: "$25/day",
        image: "https://images.unsplash.com/photo-1626187777040-ffb7cb2c5450?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8Y293b3JraW5nJTIwc3BhY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzc4ODUzMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      {
        id: "Booth-2",
        name: "Booth 2",
        type: "booth",
        status: "available",
        description: "Private booth for focused work",
        rate: "$25/day",
        image: "https://images.unsplash.com/photo-1626187777040-ffb7cb2c5450?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8Y293b3JraW5nJTIwc3BhY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzc4ODUzMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }
    );

    return workspaces;
  };

  const workspaces = generateWorkspaces();

  const filteredWorkspaces = workspaces.filter((workspace) => {
    if (filters.type !== "all" && workspace.type !== filters.type) return false;
    if (filters.availableOnly && workspace.status !== "available") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Discover Workspaces</h1>
          <p className="text-gray-600">
            Select a workspace from the interactive map to view details and reserve
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mb-4"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div
            className={`${
              showFilters ? "block" : "hidden"
            } md:flex flex-wrap gap-4 items-end`}
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Types</option>
                <option value="zone-a">Zone A</option>
                <option value="zone-b">Zone B</option>
                <option value="meeting-room">Meeting Room</option>
                <option value="booth">Booth</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px] relative" ref={calendarRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span>{selectedDate.toLocaleDateString()}</span>
                <CalendarIcon className="w-4 h-4 text-gray-500" />
              </button>
              {showCalendar && (
                <div className="absolute top-full mt-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    className="rdp-custom"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-[200px] relative" ref={timeDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <button
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span>{filters.time}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showTimeDropdown && (
                <div className="absolute top-full mt-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto w-full">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setFilters({ ...filters, time });
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                        filters.time === time ? "bg-teal-50 text-teal-600" : "text-gray-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={filters.duration}
                onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="available-only"
                checked={filters.availableOnly}
                onChange={(e) =>
                  setFilters({ ...filters, availableOnly: e.target.checked })
                }
                className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
              />
              <label htmlFor="available-only" className="text-sm font-medium text-gray-700">
                Available Only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Detail Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map */}
          <div className="flex-1">
            <WorkspaceMap
              workspaces={filteredWorkspaces}
              selectedWorkspace={selectedWorkspace}
              onSelectWorkspace={setSelectedWorkspace}
            />
          </div>

          {/* Detail Panel */}
          {selectedWorkspace && (
            <div className="lg:w-96">
              <WorkspaceDetailPanel
                workspace={selectedWorkspace}
                onClose={() => setSelectedWorkspace(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
