import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { DashboardHome } from './DashboardHome';
import { ReservationsScreen } from './ReservationsScreen';
import { KioskStatusScreen } from './KioskStatusScreen';
import { ActiveSessionsScreen } from './ActiveSessionsScreen';
import { RecordSearchScreen } from './RecordSearchScreen';
import { VisitorActivityScreen } from './VisitorActivityScreen';
import { WorkspaceStatusScreen } from './WorkspaceStatusScreen';
import { SettingsScreen } from './SettingsScreen';
// StaffAssistantScreen (RAG assistant) deferred post-beta — see
// Feature Scope and UCD Review, Section 6. Component moved to
// Admin/archives/PostBeta/.

export function StaffRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="reservations" element={<ReservationsScreen />} />
        <Route path="active-sessions" element={<ActiveSessionsScreen />} />
        <Route path="visitor-activity" element={<VisitorActivityScreen />} />
        <Route path="workspace-status" element={<WorkspaceStatusScreen />} />
        <Route path="record-search" element={<RecordSearchScreen />} />
        <Route path="kiosk-status" element={<KioskStatusScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  );
}

