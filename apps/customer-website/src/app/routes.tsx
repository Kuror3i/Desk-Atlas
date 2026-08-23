import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { WorkspaceDiscoveryPage } from "./pages/WorkspaceDiscoveryPage";
import { ReservationFlowPage } from "./pages/ReservationFlowPage";
import { ManageBookingPage } from "./pages/ManageBookingPage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "workspaces",
        Component: WorkspaceDiscoveryPage,
      },
      {
        path: "reserve",
        Component: ReservationFlowPage,
      },
      {
        path: "manage-booking",
        Component: ManageBookingPage,
      },
    ],
  },
]);
