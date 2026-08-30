"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminReservationDetail as AdminReservationDetailType } from '@deskatlas/domain';

export function ReservationDetail({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<AdminReservationDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/reservations/${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Reservation ${id} not found.`);
          }
          throw new Error(`Failed to load reservation (${response.status})`);
        }
        const data = await response.json();
        if (!isCancelled) {
          setDetail(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message ?? 'Failed to load reservation detail');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const detailFields = detail
    ? [
        { label: 'Customer Name', value: detail.customerName },
        { label: 'Email', value: detail.customerEmail },
        { label: 'Schedule', value: detail.schedule },
        { label: 'Duration', value: detail.duration },
        { label: 'Payment Status', value: detail.paymentStatus },
      ]
    : [
        { label: 'Customer Name', value: '...' },
        { label: 'Email', value: '...' },
        { label: 'Schedule', value: '...' },
        { label: 'Duration', value: '...' },
        { label: 'Payment Status', value: '...' },
      ];

  const isConfirmed = detail?.reservationStatus === 'CONFIRMED' || detail?.reservationStatus === 'CHECKED_IN';
  const detailActions: Array<{ label: string; style: React.CSSProperties }> = [];

  if (isConfirmed) {
    detailActions.push({
      label: 'Reschedule',
      style: { background: 'transparent', color: 'var(--da-text-primary)', border: '1px solid var(--da-border)' },
    });
    detailActions.push({
      label: 'Cancel Booking',
      style: { background: 'transparent', color: 'var(--da-danger)', border: '1px solid #FECACA' },
    });
    if (detail?.hasBookingQr) {
      detailActions.push({
        label: 'View QR Code',
        style: { background: 'var(--da-brand-dark)', color: '#fff', border: 'none' },
      });
    }
  }

  const detailCandidates = detail?.candidates && detail.candidates.length > 0
    ? detail.candidates.map((c) => ({
        tier: c.tier + (c.isAssigned ? ' • ALLOCATED' : ''),
        name: c.workspaceDisplayName || c.workspaceInstanceCode || 'Spot',
        color: c.isAssigned ? 'var(--da-brand-dark)' : c.color,
      }))
    : [];

  const detailTimeline = detail?.timeline && detail.timeline.length > 0
    ? detail.timeline
    : ['Reservation recorded'];

  if (loading) {
    return (
      <main data-screen-label="Reservation Detail" style={{ padding: '26px 28px 40px' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); router.push('/manage/reservations'); }} style={{ fontSize: '12px', color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)', fontWeight: 700 }}>&larr; Back to Reservations</a>
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '13px', fontFamily: 'var(--da-font-family)' }}>
          Loading reservation details...
        </div>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main data-screen-label="Reservation Detail" style={{ padding: '26px 28px 40px' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); router.push('/manage/reservations'); }} style={{ fontSize: '12px', color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)', fontWeight: 700 }}>&larr; Back to Reservations</a>
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--da-danger)', fontSize: '13px', fontFamily: 'var(--da-font-family)' }}>
          {error ?? 'Reservation not found.'}
        </div>
      </main>
    );
  }

  return (
    <main data-screen-label="Reservation Detail" style={{ padding: '26px 28px 40px' }}>
      <a href="#" onClick={(e) => { e.preventDefault(); router.push('/manage/reservations'); }} style={{ fontSize: '12px', color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)', fontWeight: 700 }}>&larr; Back to Reservations</a>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 20px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: 0, letterSpacing: '-0.02em' }}>{detail.referenceCode}</h1>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', ...detail.statusStyle }}>
          <span aria-hidden="true" style={{ fontSize: '10px', lineHeight: 1 }}>{detail.mark}</span>{detail.status}
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
          {detailActions.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
              {detailActions.map((act, i) => (
                <button key={i} style={{ padding: '9px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', ...act.style }}>{act.label}</button>
              ))}
            </div>
          )}
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
