import React from 'react';

export function DashboardPage() {
  const rangeTabs = [
    { label: 'Today', style: { background: 'var(--da-brand-dark)', color: '#fff' } },
    { label: '7 days', style: { background: 'transparent', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
    { label: '30 days', style: { background: 'transparent', color: 'var(--da-text-secondary)', border: '1px solid var(--da-border)' } },
  ];

  const activity = [
    { time: '09:12 AM', initials: 'JD', name: 'John Doe', workspace: 'Skypod 05', mark: '✓', status: 'Checked In', style: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' } },
    { time: '08:45 AM', initials: 'AS', name: 'Alice Smith', workspace: 'Lounge 02', mark: '✓', status: 'Checked In', style: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' } },
    { time: '08:15 AM', initials: 'MJ', name: 'Mike Johnson', workspace: 'Office 12', mark: '!', status: 'Awaiting Proof', style: { background: 'var(--da-soft)', color: 'var(--da-brand-dark)' } },
  ];

  const occupancy = [
    { label: 'Available', value: '17', swatch: { background: 'var(--da-brand-accent)' } },
    { label: 'In Use', value: '7', swatch: { background: 'var(--da-text-secondary)' } },
    { label: 'Reserved', value: '0', swatch: { background: 'var(--da-soft)' } },
    { label: 'Maintenance', value: '0', swatch: { background: 'var(--da-brand-dark)' } },
  ];

  return (
    <main data-screen-label="Dashboard" style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Dashboard</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>Overview of workspace operations &middot; Today</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {rangeTabs.map((rt, i) => (
            <button key={i} style={{ padding: '8px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', ...rt.style }}>
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        {/* Metric 1 */}
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--da-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'var(--da-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '15px', height: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ height: '3px', background: 'var(--da-brand-dark)', borderRadius: '2px' }}></div>
                <div style={{ height: '3px', background: 'var(--da-brand-dark)', borderRadius: '2px', opacity: .6 }}></div>
                <div style={{ height: '3px', background: 'var(--da-brand-dark)', borderRadius: '2px', opacity: .6 }}></div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '4px' }}>Today's Reservations</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--da-brand-dark)', lineHeight: 1, marginBottom: '8px' }}>12</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'var(--da-font-family)' }}>
            <span style={{ color: 'var(--da-brand-dark)', fontWeight: 800 }}>&uarr; 9%</span><span style={{ color: 'var(--da-text-secondary)' }}>vs last week</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--da-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'var(--da-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '15px', height: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--da-brand-dark)' }}></div>
                <div style={{ width: '13px', height: '5px', borderRadius: '9999px 9999px 3px 3px', background: 'var(--da-brand-dark)', opacity: .65 }}></div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '4px' }}>Currently Checked In</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--da-brand-dark)', lineHeight: 1, marginBottom: '8px' }}>7</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'var(--da-font-family)' }}>
            <span style={{ color: 'var(--da-brand-dark)', fontWeight: 800 }}>29% capacity</span><span style={{ color: 'var(--da-text-secondary)' }}>of 24</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--da-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#FFF8E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '15px', height: '15px', border: '2.5px solid var(--da-brand-dark)', borderRadius: '50%' }}></div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '4px' }}>Pending Payments</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--da-brand-dark)', lineHeight: 1, marginBottom: '8px' }}>4</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'var(--da-font-family)' }}>
            <span style={{ color: 'var(--da-brand-dark)', fontWeight: 800 }}>&darr; 12%</span><span style={{ color: 'var(--da-text-secondary)' }}>vs last week</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1.7, minWidth: '360px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', boxShadow: 'var(--da-shadow-sm)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--da-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '15px', height: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ height: '3px', background: 'var(--da-brand-dark)', borderRadius: '2px' }}></div>
                <div style={{ height: '3px', background: 'var(--da-brand-dark)', borderRadius: '2px', opacity: .5 }}></div>
                <div style={{ height: '3px', background: 'var(--da-brand-dark)', borderRadius: '2px', opacity: .5 }}></div>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-text-primary)', margin: 0 }}>Today's Activity</h3>
            </div>
            <a href="/manage/reservations" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--da-brand-dark)', fontFamily: 'var(--da-font-family)' }}>View all</a>
          </div>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid var(--da-border-light)' }}>
              <div style={{ display: 'flex', gap: '13px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', width: '64px', fontWeight: 600 }}>{a.time}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--da-canvas)', color: 'var(--da-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{a.initials}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>{a.workspace}</div>
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', ...a.style }}>
                <span aria-hidden="true" style={{ fontSize: '11px', lineHeight: 1, fontWeight: 800 }}>{a.mark}</span>{a.status}
              </span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: '260px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--da-shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-text-primary)', margin: '0 0 4px' }}>Workspace Overview</h3>
          <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '16px' }}>Ground Floor &middot; 24 workspaces</div>
          <div style={{ display: 'flex', height: '8px', borderRadius: '9999px', whiteSpace: 'nowrap', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ width: '75%', background: 'var(--da-brand-accent)' }}></div>
            <div style={{ width: '17%', background: 'var(--da-text-secondary)' }}></div>
            <div style={{ width: '4%', background: 'var(--da-soft)' }}></div>
            <div style={{ width: '4%', background: 'var(--da-brand-dark)' }}></div>
          </div>
          {occupancy.map((o, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid var(--da-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '3px', ...o.swatch }}></div>
                <span style={{ fontSize: '13px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)' }}>{o.label}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--da-text-primary)' }}>{o.value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
