"use client";

import React, { useState, useEffect } from 'react';
import type {
  BusinessOperatingHoursMode,
  BusinessSettings,
  OperatingHoursConfig,
  AdminPaymentMethod,
  BusinessClosureException,
  BusinessClosureType,
} from '@deskatlas/domain';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const TIMEZONES = [
  { value: 'Asia/Manila', label: 'Asia/Manila (UTC+08:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+08:00)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+07:00)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+00:00 / UTC+01:00)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-05:00 / UTC-04:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-08:00 / UTC-07:00)' },
  { value: 'UTC', label: 'UTC' },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<
    'Business Profile' | 'Business Hours' | 'Payment Methods' | 'Closures & Holidays' | 'Kiosk Settings'
  >('Business Profile');
  const tabs: Array<'Business Profile' | 'Business Hours' | 'Payment Methods' | 'Closures & Holidays' | 'Kiosk Settings'> = [
    'Business Profile',
    'Business Hours',
    'Payment Methods',
    'Closures & Holidays',
    'Kiosk Settings',
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    id: 1,
    businessName: 'DeskAtlas Manila',
    timezone: 'Asia/Manila',
    contactEmail: null,
    contactPhone: null,
    bookingIntervalMinutes: 30,
    paymentExpiryMinutes: 60,
    kioskTimeoutMinutes: 5,
  });

  const [hoursMode, setHoursMode] = useState<BusinessOperatingHoursMode>('CUSTOM_HOURS');
  const [daySchedules, setDaySchedules] = useState<
    Array<{
      dayOfWeek: number;
      isOpen: boolean;
      is24Hours: boolean;
      opensAt: string;
      closesAt: string;
    }>
  >(
    DAY_NAMES.map((_, index) => ({
      dayOfWeek: index,
      isOpen: index >= 1 && index <= 5, // Mon-Fri default
      is24Hours: false,
      opensAt: '09:00',
      closesAt: '18:00',
    }))
  );

  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([]);
  const [closures, setClosures] = useState<BusinessClosureException[]>([]);
  const [closuresLoading, setClosuresLoading] = useState(false);

  // Closures Calendar & Form State
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0] ?? '');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [closureEndDate, setClosureEndDate] = useState<string>('');
  const [closureType, setClosureType] = useState<BusinessClosureType>('FULL_DAY');
  const [specialOpensAt, setSpecialOpensAt] = useState('10:00');
  const [specialClosesAt, setSpecialClosesAt] = useState('14:00');
  const [closureReason, setClosureReason] = useState('');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  useEffect(() => {
    fetchSettings();
    fetchClosures();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) {
        throw new Error(`Failed to load settings (status: ${res.status})`);
      }
      const json = await res.json();
      const overview = json.data;

      if (overview?.businessSettings) {
        setBusinessSettings(overview.businessSettings);
      }

      if (overview?.operatingHoursConfig) {
        const config: OperatingHoursConfig = overview.operatingHoursConfig;
        setHoursMode(config.mode);

        const merged = DAY_NAMES.map((_, index) => {
          const found = config.schedules.find((s) => s.dayOfWeek === index);
          if (found) {
            const firstInterval = found.intervals[0];
            return {
              dayOfWeek: index,
              isOpen: found.isOpen,
              is24Hours: found.is24Hours,
              opensAt: firstInterval?.opensAt ?? '09:00',
              closesAt: firstInterval?.closesAt ?? '18:00',
            };
          }
          return {
            dayOfWeek: index,
            isOpen: false,
            is24Hours: false,
            opensAt: '09:00',
            closesAt: '18:00',
          };
        });
        setDaySchedules(merged);
      }

      if (overview?.paymentMethods) {
        setPaymentMethods(overview.paymentMethods);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }

  async function fetchClosures() {
    try {
      setClosuresLoading(true);
      const res = await fetch('/api/admin/settings/closures');
      if (!res.ok) {
        throw new Error(`Failed to load closures (status: ${res.status})`);
      }
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setClosures(json.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch closures:', err);
    } finally {
      setClosuresLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleSaveClosure(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedDate) {
      setErrorMsg('Please select a date.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/settings/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          endDate: isMultiDay && closureEndDate ? closureEndDate : null,
          closureType,
          opensAt: closureType === 'SPECIAL_HOURS' ? specialOpensAt : null,
          closesAt: closureType === 'SPECIAL_HOURS' ? specialClosesAt : null,
          reason: closureReason || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to save closure exception');
      }

      await fetchClosures();
      setClosureReason('');
      showSuccess(`Closure / exception for ${selectedDate} saved!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save closure exception');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClosure(exception: BusinessClosureException) {
    if (!confirm(`Are you sure you want to remove the closure for ${exception.date}${exception.endDate ? ` to ${exception.endDate}` : ''}?`)) {
      return;
    }
    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/settings/closures', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockIds: exception.blockIds }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to delete closure');
      }

      await fetchClosures();
      showSuccess(`Closure for ${exception.date} removed!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete closure');
    } finally {
      setSaving(false);
    }
  }


  // Handle Business Profile / Kiosk Save
  async function handleSaveProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessSettings),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to save business settings');
      }

      const json = await res.json();
      setBusinessSettings(json.data);
      showSuccess('Business settings updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  }

  // Handle Business Hours Mode Switch
  function handleModeChange(mode: BusinessOperatingHoursMode) {
    setHoursMode(mode);
    if (mode === '24_7') {
      setDaySchedules((prev) =>
        prev.map((d) => ({
          ...d,
          isOpen: true,
          is24Hours: true,
          opensAt: '00:00',
          closesAt: '24:00',
        }))
      );
    } else if (mode === '24_HOURS_SELECTED_DAYS') {
      setDaySchedules((prev) =>
        prev.map((d) => ({
          ...d,
          is24Hours: d.isOpen,
          opensAt: '00:00',
          closesAt: '24:00',
        }))
      );
    }
  }

  // Apply one day's schedule to all other days
  function handleApplyHoursToAll(sourceDayIndex: number, onlyOpenDays = false) {
    const source = daySchedules[sourceDayIndex];
    if (!source) return;

    setDaySchedules((prev) =>
      prev.map((d, i) => {
        if (i === sourceDayIndex) return d;
        if (onlyOpenDays && !d.isOpen) return d;
        return {
          ...d,
          isOpen: onlyOpenDays ? d.isOpen : source.isOpen,
          is24Hours: source.is24Hours,
          opensAt: source.opensAt,
          closesAt: source.closesAt,
        };
      })
    );
    showSuccess(
      `Applied ${DAY_NAMES[source.dayOfWeek]} hours (${source.is24Hours ? '24 Hours' : `${source.opensAt} - ${source.closesAt}`}) to ${onlyOpenDays ? 'all open days' : 'all days'}!`
    );
  }

  // Save Operating Hours
  async function handleSaveOperatingHours() {
    try {
      setSaving(true);
      setErrorMsg(null);

      const schedulesToSubmit = daySchedules.map((s) => {
        if (!s.isOpen) {
          return {
            dayOfWeek: s.dayOfWeek,
            isOpen: false,
            is24Hours: false,
            intervals: [],
          };
        }

        if (hoursMode === '24_7' || hoursMode === '24_HOURS_SELECTED_DAYS' || s.is24Hours) {
          return {
            dayOfWeek: s.dayOfWeek,
            isOpen: true,
            is24Hours: true,
            intervals: [{ opensAt: '00:00', closesAt: '24:00' }],
          };
        }

        return {
          dayOfWeek: s.dayOfWeek,
          isOpen: true,
          is24Hours: false,
          intervals: [{ opensAt: s.opensAt, closesAt: s.closesAt }],
        };
      });

      const res = await fetch('/api/admin/settings/operating-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: hoursMode,
          schedules: schedulesToSubmit,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to save operating hours');
      }

      showSuccess('Business operating hours updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save operating hours');
    } finally {
      setSaving(false);
    }
  }

  // Save Payment Method
  async function handleSavePaymentMethod(method: AdminPaymentMethod) {
    try {
      setSaving(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/settings/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to update payment method');
      }

      const json = await res.json();
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === json.data.id ? json.data : m))
      );
      showSuccess(`Payment method "${method.displayName}" updated!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main data-screen-label="Settings" style={{ padding: '26px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
            System Settings
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>
            Global configurations, adaptable operating hours, and payment channels for DeskAtlas
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✓</span> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--da-border-light)', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((t, i) => (
          <button 
            key={i}
            onClick={() => {
              setActiveTab(t);
              setErrorMsg(null);
            }}
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

      {loading ? (
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '40px', textAlign: 'center', color: 'var(--da-text-secondary)' }}>
          Loading system settings...
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', padding: '26px', maxWidth: '750px', boxShadow: 'var(--da-shadow-sm)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 18px' }}>
            {activeTab}
          </h3>

          {/* TAB 1: Business Profile */}
          {activeTab === 'Business Profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>Business Name</label>
                <input 
                  type="text" 
                  value={businessSettings.businessName}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, businessName: e.target.value })}
                  required
                  style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>Contact Email</label>
                  <input 
                    type="email" 
                    value={businessSettings.contactEmail || ''}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, contactEmail: e.target.value || null })}
                    placeholder="contact@example.com"
                    style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>Contact Phone</label>
                  <input 
                    type="text" 
                    value={businessSettings.contactPhone || ''}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, contactPhone: e.target.value || null })}
                    placeholder="+63 917 123 4567"
                    style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>Timezone</label>
                  <select 
                    value={businessSettings.timezone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, timezone: e.target.value })}
                    style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)', background: '#fff' }}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>Booking Slot Interval</label>
                  <select 
                    value={businessSettings.bookingIntervalMinutes}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, bookingIntervalMinutes: Number(e.target.value) })}
                    style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)', background: '#fff' }}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes (1 hour)</option>
                    <option value={120}>120 minutes (2 hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>Online Payment Session Expiry (Minutes)</label>
                <input 
                  type="number" 
                  min={5}
                  max={1440}
                  value={businessSettings.paymentExpiryMinutes}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, paymentExpiryMinutes: Number(e.target.value) })}
                  style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }} 
                />
                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', marginTop: '4px' }}>
                  Default is 60 minutes for online GCash/bank transfer proof submission.
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                style={{ 
                  background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '12px', 
                  borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', 
                  marginTop: '8px', opacity: saving ? 0.7 : 1 
                }}
              >
                {saving ? 'Saving...' : 'Save Business Profile'}
              </button>
            </form>
          )}

          {/* TAB 2: Business Hours (Adaptable Business Model) */}
          {activeTab === 'Business Hours' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--da-brand-dark)', marginBottom: '8px' }}>
                  Operating Hours Preset & Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: '24_7', title: '24 / 7', desc: 'Open 24 hours every day' },
                    { id: '24_HOURS_SELECTED_DAYS', title: '24h on Selected Days', desc: 'Open 24h on specific days only' },
                    { id: 'CUSTOM_HOURS', title: 'Custom Hours', desc: 'Set custom opening & closing times' },
                  ].map((m) => {
                    const isSelected = hoursMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleModeChange(m.id as BusinessOperatingHoursMode)}
                        style={{
                          padding: '12px 14px',
                          border: isSelected ? '2px solid var(--da-brand-dark)' : '1px solid var(--da-border)',
                          borderRadius: '10px',
                          background: isSelected ? '#F0FDFA' : '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--da-brand-dark)' : '#1E293B', marginBottom: '2px' }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)' }}>
                          {m.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day by Day Schedule Grid */}
              <div style={{ borderTop: '1px solid var(--da-border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-brand-dark)' }}>
                    Weekly Schedule
                  </div>
                  {hoursMode === 'CUSTOM_HOURS' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleApplyHoursToAll(1, true)}
                        style={{
                          background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px',
                          padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer'
                        }}
                      >
                        Copy Mon to all open days
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyHoursToAll(1, false)}
                        style={{
                          background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px',
                          padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer'
                        }}
                      >
                        Copy Mon to all 7 days
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {daySchedules.map((schedule, idx) => (
                    <div 
                      key={schedule.dayOfWeek}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', background: schedule.isOpen ? '#FAFAFA' : '#F1F5F9',
                        border: '1px solid var(--da-border-light)', borderRadius: '8px'
                      }}
                    >
                      {/* Day Label & Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '130px' }}>
                        <input 
                          type="checkbox"
                          id={`day-toggle-${schedule.dayOfWeek}`}
                          checked={schedule.isOpen}
                          disabled={hoursMode === '24_7'}
                          onChange={(e) => {
                            const updated = [...daySchedules];
                            updated[idx] = {
                              ...schedule,
                              isOpen: e.target.checked,
                              is24Hours: hoursMode === '24_HOURS_SELECTED_DAYS' ? e.target.checked : schedule.is24Hours,
                            };
                            setDaySchedules(updated);
                          }}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <label 
                          htmlFor={`day-toggle-${schedule.dayOfWeek}`}
                          style={{ fontSize: '13px', fontWeight: 700, color: schedule.isOpen ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}
                        >
                          {DAY_NAMES[schedule.dayOfWeek]}
                        </label>
                      </div>

                      {/* Hours Display / Inputs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!schedule.isOpen ? (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', padding: '4px 10px', background: '#E2E8F0', borderRadius: '6px' }}>
                            Closed
                          </span>
                        ) : hoursMode === '24_7' || hoursMode === '24_HOURS_SELECTED_DAYS' || schedule.is24Hours ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0D9488', padding: '4px 12px', background: '#CCFBF1', borderRadius: '6px' }}>
                              Open 24 Hours
                            </span>
                            {hoursMode === 'CUSTOM_HOURS' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...daySchedules];
                                  updated[idx] = { ...schedule, is24Hours: false };
                                  setDaySchedules(updated);
                                }}
                                style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Set custom times
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="time" 
                              value={schedule.opensAt}
                              onChange={(e) => {
                                const updated = [...daySchedules];
                                updated[idx] = { ...schedule, opensAt: e.target.value };
                                setDaySchedules(updated);
                              }}
                              style={{ border: '1px solid var(--da-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '12px', color: '#64748B' }}>to</span>
                            <input 
                              type="time" 
                              value={schedule.closesAt}
                              onChange={(e) => {
                                const updated = [...daySchedules];
                                updated[idx] = { ...schedule, closesAt: e.target.value };
                                setDaySchedules(updated);
                              }}
                              style={{ border: '1px solid var(--da-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...daySchedules];
                                updated[idx] = { ...schedule, is24Hours: true, opensAt: '00:00', closesAt: '24:00' };
                                setDaySchedules(updated);
                              }}
                              style={{ background: 'none', border: 'none', color: '#0D9488', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              24h
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyHoursToAll(idx, false)}
                              title={`Apply ${DAY_NAMES[schedule.dayOfWeek]} hours (${schedule.opensAt} - ${schedule.closesAt}) to all days`}
                              style={{
                                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px',
                                padding: '4px 8px', fontSize: '11px', fontWeight: 600, color: '#0369A1', cursor: 'pointer'
                              }}
                            >
                              Apply to all
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="button"
                onClick={handleSaveOperatingHours}
                disabled={saving}
                style={{ 
                  background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '12px', 
                  borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', 
                  marginTop: '8px', opacity: saving ? 0.7 : 1 
                }}
              >
                {saving ? 'Saving...' : 'Save Business Hours'}
              </button>
            </div>
          )}

          {/* TAB 3: Payment Methods */}
          {activeTab === 'Payment Methods' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)' }}>
                Configure online and in-person payment channels. Online methods support 1-hour proof uploads; counter payment methods are used for kiosk and desk transactions.
              </div>

              {paymentMethods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>
                  No payment methods configured in database.
                </div>
              ) : (
                paymentMethods.map((method, idx) => (
                  <div 
                    key={method.id}
                    style={{ 
                      border: '1px solid var(--da-border)', borderRadius: '10px', padding: '18px',
                      background: method.isActive ? '#FFFFFF' : '#F8FAFC'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                          background: method.methodType === 'GCASH' ? '#DBEAFE' : method.methodType === 'BANK' ? '#EDE9FE' : '#DCFCE7',
                          color: method.methodType === 'GCASH' ? '#1E40AF' : method.methodType === 'BANK' ? '#5B21B6' : '#166534'
                        }}>
                          {method.methodType}
                        </span>
                        <input 
                          type="text"
                          value={method.displayName}
                          onChange={(e) => {
                            const updated = [...paymentMethods];
                            updated[idx] = { ...method, displayName: e.target.value };
                            setPaymentMethods(updated);
                          }}
                          style={{ fontWeight: 700, fontSize: '14px', border: '1px solid var(--da-border)', borderRadius: '6px', padding: '4px 8px' }}
                        />
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={method.isActive}
                          onChange={(e) => {
                            const updated = [...paymentMethods];
                            updated[idx] = { ...method, isActive: e.target.checked };
                            setPaymentMethods(updated);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        {method.isActive ? 'Active' : 'Inactive'}
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>
                          Account / Receiver Name
                        </label>
                        <input 
                          type="text"
                          value={method.accountName || ''}
                          onChange={(e) => {
                            const updated = [...paymentMethods];
                            updated[idx] = { ...method, accountName: e.target.value || null };
                            setPaymentMethods(updated);
                          }}
                          placeholder="e.g. DeskAtlas Corp"
                          style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>
                          Account / Mobile Number
                        </label>
                        <input 
                          type="text"
                          value={method.accountNumber || ''}
                          onChange={(e) => {
                            const updated = [...paymentMethods];
                            updated[idx] = { ...method, accountNumber: e.target.value || null };
                            setPaymentMethods(updated);
                          }}
                          placeholder="e.g. 09171234567"
                          style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>
                        Customer Instructions
                      </label>
                      <textarea 
                        rows={2}
                        value={method.instructions || ''}
                        onChange={(e) => {
                          const updated = [...paymentMethods];
                          updated[idx] = { ...method, instructions: e.target.value || null };
                          setPaymentMethods(updated);
                        }}
                        placeholder="Instructions displayed on payment screen..."
                        style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', fontFamily: 'var(--da-font-family)' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--da-border-light)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: method.methodType === 'CASH' ? 'not-allowed' : 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={method.allowWeb}
                            disabled={method.methodType === 'CASH'}
                            onChange={(e) => {
                              const updated = [...paymentMethods];
                              updated[idx] = { ...method, allowWeb: e.target.checked };
                              setPaymentMethods(updated);
                            }}
                          />
                          Allow for Online/Web
                          {method.methodType === 'CASH' && <span style={{ fontSize: '10px', color: '#94A3B8' }}>(Cash counter-only)</span>}
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={method.allowKiosk}
                            onChange={(e) => {
                              const updated = [...paymentMethods];
                              updated[idx] = { ...method, allowKiosk: e.target.checked };
                              setPaymentMethods(updated);
                            }}
                          />
                          Allow for Kiosk
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSavePaymentMethod(method)}
                        disabled={saving}
                        style={{ 
                          background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '6px 14px', 
                          borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' 
                        }}
                      >
                        Save Method
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Closures & Holidays */}
          {activeTab === 'Closures & Holidays' && (() => {
            const currentYear = calendarMonth.getFullYear();
            const currentMonth = calendarMonth.getMonth();
            const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

            const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; exception?: BusinessClosureException }> = [];

            // Previous month trailing days
            const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
              const d = prevMonthDays - i;
              const prevM = currentMonth === 0 ? 12 : currentMonth;
              const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
              const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
            }

            // Current month days
            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const matchedException = closures.find((c) => {
                if (c.date === dateStr) return true;
                if (c.endDate && dateStr >= c.date && dateStr <= c.endDate) return true;
                return false;
              });
              calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: true, exception: matchedException });
            }

            // Next month leading days to complete grid
            const remainingCells = (7 - (calendarDays.length % 7)) % 7;
            for (let d = 1; d <= remainingCells; d++) {
              const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
              const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
              const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
            }

            const selectedException = closures.find((c) => {
              if (c.date === selectedDate) return true;
              if (c.endDate && selectedDate >= c.date && selectedDate <= c.endDate) return true;
              return false;
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', lineHeight: '1.5' }}>
                  Select a date on the calendar to mark whole-facility closures or adjust opening hours for specific holidays and maintenance events.
                </div>

                {/* Calendar Header & Grid */}
                <div style={{ border: '1px solid var(--da-border)', borderRadius: '12px', padding: '18px', background: '#FAFAFA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)' }}>
                      {monthName}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(new Date(currentYear, currentMonth - 1, 1))}
                        style={{ padding: '6px 12px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(new Date())}
                        style={{ padding: '6px 12px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(new Date(currentYear, currentMonth + 1, 1))}
                        style={{ padding: '6px 12px', background: '#fff', border: '1px solid var(--da-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  {/* Days of week header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw, i) => (
                      <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', padding: '4px 0' }}>
                        {dw}
                      </div>
                    ))}
                  </div>

                  {/* Month grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {calendarDays.map((cell, idx) => {
                      const isSelected = cell.dateStr === selectedDate;
                      const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
                      const hasClosure = Boolean(cell.exception);
                      const isFullDay = cell.exception?.closureType === 'FULL_DAY';

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedDate(cell.dateStr);
                            if (cell.exception) {
                              setClosureType(cell.exception.closureType);
                              if (cell.exception.opensAt) setSpecialOpensAt(cell.exception.opensAt);
                              if (cell.exception.closesAt) setSpecialClosesAt(cell.exception.closesAt);
                              setClosureReason(cell.exception.reason || '');
                              setIsMultiDay(Boolean(cell.exception.endDate));
                              setClosureEndDate(cell.exception.endDate || '');
                            }
                          }}
                          style={{
                            height: '70px',
                            padding: '6px',
                            background: isSelected
                              ? '#F0FDFA'
                              : hasClosure
                              ? isFullDay
                                ? '#FEF2F2'
                                : '#FFFBEB'
                              : cell.isCurrentMonth
                              ? '#FFFFFF'
                              : '#F8FAFC',
                            border: isSelected
                              ? '2px solid var(--da-brand-dark)'
                              : hasClosure
                              ? isFullDay
                                ? '1px solid #FECACA'
                                : '1px solid #FDE68A'
                              : '1px solid var(--da-border-light)',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            opacity: cell.isCurrentMonth ? 1 : 0.45,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: isToday || isSelected ? 800 : 600,
                              color: isToday ? '#0284C7' : '#1E293B',
                            }}>
                              {cell.dayNum}
                            </span>
                            {isToday && (
                              <span style={{ fontSize: '9px', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '1px 4px', borderRadius: '4px' }}>
                                TODAY
                              </span>
                            )}
                          </div>

                          {cell.exception && (
                            <div style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '2px 4px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              background: isFullDay ? '#EF4444' : '#F59E0B',
                              color: '#fff',
                            }}>
                              {isFullDay ? 'Closed' : `${cell.exception.opensAt}-${cell.exception.closesAt}`}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Exception Action Card */}
                <div style={{ border: '1px solid var(--da-border)', borderRadius: '12px', padding: '20px', background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-brand-dark)' }}>
                        Configure Date Exception
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)' }}>
                        Selected Date: <strong style={{ color: '#0F172A' }}>{selectedDate}</strong>
                        {selectedException && (
                          <span style={{ marginLeft: '8px', color: selectedException.closureType === 'FULL_DAY' ? '#DC2626' : '#D97706', fontWeight: 700 }}>
                            (Currently: {selectedException.closureType === 'FULL_DAY' ? 'Closed Full Day' : `Special Hours ${selectedException.opensAt}-${selectedException.closesAt}`})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveClosure} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>
                          Selected Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          required
                          style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>
                          Exception Mode
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setClosureType('FULL_DAY')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: closureType === 'FULL_DAY' ? '2px solid #EF4444' : '1px solid var(--da-border)',
                              background: closureType === 'FULL_DAY' ? '#FEF2F2' : '#fff',
                              color: closureType === 'FULL_DAY' ? '#991B1B' : '#475569',
                            }}
                          >
                            🚫 Closed Full Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setClosureType('SPECIAL_HOURS')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: closureType === 'SPECIAL_HOURS' ? '2px solid #F59E0B' : '1px solid var(--da-border)',
                              background: closureType === 'SPECIAL_HOURS' ? '#FFFBEB' : '#fff',
                              color: closureType === 'SPECIAL_HOURS' ? '#92400E' : '#475569',
                            }}
                          >
                            ⏱️ Special Opening Hours
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Conditional Controls for Full Day / Special Hours */}
                    {closureType === 'FULL_DAY' ? (
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isMultiDay}
                            onChange={(e) => setIsMultiDay(e.target.checked)}
                          />
                          Multi-day closure period
                        </label>
                        {isMultiDay && (
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>
                              End Date (Inclusive)
                            </label>
                            <input
                              type="date"
                              min={selectedDate}
                              value={closureEndDate}
                              onChange={(e) => setClosureEndDate(e.target.value)}
                              required={isMultiDay}
                              style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>
                            Opening Time on this Date
                          </label>
                          <input
                            type="time"
                            value={specialOpensAt}
                            onChange={(e) => setSpecialOpensAt(e.target.value)}
                            required
                            style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>
                            Closing Time on this Date
                          </label>
                          <input
                            type="time"
                            value={specialClosesAt}
                            onChange={(e) => setSpecialClosesAt(e.target.value)}
                            required
                            style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>
                        Reason / Holiday Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Christmas Day, New Year Holiday, Planned Facility Maintenance..."
                        value={closureReason}
                        onChange={(e) => setClosureReason(e.target.value)}
                        style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          background: 'var(--da-brand-dark)',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Date Exception'}
                      </button>
                      {selectedException && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClosure(selectedException)}
                          disabled={saving}
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete Exception for this Date
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Scheduled Closures & Holidays List */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--da-brand-dark)', marginBottom: '10px' }}>
                    Active & Upcoming Closures ({closures.length})
                  </div>

                  {closuresLoading ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '12px' }}>
                      Loading closures...
                    </div>
                  ) : closures.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', border: '1px dashed var(--da-border)', borderRadius: '8px', fontSize: '12px' }}>
                      No closures or holiday exceptions scheduled. Select a date above to schedule one.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {closures.map((exc) => (
                        <div
                          key={exc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            border: '1px solid var(--da-border-light)',
                            borderRadius: '8px',
                            background: exc.closureType === 'FULL_DAY' ? '#FEF2F2' : '#FFFBEB',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: exc.closureType === 'FULL_DAY' ? '#EF4444' : '#F59E0B',
                                color: '#fff',
                              }}
                            >
                              {exc.closureType === 'FULL_DAY' ? 'CLOSED' : 'SPECIAL HOURS'}
                            </span>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                                {exc.date}{exc.endDate ? ` → ${exc.endDate}` : ''}
                                {exc.closureType === 'SPECIAL_HOURS' && ` (${exc.opensAt} - ${exc.closesAt})`}
                              </div>
                              {exc.reason && (
                                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)' }}>
                                  {exc.reason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(exc.date);
                                setClosureType(exc.closureType);
                                if (exc.opensAt) setSpecialOpensAt(exc.opensAt);
                                if (exc.closesAt) setSpecialClosesAt(exc.closesAt);
                                setClosureReason(exc.reason || '');
                                setIsMultiDay(Boolean(exc.endDate));
                                setClosureEndDate(exc.endDate || '');
                              }}
                              style={{
                                background: '#fff',
                                border: '1px solid var(--da-border)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#334155',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClosure(exc)}
                              style={{
                                background: '#fff',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#DC2626',
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}


          {/* TAB 5: Kiosk Settings */}
          {activeTab === 'Kiosk Settings' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '6px' }}>
                  Inactivity Timeout (Minutes)
                </label>
                <input 
                  type="number" 
                  min={1}
                  max={60}
                  value={businessSettings.kioskTimeoutMinutes || 5}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, kioskTimeoutMinutes: Number(e.target.value) })}
                  style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--da-font-family)' }} 
                />
                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', marginTop: '4px' }}>
                  The kiosk resets automatically to the welcome screen if the user is inactive for this duration.
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                style={{ 
                  background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '12px', 
                  borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', 
                  marginTop: '8px', opacity: saving ? 0.7 : 1 
                }}
              >
                {saving ? 'Saving...' : 'Save Kiosk Settings'}
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}
