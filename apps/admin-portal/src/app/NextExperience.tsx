"use client";

import dynamic from "next/dynamic";
import { createDemoUser } from "@deskatlas/domain";
import { AppShell, StatusBadge } from "@deskatlas/ui";

const AdminApp = dynamic(() => import("./App"), { ssr: false });

export function NextExperience() {
  const user = createDemoUser("admin");

  return (
    <AppShell
      title="DeskAtlas Admin"
      subtitle="Shared shell for the internal operations experience"
    >
      <div className="flex items-center gap-3">
        <StatusBadge label="Live" tone="positive" />
        <span className="text-sm text-slate-400">Signed in as {user.name}</span>
      </div>
      <div className="mt-6">
        <AdminApp />
      </div>
    </AppShell>
  );
}
