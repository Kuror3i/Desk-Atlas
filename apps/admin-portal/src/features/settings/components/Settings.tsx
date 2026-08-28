"use client";

import React, { useState } from 'react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('Business Profile');
  const tabs = ['Business Profile', 'Business Hours', 'Closures & Holidays', 'Kiosk Settings'];

  return (
    <main data-screen-label="Settings" style={{ padding: '26px 28px 40px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>System Settings</h1>
      <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '22px' }}>Global configurations for DeskAtlas</div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--da-border-light)', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((t, i) => (
          <button 
            key={i}
            onClick={() => setActiveTab(t)}
            style={{ 
              background: 'none', border: 'none', padding: '10px 20px', fontSize: '13px', fontWeight: 700, 
              cursor: 'pointer', fontFamily: 'var(--da-font-family)', whiteSpace: 'nowrap',
              color: activeTab === t ? 'var(--da-brand-dark)' : 'var(--da-text-secondary)',
              borderBottom: activeTab === t ? '2px solid var(--da-brand-dark)' : '2px solid transparent'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '26px', maxWidth: '600px', boxShadow: 'var(--da-shadow-sm)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 16px' }}>{activeTab}</h3>
        
        {activeTab === 'Business Profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '6px' }}>Business Name</label>
              <input type="text" defaultValue="DeskAtlas Manila" style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '6px' }}>Currency</label>
                <select style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }}>
                  <option>PHP (₱)</option>
                  <option>USD ($)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '6px' }}>Timezone</label>
                <select style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }}>
                  <option>Asia/Manila (UTC+8)</option>
                </select>
              </div>
            </div>
            <button style={{ background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}>
              Save Changes
            </button>
          </div>
        )}

        {activeTab !== 'Business Profile' && (
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', textAlign: 'center', padding: '40px 0' }}>
            {activeTab} settings interface under construction.
          </div>
        )}
      </div>
    </main>
  );
}
