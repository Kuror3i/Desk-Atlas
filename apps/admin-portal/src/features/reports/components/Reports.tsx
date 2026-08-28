"use client";

import React from 'react';

export function Reports() {
  const metrics = [
    { label: 'Total Revenue', value: '₱ 84,500', trend: '+12% vs last month', positive: true },
    { label: 'Occupancy Rate', value: '78%', trend: '+4% vs last month', positive: true },
    { label: 'Total Bookings', value: '412', trend: '-2% vs last month', positive: false },
    { label: 'No Shows', value: '14', trend: '-5% vs last month', positive: true },
  ];

  return (
    <main data-screen-label="Reports" style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Reports & Analytics</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>Operational metrics and financial performance</div>
        </div>
        <select style={{ border: '1px solid var(--da-border)', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--da-font-family)' }}>
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--da-shadow-sm)' }}>
            <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--da-brand-dark)', marginBottom: '8px', lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: m.positive ? 'var(--da-success)' : 'var(--da-attention)', fontFamily: 'var(--da-font-family)' }}>
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--da-shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 16px' }}>Revenue Overview</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px', paddingTop: '20px' }}>
            {/* Mock Bar Chart */}
            {[40, 60, 45, 80, 50, 90, 75].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '100%', height: `${h}%`, background: 'var(--da-brand-dark)', borderRadius: '4px 4px 0 0', opacity: i === 6 ? 1 : 0.4 }}></div>
                <div style={{ fontSize: '10px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>{'Mon,Tue,Wed,Thu,Fri,Sat,Sun'.split(',')[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--da-shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 16px' }}>Top Workspaces</h3>
          {['Skypod 01', 'Meeting Room 02', 'Lounge 04', 'Dedicated Desk 01'].map((ws, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--da-border-light)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--da-text-primary)' }}>{ws}</span>
              <span style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>{98 - (i * 12)}% occ.</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
