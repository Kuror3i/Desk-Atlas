
import { createRoot } from "react-dom/client";
import { createDemoUser } from "@deskatlas/domain";
import { AppShell, StatusBadge } from "@deskatlas/ui";
import App from "./app/App.tsx";
import "./styles/index.css";

const user = createDemoUser("admin");
console.info("DeskAtlas shared domain user", user);

createRoot(document.getElementById("root")!).render(
  <AppShell title="DeskAtlas Admin" subtitle="Shared shell for the internal operations experience">
    <div className="flex items-center gap-3">
      <StatusBadge label="Live" tone="positive" />
      <span className="text-sm text-slate-400">Signed in as {user.name}</span>
    </div>
    <div className="mt-6">
      <App />
    </div>
  </AppShell>
);
  