"use client";

import React, { useState, useEffect } from 'react';

export function MapEditor() {
  const gridOn = true;
  const snapOn = true;
  const [showInspector, setShowInspector] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [builderZoom, setBuilderZoom] = useState(1);
  const [saveState, setSaveState] = useState('Saved');
  const [selectedObjId, setSelectedObjId] = useState<string | null>('b1');
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const [builderObjects, setBuilderObjects] = useState([
    { id: 'b1', name: 'Skypod 04', x: 310, y: 40, w: 70, h: 70, rotation: 0, bookable: true, template: 'Skypod Table', status: 'available' },
    { id: 'b2', name: 'Meeting Room 02', x: 450, y: 400, w: 200, h: 100, rotation: 0, bookable: true, template: 'Meeting Room', status: 'available' },
    { id: 'b3', name: 'Pantry', x: 820, y: 20, w: 120, h: 80, rotation: 0, bookable: false, template: null, status: null }
  ]);
  const [dragState, setDragState] = useState<{ id: string, startX: number, startY: number, startObjX: number, startObjY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ id: string, startX: number, startY: number, startObjW: number, startObjH: number } | null>(null);

  useEffect(() => {
    if (dragState) {
      const handlePointerMove = (e: PointerEvent) => {
        const dx = (e.clientX - dragState.startX) / builderZoom;
        const dy = (e.clientY - dragState.startY) / builderZoom;

        let newX = dragState.startObjX + dx;
        let newY = dragState.startObjY + dy;

        if (snapOn) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }
        
        const obj = builderObjects.find(o => o.id === dragState.id);
        const objW = obj?.w || 0;
        const objH = obj?.h || 0;
        
        const canvasW = canvasRef.current ? canvasRef.current.offsetWidth : 1000;
        const canvasH = canvasRef.current ? canvasRef.current.offsetHeight : 1000;
        
        newX = Math.max(0, Math.min(newX, canvasW - objW));
        newY = Math.max(0, Math.min(newY, canvasH - objH));

        setBuilderObjects(prev => prev.map(o => 
          o.id === dragState.id ? { ...o, x: newX, y: newY } : o
        ));
      };

      const handlePointerUp = () => setDragState(null);

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    } else if (resizeState) {
      const handlePointerMove = (e: PointerEvent) => {
        const dx = (e.clientX - resizeState.startX) / builderZoom;
        const dy = (e.clientY - resizeState.startY) / builderZoom;

        let newW = Math.max(20, resizeState.startObjW + dx);
        let newH = Math.max(20, resizeState.startObjH + dy);

        if (snapOn) {
          newW = Math.round(newW / 20) * 20;
          newH = Math.round(newH / 20) * 20;
        }
        
        const obj = builderObjects.find(o => o.id === resizeState.id);
        const objX = obj?.x || 0;
        const objY = obj?.y || 0;

        const canvasW = canvasRef.current ? canvasRef.current.offsetWidth : 1000;
        const canvasH = canvasRef.current ? canvasRef.current.offsetHeight : 1000;

        newW = Math.min(newW, canvasW - objX);
        newH = Math.min(newH, canvasH - objY);

        setBuilderObjects(prev => prev.map(o => 
          o.id === resizeState.id ? { ...o, w: newW, h: newH } : o
        ));
      };

      const handlePointerUp = () => setResizeState(null);

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragState, resizeState, builderZoom, snapOn]);

  const paletteWorkspaces = [
    { name: 'Skypod Table' },
    { name: 'Meeting Room' },
    { name: 'Lounge Seat' }
  ];

  const paletteStructure = [
    'Wall (Solid)', 'Wall (Glass)', 'Doorway', 'Restroom', 'Emergency Exit'
  ];

  const publishChecks = [
    { text: 'All workspaces inside canvas bounds', color: 'var(--da-success)', icon: '✓' },
    { text: 'No overlapping bookable workspaces', color: 'var(--da-success)', icon: '✓' },
    { text: '3 instances added, 0 instances removed', color: 'var(--da-text-secondary)', icon: 'ℹ' },
    { text: 'Draft map saved', color: 'var(--da-success)', icon: '✓' },
  ];

  const selectedObj = builderObjects.find(o => o.id === selectedObjId) || builderObjects[0];

  return (
    <main data-screen-label="Map Builder" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid var(--da-border)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <select style={{ border: '1px solid var(--da-border)', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontFamily: 'var(--da-font-family)' }}>
            <option>Ground Floor</option>
          </select>
          <button style={{ border: 'none', background: 'none', fontSize: '12px', fontWeight: 600, color: 'var(--da-text-primary)', cursor: 'pointer', fontFamily: 'var(--da-font-family)' }}>Undo</button>
          <button style={{ border: 'none', background: 'none', fontSize: '12px', fontWeight: 600, color: 'var(--da-text-primary)', cursor: 'pointer', fontFamily: 'var(--da-font-family)' }}>Redo</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: 'var(--da-font-family)', color: 'var(--da-text-primary)' }}>
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setBuilderZoom(z => Math.max(0.5, z - 0.1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>−</button>
          <span style={{ fontSize: '12px', fontFamily: 'var(--da-font-family)', width: '40px', textAlign: 'center' }}>{Math.round(builderZoom * 100)}%</span>
          <button onClick={() => setBuilderZoom(z => Math.min(2, z + 0.1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>+</button>
          <button style={{ border: '1px solid var(--da-border)', background: '#fff', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Fit View</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--da-font-family)', color: 'var(--da-text-secondary)' }}>{saveState}</span>
          <button style={{ border: '1px solid var(--da-border)', background: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Save Draft</button>
          <button onClick={() => setShowPublishModal(true)} style={{ background: 'linear-gradient(0deg, var(--da-brand-dark) 70%, #154A32)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Publish</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Palette */}
        <aside style={{ width: '180px', background: '#fff', borderRight: '1px solid var(--da-border)', padding: '14px', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--da-text-secondary)', letterSpacing: '.05em', marginBottom: '8px', fontFamily: 'var(--da-font-family)' }}>WORKSPACES</div>
            {paletteWorkspaces.map((pw, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--da-border-light)' }}>
                <span style={{ fontSize: '12px', color: 'var(--da-text-primary)', fontFamily: 'var(--da-font-family)' }}>{pw.name}</span>
                <button style={{ border: '1px solid var(--da-border)', background: 'var(--da-canvas)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
              </div>
            ))}
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--da-text-secondary)', letterSpacing: '.05em', margin: '16px 0 8px', fontFamily: 'var(--da-font-family)' }}>STRUCTURE</div>
            {paletteStructure.map((ps, i) => (
              <div key={i} style={{ padding: '7px 0', borderTop: '1px solid var(--da-border-light)', fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>{ps}</div>
            ))}
          </aside>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#F1F8F3', position: 'relative' }}>
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
              backgroundImage: gridOn ? 'radial-gradient(var(--da-border) 1px, transparent 1px)' : 'none', 
              backgroundSize: '20px 20px',
              overflow: 'hidden'
            }}>
            {builderObjects.map((obj) => (
              <div key={obj.id} style={{ position: 'absolute', left: obj.x, top: obj.y, width: obj.w, height: obj.h, transform: `rotate(${obj.rotation}deg)` }}>
                <button 
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (e.button !== 0) return;
                    setSelectedObjId(obj.id); 
                    setShowInspector(true);
                    setDragState({
                      id: obj.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startObjX: obj.x,
                      startObjY: obj.y
                    });
                  }}
                  onClick={() => { setSelectedObjId(obj.id); setShowInspector(true); }}
                  aria-pressed={selectedObjId === obj.id}
                  style={{ 
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '11px', fontWeight: 700, textAlign: 'center', cursor: 'pointer', 
                    fontFamily: 'var(--da-font-family)', padding: '2px', lineHeight: 1.2,
                    background: obj.bookable ? 'rgba(200, 244, 81, 0.4)' : '#F3F7F4',
                    border: selectedObjId === obj.id ? '2px solid var(--da-brand-dark)' : '1px solid var(--da-border)',
                    borderRadius: '8px'
                  }}
                >
                  {obj.name}
                </button>
                {selectedObjId === obj.id && (
                  <div
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.button !== 0) return;
                      setResizeState({
                        id: obj.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        startObjW: obj.w,
                        startObjH: obj.h
                      });
                    }}
                    style={{
                      position: 'absolute', right: '-4px', bottom: '-4px', width: '12px', height: '12px',
                      background: 'var(--da-brand-dark)', borderRadius: '50%', cursor: 'nwse-resize',
                      border: '2px solid #fff'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inspector */}
        {showInspector && selectedObj && (
          <aside style={{ width: '240px', background: '#fff', borderLeft: '1px solid var(--da-border)', padding: '18px', flexShrink: 0, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 14px' }}>{selectedObj.name}</h3>
            {selectedObj.bookable && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '2px' }}>Template</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '14px' }}>{selectedObj.template}</div>
              </>
            )}
            <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '4px' }}>Display Name</div>
            <input defaultValue={selectedObj.name} style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', marginBottom: '14px', fontFamily: 'var(--da-font-family)' }} />
            
            {selectedObj.bookable && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '4px' }}>Status</div>
                <select defaultValue={selectedObj.status || 'available'} style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', marginBottom: '14px', fontFamily: 'var(--da-font-family)' }}>
                  <option value="available">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </>
            )}
            
            <button style={{ width: '100%', border: '1px solid var(--da-brand-dark)', background: '#fff', color: 'var(--da-brand-dark)', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Remove from Map</button>
          </aside>
        )}
      </div>

      {showPublishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,59,39,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '26px', maxWidth: '420px', width: '90%' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 8px' }}>Publish map?</h3>
            <p style={{ fontSize: '13px', color: 'var(--da-text-primary)', margin: '0 0 16px' }}>This will immediately replace the live map shown to customers and kiosk users on Ground Floor.</p>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--da-text-secondary)', letterSpacing: '.04em', marginBottom: '8px', fontFamily: 'var(--da-font-family)' }}>VALIDATION</div>
            {publishChecks.map((pc, i) => (
              <div key={i} style={{ fontSize: '13px', color: pc.color, marginBottom: '6px' }}>{pc.icon} {pc.text}</div>
            ))}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowPublishModal(false)} style={{ background: 'transparent', border: '1px solid var(--da-border)', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setShowPublishModal(false)} style={{ background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Confirm Publish</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
