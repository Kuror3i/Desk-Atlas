"use client";

import { useEffect, useState } from "react";

interface ReservationTimePickerProps {
  workspace: any;
  date: string;
  onSelect: (time: string) => void;
  onBack: () => void;
}

export function ReservationTimePicker({ workspace, date, onSelect, onBack }: ReservationTimePickerProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/availability?workspaceInstanceId=${workspace.id}&date=${date}&durationMinutes=120`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSlots(data.availability || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [workspace.id, date]);

  return (
    <main data-screen-label="Kiosk Time Picker">
      <div style={{ marginBottom: "20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#65736A", fontSize: "20px", cursor: "pointer", textDecoration: "underline" }}>
          ← Back
        </button>
      </div>
      <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#0C3B27", margin: "0 0 8px" }}>
        When would you like to start?
      </h1>
      <p style={{ fontSize: "22px", color: "#65736A", margin: "0 0 36px" }}>
        {workspace.name} · Date: {date}
      </p>

      {loading && <div style={{ fontSize: "24px" }}>Loading available slots...</div>}
      {error && <div style={{ color: "red", fontSize: "24px" }}>{error}</div>}

      {!loading && !error && slots.length === 0 && (
        <div style={{ fontSize: "24px" }}>No available slots for this duration today.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        {slots.map(slot => {
          const disabled = !slot.available;
          return (
            <button 
              key={slot.startTime}
              onClick={() => !disabled && onSelect(slot.startTime)} 
              disabled={disabled} 
              style={{
                padding: "26px 0", borderRadius: "18px", fontSize: "26px", fontWeight: 800, 
                cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif",
                background: disabled ? "#F0F2F1" : "#FFFFFF",
                color: disabled ? "#B5BDB8" : "#12251A",
                border: disabled ? "none" : "2px solid #DCE6DF"
              }}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
    </main>
  );
}
