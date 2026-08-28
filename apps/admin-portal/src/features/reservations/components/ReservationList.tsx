"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export function ReservationList() {
  const router = useRouter();
  
  const resFilters = [
    { label: 'All', style: { background: 'var(--da-brand-dark)', color: '#fff' } },
    { label: 'Checked In', style: { background: 'transparent', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
    { label: 'Upcoming', style: { background: 'transparent', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
    { label: 'Awaiting Proof', style: { background: 'transparent', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
  ];

  const reservations = [
    { ref: 'RES-8921', initials: 'JD', customer: 'John Doe', workspace: 'Skypod 05', schedule: 'Aug 27, 09:00 - 17:00', payment: 'Paid', paymentColor: 'var(--da-success)', mark: '✓', status: 'Checked In', statusStyle: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' } },
    { ref: 'RES-8922', initials: 'AS', customer: 'Alice Smith', workspace: 'Lounge 02', schedule: 'Aug 27, 09:00 - 12:00', payment: 'Pending', paymentColor: 'var(--da-text-secondary)', mark: '!', status: 'Awaiting Proof', statusStyle: { background: 'var(--da-soft)', color: 'var(--da-brand-dark)' } },
    { ref: 'RES-8923', initials: 'MJ', customer: 'Mike Johnson', workspace: 'Office 12', schedule: 'Aug 27, 13:00 - 17:00', payment: 'Review', paymentColor: 'var(--da-attention)', mark: '⧖', status: 'Payment Review', statusStyle: { background: '#FFF8E8', color: 'var(--da-brand-dark)' } },
  ];

  const pages = [
    { label: '1', style: { background: 'var(--da-brand-dark)', color: '#fff', border: 'none' } },
    { label: '2', style: { background: '#fff', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
    { label: '3', style: { background: '#fff', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
    { label: 'Next', style: { background: '#fff', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
  ];

  return (
    <main data-screen-label="Reservations" style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Reservations</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>All bookings across floors and schedules</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid var(--da-border)', background: '#fff', borderRadius: '9px', padding: '9px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--da-text-primary)', cursor: 'pointer', fontFamily: 'var(--da-font-family)' }}>
            <div style={{ width: '11px', height: '11px', border: '2px solid var(--da-text-secondary)', borderRadius: '2px' }}></div>Filters
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px 1px rgba(12,59,39,.16)' }}>Export</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', boxShadow: 'var(--da-shadow-sm)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--da-border-light)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, color: 'var(--da-brand-dark)' }}>30</span>
            <span style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>reservations</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {resFilters.map((f, i) => (
              <button key={i} style={{ padding: '7px 14px', borderRadius: '9999px', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--da-font-family)', ...f.style }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.1fr 1.4fr .9fr 1.1fr .5fr', padding: '11px 20px', background: '#F1F8F3', fontSize: '10px', fontWeight: 800, color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', letterSpacing: '.06em' }}>
          <span>REFERENCE ⇅</span><span>CUSTOMER ⇅</span><span>WORKSPACE</span><span>SCHEDULE ⇅</span><span>PAYMENT</span><span>STATUS</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        
        {reservations.map((r, i) => (
          <div key={i} onClick={() => router.push(`/manage/reservations/${r.ref}`)} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.1fr 1.4fr .9fr 1.1fr .5fr', padding: '13px 20px', borderTop: '1px solid var(--da-border-light)', fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)', cursor: 'pointer', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: 'var(--da-brand-dark)' }}>{r.ref}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--da-canvas)', color: 'var(--da-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>{r.initials}</div>
              <span style={{ fontWeight: 600 }}>{r.customer}</span>
            </div>
            <span>{r.workspace}</span>
            <span style={{ color: 'var(--da-text-primary)' }}>{r.schedule}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: r.paymentColor }}>{r.payment}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, padding: '4px 9px', borderRadius: '9999px', whiteSpace: 'nowrap', width: 'fit-content', ...r.statusStyle }}>
              <span aria-hidden="true" style={{ fontSize: '10px', lineHeight: 1 }}>{r.mark}</span>{r.status}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--da-text-secondary)', fontWeight: 800, letterSpacing: '1px' }}>⋯</span>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderTop: '1px solid var(--da-border-light)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>Showing 1 to 3 of 30 entries</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {pages.map((pg, i) => (
              <button key={i} style={{ width: pg.label === 'Next' ? 'auto' : '36px', height: '36px', padding: pg.label === 'Next' ? '0 12px' : 0, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', ...pg.style }}>{pg.label}</button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
