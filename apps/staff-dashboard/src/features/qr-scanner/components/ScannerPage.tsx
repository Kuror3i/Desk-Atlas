"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { useBookingLookup } from '../hooks/useBookingLookup';
import { useCheckInActions } from '@/features/check-in/hooks/useCheckInActions';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const { lookupToken, result, loading: lookupLoading, error: lookupError, clear } = useBookingLookup();
  const { checkIn, checkOut, loading: actionLoading, error: actionError } = useCheckInActions();
  const router = useRouter();

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (!scanning) return;

    let requestAnimationFrameId: number;
    let localStream: MediaStream;

    const startVideo = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
          videoRef.current.play();
          requestAnimationFrameId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code) {
              handleScan(code.data);
              return; // Stop ticking if found
            }
          }
        }
      }
      if (scanning) {
        requestAnimationFrameId = requestAnimationFrame(tick);
      }
    };

    startVideo();

    return () => {
      if (requestAnimationFrameId) cancelAnimationFrame(requestAnimationFrameId);
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [scanning]);

  const handleScan = async (data: string) => {
    setScanning(false);
    stopStream();
    try {
      await lookupToken(data);
    } catch (e) {
      // error handled in hook
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await checkIn(id);
      router.push(`/manage/reservations/${id}`);
    } catch (e) {}
  };

  const handleCheckOut = async (id: string) => {
    try {
      await checkOut(id);
      router.push(`/manage/reservations/${id}`);
    } catch (e) {}
  };

  const resumeScanning = () => {
    clear();
    setScanning(true);
  };

  return (
    <main style={{ padding: '26px 28px 40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>QR Scanner</h1>
        <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: "'Inter', sans-serif" }}>Scan guest booking QR codes</div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', overflow: 'hidden' }}>
        
        {scanning ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: '200px', height: '200px', border: '2px solid var(--da-accent)', borderRadius: '12px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)' }}></div>
              </div>
            </div>
            <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--da-text-secondary)' }}>Point the camera at the booking QR</div>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            {lookupLoading && <div style={{ textAlign: 'center', padding: '40px' }}>Looking up token...</div>}
            
            {lookupError && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ color: 'var(--da-danger)', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{lookupError}</div>
                <button onClick={resumeScanning} style={{ padding: '10px 20px', background: 'var(--da-brand-dark)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Scan Again</button>
              </div>
            )}

            {result && !lookupLoading && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: 0 }}>Scan Result</h2>
                  <div style={{ padding: '6px 12px', background: result.accessState === 'ACTIVE' ? 'var(--da-info)' : 'var(--da-soft)', color: 'var(--da-primary)', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    {result.accessState}
                  </div>
                </div>

                <div style={{ background: 'var(--da-canvas)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--da-brand-dark)', marginBottom: '4px' }}>{result.customerName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)' }}>{result.referenceCode} • {result.reservationStatus}</div>
                  
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>WORKSPACE</div>
                      <div style={{ fontSize: '14px', color: 'var(--da-brand-dark)', fontWeight: 500 }}>{result.workspaceDisplayName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>TIME</div>
                      <div style={{ fontSize: '14px', color: 'var(--da-brand-dark)', fontWeight: 500 }}>
                        {format(new Date(result.bookingStartAt), 'h:mm a')} - {format(new Date(result.bookingEndAt), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>

                {actionError && (
                  <div style={{ color: 'var(--da-danger)', fontSize: '13px', marginBottom: '16px', background: '#FEE2E2', padding: '12px', borderRadius: '6px' }}>
                    {actionError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  {result.checkInState !== 'CHECKED_IN' && result.reservationStatus === 'CONFIRMED' && (
                    <button 
                      onClick={() => handleCheckIn(result.reservationId)}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '12px', background: 'var(--da-brand-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {actionLoading ? 'Processing...' : 'Check In'}
                    </button>
                  )}
                  {result.checkInState === 'CHECKED_IN' && (
                    <button 
                      onClick={() => handleCheckOut(result.reservationId)}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '12px', background: '#fff', color: 'var(--da-danger)', border: '1px solid var(--da-danger)', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {actionLoading ? 'Processing...' : 'Check Out'}
                    </button>
                  )}
                  <button 
                    onClick={resumeScanning}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '12px', background: 'var(--da-canvas)', color: 'var(--da-brand-dark)', border: '1px solid var(--da-border)', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
