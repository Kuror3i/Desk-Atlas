"use client";

import dynamic from "next/dynamic";
import { createDemoUser } from "@deskatlas/domain";
import { AppShell, StatusBadge } from "@deskatlas/ui";

const CustomerApp = dynamic(() => import("./App"), { ssr: false });

export function NextExperience() {
  const user = createDemoUser("customer");

  return (
    <AppShell title="DeskAtlas Customer" subtitle="Shared shell for guest-facing experiences">
      <div className="flex items-center gap-3">
        <StatusBadge label="Ready" tone="default" />
        <span className="text-sm text-slate-400">Viewing as {user.name}</span>
      </div>
      <div className="mt-6">
        <CustomerApp />
      </div>
    </AppShell>
  );
}
