import { createBrowserRouter, Navigate } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardHome } from "./components/DashboardHome";
import { ReservationsScreen } from "./components/ReservationsScreen";
import { ActiveSessionsScreen } from "./components/ActiveSessionsScreen";
import { VisitorActivityScreen } from "./components/VisitorActivityScreen";
import { WorkspaceStatusScreen } from "./components/WorkspaceStatusScreen";
import { RecordSearchScreen } from "./components/RecordSearchScreen";
import { KioskStatusScreen } from "./components/KioskStatusScreen";
import { StaffAssistantScreen } from "./components/StaffAssistantScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { RoleSelection } from "./components/RoleSelection";
import { StaffLogin } from "./components/StaffLogin";
import { ForgotPassword } from "./components/ForgotPassword";
import { ProtectedDashboardLayout } from "./components/ProtectedDashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RoleSelection,
  },
  {
    path: "/login",
    Component: StaffLogin,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/dashboard",
    Component: ProtectedDashboardLayout,
    children: [
      { index: true, Component: DashboardHome },
      { path: "reservations", Component: ReservationsScreen },
      { path: "active-sessions", Component: ActiveSessionsScreen },
      { path: "visitor-activity", Component: VisitorActivityScreen },
      { path: "workspace-status", Component: WorkspaceStatusScreen },
      { path: "record-search", Component: RecordSearchScreen },
      { path: "kiosk-status", Component: KioskStatusScreen },
      { path: "staff-assistant", Component: StaffAssistantScreen },
      { path: "settings", Component: SettingsScreen },
    ],
  },
]);
