"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeScreen } from "../features/welcome/WelcomeScreen";
import { KioskScanner } from "../features/qr-scanner/KioskScanner";

export default function KioskStartPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);

  if (showScanner) {
    return <KioskScanner onCancel={() => setShowScanner(false)} />;
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100svh",
      margin: 0,
      background: "#0C3B27",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <WelcomeScreen 
        onStart={() => router.push("/kiosk/reserve")} 
        onOpenScanner={() => setShowScanner(true)}
      />
    </div>
  );
}
