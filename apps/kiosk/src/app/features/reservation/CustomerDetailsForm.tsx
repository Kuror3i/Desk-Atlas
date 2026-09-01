"use client";

interface CustomerDetailsFormProps {
  value: { firstName: string; lastName: string; email: string };
  template: any;
  desk: any;
  durationHours: number;
  onChange: (val: { firstName: string; lastName: string; email: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CustomerDetailsForm({
  value,
  template,
  desk,
  durationHours,
  onChange,
  onNext,
  onBack,
}: CustomerDetailsFormProps) {
  const isValid =
    value.firstName.trim() !== "" &&
    value.lastName.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim());

  const rate = Number(template?.rate_amount ?? template?.rateAmount ?? 0);
  const amountDue = rate * durationHours;

  const inputStyle = {
    width: "100%",
    padding: "18px 20px",
    borderRadius: "14px",
    border: "2px solid #E1E9E3",
    fontSize: "20px",
    marginBottom: "20px",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box" as const,
  };

  return (
    <main data-screen-label="Kiosk Customer Details" style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
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
          ← Back to Spot Selection
        </button>
      </div>

      <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#0C3B27", margin: "0 0 10px" }}>
        Guest Contact Details
      </h1>
      <p style={{ fontSize: "18px", color: "#65736A", margin: "0 0 28px" }}>
        Your booking pass QR code will be emailed here once confirmed.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px", alignItems: "flex-start" }}>
        <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "32px", border: "1px solid #E1E9E3" }}>
          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "#12251A", marginBottom: "8px" }}>
              First Name
            </label>
            <input
              type="text"
              value={value.firstName}
              onChange={(e) => onChange({ ...value, firstName: e.target.value })}
              style={inputStyle}
              placeholder="e.g. Juan"
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "#12251A", marginBottom: "8px" }}>
              Last Name
            </label>
            <input
              type="text"
              value={value.lastName}
              onChange={(e) => onChange({ ...value, lastName: e.target.value })}
              style={inputStyle}
              placeholder="e.g. Dela Cruz"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "#12251A", marginBottom: "8px" }}>
              Email Address
            </label>
            <input
              type="email"
              value={value.email}
              onChange={(e) => onChange({ ...value, email: e.target.value })}
              style={inputStyle}
              placeholder="e.g. juan@example.com"
            />
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!isValid}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "20px",
              borderRadius: "14px",
              background: isValid ? "#0C3B27" : "#E2E8E4",
              color: isValid ? "#FFFFFF" : "#8E9992",
              border: "none",
              fontSize: "20px",
              fontWeight: 800,
              cursor: isValid ? "pointer" : "not-allowed",
              boxShadow: isValid ? "0 6px 20px rgba(12, 59, 39, 0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Continue to Counter Payment →
          </button>
        </div>

        {/* Booking summary sidebar */}
        <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", border: "1px solid #E1E9E3" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#65736A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
            Booking Summary
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0C3B27", marginBottom: "4px" }}>
            {desk?.name || desk?.displayName}
          </div>
          <div style={{ fontSize: "16px", color: "#65736A", marginBottom: "18px" }}>
            {template?.name} · Starting Now
          </div>

          <div style={{ borderTop: "1px solid #E1E9E3", paddingTop: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "16px" }}>
              <span style={{ color: "#65736A" }}>Duration:</span>
              <span style={{ fontWeight: 700, color: "#12251A" }}>{durationHours} {durationHours === 1 ? "hour" : "hours"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "16px" }}>
              <span style={{ color: "#65736A" }}>Hourly Rate:</span>
              <span style={{ fontWeight: 600, color: "#12251A" }}>₱{rate}/hr</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px dashed #E1E9E3", fontSize: "20px" }}>
              <span style={{ fontWeight: 800, color: "#0C3B27" }}>Total Amount:</span>
              <span style={{ fontWeight: 800, color: "#0C3B27" }}>₱{amountDue}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
