"use client";

interface WorkspaceTypePickerProps {
  templates: any[];
  workspaces: any[];
  onSelect: (template: any) => void;
}

export function WorkspaceTypePicker({ templates, workspaces, onSelect }: WorkspaceTypePickerProps) {
  return (
    <main data-screen-label="Kiosk Type Picker">
      <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#0C3B27", margin: "0 0 40px" }}>
        What kind of workspace do you need?
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        {templates.map(tpl => {
          const count = workspaces.filter(w => w.template_id === tpl.id && w.operational_status === "ACTIVE").length;
          return (
            <button 
              key={tpl.id}
              onClick={() => onSelect(tpl)} 
              style={{
                textAlign: "left", background: "#FFFFFF", border: "2px solid #E1E9E3", 
                borderRadius: "24px", padding: "32px", cursor: "pointer"
              }}
            >
              <div style={{ fontSize: "30px", fontWeight: 800, color: "#12251A", marginBottom: "10px" }}>
                {tpl.name}
              </div>
              <div style={{ fontSize: "20px", color: "#65736A", fontFamily: "'Inter', sans-serif" }}>
                ₱{tpl.rate_amount}/hr · Capacity {tpl.capacity} · {count} active
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
