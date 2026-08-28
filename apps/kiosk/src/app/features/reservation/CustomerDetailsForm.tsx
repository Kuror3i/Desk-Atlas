"use client";

interface CustomerDetailsFormProps {
  value: { firstName: string; lastName: string; email: string };
  onChange: (val: { firstName: string; lastName: string; email: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CustomerDetailsForm({ value, onChange, onNext, onBack }: CustomerDetailsFormProps) {
  const isValid = value.firstName.trim() !== "" && value.lastName.trim() !== "" && value.email.includes("@");

  const inputStyle = {
    width: "100%", padding: "20px 24px", borderRadius: "16px", border: "2px solid #E1E9E3", 
    fontSize: "24px", marginBottom: "24px", outline: "none", fontFamily: "'Inter', sans-serif"
  };

  return (
    <main data-screen-label="Kiosk Customer Details">
      <div style={{ marginBottom: "20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#65736A", fontSize: "20px", cursor: "pointer", textDecoration: "underline" }}>
          ← Back
        </button>
      </div>
      <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#0C3B27", margin: "0 0 40px" }}>
        Who is booking?
      </h1>
      
      <div style={{ background: "#FFFFFF", borderRadius: "24px", padding: "40px", maxWidth: "600px" }}>
        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 700, color: "#12251A", marginBottom: "12px" }}>First Name</label>
          <input 
            type="text" 
            value={value.firstName} 
            onChange={e => onChange({ ...value, firstName: e.target.value })} 
            style={inputStyle} 
            placeholder="Juan"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 700, color: "#12251A", marginBottom: "12px" }}>Last Name</label>
          <input 
            type="text" 
            value={value.lastName} 
            onChange={e => onChange({ ...value, lastName: e.target.value })} 
            style={inputStyle} 
            placeholder="Dela Cruz"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 700, color: "#12251A", marginBottom: "12px" }}>Email</label>
          <input 
            type="email" 
            value={value.email} 
            onChange={e => onChange({ ...value, email: e.target.value })} 
            style={inputStyle} 
            placeholder="juan@example.com"
          />
        </div>

        <button 
          onClick={onNext} 
          disabled={!isValid}
          style={{
            width: "100%", marginTop: "20px", padding: "24px", borderRadius: "16px",
            background: isValid ? "#0C3B27" : "#F0F2F1",
            color: isValid ? "#fff" : "#B5BDB8",
            border: "none", fontSize: "24px", fontWeight: 800,
            cursor: isValid ? "pointer" : "not-allowed"
          }}
        >
          Continue
        </button>
      </div>
    </main>
  );
}
