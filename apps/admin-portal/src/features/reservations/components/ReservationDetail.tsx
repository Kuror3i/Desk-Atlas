"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export function ReservationDetail({ id }: { id: string }) {
  const router = useRouter();
  
  const detailFields = [
    { label: 'Customer Name', value: 'John Doe' },
    { label: 'Email', value: 'john.doe@example.com' },
    { label: 'Schedule', value: 'Aug 27, 09:00 - 17:00' },
    { label: 'Duration', value: '8 hours' },
    { label: 'Payment Status', value: 'Confirmed (₱1,200)' },
  ];

  const detailActions = [
    { label: 'Reschedule', style: { background: 'transparent', color: 'var(--da-text-primary)', border: '1px solid var(--da-border)' } },
    { label: 'Cancel Booking', style: { background: 'transparent', color: 'var(--da-danger)', border: '1px solid #FECACA' } },
    { label: 'View QR Code', style: { background: 'var(--da-brand-dark)', color: '#fff', border: 'none' } },
  ];

  const detailCandidates = [
    { tier: 'MAIN', name: 'Skypod 05', color: 'var(--da-brand-dark)' },
    { tier: 'ALTERNATIVE 1', name: 'Skypod 02', color: 'var(--da-text-secondary)' },
  ];

  const detailTimeline = [
    'Aug 26, 14:22 - Reservation requested',
    'Aug 26, 14:25 - Payment proof uploaded',
    'Aug 26, 15:00 - Payment approved & Allocated to Skypod 05',
    'Aug 27, 08:55 - Customer checked in at Kiosk',
  ];

  return (
    <main data-screen-label="Reservation Detail" style={{ padding: '26px 28px 40px' }}>
      <a href="#" onClick={(e) => { e.preventDefault(); router.push('/manage/reservations'); }} style={{ fontSize: '12px', color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)', fontWeight: 700 }}>&larr; Back to Reservations</a>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 20px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: 0, letterSpacing: '-0.02em' }}>{id}</h1>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', background: 'var(--da-info)', color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)' }}>
          <span aria-hidden="true" style={{ fontSize: '10px', lineHeight: 1 }}>✓</span>Confirmed
        </span>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1.3, minWidth: '320px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-text-primary)', margin: '0 0 12px' }}>Reservation Information</h3>
          {detailFields.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--da-border-light)', fontSize: '13px' }}>
              <span style={{ color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>{f.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>{f.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
            {detailActions.map((act, i) => (
              <button key={i} style={{ padding: '9px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', ...act.style }}>{act.label}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '260px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-text-primary)', margin: '0 0 12px' }}>Candidates</h3>
          {detailCandidates.map((c, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${c.color}`, padding: '8px 10px', marginBottom: '8px', background: '#F1F8F3', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: c.color, fontFamily: 'var(--da-font-family)' }}>{c.tier}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)' }}>{c.name}</div>
            </div>
          ))}
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-text-primary)', margin: '20px 0 12px' }}>Timeline</h3>
          {detailTimeline.map((t, i) => (
            <div key={i} style={{ fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)', padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid var(--da-border-light)' }}>{t}</div>
          ))}
        </div>
      </div>
    </main>
  );
}
