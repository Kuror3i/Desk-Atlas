import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "./DashboardLayout";

export function ProtectedDashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
