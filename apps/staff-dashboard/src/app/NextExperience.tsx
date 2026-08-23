"use client";

import dynamic from "next/dynamic";

const StaffApp = dynamic(() => import("./App"), { ssr: false });

export function NextExperience() {
  return <StaffApp />;
}
