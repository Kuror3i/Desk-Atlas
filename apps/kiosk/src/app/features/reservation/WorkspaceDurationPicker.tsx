"use client";

interface WorkspaceDurationPickerProps {
  template: any;
  durationHours: number;
  onSelectDuration: (hours: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let hour = parseInt(hStr, 10);
  const minute = mStr || "00";
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

export function WorkspaceDurationPicker({
  template,
  durationHours,
  onSelectDuration,
  onNext,
  onBack,
}: WorkspaceDurationPickerProps) {
  const rate = Number(template.rate_amount ?? template.rateAmount ?? 0);
  const totalAmount = rate * durationHours;

  // Compute immediate time window starting now in local time
  const now = new Date();
  const startHour = now.getHours();
  const startMinute = now.getMinutes();
  const startStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;

  const endTotalMinutes = startHour * 60 + startMinute + durationHours * 60;
  const endHour = Math.floor(endTotalMinutes / 60) % 24;
  const endMinute = endTotalMinutes % 60;
  const endStr = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

  return (
    <main data-screen-label="Kiosk Duration Picker" style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#65736A",
            fontSize: "20px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ← Back to Categories
        </button>
      </div>

      <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#0C3B27", margin: "0 0 8px" }}>
        How long do you need the {template.name}?
      </h1>
      <p style={{ fontSize: "20px", color: "#65736A", margin: "0 0 32px" }}>
        Walk-in bookings start immediately. Choose your duration below.
      </p>

      {/* Immediate time window banner */}
      <div
        style={{
          background: "#E8F5E9",
          border: "1px solid #C8E6C9",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#2E7D32", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Immediate Walk-In Window
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#1B5E20", marginTop: "4px" }}>
            Starting Now ({formatTime12Hour(startStr)}) → {formatTime12Hour(endStr)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14px", color: "#65736A" }}>Estimated Total</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#0C3B27" }}>
            ₱{totalAmount}
          </div>
        </div>
      </div>

      {/* Duration grid options */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        {DURATION_OPTIONS.map((hours) => {
          const isSelected = durationHours === hours;
          const cost = rate * hours;
          return (
            <button
              key={hours}
              type="button"
              onClick={() => onSelectDuration(hours)}
              style={{
                padding: "24px 16px",
                borderRadius: "18px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: isSelected ? "#0C3B27" : "#FFFFFF",
                border: isSelected ? "3px solid #0C3B27" : "2px solid #E1E9E3",
                color: isSelected ? "#FFFFFF" : "#12251A",
                boxShadow: isSelected ? "0 8px 20px rgba(12, 59, 39, 0.18)" : "none",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 800, marginBottom: "4px" }}>
                {hours} {hours === 1 ? "hr" : "hrs"}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: isSelected ? "#C8F451" : "#65736A",
                }}
              >
                ₱{cost}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        style={{
          width: "100%",
          padding: "22px",
          borderRadius: "16px",
          background: "#0C3B27",
          color: "#FFFFFF",
          border: "none",
          fontSize: "22px",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(12, 59, 39, 0.2)",
        }}
      >
        Continue to Pick a Spot →
      </button>
    </main>
  );
}
