"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export function PaymentQueue() {
  const router = useRouter();
  
  const paymentQueue = [
    { ref: 'PAY-1048', customer: 'Mike Johnson', amount: '1,200', ago: '5 mins ago' },
    { ref: 'PAY-1049', customer: 'Sarah Connor', amount: '800', ago: '12 mins ago' },
    { ref: 'PAY-1050', customer: 'Kyle Reese', amount: '1,500', ago: '24 mins ago' },
  ];

  return (
    <main data-screen-label="Payments" style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Online Payments</h1>
      <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '22px' }}>Review submitted proofs and allocate workspaces</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', letterSpacing: '.08em' }}>AWAITING REVIEW</span>
        <span style={{ fontSize: '10px', fontWeight: 800, background: '#FFF8E8', color: 'var(--da-brand-dark)', borderRadius: '9999px', whiteSpace: 'nowrap', padding: '2px 8px', fontFamily: 'var(--da-font-family)' }}>3</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--da-border)' }}></div>
      </div>
      
      {paymentQueue.map((p, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: 'var(--da-shadow-sm)', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#FFF8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '16px', height: '16px', border: '2.5px solid var(--da-brand-dark)', borderRadius: '50%' }}></div>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--da-brand-dark)', fontSize: '14px' }}>{p.ref}</div>
              <div style={{ fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)' }}>{p.customer} &middot; <strong style={{ color: 'var(--da-text-primary)' }}>₱{p.amount}</strong> &middot; submitted {p.ago}</div>
            </div>
          </div>
          <button onClick={() => router.push(`/manage/payments/${p.ref}`)} style={{ background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '9px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px 1px rgba(12,59,39,.16)' }}>Review</button>
        </div>
      ))}
    </main>
  );
}
