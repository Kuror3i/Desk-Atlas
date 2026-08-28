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
      width: "1080px", height: "1920px", margin: "0 auto", 
      background: "#F3F7F4", position: "relative", overflow: "hidden", 
      display: "flex", flexDirection: "column"
    }}>
      <WelcomeScreen 
        onStart={() => router.push("/kiosk/reserve")} 
        onOpenScanner={() => setShowScanner(true)}
      />
    </div>
  );
}
