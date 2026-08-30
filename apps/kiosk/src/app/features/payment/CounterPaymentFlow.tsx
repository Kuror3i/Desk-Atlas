"use client";

interface CounterPaymentFlowProps {
  amountDue: number;
  template: any;
  desk: any;
  durationHours: number;
  customer: { firstName: string; lastName: string; email: string };
  isSubmitting?: boolean;
  onPay: (method: "counter_cash" | "counter_qr") => void;
  onBack: () => void;
}

export function CounterPaymentFlow({
  amountDue,
  template,
  desk,
  durationHours,
  customer,
  isSubmitting,
  onPay,
  onBack,
}: CounterPaymentFlowProps) {
  return (
    <main data-screen-label="Kiosk Review Pay" style={{ maxWidth: "700px", margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={onBack}
          disabled={isSubmitting}
          style={{
            background: "none",
            border: "none",
            color: "#65736A",
            fontSize: "20px",
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ← Back to Guest Details
        </button>
      </div>

      <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#0C3B27", margin: "0 0 10px" }}>
        Confirm & Choose Counter Payment
      </h1>
      <p style={{ fontSize: "18px", color: "#65736A", margin: "0 0 28px" }}>
        Select how you will pay at the counter to generate your check-in code.
      </p>

      {/* Booking summary card */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "28px 32px",
          marginBottom: "28px",
          border: "1px solid #E1E9E3",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0C3B27" }}>
              {desk?.name || desk?.displayName}
            </div>
            <div style={{ fontSize: "16px", color: "#65736A" }}>
              {template?.name} · Starting Now · {durationHours} {durationHours === 1 ? "hour" : "hours"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", color: "#65736A" }}>Guest</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#12251A" }}>
              {customer.firstName} {customer.lastName}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "16px",
            marginTop: "12px",
            borderTop: "1px solid #E1E9E3",
          }}
        >
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#0C3B27" }}>Total Amount Due</span>
          <span style={{ fontSize: "32px", fontWeight: 800, color: "#0C3B27" }}>₱{amountDue}</span>
        </div>
      </div>

      {/* Payment Method buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <button
          type="button"
          onClick={() => onPay("counter_cash")}
          disabled={isSubmitting}
          style={{
            background: "#FFFFFF",
            border: "2px solid #0C3B27",
            color: "#0C3B27",
            borderRadius: "18px",
            padding: "28px 20px",
            fontSize: "22px",
            fontWeight: 800,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            textAlign: "center",
            transition: "all 0.15s ease",
            boxShadow: "0 4px 12px rgba(12, 59, 39, 0.08)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💵</div>
          <div>Pay Cash at Counter</div>
        </button>

        <button
          type="button"
          onClick={() => onPay("counter_qr")}
          disabled={isSubmitting}
          style={{
            background: "#0C3B27",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "18px",
            padding: "28px 20px",
            fontSize: "22px",
            fontWeight: 800,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            textAlign: "center",
            transition: "all 0.15s ease",
            boxShadow: "0 6px 20px rgba(12, 59, 39, 0.2)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📱</div>
          <div>Counter QR (GCash)</div>
        </button>
      </div>

      {isSubmitting && (
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "18px", color: "#65736A" }}>
          Submitting reservation...
        </div>
      )}
    </main>
  );
}
