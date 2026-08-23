
import { createRoot } from "react-dom/client";
import { createDemoUser } from "@deskatlas/domain";
import { AppShell, StatusBadge } from "@deskatlas/ui";
import App from "./app/App.tsx";
import "./styles/index.css";

const user = createDemoUser("customer");
console.info("DeskAtlas shared domain user", user);

createRoot(document.getElementById("root")!).render(
  <AppShell title="DeskAtlas Customer" subtitle="Shared shell for guest-facing experiences">
    <div className="flex items-center gap-3">
      <StatusBadge label="Ready" tone="default" />
      <span className="text-sm text-slate-400">Viewing as {user.name}</span>
    </div>
    <div className="mt-6">
      <App />
    </div>
  </AppShell>
);
  