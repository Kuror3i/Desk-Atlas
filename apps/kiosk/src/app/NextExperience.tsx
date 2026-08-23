"use client";

import dynamic from "next/dynamic";
import { createDemoUser } from "@deskatlas/domain";
import { AppShell, StatusBadge } from "@deskatlas/ui";

const KioskApp = dynamic(() => import("./App"), { ssr: false });

export function NextExperience() {
  const user = createDemoUser("staff");

  return (
    <AppShell title="DeskAtlas Kiosk" subtitle="Shared shell for front-desk and service workflows">
      <div className="flex items-center gap-3">
        <StatusBadge label="Online" tone="warning" />
        <span className="text-sm text-slate-400">Assisting {user.name}</span>
      </div>
      <div className="mt-6">
        <KioskApp />
      </div>
    </AppShell>
  );
}
