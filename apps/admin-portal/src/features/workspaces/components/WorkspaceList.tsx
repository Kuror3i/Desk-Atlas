"use client";

import React, { useState } from 'react';

const availableTags = [
  'Near Window',
  'Solo',
  'Shared',
  'Meeting Room',
];

const availableShapes = [
  { value: 'desk', label: 'Desk' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'square', label: 'Square' },
  { value: 'booth', label: 'Booth' },
];

export function WorkspaceList() {
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates');
  const [instanceFilter, setInstanceFilter] = useState<string>('All');
  const [modalMode, setModalMode] = useState<'create_template' | 'edit_template' | 'edit_instance' | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [rateAmount, setRateAmount] = useState('');
  const [defaultShape, setDefaultShape] = useState('desk');
  const [defaultColor, setDefaultColor] = useState('#009689');
  const [isActive, setIsActive] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  // Instance form states
  const [instanceName, setInstanceName] = useState('');
  const [instanceStatus, setInstanceStatus] = useState('Active');

  const wsTemplates = [
    { name: 'Skypod Table', rate: 450, capacity: '1 person', count: 12 },
    { name: 'Meeting Room', rate: 1200, capacity: '4-6 people', count: 4 },
    { name: 'Lounge Seat', rate: 300, capacity: '1 person', count: 8 },
    { name: 'Dedicated Desk', rate: 600, capacity: '1 person', count: 6 },
  ];

  const wsInstances = [
    { name: 'Skypod 01', floor: 'Ground Floor', template: 'Skypod Table', mark: '✓', status: 'Active', statusStyle: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' } },
    { name: 'Skypod 02', floor: 'Ground Floor', template: 'Skypod Table', mark: '✓', status: 'Active', statusStyle: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' } },
    { name: 'Meeting 01', floor: 'Ground Floor', template: 'Meeting Room', mark: '✓', status: 'Active', statusStyle: { background: 'var(--da-info)', color: 'var(--da-brand-dark)' } },
    { name: 'Lounge 05', floor: 'Mezzanine', template: 'Lounge Seat', mark: '!', status: 'Maintenance', statusStyle: { background: 'var(--da-soft)', color: 'var(--da-brand-dark)' } },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setModalMode(null);
  };

  const openCreateTemplate = () => {
    setTemplateName('');
    setDescription('');
    setCapacity('');
    setRateAmount('');
    setDefaultShape('desk');
    setDefaultColor('#009689');
    setRecommendations([]);
    setModalMode('create_template');
  };

  const openEditTemplate = (t: any) => {
    setTemplateName(t.name);
    setCapacity(t.capacity.split(' ')[0]);
    setRateAmount(t.rate.toString());
    setDescription('Existing description...');
    setDefaultShape('desk');
    setDefaultColor('#009689');
    setRecommendations(['Solo']);
    setModalMode('edit_template');
  };

  const openEditInstance = (i: any) => {
    setInstanceName(i.name);
    setInstanceStatus(i.status);
    setModalMode('edit_instance');
  };

  const toggleRecommendation = (tag: string) => {
    setRecommendations(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <main data-screen-label="Workspaces" style={{ padding: '26px 28px 40px' }}>
      <div className="mobile-flex-col mobile-items-start" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Workspaces</h1>
          <div style={{ fontSize: '13px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)' }}>Templates define pricing and capacity; instances are the physical desks on the map</div>
        </div>
        <button 
          onClick={openCreateTemplate}
          style={{ background: 'var(--da-brand-dark)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--da-font-family)' }}
        >
          Create Template
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
        <button 
          onClick={() => setActiveTab('templates')} 
          style={{ padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', background: activeTab === 'templates' ? 'var(--da-brand-dark)' : 'transparent', color: activeTab === 'templates' ? '#fff' : 'var(--da-text-secondary)', border: activeTab === 'templates' ? 'none' : '1px solid var(--da-border)' }}
        >
          Templates
        </button>
        <button 
          onClick={() => setActiveTab('instances')} 
          style={{ padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', background: activeTab === 'instances' ? 'var(--da-brand-dark)' : 'transparent', color: activeTab === 'instances' ? '#fff' : 'var(--da-text-secondary)', border: activeTab === 'instances' ? 'none' : '1px solid var(--da-border)' }}
        >
          Physical Instances
        </button>
      </div>

      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {wsTemplates.map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontWeight: 800, color: 'var(--da-text-primary)', fontSize: '15px' }}>{t.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '10px' }}>₱{t.rate}/hour &middot; Capacity {t.capacity} &middot; {t.count} instances</div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', whiteSpace: 'nowrap', background: 'var(--da-info)', color: 'var(--da-brand-dark)' }}>Active</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                <button onClick={() => openEditTemplate(t)} style={{ flex: 1, background: 'var(--da-canvas)', border: 'none', padding: '7px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: 'var(--da-text-primary)' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'instances' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setInstanceFilter('All')}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', background: instanceFilter === 'All' ? 'var(--da-brand-dark)' : 'var(--da-canvas)', color: instanceFilter === 'All' ? '#fff' : 'var(--da-text-primary)', border: '1px solid var(--da-border)' }}
            >
              All
            </button>
            {Array.from(new Set(wsInstances.map(i => i.template))).map(tpl => (
              <button
                key={tpl}
                onClick={() => setInstanceFilter(tpl)}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--da-font-family)', background: instanceFilter === tpl ? 'var(--da-brand-dark)' : 'var(--da-canvas)', color: instanceFilter === tpl ? '#fff' : 'var(--da-text-primary)', border: '1px solid var(--da-border)' }}
              >
                {tpl}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Array.from(new Set(wsInstances.map(i => i.template)))
              .filter(tpl => instanceFilter === 'All' || instanceFilter === tpl)
              .map(tpl => (
                <div key={tpl}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--da-text-primary)', marginBottom: '12px', marginTop: 0 }}>{tpl}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                    {wsInstances.filter(i => i.template === tpl).map((i, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid var(--da-border)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--da-text-primary)', fontSize: '15px' }}>{i.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--da-text-secondary)', fontFamily: 'var(--da-font-family)', marginBottom: '10px' }}>{i.floor}</div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', whiteSpace: 'nowrap', ...i.statusStyle }}>
                          <span aria-hidden="true">{i.mark}</span>{i.status}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                          <button onClick={() => openEditInstance(i)} style={{ flex: 1, background: 'var(--da-canvas)', border: 'none', padding: '7px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: 'var(--da-text-primary)' }}>Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {modalMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(18, 37, 26, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, overflowY: 'auto' }}>
          <div style={{ background: 'var(--da-surface)', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '640px', boxShadow: 'var(--da-shadow-lg)', margin: '40px auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--da-brand-dark)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
              {modalMode === 'create_template' ? 'Create Template' : modalMode === 'edit_template' ? 'Edit Template' : 'Edit Instance'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {modalMode === 'edit_instance' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Instance Name</label>
                    <input 
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Status</label>
                    <select 
                      value={instanceStatus}
                      onChange={(e) => setInstanceStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box', background: '#fff' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Template Name <span style={{ color: 'var(--da-danger)' }}>*</span></label>
                    <input 
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. Executive Suite"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Shared template description"
                      rows={3}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Template Image</label>
                    <div style={{ position: 'relative', border: '1px dashed var(--da-border)', borderRadius: '8px', padding: '24px', textAlign: 'center', background: 'var(--da-canvas)', cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--da-brand-dark)', marginBottom: '4px' }}>Click to upload or drag and drop</div>
                      <div style={{ fontSize: '11px', color: 'var(--da-text-secondary)' }}>PNG, JPG up to 5MB</div>
                      <input type="file" accept="image/png, image/jpeg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                  </div>

                  <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Capacity</label>
                      <input 
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder="e.g. 1"
                        min="1"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Hourly Rate (₱)</label>
                      <input 
                        type="number"
                        value={rateAmount}
                        onChange={(e) => setRateAmount(e.target.value)}
                        placeholder="e.g. 500"
                        min="0"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Default Shape</label>
                      <select 
                        value={defaultShape}
                        onChange={(e) => setDefaultShape(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box', background: '#fff' }}
                      >
                        {availableShapes.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '6px' }}>Default Color</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="color"
                          value={defaultColor}
                          onChange={(e) => setDefaultColor(e.target.value)}
                          style={{ height: '42px', width: '56px', border: '1px solid var(--da-border)', borderRadius: '8px', background: '#fff', cursor: 'pointer', padding: '2px' }}
                        />
                        <input 
                          type="text"
                          value={defaultColor}
                          onChange={(e) => setDefaultColor(e.target.value)}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--da-border)', fontSize: '14px', fontFamily: 'var(--da-font-family)', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--da-text-primary)', marginBottom: '10px' }}>Recommendation Tags</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleRecommendation(tag)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--da-font-family)',
                            transition: 'all 0.2s',
                            border: recommendations.includes(tag) ? '1px solid var(--da-brand-dark)' : '1px solid var(--da-border)',
                            background: recommendations.includes(tag) ? 'var(--da-brand-dark)' : 'var(--da-canvas)',
                            color: recommendations.includes(tag) ? '#fff' : 'var(--da-text-primary)'
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mobile-flex-col" style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--da-border-light)' }}>
                <button 
                  type="button" 
                  onClick={() => setModalMode(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#fff', color: 'var(--da-text-primary)', border: '1px solid var(--da-border)', fontFamily: 'var(--da-font-family)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: 'var(--da-brand-dark)', color: '#fff', border: 'none', fontFamily: 'var(--da-font-family)' }}
                >
                  {modalMode === 'create_template' ? 'Create Template' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
