"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface KioskScannerProps {
  onCancel: () => void;
}

export function KioskScanner({ onCancel }: KioskScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 } },
          async (decodedText) => {
            // Stop scanning once we got a hit
            scannerRef.current?.stop().catch(console.error);
            setLoading(true);
            try {
              const res = await fetch(`/api/booking/${decodedText}`);
              if (!res.ok) {
                setError("Invalid or expired token");
              } else {
                const data = await res.json();
                setBookingData(data);
              }
            } catch (err) {
              setError("Network error looking up token");
            } finally {
              setLoading(false);
            }
          },
          () => {} // ignore normal read failures (no qr found)
        );
      } catch (err) {
        console.error("Scanner failed to start", err);
        setError("Failed to access camera");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", background: "#F3F7F4", display: "flex", flexDirection: "column" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", 
        padding: "32px 44px", background: "#FFFFFF", borderBottom: "1px solid #E1E9E3"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#C8F451" }}></div>
          <span style={{ fontWeight: 800, fontSize: "26px", color: "#0C3B27" }}>DeskAtlas</span>
        </div>
        <button onClick={onCancel} style={{
          fontSize: "20px", fontWeight: 700, color: "#65736A", background: "none", 
          border: "1px solid #DCE6DF", borderRadius: "9999px", padding: "14px 28px", cursor: "pointer"
        }}>
          Close
        </button>
      </header>

      <main style={{ flex: 1, padding: "48px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#0C3B27", margin: "0 0 40px" }}>
          Scan Booking QR
        </h1>
        
        {loading && <div style={{ fontSize: "24px" }}>Looking up booking...</div>}
        
        {error && (
          <div style={{ background: "#FFEBEE", color: "#C62828", padding: "20px", borderRadius: "12px", fontSize: "24px", marginBottom: "20px" }}>
            {error}
            <button onClick={() => { setError(null); window.location.reload(); }} style={{ marginLeft: "20px", padding: "10px 20px" }}>Retry</button>
          </div>
        )}

        {bookingData && (
          <div style={{ background: "#FFFFFF", borderRadius: "18px", padding: "32px", width: "100%", maxWidth: "600px", marginTop: "24px" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0C3B27", marginBottom: "12px" }}>
              {bookingData.workspaceName || "Workspace"}
            </div>
            <div style={{ fontSize: "22px", color: "#65736A", marginBottom: "24px" }}>
              Status: <strong style={{ color: "#16723A" }}>{bookingData.status}</strong>
            </div>
            <button style={{ width: "100%", background: "#0C3B27", color: "#fff", border: "none", padding: "24px", borderRadius: "12px", fontSize: "24px", fontWeight: 800, cursor: "pointer" }}>
              Check In
            </button>
          </div>
        )}

        {/* Scanner container, hide if we have result or error */}
        <div 
          id="reader" 
          style={{ 
            width: "500px", 
            height: "500px", 
            background: "#000",
            display: (bookingData || error || loading) ? "none" : "block",
            borderRadius: "24px",
            overflow: "hidden"
          }}
        ></div>

      </main>
    </div>
  );
}
