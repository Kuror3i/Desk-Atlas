"use client";

interface CounterPaymentFlowProps {
  amountDue: number;
  onPay: (method: "counter_cash" | "counter_qr") => void;
  onBack: () => void;
}

export function CounterPaymentFlow({ amountDue, onPay, onBack }: CounterPaymentFlowProps) {
  return (
    <main data-screen-label="Kiosk Review Pay">
      <div style={{ marginBottom: "20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#65736A", fontSize: "20px", cursor: "pointer", textDecoration: "underline" }}>
          ← Back
        </button>
      </div>
      <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#0C3B27", margin: "0 0 32px" }}>
        Confirm and pay
      </h1>
      
      <div style={{ background: "#FFFFFF", borderRadius: "22px", padding: "32px", marginBottom: "28px", maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "18px", marginTop: "10px" }}>
          <span style={{ fontSize: "26px", fontWeight: 800, color: "#0C3B27" }}>Amount Due</span>
          <span style={{ fontSize: "30px", fontWeight: 800, color: "#0C3B27" }}>₱{amountDue}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "600px" }}>
        <button 
          onClick={() => onPay("counter_qr")} 
          style={{ background: "#0C3B27", color: "#fff", border: "none", borderRadius: "20px", padding: "34px", fontSize: "26px", fontWeight: 800, cursor: "pointer" }}
        >
          Counter QR
        </button>
        <button 
          onClick={() => onPay("counter_cash")} 
          style={{ background: "#FFFFFF", border: "2px solid #C3D3C8", color: "#154A32", borderRadius: "20px", padding: "34px", fontSize: "26px", fontWeight: 800, cursor: "pointer" }}
        >
          Pay Cash
        </button>
      </div>
    </main>
  );
}
