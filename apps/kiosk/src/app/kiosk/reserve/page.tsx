"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionManager } from "../../features/session/SessionManager";

import { WorkspaceTypePicker } from "../../features/reservation/WorkspaceTypePicker";
import { WorkspaceDeskPicker } from "../../features/reservation/WorkspaceDeskPicker";
import { ReservationTimePicker } from "../../features/reservation/ReservationTimePicker";
import { CustomerDetailsForm } from "../../features/reservation/CustomerDetailsForm";
import { CounterPaymentFlow } from "../../features/payment/CounterPaymentFlow";

type FlowStep = "type" | "desk" | "time" | "details" | "pay" | "done";

export default function KioskReservationFlow() {
  const router = useRouter();
  
  const [step, setStep] = useState<FlowStep>("type");
  
  // Data
  const [publishedMap, setPublishedMap] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState(true);

  // Selections
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [activeDesk, setActiveDesk] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({ firstName: "", lastName: "", email: "" });
  const [reservationResult, setReservationResult] = useState<any>(null);

  useEffect(() => {
    // Load published map on mount
    fetch("/api/published-map")
      .then(r => r.json())
      .then(data => {
        setPublishedMap(data.published);
        setLoadingMap(false);
      })
      .catch(console.error);

    // Default to today for simplified Kiosk flow
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  const handleReset = () => {
    setStep("type");
    setActiveTemplate(null);
    setActiveDesk(null);
    setSelectedTime("");
    setCustomerInfo({ firstName: "", lastName: "", email: "" });
    setReservationResult(null);
  };

  const submitReservation = async (paymentMethod: "counter_cash" | "counter_qr") => {
    // POST /api/reservations
    // We expect the backend to accept kiosk reservation
    const body = {
      workspaceInstanceId: activeDesk.id,
      date: selectedDate,
      startTime: selectedTime,
      durationMinutes: 120, // Kiosk hardcoded or selected (simplifying to 120 for MVP)
      customer: customerInfo,
      paymentMethod,
      source: "KIOSK"
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setReservationResult(data);
        setStep("done");
      } else {
        alert("Failed to submit reservation");
      }
    } catch (e) {
      alert("Error submitting reservation");
    }
  };

  if (loadingMap) {
    return <div style={{ padding: 40, fontSize: 24 }}>Loading map...</div>;
  }

  return (
    <SessionManager onReset={handleReset} onTimeoutWarning={() => {}}>
      <div style={{ width: "1080px", height: "1920px", margin: "0 auto", background: "#F3F7F4", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 44px", background: "#FFFFFF", borderBottom: "1px solid #E1E9E3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#C8F451" }}></div>
            <span style={{ fontWeight: 800, fontSize: "26px", color: "#0C3B27" }}>DeskAtlas</span>
          </div>
          {step !== "done" && (
            <button onClick={() => router.push("/kiosk")} style={{ fontSize: "20px", fontWeight: 700, color: "#65736A", background: "none", border: "1px solid #DCE6DF", borderRadius: "9999px", padding: "14px 28px", cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </header>

        <div style={{ flex: 1, padding: "48px 60px", overflowY: "auto" }}>
          {step === "type" && (
            <WorkspaceTypePicker 
              templates={publishedMap?.templates || []} 
              workspaces={publishedMap?.workspaces || []}
              onSelect={(tpl) => {
                setActiveTemplate(tpl);
                setStep("desk");
              }} 
            />
          )}

          {step === "desk" && (
            <WorkspaceDeskPicker 
              template={activeTemplate}
              workspaces={(publishedMap?.workspaces || []).filter((w: any) => w.template_id === activeTemplate.id)}
              floor={publishedMap?.floor}
              kioskMarker={publishedMap?.elements?.find((e: any) => e.elementType === 'KIOSK_YOU_ARE_HERE' || e.elementRole === 'INFORMATION' || e.style?.markerType === 'KIOSK_YOU_ARE_HERE')}
              onSelect={(ws) => {
                setActiveDesk(ws);
                setStep("time");
              }}
              onBack={() => setStep("type")}
            />
          )}

          {step === "time" && (
            <ReservationTimePicker 
              workspace={activeDesk}
              date={selectedDate}
              onSelect={(time) => {
                setSelectedTime(time);
                setStep("details");
              }}
              onBack={() => setStep("desk")}
            />
          )}

          {step === "details" && (
            <CustomerDetailsForm
              value={customerInfo}
              onChange={setCustomerInfo}
              onNext={() => setStep("pay")}
              onBack={() => setStep("time")}
            />
          )}

          {step === "pay" && (
            <CounterPaymentFlow 
              amountDue={activeTemplate.rate_amount * 2} // Assuming 2 hours
              onPay={submitReservation}
              onBack={() => setStep("details")}
            />
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", marginTop: "100px" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "#DDF5E5", color: "#16723A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", margin: "0 auto 28px" }}>✓</div>
              <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#0C3B27", margin: "0 0 12px" }}>Pending Counter Confirmation</h1>
              <p style={{ fontSize: "22px", color: "#65736A", margin: "0 0 32px" }}>
                {activeDesk?.name} · {selectedTime}
              </p>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#0C3B27", marginBottom: "40px" }}>
                Ref: {reservationResult?.referenceCode || "..."}
              </div>
              <p style={{ fontSize: "16px", color: "#89958D" }}>Please proceed to the counter to complete your payment.</p>
              <button onClick={() => router.push("/kiosk")} style={{ marginTop: "40px", background: "#0C3B27", color: "#fff", border: "none", padding: "20px 40px", borderRadius: "12px", fontSize: "20px", fontWeight: 800, cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </SessionManager>
  );
}
