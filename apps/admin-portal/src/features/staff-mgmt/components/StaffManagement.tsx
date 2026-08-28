"use client";

import React from 'react';

export function StaffManagement() {
  const staff = [
    { initials: 'JD', name: 'John Doe', email: 'john@deskatlas.com', role: 'Staff', mark: '✓', status: 'Active', statusStyle: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' }, lastActive: '2 mins ago' },
    { initials: 'AS', name: 'Alice Smith', email: 'alice@deskatlas.com', role: 'Admin', mark: '✓', status: 'Active', statusStyle: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' }, lastActive: '1 hr ago' },
    { initials: 'MJ', name: 'Mike Johnson', email: 'mike@deskatlas.com', role: 'Staff', mark: '!', status: 'Inactive', statusStyle: { background: 'var(--da-soft)', color: 'var(--da-brand-dark)' }, lastActive: '3 days ago' },
  ];

  return (
    <main data-screen-label="Staff" style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Staff Accounts</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>Admins manage settings and maps; staff handle the front desk</div>
        </div>
        <button style={{ background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px 1px rgba(12,59,39,.16)' }}>
          + Add Staff
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--da-shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr .8fr .9fr 1fr .8fr', padding: '11px 20px', background: 'var(--da-canvas)', fontSize: '10px', fontWeight: 800, color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', letterSpacing: '.06em' }}>
          <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>STATUS</span><span>LAST ACTIVE</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>
        
        {staff.map((st, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr .8fr .9fr 1fr .8fr', padding: '12px 20px', borderTop: '1px solid var(--da-border-light)', fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--da-brand-dark)', color: 'var(--da-brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>
                {st.initials}
              </div>
              <span style={{ fontWeight: 700 }}>{st.name}</span>
            </div>
            <span style={{ color: 'var(--da-text-primary)' }}>{st.email}</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--da-text-primary)', background: 'var(--da-bg)', borderRadius: '6px', padding: '3px 8px', width: 'fit-content' }}>
              {st.role}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, padding: '4px 9px', borderRadius: '9999px', whiteSpace: 'nowrap', width: 'fit-content', ...st.statusStyle }}>
              <span aria-hidden="true" style={{ fontSize: '10px', lineHeight: 1 }}>{st.mark}</span>{st.status}
            </span>
            <span style={{ color: 'var(--da-text-primary)' }}>{st.lastActive}</span>
            <a href="#" style={{ color: 'var(--da-brand-dark)', fontWeight: 700, textAlign: 'right', textDecoration: 'none' }}>Manage</a>
          </div>
        ))}
      </div>
    </main>
  );
}
