"use client";

interface WorkspaceDeskPickerProps {
  template: any;
  workspaces: any[];
  onSelect: (workspace: any) => void;
  onBack: () => void;
  kioskMarker?: any;
  floor?: any;
}

export function WorkspaceDeskPicker({ template, workspaces, onSelect, onBack, kioskMarker, floor }: WorkspaceDeskPickerProps) {
  return (
    <main data-screen-label="Kiosk Desk Picker">
      <div style={{ marginBottom: "20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#65736A", fontSize: "20px", cursor: "pointer", textDecoration: "underline" }}>
          ← Back
        </button>
      </div>
      <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#0C3B27", margin: "0 0 20px" }}>
        Pick your {template.name}
      </h1>
      {kioskMarker && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "10px 18px", marginBottom: "28px", color: "#991B1B", fontWeight: 700, fontSize: "16px" }}>
          <span style={{ fontSize: "20px" }}>📍</span>
          <span>You are here: <strong>{kioskMarker.label || 'Kiosk Location'}</strong>{floor?.name ? ` on ${floor.name}` : ''}</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
        {workspaces.map(ws => {
          const available = ws.operational_status === "ACTIVE"; // Actual availability is checked in next step, but here we just check if it's ACTIVE
          return (
            <button 
              key={ws.id}
              onClick={() => available && onSelect(ws)} 
              disabled={!available} 
              style={{
                padding: "30px 16px", borderRadius: "20px", textAlign: "center", 
                cursor: available ? "pointer" : "not-allowed",
                background: available ? "#FFFFFF" : "#F0F2F1",
                border: available ? "2px solid #DCE6DF" : "2px solid #E1E9E3",
                color: available ? "#12251A" : "#8E9992"
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px" }}>
                {ws.name}
              </div>
              <div style={{ fontSize: "16px", fontFamily: "'Inter', sans-serif" }}>
                {available ? "Available to book" : "Maintenance"}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
