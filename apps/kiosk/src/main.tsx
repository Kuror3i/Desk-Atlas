
import { createRoot } from "react-dom/client";
import { createDemoUser } from "@deskatlas/domain";
import { AppShell, StatusBadge } from "@deskatlas/ui";
import App from "./app/App.tsx";
import "./styles/index.css";

const user = createDemoUser("staff");
console.info("DeskAtlas shared domain user", user);

createRoot(document.getElementById("root")!).render(
  <AppShell title="DeskAtlas Kiosk" subtitle="Shared shell for front-desk and service workflows">
    <div className="flex items-center gap-3">
      <StatusBadge label="Online" tone="warning" />
      <span className="text-sm text-slate-400">Assisting {user.name}</span>
    </div>
    <div className="mt-6">
      <App />
    </div>
  </AppShell>
);
  