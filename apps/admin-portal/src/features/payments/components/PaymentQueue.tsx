"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaymentReviewQueueItem } from '@deskatlas/domain';

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function PaymentQueue() {
  const router = useRouter();
  const [queue, setQueue] = useState<PaymentReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/payments/reviews');
      if (!res.ok) {
        throw new Error(`Failed to load payment review queue (${res.status})`);
      }
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <main data-screen-label="Payments" style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Online Payments</h1>
      <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '22px' }}>Review submitted proofs and allocate workspaces</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', letterSpacing: '.08em' }}>AWAITING REVIEW</span>
        <span style={{ fontSize: '10px', fontWeight: 800, background: '#FFF8E8', color: 'var(--da-brand-dark)', borderRadius: '9999px', whiteSpace: 'nowrap', padding: '2px 8px', fontFamily: 'var(--da-font-family)' }}>{queue.length}</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--da-border)' }}></div>
      </div>
      
      {loading && (
        <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '13px', fontFamily: 'var(--da-font-family)' }}>
          Loading payment review queue...
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '16px 20px', color: '#991B1B', fontSize: '13px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={fetchQueue} style={{ background: '#991B1B', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loading && !error && queue.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '14px', fontFamily: 'var(--da-font-family)' }}>
          No online payments awaiting review.
        </div>
      )}

      {!loading && !error && queue.map((p) => {
        const formattedAmount = Number(p.amountDue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        const formattedTime = formatTimeAgo(p.proofSubmittedAt);
        const refDisplay = p.reservationReferenceCode || p.paymentAttemptId.slice(0, 8);
        const customerName = `${p.customerFirstName} ${p.customerLastName}`.trim();

        return (
          <div key={p.paymentAttemptId} style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: 'var(--da-shadow-sm)', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#FFF8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: '16px', height: '16px', border: '2.5px solid var(--da-brand-dark)', borderRadius: '50%' }}></div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--da-brand-dark)', fontSize: '14px' }}>{refDisplay}</div>
                <div style={{ fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)' }}>{customerName} &middot; <strong style={{ color: 'var(--da-text-primary)' }}>₱{formattedAmount}</strong> &middot; submitted {formattedTime}</div>
              </div>
            </div>
            <button onClick={() => router.push(`/manage/payments/${p.paymentAttemptId}`)} style={{ background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '9px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px 1px rgba(12,59,39,.16)' }}>Review</button>
          </div>
        );
      })}
    </main>
  );
}
