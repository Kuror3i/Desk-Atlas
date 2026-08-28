"use client";

import React, { useState, useRef } from 'react';

export default function WorkspaceMapPage() {
  const [builderZoom, setBuilderZoom] = useState(1);
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [builderObjects, setBuilderObjects] = useState([
    { id: 'b1', name: 'Skypod 04', x: 310, y: 40, w: 70, h: 70, rotation: 0, bookable: true, template: 'Skypod Table', status: 'available' },
    { id: 'b2', name: 'Meeting Room 02', x: 450, y: 400, w: 200, h: 100, rotation: 0, bookable: true, template: 'Meeting Room', status: 'available' },
    { id: 'b3', name: 'Pantry', x: 820, y: 20, w: 120, h: 80, rotation: 0, bookable: false, template: null, status: null }
  ]);

  const selectedObj = builderObjects.find(o => o.id === selectedObjId);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flex: 1 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid var(--da-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-text-primary)' }}>Workspace Map</span>
          <select style={{ border: '1px solid var(--da-border)', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontFamily: 'var(--da-font-family)' }}>
            <option>Ground Floor</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setBuilderZoom(z => Math.max(0.5, z - 0.1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>−</button>
          <span style={{ fontSize: '12px', fontFamily: 'var(--da-font-family)', width: '40px', textAlign: 'center' }}>{Math.round(builderZoom * 100)}%</span>
          <button onClick={() => setBuilderZoom(z => Math.min(2, z + 0.1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--da-border)', background: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>+</button>
          <button onClick={() => setBuilderZoom(1)} style={{ border: '1px solid var(--da-border)', background: '#fff', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Fit View</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
              backgroundImage: 'radial-gradient(var(--da-border) 1px, transparent 1px)', 
              backgroundSize: '20px 20px',
              overflow: 'hidden'
            }}>
            {builderObjects.map((obj) => (
              <div key={obj.id} style={{ position: 'absolute', left: obj.x, top: obj.y, width: obj.w, height: obj.h, transform: `rotate(${obj.rotation}deg)` }}>
                <button 
                  onClick={() => setSelectedObjId(obj.id)}
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
              </div>
            ))}
          </div>
        </div>

        {/* Inspector */}
        {selectedObj && (
          <aside style={{ width: '240px', background: '#fff', borderLeft: '1px solid var(--da-border)', padding: '18px', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: 0 }}>{selectedObj.name}</h3>
              <button onClick={() => setSelectedObjId(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: 'var(--da-text-secondary)' }}>&times;</button>
            </div>
            
            {selectedObj.bookable && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '2px' }}>Template</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '14px' }}>{selectedObj.template}</div>
              </>
            )}
            
            {selectedObj.bookable && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '4px' }}>Status</div>
                <select 
                  value={selectedObj.status || 'available'} 
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setBuilderObjects(prev => prev.map(o => o.id === selectedObj.id ? { ...o, status: newStatus } : o));
                  }}
                  style={{ width: '100%', border: '1px solid var(--da-border)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', marginBottom: '14px', fontFamily: 'var(--da-font-family)' }}
                >
                  <option value="available">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
