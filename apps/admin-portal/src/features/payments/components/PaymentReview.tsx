"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PaymentReview({ id }: { id: string }) {
  const router = useRouter();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isApproveSuccess, setIsApproveSuccess] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const reviewFields = [
    { label: 'Customer', value: 'Mike Johnson' },
    { label: 'Reference', value: id },
    { label: 'Amount', value: '₱1,200' },
    { label: 'Date/Time', value: 'Aug 27, 2026, 13:00 - 17:00' },
    { label: 'Submitted', value: '5 mins ago' },
  ];

  const reviewCandidates = [
    { tier: 'MAIN', name: 'Office 12', color: 'var(--da-brand-dark)' },
    { tier: 'ALTERNATIVE 1', name: 'Office 10', color: 'var(--da-text-secondary)' },
    { tier: 'ALTERNATIVE 2', name: 'Skypod 01', color: 'var(--da-text-secondary)' },
  ];

  const confirmApprove = () => {
    setIsApproveSuccess(true);
  };

  const closeApprove = () => {
    setShowApproveModal(false);
    if (isApproveSuccess) {
      router.push('/manage/payments');
    }
  };

  return (
    <main data-screen-label="Payment Review" style={{ padding: '26px 28px 40px' }}>
      <a href="#" onClick={(e) => { e.preventDefault(); router.push('/manage/payments'); }} style={{ fontSize: '12px', color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)', fontWeight: 700 }}>&larr; Back to Payments</a>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '14px 0 3px', letterSpacing: '-0.02em' }}>Payment Proof</h1>
      <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '20px' }}>Approving allocates Main &rarr; Alt 1 &rarr; Alt 2 by live availability</div>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1.2, minWidth: '300px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ width: '100%', height: '280px', background: 'var(--da-canvas)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--da-text-secondary)', fontSize: '12px', fontFamily: 'var(--da-font-family)', marginBottom: '16px' }}>Large proof preview</div>
          {reviewFields.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--da-border-light)', fontSize: '13px' }}>
              <span style={{ color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>{f.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>{f.value}</span>
            </div>
          ))}
        </div>
        
        <div style={{ flex: 1, minWidth: '260px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-text-primary)', margin: '0 0 12px' }}>Reservation Candidates</h3>
          {reviewCandidates.map((c, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${c.color}`, padding: '8px 10px', marginBottom: '8px', background: '#F1F8F3', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: c.color, fontFamily: 'var(--da-font-family)' }}>{c.tier}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)' }}>{c.name}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button onClick={() => setShowRejectModal(true)} style={{ flex: 1, background: '#fff', border: '1px solid var(--da-brand-dark)', color: 'var(--da-brand-dark)', padding: '11px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Reject Payment</button>
            <button onClick={() => setShowApproveModal(true)} style={{ flex: 1, background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', padding: '11px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Approve Payment</button>
          </div>
        </div>
      </div>

      {showApproveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,59,39,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px', maxWidth: '380px', width: '90%' }}>
            {!isApproveSuccess ? (
              <>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 10px' }}>Approve payment?</h3>
                <p style={{ fontSize: '13px', color: 'var(--da-text-primary)', lineHeight: 1.5, margin: '0 0 14px' }}>DeskAtlas will check Main &rarr; Alternative 1 &rarr; Alternative 2 against current availability.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={closeApprove} style={{ background: 'transparent', border: '1px solid var(--da-border)', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={confirmApprove} style={{ background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Approve & Allocate</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--da-info)', color: 'var(--da-brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 12px' }}>✓</div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 8px' }}>Payment approved</h3>
                <p style={{ fontSize: '12px', color: 'var(--da-text-secondary)', margin: '0 0 4px', fontFamily: 'var(--da-font-family)' }}>Assigned workspace</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 14px' }}>Office 12</p>
                <p style={{ fontSize: '12px', color: 'var(--da-text-secondary)', margin: '0 0 16px' }}>Booking QR created.</p>
                <button onClick={closeApprove} style={{ width: '100%', background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,59,39,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px', maxWidth: '380px', width: '90%' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 14px' }}>Reject Payment</h3>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)' }}>Reason</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px', fontSize: '13px', margin: '6px 0 16px', minHeight: '70px', fontFamily: 'var(--da-font-family)' }} placeholder="Explain why this payment is rejected"></textarea>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)} style={{ background: 'transparent', border: '1px solid var(--da-border)', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowRejectModal(false); router.push('/manage/payments'); }} style={{ background: 'var(--da-danger)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Reject Payment</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
