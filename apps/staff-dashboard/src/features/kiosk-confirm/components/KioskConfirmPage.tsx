"use client";

import React, { useState } from 'react';
import { useKioskConfirm } from '../hooks/useKioskConfirm';

export function KioskConfirmPage() {
  const [paymentId, setPaymentId] = useState('');
  const { confirmPayment, loading, error, result, reset } = useKioskConfirm();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId.trim()) return;
    await confirmPayment(paymentId.trim());
  };

  return (
    <main style={{ padding: '26px 28px 40px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Kiosk Payment</h1>
        <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: "'Inter', sans-serif" }}>Confirm counter payments manually</div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '24px' }}>
        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--da-info)', color: 'var(--da-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>✓</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--da-brand-dark)', marginBottom: '8px' }}>Payment Confirmed</h2>
            <div style={{ fontSize: '14px', color: 'var(--da-text-secondary)', marginBottom: '24px' }}>
              Reservation is now {result.reservationStatus}.
            </div>
            <button 
              onClick={() => { reset(); setPaymentId(''); }}
              style={{ padding: '10px 20px', background: 'var(--da-brand-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Confirm Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleConfirm}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '8px' }}>Payment Attempt ID</label>
            <input 
              value={paymentId} 
              onChange={(e) => setPaymentId(e.target.value)} 
              placeholder="Enter ID from kiosk or customer..." 
              style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '12px', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
            />

            {error && (
              <div style={{ color: 'var(--da-danger)', fontSize: '13px', marginBottom: '16px', background: '#FEE2E2', padding: '12px', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !paymentId.trim()}
              style={{ width: '100%', padding: '12px', background: 'var(--da-brand-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: (loading || !paymentId.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !paymentId.trim()) ? 0.7 : 1 }}
            >
              {loading ? 'Confirming...' : 'Confirm Kiosk Payment'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
