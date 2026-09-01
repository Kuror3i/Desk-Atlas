"use client";

import React, { useEffect, useState } from 'react';
import type { StaffMember, StaffRole } from '@deskatlas/domain';

export function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add Staff Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addEmail, setAddEmail] = useState<string>('');
  const [addPassword, setAddPassword] = useState<string>('');
  const [addRole, setAddRole] = useState<StaffRole>('STAFF');
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Manage Staff Modal state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [manageName, setManageName] = useState<string>('');
  const [manageRole, setManageRole] = useState<StaffRole>('STAFF');
  const [manageIsActive, setManageIsActive] = useState<boolean>(true);
  const [managePassword, setManagePassword] = useState<string>('');
  const [manageLoading, setManageLoading] = useState<boolean>(false);
  const [manageError, setManageError] = useState<string | null>(null);

  async function loadStaff() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/staff', { cache: 'no-store' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load staff accounts (${res.status})`);
      }
      const data = await res.json();
      setStaffList(data.staff ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function openAddModal() {
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddRole('STAFF');
    setAddError(null);
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
    setAddError(null);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) {
      setAddError('Name and email are required.');
      return;
    }
    if (addPassword && addPassword.length < 6) {
      setAddError('Password must be at least 6 characters.');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: addName.trim(),
          email: addEmail.trim(),
          password: addPassword || undefined,
          role: addRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create staff account.');
      }

      closeAddModal();
      await loadStaff();
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create staff account.');
    } finally {
      setAddLoading(false);
    }
  }

  function openManageModal(st: StaffMember) {
    setEditingStaff(st);
    setManageName(st.name);
    setManageRole(st.rawRole);
    setManageIsActive(st.isActive);
    setManagePassword('');
    setManageError(null);
  }

  function closeManageModal() {
    setEditingStaff(null);
    setManageError(null);
  }

  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStaff) return;
    if (!manageName.trim()) {
      setManageError('Display name cannot be blank.');
      return;
    }
    if (managePassword && managePassword.length < 6) {
      setManageError('Password must be at least 6 characters.');
      return;
    }

    setManageLoading(true);
    setManageError(null);
    try {
      const res = await fetch(`/api/admin/staff/${encodeURIComponent(editingStaff.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: manageName.trim(),
          role: manageRole,
          isActive: manageIsActive,
          password: managePassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update staff account.');
      }

      closeManageModal();
      await loadStaff();
    } catch (err: any) {
      setManageError(err?.message || 'Failed to update staff account.');
    } finally {
      setManageLoading(false);
    }
  }

  return (
    <main data-screen-label="Staff" style={{ padding: '26px 28px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Staff Accounts</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>Admins manage settings and maps; staff handle the front desk</div>
        </div>
        <button
          onClick={openAddModal}
          style={{ background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px 1px rgba(12,59,39,.16)' }}
        >
          + Add Staff
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={loadStaff} style={{ background: '#991B1B', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Staff Table */}
      <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--da-shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr .8fr .9fr 1fr .8fr', padding: '11px 20px', background: 'var(--da-canvas)', fontSize: '10px', fontWeight: 800, color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', letterSpacing: '.06em' }}>
          <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>STATUS</span><span>LAST ACTIVE</span><span style={{ textAlign: 'right' }}>ACTIONS</span>
        </div>

        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '13px' }}>
            Loading staff accounts...
          </div>
        ) : staffList.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--da-text-secondary)', fontSize: '13px' }}>
            No staff accounts found. Click <strong>+ Add Staff</strong> to create one.
          </div>
        ) : (
          staffList.map((st) => (
            <div key={st.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr .8fr .9fr 1fr .8fr', padding: '12px 20px', borderTop: '1px solid var(--da-border-light)', fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)', alignItems: 'center' }}>
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
              <button
                onClick={() => openManageModal(st)}
                style={{ background: 'transparent', border: 'none', color: 'var(--da-brand-dark)', fontWeight: 700, textAlign: 'right', cursor: 'pointer', padding: 0, fontSize: '12px' }}
              >
                Manage
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Staff */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 4px' }}>Add Staff Member</h2>
            <p style={{ fontSize: '12px', color: 'var(--da-text-secondary)', margin: '0 0 18px' }}>Create an account for front desk staff or administrators</p>

            {addError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>FULL NAME</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. john@deskatlas.com"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>TEMPORARY PASSWORD</label>
                <input
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>ROLE</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as StaffRole)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
                >
                  <option value="STAFF">Staff (Front desk, check-in, counter)</option>
                  <option value="ADMIN">Admin (Full access, maps, settings, staff)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={addLoading}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', color: 'var(--da-text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: 'var(--da-brand-dark)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: addLoading ? 0.7 : 1 }}
                >
                  {addLoading ? 'Creating...' : '+ Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Staff */}
      {editingStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 4px' }}>Manage Staff</h2>
            <p style={{ fontSize: '12px', color: 'var(--da-text-secondary)', margin: '0 0 18px' }}>
              {editingStaff.email}
            </p>

            {manageError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px' }}>
                {manageError}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>DISPLAY NAME</label>
                <input
                  type="text"
                  value={manageName}
                  onChange={(e) => setManageName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>ROLE</label>
                <select
                  value={manageRole}
                  onChange={(e) => setManageRole(e.target.value as StaffRole)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>ACCOUNT STATUS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setManageIsActive(!manageIsActive)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: manageIsActive ? '1px solid #10B981' : '1px solid #EF4444',
                      background: manageIsActive ? '#D1FAE5' : '#FEE2E2',
                      color: manageIsActive ? '#065F46' : '#991B1B',
                    }}
                  >
                    {manageIsActive ? '✓ Active (Click to Deactivate)' : '! Inactive (Click to Activate)'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--da-text-secondary)', marginBottom: '4px' }}>RESET PASSWORD (OPTIONAL)</label>
                <input
                  type="password"
                  value={managePassword}
                  onChange={(e) => setManagePassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={closeManageModal}
                  disabled={manageLoading}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', color: 'var(--da-text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manageLoading}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: 'var(--da-brand-dark)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: manageLoading ? 0.7 : 1 }}
                >
                  {manageLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
