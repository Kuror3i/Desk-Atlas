"use client";

import React from 'react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { format } from 'date-fns';

export function DashboardPage() {
  const { occupancy, activity, loading, error, refetch } = useDashboardStats();

  if (loading) {
    return (
      <main style={{ padding: '26px 28px 40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px' }}>Dashboard</h1>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--da-text-secondary)' }}>Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '26px 28px 40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px' }}>Dashboard</h1>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--da-danger)' }}>
          {error}
          <div style={{ marginTop: '10px' }}>
            <button onClick={refetch} style={{ padding: '8px 16px', background: 'var(--da-brand-dark)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Retry</button>
          </div>
        </div>
      </main>
    );
  }

  const occupiedCount = occupancy.filter(o => o.occupancyState === 'OCCUPIED').length;
  const reservedCount = occupancy.filter(o => o.occupancyState === 'RESERVED').length;

  return (
    <main style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Dashboard</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: "'Inter', sans-serif" }}>
            Overview of workspace operations · {format(new Date(), 'EEEE, MMMM d')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '12px' }}>CURRENTLY OCCUPIED</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--da-brand-dark)' }}>{occupiedCount}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '12px' }}>RESERVED TODAY</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--da-brand-dark)' }}>{reservedCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <section style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--da-border)', background: 'var(--da-canvas)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: 0 }}>Recent Activity</h2>
          </div>
          <div style={{ padding: '0 20px' }}>
            {activity.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '13px' }}>No recent activity.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--da-border)' }}>
                {activity.map((act) => (
                  <div key={`${act.reservationId}-${act.occurredAt}`} style={{ background: '#fff', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--da-brand-dark)', marginBottom: '4px' }}>
                        {act.customerName} - {act.workspaceDisplayName || 'Unknown Workspace'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)' }}>
                        {format(new Date(act.occurredAt), 'h:mm a')} • {act.activityType.replace('_', ' ')}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, background: 'var(--da-canvas)', color: 'var(--da-text-secondary)', padding: '4px 8px', borderRadius: '4px' }}>
                      {act.referenceCode}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
