"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getContrastColor(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith('#') || hexColor.length < 7) return '#111827';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#111827' : '#ffffff';
}

function AmenityIcon({ type, name, color }: { type?: string; name?: string; color?: string }) {
  const norm = (type || name || '').toLowerCase();
  const iconColor = color || '#1e293b';

  if (norm.includes('restroom') || norm.includes('toilet') || norm.includes('bath') || norm.includes('cr') || norm.includes('washroom')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Restroom">
        <circle cx="8" cy="5" r="2" fill={iconColor} stroke="none" />
        <path d="M8 8v6M6 10h4M7 14v6M9 14v6" stroke={iconColor} strokeWidth="1.75" />
        <circle cx="16" cy="5" r="2" fill={iconColor} stroke="none" />
        <path d="M14 10l2-2 2 2M16 8v3M14 14l1-3h2l1 3M15 14v6M17 14v6" stroke={iconColor} strokeWidth="1.75" />
      </svg>
    );
  }

  if (norm.includes('pantry') || norm.includes('kitchen') || norm.includes('dining') || norm.includes('cafe') || norm.includes('coffee') || norm.includes('snack')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Pantry">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }

  if (norm.includes('exit') || norm.includes('emergency')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Emergency Exit">
        <path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
        <path d="M3 12h11" />
        <path d="M10 8l4 4-4 4" />
        <circle cx="6" cy="7" r="1.5" fill={iconColor} stroke="none" />
        <path d="M6 9v3l-2 2" stroke={iconColor} strokeWidth="1.75" />
      </svg>
    );
  }

  if (norm.includes('door')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Doorway">
        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
        <path d="M2 20h20" />
        <circle cx="14" cy="12" r="1" fill={iconColor} />
      </svg>
    );
  }

  return null;
}

export default function WorkspaceMapPage() {
  const router = useRouter();
  const [builderZoom, setBuilderZoom] = useState(1);
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [publishedMap, setPublishedMap] = useState<any | null>(null);

  // Load catalog and initial floor
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [wsRes, floorsRes] = await Promise.all([
        fetch('/api/admin/workspaces'),
        fetch('/api/admin/workspaces/floors'),
      ]);

      const wsData = wsRes.ok ? await wsRes.json() : {};
      const floorsData = floorsRes.ok ? await floorsRes.json() : {};

      const loadedFloors = floorsData.floors || wsData.floors || [];
      const loadedTemplates = wsData.templates || [];
      const loadedInstances = wsData.instances || [];

      setFloors(loadedFloors);
      setTemplates(loadedTemplates);
      setInstances(loadedInstances);

      if (loadedFloors.length > 0) {
        const firstFloorId = loadedFloors[0].id;
        setSelectedFloorId(firstFloorId);
        await loadPublishedMapForFloor(firstFloorId);
      } else {
        setPublishedMap(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load workspace map data');
    } finally {
      setLoading(false);
    }
  };

  const loadPublishedMapForFloor = async (floorId: string) => {
    try {
      setLoadingMap(true);
      setSelectedObjId(null);
      const res = await fetch(`/api/admin/maps/published?floorId=${encodeURIComponent(floorId)}`);
      if (res.ok) {
        const data = await res.json();
        setPublishedMap(data.published || null);
      } else {
        setPublishedMap(null);
      }
    } catch (err) {
      setPublishedMap(null);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleFloorChange = async (newFloorId: string) => {
    setSelectedFloorId(newFloorId);
    await loadPublishedMapForFloor(newFloorId);
  };

  // Handle status update for an instance from the inspector
  const handleUpdateInstanceStatus = async (instanceId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/admin/workspaces/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationalStatus: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update workspace status');
      }

      // Update local state
      setInstances(prev =>
        prev.map(ins => (ins.id === instanceId ? { ...ins, operationalStatus: newStatus } : ins))
      );

      setSuccessMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const elements = publishedMap?.elements || [];
  const selectedElement = elements.find((e: any) => e.id === selectedObjId);
  const selectedInstance = selectedElement
    ? instances.find(ins => ins.id === selectedElement.workspaceInstanceId)
    : null;
  const selectedTemplate = selectedInstance
    ? selectedInstance.template || templates.find(t => t.id === selectedInstance.templateId)
    : null;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flex: 1 }}>
      {/* Toast Notifications */}
      {errorMsg && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#b91c1c', padding: '8px 16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} style={{ border: 'none', background: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#ecfdf5', borderBottom: '1px solid #a7f3d0', color: '#065f46', padding: '8px 16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ border: 'none', background: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid var(--da-border)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--da-text-primary)' }}>Workspace Map</span>
          {floors.length > 0 ? (
            <select
              value={selectedFloorId || ''}
              onChange={(e) => handleFloorChange(e.target.value)}
              style={{ border: '1px solid var(--da-border)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontFamily: 'var(--da-font-family)', background: '#fff', fontWeight: 700 }}
            >
              {floors.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--da-text-secondary)' }}>No floors available</span>
          )}

          {publishedMap && (
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: 'var(--da-info)', color: 'var(--da-brand-dark)' }}>
              v{publishedMap.version?.versionNumber} Live
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setBuilderZoom(z => Math.max(0.5, z - 0.1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>−</button>
          <span style={{ fontSize: '12px', fontFamily: 'var(--da-font-family)', width: '40px', textAlign: 'center' }}>{Math.round(builderZoom * 100)}%</span>
          <button onClick={() => setBuilderZoom(z => Math.min(2, z + 0.1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>+</button>
          <button onClick={() => setBuilderZoom(1)} style={{ border: '1px solid var(--da-border)', background: '#fff', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Fit View</button>
          
          <Link 
            href="/manage/map"
            style={{ textDecoration: 'none', border: '1px solid var(--da-border)', background: 'var(--da-canvas)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: 'var(--da-brand-dark)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ✏️ Edit in Map Builder
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#F1F8F3', position: 'relative' }}>
          {loading || loadingMap ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--da-text-secondary)', fontSize: '14px', fontFamily: 'var(--da-font-family)' }}>
              Loading workspace map...
            </div>
          ) : !publishedMap || elements.length === 0 ? (
            /* Empty State when no published map is available */
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
              <div style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '16px', padding: '40px 32px', maxWidth: '460px', boxShadow: 'var(--da-shadow-md)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--da-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
                  🗺️
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  No workspace map created yet
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--da-text-secondary)', margin: '0 0 24px', lineHeight: 1.5, fontFamily: 'var(--da-font-family)' }}>
                  No published floor plan was found for this floor. Open the Map Builder to place desks, configure rooms, and publish your live workspace layout.
                </p>
                <button
                  onClick={() => router.push('/manage/map')}
                  style={{ background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--da-font-family)', transition: 'opacity 0.2s' }}
                >
                  Open Map Builder
                </button>
              </div>
            </div>
          ) : (
            /* Published Map Canvas View */
            <div 
              ref={canvasRef}
              style={{ 
                width: `${100 / builderZoom}%`, 
                height: `${100 / builderZoom}%`, 
                position: 'relative', 
                background: '#fff', 
                border: 'none', 
                transform: `scale(${builderZoom})`, 
                transformOrigin: 'top left', 
                backgroundImage: 'radial-gradient(var(--da-border) 1px, transparent 1px)', 
                backgroundSize: '20px 20px',
                overflow: 'hidden'
              }}
            >
              {elements.map((el: any) => {
                const isWorkspace = el.elementRole === 'WORKSPACE';
                const isWall = el.elementType?.toLowerCase().includes('wall') || el.elementType?.toLowerCase().includes('thin') || el.elementType?.toLowerCase().includes('glass') || el.elementType?.toLowerCase().includes('separator');
                const inst = isWorkspace ? instances.find(ins => ins.id === el.workspaceInstanceId) : null;
                const tmpl = inst ? (inst.template || templates.find(t => t.id === inst.templateId)) : null;
                const status = inst?.operationalStatus || 'ACTIVE';
                const isSelected = selectedObjId === el.id;

                const isRestroom = el.elementType?.toLowerCase().includes('restroom') || el.label?.toLowerCase().includes('restroom');
                const isPantry = el.elementType?.toLowerCase().includes('pantry') || el.label?.toLowerCase().includes('pantry');
                const isEmergencyExit = el.elementType?.toLowerCase().includes('exit') || el.elementType?.toLowerCase().includes('emergency') || el.label?.toLowerCase().includes('exit') || el.label?.toLowerCase().includes('emergency');
                const isAmenity = el.elementRole === 'AMENITY' || isRestroom || isPantry || isEmergencyExit;

                let defaultAmenityColor = '#F3F7F4';
                if (isRestroom) defaultAmenityColor = '#E0F2FE';
                else if (isPantry) defaultAmenityColor = '#FEF3C7';
                else if (isEmergencyExit) defaultAmenityColor = '#DCFCE7';

                const displayName = inst?.displayName || el.label || tmpl?.name || el.elementType;
                const itemColor = el.properties?.color || tmpl?.defaultColor || (isWorkspace ? '#009689' : (isAmenity ? defaultAmenityColor : (isWall ? '#334155' : '#F3F7F4')));

                let bg = el.properties?.color || itemColor;
                let textColor = getContrastColor(bg);
                let border = isSelected ? '3px solid var(--da-brand-dark)' : '1px solid rgba(0, 0, 0, 0.15)';

                if (isWorkspace) {
                  if (status === 'MAINTENANCE') {
                    border = '2px dashed #f59e0b';
                  } else if (status === 'INACTIVE') {
                    border = '2px dashed #94a3b8';
                    bg = 'rgba(148, 163, 184, 0.4)';
                    textColor = '#334155';
                  }
                } else if (el.elementType?.toLowerCase().includes('door')) {
                  border = '2px dashed var(--da-brand-dark)';
                }

                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      transform: `rotate(${el.rotation || 0}deg)`,
                      zIndex: el.zIndex || 1,
                    }}
                  >
                    <button
                      onClick={() => setSelectedObjId(el.id)}
                      aria-pressed={isSelected}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontFamily: 'var(--da-font-family)',
                        padding: '4px',
                        lineHeight: 1.2,
                        background: bg,
                        border: border,
                        borderRadius: isWall ? '2px' : '8px',
                        color: textColor,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: isSelected ? '0 0 0 2px var(--da-brand-dark)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isWorkspace ? (
                        <>
                          <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                          </span>
                          {inst?.instanceCode && (
                            <span style={{ fontSize: '9px', opacity: 0.85, marginTop: '2px', fontWeight: 600 }}>
                              {inst.instanceCode}
                            </span>
                          )}
                        </>
                      ) : isAmenity ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', pointerEvents: 'none', maxWidth: '100%', maxHeight: '100%' }}>
                          <AmenityIcon type={el.elementType} name={displayName} color={textColor} />
                          <span style={{ fontSize: '10px', fontWeight: 700, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>
                            {displayName}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspector Sidebar */}
        {selectedElement && (
          <aside style={{ width: '280px', background: '#fff', borderLeft: '1px solid var(--da-border)', padding: '20px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--da-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {selectedElement.elementRole}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '3px 0 0' }}>
                  {selectedInstance?.displayName || selectedElement.label || selectedElement.elementType}
                </h3>
              </div>
              <button onClick={() => setSelectedObjId(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--da-text-secondary)' }}>&times;</button>
            </div>

            {selectedInstance ? (
              <>
                <div style={{ padding: '12px', background: 'var(--da-canvas)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--da-text-secondary)' }}>Template:</span>
                    <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>{selectedTemplate?.name || 'Standard'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--da-text-secondary)' }}>Code:</span>
                    <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>{selectedInstance.instanceCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--da-text-secondary)' }}>Rate:</span>
                    <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>₱{selectedTemplate?.rateAmount ?? 0}/hr</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--da-text-secondary)' }}>Capacity:</span>
                    <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>{selectedTemplate?.capacity ?? 1} Person(s)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--da-text-secondary)' }}>Floor:</span>
                    <span style={{ fontWeight: 700, color: 'var(--da-text-primary)' }}>{publishedMap?.floor?.name || 'Ground Floor'}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>
                    Operational Status
                  </label>
                  <select
                    disabled={actionLoading}
                    value={selectedInstance.operationalStatus || 'ACTIVE'}
                    onChange={(e) => handleUpdateInstanceStatus(selectedInstance.id, e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontFamily: 'var(--da-font-family)', background: '#fff', fontWeight: 600 }}
                  >
                    <option value="ACTIVE">Active (Bookable)</option>
                    <option value="MAINTENANCE">Maintenance (Blocked)</option>
                    <option value="INACTIVE">Inactive (Hidden)</option>
                  </select>
                </div>
              </>
            ) : (
              <div style={{ padding: '12px', background: 'var(--da-canvas)', borderRadius: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--da-text-secondary)' }}>Type:</span>
                  <span style={{ fontWeight: 700 }}>{selectedElement.elementType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--da-text-secondary)' }}>Size:</span>
                  <span style={{ fontWeight: 700 }}>{selectedElement.width} × {selectedElement.height} px</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--da-text-secondary)' }}>Rotation:</span>
                  <span style={{ fontWeight: 700 }}>{selectedElement.rotation || 0}°</span>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
