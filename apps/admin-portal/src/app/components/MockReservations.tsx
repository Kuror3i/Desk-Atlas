const reservations = [
  {
    id: "res-1001",
    workspace: "Desk A5",
    customerName: "Maya Collins",
    startTime: "2026-05-28T09:00:00",
    endTime: "2026-05-28T13:00:00",
    status: "confirmed",
  },
  {
    id: "res-1002",
    workspace: "Meeting Room B",
    customerName: "Northstar Design",
    startTime: "2026-05-28T10:30:00",
    endTime: "2026-05-28T12:00:00",
    status: "pending payment review",
  },
  {
    id: "res-1003",
    workspace: "Hot Desk B12",
    customerName: "Eli Moreno",
    startTime: "2026-05-28T14:00:00",
    endTime: "2026-05-28T18:00:00",
    status: "checked in",
  },
];

export function MockReservations() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-2">Upcoming Reservations (7 days)</h3>
      <ul className="space-y-2">
        {reservations.map((reservation) => (
          <li key={reservation.id} className="text-sm">
            <div className="font-medium">
              {reservation.customerName} - {reservation.workspace}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(reservation.startTime).toLocaleString()} -{" "}
              {new Date(reservation.endTime).toLocaleString()}
            </div>
            <div className="text-xs">Status: {reservation.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
