"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SessionManagerProps {
  children: ReactNode;
  timeoutMs?: number;
  onTimeoutWarning?: () => void;
  onReset: () => void;
}

export function SessionManager({ 
  children, 
  timeoutMs = 60000, // 1 minute for kiosk inactivity
  onTimeoutWarning,
  onReset
}: SessionManagerProps) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (onTimeoutWarning) {
        onTimeoutWarning();
      }
      onReset();
      router.push("/kiosk");
    }, timeoutMs);
  };

  useEffect(() => {
    resetTimer();
    const events = ["mousedown", "touchstart", "keydown", "scroll"];
    const handleActivity = () => resetTimer();
    
    events.forEach(evt => window.addEventListener(evt, handleActivity));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, []);

  return (
    <>
      {children}
      {/* Staff manual reset control (hidden in corner) */}
      <button
        onClick={() => {
          onReset();
          router.push("/kiosk");
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          width: "40px",
          height: "40px",
          opacity: 0.1,
          background: "red",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer"
        }}
        title="Staff Reset"
      />
    </>
  );
}
