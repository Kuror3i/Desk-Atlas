import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Edit2,
  Layers,
  Link2,
  MapPin,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { AdminWorkspaceSpace, Floor, FloorMap, MapElementInput, WorkspaceTemplate } from '@deskatlas/domain';
import {
  createAdminFloor,
  createAdminWorkspaceInstanceFromTemplate,
  fetchAdminWorkspaceCatalog,
} from '../../lib/adminWorkspaceApi';
import {
  fetchAdminMapDraft,
  fetchAdminPublishedMap,
  publishAdminMapDraft,
  saveAdminMapDraft,
} from '../../lib/adminMapApi';

type SpaceType = 'desk' | 'meeting-room' | 'phone-booth';

const MAP_CANVAS_WIDTH = 1600;
const MAP_CANVAS_HEIGHT = 1000;
const MAP_GRID_SIZE = 20;
const AUTOSAVE_DELAY_MS = 500;

type FloorSpace = {
  id: string;
  type: SpaceType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  zone: string;
  workspaceInstanceId: string | null;
};

type ZoneArea = {
  id: string;
  name: string;
  elementType: 'zone' | 'pantry' | 'restroom';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type NoticeTone = 'info' | 'success' | 'warning' | 'error';

type NoticeState = {
  tone: NoticeTone;
  title: string;
  message: string;
} | null;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type EditWorkspaceForm = {
  label: string;
  zone: string;
  workspaceInstanceId: string;
};

const defaultZoneColors = [
  'rgba(0, 150, 137, 0.1)',
  'rgba(59, 130, 246, 0.1)',
  'rgba(249, 115, 22, 0.1)',
  'rgba(236, 72, 153, 0.1)',
];

const spaceColors = {
  desk: 'bg-[#009689]',
  'meeting-room': 'bg-purple-500',
  'phone-booth': 'bg-orange-500',
} as const;

const spaceLabels = {
  desk: 'Desk',
  'meeting-room': 'Meeting Room',
  'phone-booth': 'Phone Booth',
} as const;

export function LayoutEditor() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [workspaceTemplates, setWorkspaceTemplates] = useState<WorkspaceTemplate[]>([]);
  const [workspaceCatalog, setWorkspaceCatalog] = useState<AdminWorkspaceSpace[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [spaces, setSpaces] = useState<FloorSpace[]>([]);
  const [zones, setZones] = useState<ZoneArea[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [draggingSpaceId, setDraggingSpaceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingSpaceId, setResizingSpaceId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const [draftMap, setDraftMap] = useState<FloorMap | null>(null);
  const [publishedMap, setPublishedMap] = useState<FloorMap | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<FloorSpace | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [editForm, setEditForm] = useState<EditWorkspaceForm>({
    label: '',
    zone: '',
    workspaceInstanceId: '',
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const hydratedFloorRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChangesRef = useRef(false);

  useEffect(() => {
    let active = true;

    fetchAdminWorkspaceCatalog()
      .then((catalog) => {
        if (!active) return;
        setWorkspaceTemplates(catalog.templates);
        setWorkspaceCatalog(catalog.spaces);
        setFloors(catalog.floors);
        setSelectedFloorId((current) => current || catalog.floors[0]?.id || '');
      })
      .catch((error) => {
        console.error('Unable to load workspace catalog for map editor', error);
        if (active) {
          setNotice({
            tone: 'error',
            title: 'Unable to load map dependencies',
            message: 'Workspace templates and floors could not be loaded from the backend.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFloorId) return;

    let active = true;
    setIsLoading(true);

    Promise.all([fetchAdminMapDraft(selectedFloorId), fetchAdminPublishedMap(selectedFloorId)])
      .then(([draft, published]) => {
        if (!active) return;
        setDraftMap(draft);
        setPublishedMap(published);
        setSpaces(mapDraftToSpaces(draft));
        setZones(mapDraftToZones(draft));
        setSelectedSpaceId(null);
        setSelectedZoneId(null);
        setIsDirty(false);
        setSaveState('idle');
        hydratedFloorRef.current = selectedFloorId;
      })
      .catch((error) => {
        console.warn('Unable to load floor-specific map data', error);
        if (!active) return;
        setDraftMap(null);
        setPublishedMap(null);
        setSpaces([]);
        setZones([]);
        setNotice({
          tone: 'error',
          title: 'Unable to load floor map',
          message: error instanceof Error ? error.message : 'The selected floor map could not be loaded.',
        });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedFloorId]);

  useEffect(() => {
    if (!selectedFloorId) return;
    if (hydratedFloorRef.current !== selectedFloorId) return;
    if (!isDirty) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void persistDraft('autosave');
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [isDirty, selectedFloorId, spaces, zones]);

  const floorInstances = useMemo(
    () => workspaceCatalog.filter((space) => space.floorId === selectedFloorId),
    [selectedFloorId, workspaceCatalog]
  );

  const workspaceByInstanceId = useMemo(
    () => new Map(workspaceCatalog.map((space) => [space.id, space])),
    [workspaceCatalog]
  );

  const activeTemplates = useMemo(
    () => workspaceTemplates.filter((template) => template.isActive),
    [workspaceTemplates]
  );

  const linkedInstanceIds = useMemo(
    () => new Set(spaces.map((space) => space.workspaceInstanceId).filter((value): value is string => Boolean(value))),
    [spaces]
  );

  const availableInstances = useMemo(
    () => floorInstances.filter((space) => !linkedInstanceIds.has(space.id)),
    [floorInstances, linkedInstanceIds]
  );

  const unlinkedSpaces = useMemo(
    () => spaces.filter((space) => !space.workspaceInstanceId),
    [spaces]
  );

  const statusSummary = {
    workspaces: spaces.length,
    linked: spaces.filter((space) => Boolean(space.workspaceInstanceId)).length,
    unlinked: unlinkedSpaces.length,
    zones: zones.length,
  };

  function markDirty() {
    setIsDirty(true);
    pendingChangesRef.current = true;
    setSaveState((current) => (current === 'saving' ? current : 'idle'));
  }

  function buildMapInput(): { floorId: string; canvasWidth: number; canvasHeight: number; gridSize: number; elements: MapElementInput[] } {
    return {
      floorId: selectedFloorId,
      canvasWidth: MAP_CANVAS_WIDTH,
      canvasHeight: MAP_CANVAS_HEIGHT,
      gridSize: MAP_GRID_SIZE,
      elements: [...zones.map(zoneToMapElement), ...spaces.map((space, index) => spaceToMapElement(space, index))],
    };
  }

  async function persistDraft(source: 'manual' | 'autosave') {
    if (!selectedFloorId) return;

    setSaveState('saving');
    pendingChangesRef.current = false;
    try {
      const draft = await saveAdminMapDraft(buildMapInput());
      setDraftMap(draft);
      
      if (!pendingChangesRef.current) {
        setIsDirty(false);
        setSaveState('saved');
      } else {
        setSaveState('idle');
      }
      
      setLastSavedAt(new Date().toISOString());
      setNotice({
        tone: 'success',
        title: source === 'manual' ? 'Draft saved' : 'Draft autosaved',
        message:
          source === 'manual'
            ? `${spaces.length} workspace elements were saved for the selected floor.`
            : 'Recent map changes were saved automatically.',
      });
    } catch (error) {
      setSaveState('error');
      setNotice({
        tone: 'error',
        title: 'Unable to save draft',
        message: error instanceof Error ? error.message : 'The map draft could not be saved.',
      });
    }
  }

  async function handlePublish() {
    if (!selectedFloorId) return;

    setSaveState('saving');
    pendingChangesRef.current = false;
    try {
      const published = await publishAdminMapDraft({
        floorId: selectedFloorId,
        actorUserId: '00000000-0000-0000-0000-000000000000',
      });
      setPublishedMap(published);
      
      const newDraft = await fetchAdminMapDraft(selectedFloorId);
      setDraftMap(newDraft);
      
      if (!pendingChangesRef.current) {
        setIsDirty(false);
        setSaveState('saved');
      } else {
        setSaveState('idle');
      }
      
      setLastSavedAt(new Date().toISOString());
      setNotice({
        tone: 'success',
        title: 'Floor published',
        message: `${published.floor.name} is now using published backend geometry.`,
      });
    } catch (error) {
      setSaveState('error');
      setNotice({
        tone: 'error',
        title: 'Publish validation failed',
        message: error instanceof Error ? error.message : 'The floor could not be published.',
      });
    }
  }

  async function handleAddTemplatePlacement(template: WorkspaceTemplate) {
    if (!selectedFloorId) return;

    setSaveState('saving');
    try {
      const instance = await createAdminWorkspaceInstanceFromTemplate({
        templateId: template.id,
        floorId: selectedFloorId,
      });
      setWorkspaceCatalog((current) => [...current, instance]);
      placeWorkspaceShape(instance, spaces.length);
      setSaveState('idle');
      setNotice({
        tone: 'info',
        title: 'Workspace placed',
        message: `${instance.name} was created for this floor and linked to the map.`,
      });
    } catch (error) {
      setSaveState('error');
      setNotice({
        tone: 'error',
        title: 'Unable to add workspace',
        message: error instanceof Error ? error.message : 'A workspace could not be created for this floor.',
      });
    }
  }

  function placeWorkspaceShape(instance: AdminWorkspaceSpace, count: number) {
    const defaultWidth = instance.type === 'meeting-room' ? 150 : instance.type === 'phone-booth' ? 70 : 80;
    const defaultHeight = instance.type === 'meeting-room' ? 100 : instance.type === 'phone-booth' ? 70 : 60;

    const newSpace: FloorSpace = {
      id: crypto.randomUUID(),
      type: instance.type,
      x: snapToGrid(80 + (count % 6) * 110),
      y: snapToGrid(80 + Math.floor(count / 6) * 110),
      width: defaultWidth,
      height: defaultHeight,
      label: instance.name,
      zone: inferZoneFromInstance(instance),
      workspaceInstanceId: instance.id,
    };

    setSpaces((current) => [...current, newSpace]);
    setSelectedSpaceId(newSpace.id);
    setSelectedZoneId(null);
    markDirty();
  }

  async function handleAddFloor() {
    if (!newFloorName.trim()) {
      setNotice({
        tone: 'warning',
        title: 'Floor name required',
        message: 'Enter a floor name before adding it.',
      });
      return;
    }

    try {
      const newFloor = await createAdminFloor(newFloorName.trim());
      setFloors((current) => [...current, newFloor]);
      setSelectedFloorId(newFloor.id);
      setNewFloorName('');
      setShowAddFloorModal(false);
      setNotice({
        tone: 'success',
        title: 'Floor added',
        message: 'New empty floor created successfully.',
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Failed to add floor',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  function handleAddZone() {
    if (!newZoneName.trim()) {
      setNotice({
        tone: 'warning',
        title: 'Zone name required',
        message: 'Enter a zone name before adding it to the floor.',
      });
      return;
    }

    const newZone: ZoneArea = {
      id: crypto.randomUUID(),
      name: newZoneName.trim(),
      elementType: 'zone',
      x: snapToGrid(100),
      y: snapToGrid(100),
      width: snapToGrid(300),
      height: snapToGrid(200),
      color: defaultZoneColors[zones.length % defaultZoneColors.length],
    };

    setZones((current) => [...current, newZone]);
    setSelectedZoneId(newZone.id);
    setSelectedSpaceId(null);
    setNewZoneName('');
    setShowAddZoneModal(false);
    markDirty();
  }

  function handleApplyStarterZones() {
    setZones(createStarterZones());
    setSelectedZoneId(null);
    setSelectedSpaceId(null);
    markDirty();
    setNotice({
      tone: 'info',
      title: 'Starter zones applied',
      message: 'Default coworking zones were added to the current floor.',
    });
  }

  function handleMouseDown(event: ReactMouseEvent, spaceId: string) {
    event.stopPropagation();
    const space = spaces.find((item) => item.id === spaceId);
    if (!space) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingSpaceId(spaceId);
    setSelectedSpaceId(spaceId);
    setSelectedZoneId(null);
    setDragOffset({
      x: event.clientX - rect.left - space.x,
      y: event.clientY - rect.top - space.y,
    });
  }

  function handleResizeStart(event: ReactMouseEvent, space: FloorSpace, handle: string) {
    event.stopPropagation();
    setResizingSpaceId(space.id);
    setResizeHandle(handle);
    setResizeStart({
      x: space.x,
      y: space.y,
      width: space.width,
      height: space.height,
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
    setSelectedSpaceId(space.id);
    setSelectedZoneId(null);
  }

  function handleMouseMove(event: ReactMouseEvent) {
    if (resizingSpaceId && resizeHandle) {
      const deltaX = event.clientX - resizeStart.mouseX;
      const deltaY = event.clientY - resizeStart.mouseY;
      
      setSpaces((current) =>
        current.map((space) => {
          if (space.id !== resizingSpaceId) return space;
          let { x, y, width, height } = resizeStart;
          
          if (resizeHandle.includes('e')) width = snapToGrid(Math.max(20, width + deltaX));
          if (resizeHandle.includes('s')) height = snapToGrid(Math.max(20, height + deltaY));
          if (resizeHandle.includes('w')) {
             const newRight = x + width;
             x = snapToGrid(Math.min(newRight - 20, x + deltaX));
             width = newRight - x;
          }
          if (resizeHandle.includes('n')) {
             const newBottom = y + height;
             y = snapToGrid(Math.min(newBottom - 20, y + deltaY));
             height = newBottom - y;
          }
          
          return { ...space, x, y, width, height };
        })
      );
      markDirty();
      return;
    }

    if (!draggingSpaceId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const nextX = snapToGrid(clamp(event.clientX - rect.left - dragOffset.x, 0, MAP_CANVAS_WIDTH - 40));
    const nextY = snapToGrid(clamp(event.clientY - rect.top - dragOffset.y, 0, MAP_CANVAS_HEIGHT - 40));

    setSpaces((current) =>
      current.map((space) =>
        space.id === draggingSpaceId
          ? { ...space, x: nextX, y: nextY, zone: detectZoneName({ ...space, x: nextX, y: nextY }, zones) ?? space.zone }
          : space
      )
    );
    markDirty();
  }

  function handleMouseUp() {
    setDraggingSpaceId(null);
    setResizingSpaceId(null);
    setResizeHandle(null);
  }

  function handleCanvasClick() {
    setSelectedSpaceId(null);
    setSelectedZoneId(null);
  }

  function handleEditClick(space: FloorSpace) {
    setEditingSpace(space);
    setEditForm({
      label: space.label,
      zone: space.zone,
      workspaceInstanceId: space.workspaceInstanceId ?? '',
    });
    setShowEditModal(true);
  }

  function handleSaveEdit() {
    if (!editingSpace) return;
    if (!editForm.label.trim()) {
      setNotice({
        tone: 'warning',
        title: 'Workspace label required',
        message: 'Enter a visible label before saving this workspace placement.',
      });
      return;
    }

    const selectedInstance = workspaceByInstanceId.get(editForm.workspaceInstanceId);
    const selectedType = selectedInstance?.type ?? editingSpace.type;

    setSpaces((current) =>
      current.map((space) =>
        space.id === editingSpace.id
          ? {
              ...space,
              label: editForm.label.trim(),
              zone: editForm.zone.trim() || inferZoneFromInstance(selectedInstance) || space.zone,
              workspaceInstanceId: editForm.workspaceInstanceId || null,
              type: selectedType,
            }
          : space
      )
    );
    setShowEditModal(false);
    setEditingSpace(null);
    markDirty();
  }

  function handleDuplicate(space: FloorSpace) {
    const duplicate: FloorSpace = {
      ...space,
      id: crypto.randomUUID(),
      x: snapToGrid(clamp(space.x + 30, 0, MAP_CANVAS_WIDTH - space.width)),
      y: snapToGrid(clamp(space.y + 30, 0, MAP_CANVAS_HEIGHT - space.height)),
      workspaceInstanceId: null,
      label: `${space.label} Copy`,
    };

    setSpaces((current) => [...current, duplicate]);
    setSelectedSpaceId(duplicate.id);
    setSelectedZoneId(null);
    markDirty();
    setNotice({
      tone: 'warning',
      title: 'Duplicate created as editor aid',
      message: 'Link the duplicated shape to a different physical workspace instance before publishing.',
    });
  }

  function handleDeleteClick(space: FloorSpace) {
    setEditingSpace(space);
    setShowDeleteConfirm(true);
  }

  function handleConfirmDelete() {
    if (!editingSpace) return;
    setSpaces((current) => current.filter((space) => space.id !== editingSpace.id));
    setSelectedSpaceId(null);
    setShowDeleteConfirm(false);
    setEditingSpace(null);
    markDirty();
  }

  function handleDeleteZone(zoneId: string) {
    setZones((current) => current.filter((zone) => zone.id !== zoneId));
    setSelectedZoneId(null);
    markDirty();
  }

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedSpaceCatalog = selectedSpace?.workspaceInstanceId
    ? workspaceByInstanceId.get(selectedSpace.workspaceInstanceId) ?? null
    : null;

  if (!floors.length && !isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-xl font-semibold text-gray-900">No floors available</p>
        <p className="text-sm text-gray-600 mt-2">Create workspace floors first so the map editor has a real floor to manage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Published Map Editor</h2>
            <p className="text-gray-600 mt-1">
              Build one floor at a time, link real workspace instances, save drafts, and publish validated geometry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedFloorId}
              onChange={(event) => setSelectedFloorId(event.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-[#009689] transition-all"
            >
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddFloorModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Floor
            </button>
            <button
              onClick={() => void persistDraft('manual')}
              className="flex items-center gap-2 px-4 py-2 bg-[#009689] text-white rounded-lg hover:opacity-90 transition-opacity"
              disabled={!selectedFloorId || isLoading}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={() => void handlePublish()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={!selectedFloorId || isLoading}
            >
              <Send className="w-4 h-4" />
              Publish Floor
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Layers className="w-6 h-6 text-[#009689]" />}
          label="Workspace Shapes"
          value={statusSummary.workspaces}
          helper={`${statusSummary.linked} linked`}
        />
        <SummaryCard
          icon={<Link2 className="w-6 h-6 text-blue-600" />}
          label="Unlinked Shapes"
          value={statusSummary.unlinked}
          helper={statusSummary.unlinked === 0 ? 'Ready to publish' : 'Will stay editor-only'}
        />
        <SummaryCard
          icon={<MapPin className="w-6 h-6 text-orange-600" />}
          label="Zones"
          value={statusSummary.zones}
          helper="Non-bookable structure elements"
        />
        <SummaryCard
          icon={<Clock3 className="w-6 h-6 text-purple-600" />}
          label="Save State"
          value={formatSaveState(saveState)}
          helper={lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'No save yet'}
        />
      </div>

      {notice && <NoticeBanner notice={notice} />}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Instance Palette</h3>
                <p className="text-sm text-gray-600 mt-1">Only real physical workspaces can become bookable.</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {activeTemplates.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No active workspace templates are available to add on this floor yet.
                </p>
              ) : (
                activeTemplates.map((template) => {
                  const instance = {
                    id: template.id,
                    type: inferTemplateSpaceType(template),
                    hourlyRate: template.rateAmount,
                  };

                  return (
                  <button
                    key={template.id}
                    onClick={() => void handleAddTemplatePlacement(template)}
                    className="w-full text-left rounded-lg border border-gray-200 p-4 hover:border-[#009689] hover:bg-[#f4fbfa] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{template.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Next placement: {getNextTemplatePlacementLabel(template, floorInstances)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{instance.type.replace('-', ' ')} • ${instance.hourlyRate}/hr</p>
                      </div>
                      <Plus className="w-4 h-4 text-[#009689] shrink-0" />
                    </div>
                  </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Structure Tools</h3>
                <p className="text-sm text-gray-600 mt-1">Use zones for organization, not bookability.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleApplyStarterZones}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Apply Starter Zones
              </button>
              <button
                onClick={() => setShowAddZoneModal(true)}
                className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                Add Zone
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Draft & Published Status</h3>
            <div className="space-y-3 mt-4">
              <StatusRow label="Draft version" value={draftMap ? `v${draftMap.version.versionNumber}` : 'No draft yet'} />
              <StatusRow
                label="Published version"
                value={publishedMap ? `v${publishedMap.version.versionNumber}` : 'Not published'}
              />
              <StatusRow
                label="Published elements"
                value={publishedMap ? String(publishedMap.elements.length) : '0'}
              />
              <StatusRow
                label="Validation note"
                value={unlinkedSpaces.length === 0 ? 'All workspace shapes linked' : `${unlinkedSpaces.length} editor-only shape(s)`}
              />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>Editor rules:</strong> This canvas is schematic and backend-authoritative. Linked workspace shapes save as
              real `WORKSPACE` elements. Unlinked shapes save as `EDITOR_AID` and will not publish as bookable inventory.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div
              ref={canvasRef}
              className="relative bg-gray-50 cursor-default overflow-auto"
              style={{ height: '640px' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(#00968944 1px, transparent 1px), linear-gradient(90deg, #00968944 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`absolute border-2 border-dashed rounded-lg group ${selectedZoneId === zone.id ? 'ring-2 ring-blue-400' : ''}`}
                  style={{
                    left: `${zone.x}px`,
                    top: `${zone.y}px`,
                    width: `${zone.width}px`,
                    height: `${zone.height}px`,
                    backgroundColor: zone.color,
                    borderColor: zone.color.replace('0.1', '0.5'),
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedZoneId(zone.id);
                    setSelectedSpaceId(null);
                  }}
                >
                  <div className="absolute -top-8 left-0 flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-md border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{zone.name}</p>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}

              {spaces.map((space) => {
                const linkedSpace = space.workspaceInstanceId ? workspaceByInstanceId.get(space.workspaceInstanceId) ?? null : null;
                const isSelected = selectedSpaceId === space.id;

                return (
                  <div
                    key={space.id}
                    className={`absolute ${spaceColors[space.type]} text-white rounded-lg shadow-lg cursor-move transition-all ${
                      isSelected ? 'ring-4 ring-blue-400' : ''
                    } ${draggingSpaceId === space.id ? 'opacity-70' : 'hover:shadow-xl'} ${
                      linkedSpace ? '' : 'border-2 border-dashed border-white/80'
                    }`}
                    style={{
                      left: `${space.x}px`,
                      top: `${space.y}px`,
                      width: `${space.width}px`,
                      height: `${space.height}px`,
                    }}
                    onMouseDown={(event) => handleMouseDown(event, space.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedSpaceId(space.id);
                      setSelectedZoneId(null);
                    }}
                  >
                    <div className="h-full flex flex-col items-center justify-center p-2 text-center">
                      <p className="text-xs font-semibold break-words">{space.label}</p>
                    </div>

                    {isSelected && (
                      <>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-lg p-1 border border-gray-200 z-10">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditClick(space);
                            }}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDuplicate(space);
                            }}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteClick(space);
                            }}
                            className="p-2 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-ns-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'n')} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-ns-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 's')} />
                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-ew-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'w')} />
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-ew-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'e')} />
                        
                        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-nwse-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'nw')} />
                        <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-nesw-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'ne')} />
                        <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-nesw-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'sw')} />
                        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-nwse-resize z-10" onMouseDown={(e) => handleResizeStart(e, space, 'se')} />
                      </>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="text-center">
                    <Clock3 className="w-10 h-10 text-[#009689] mx-auto mb-3 animate-pulse" />
                    <p className="text-sm font-medium text-gray-900">Loading floor map...</p>
                  </div>
                </div>
              )}

              {!isLoading && spaces.length === 0 && zones.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No map elements yet</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Place real workspace instances from the palette or add zones to start this floor.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Selected Placement</h3>
              {selectedSpace ? (
                <div className="space-y-3 mt-4">
                  <StatusRow label="Label" value={selectedSpace.label} />
                  <StatusRow label="Zone" value={selectedSpace.zone} />
                  <StatusRow label="Type" value={selectedSpace.type} />
                  <StatusRow label="Workspace link" value={selectedSpaceCatalog?.name ?? 'Unlinked editor aid'} />
                  <StatusRow
                    label="Template rate"
                    value={selectedSpaceCatalog ? `$${selectedSpaceCatalog.hourlyRate}/hr (read-only from template)` : 'Not linked'}
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-4">Select a workspace shape to inspect its backend link.</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Validation Readiness</h3>
              <div className="space-y-3 mt-4">
                <ReadinessRow
                  ok={Boolean(selectedFloorId)}
                  text="A real floor is selected for this draft."
                />
                <ReadinessRow
                  ok={spaces.every((space) => space.x >= 0 && space.y >= 0)}
                  text="Placed elements remain inside the working canvas."
                />
                <ReadinessRow
                  ok={unlinkedSpaces.length === 0}
                  text={
                    unlinkedSpaces.length === 0
                      ? 'Every workspace shape is linked to a real instance.'
                      : `${unlinkedSpaces.length} workspace shape(s) still need a real instance link.`
                  }
                />
                <ReadinessRow
                  ok={availableInstances.length >= 0}
                  text="Real workspace instances are selected from backend catalog data, not local-only shapes."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && editingSpace && (
        <ModalFrame
          title="Edit Workspace Placement"
          onClose={() => {
            setShowEditModal(false);
            setEditingSpace(null);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visible Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editForm.label}
                onChange={(event) => setEditForm({ ...editForm, label: event.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
              <input
                type="text"
                value={editForm.zone}
                onChange={(event) => setEditForm({ ...editForm, zone: event.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Linked Workspace Instance</label>
              <select
                value={editForm.workspaceInstanceId}
                onChange={(event) => setEditForm({ ...editForm, workspaceInstanceId: event.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
              >
                <option value="">No link (editor aid only)</option>
                {floorInstances
                  .filter((instance) => !linkedInstanceIds.has(instance.id) || instance.id === editingSpace.workspaceInstanceId)
                  .map((instance) => (
                    <option key={instance.id} value={instance.id}>
                      {instance.instanceCode} • {instance.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Template pricing</p>
              <p className="text-gray-900 font-medium">
                {editForm.workspaceInstanceId && workspaceByInstanceId.get(editForm.workspaceInstanceId)
                  ? `$${workspaceByInstanceId.get(editForm.workspaceInstanceId)!.hourlyRate}/hr from linked template`
                  : 'Link a real workspace instance to use backend pricing.'}
              </p>
            </div>
          </div>

          <ModalActions
            onCancel={() => {
              setShowEditModal(false);
              setEditingSpace(null);
            }}
            onConfirm={handleSaveEdit}
            confirmLabel="Save Placement"
          />
        </ModalFrame>
      )}

      {showDeleteConfirm && editingSpace && (
        <ModalFrame
          title="Remove Workspace Placement"
          onClose={() => {
            setShowDeleteConfirm(false);
            setEditingSpace(null);
          }}
        >
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-800">
                Remove this workspace shape from the floor draft? The physical workspace instance stays in the catalog.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Placement</p>
              <p className="text-gray-900 font-medium">{editingSpace.label}</p>
            </div>
          </div>
          <ModalActions
            onCancel={() => {
              setShowDeleteConfirm(false);
              setEditingSpace(null);
            }}
            onConfirm={handleConfirmDelete}
            confirmLabel="Remove from Draft"
            confirmClassName="bg-red-600 hover:bg-red-700"
          />
        </ModalFrame>
      )}

      {showAddZoneModal && (
        <ModalFrame
          title="Add Zone"
          onClose={() => {
            setShowAddZoneModal(false);
            setNewZoneName('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(event) => setNewZoneName(event.target.value)}
                placeholder="e.g., Quiet Area"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                Zones are structural elements only. They help organize the floor but do not create bookable inventory.
              </p>
            </div>
          </div>
          <ModalActions
            onCancel={() => {
              setShowAddZoneModal(false);
              setNewZoneName('');
            }}
            onConfirm={handleAddZone}
            confirmLabel="Add Zone"
          />
        </ModalFrame>
      )}

      {showAddFloorModal && (
        <ModalFrame
          title="Add New Floor"
          onClose={() => {
            setShowAddFloorModal(false);
            setNewFloorName('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newFloorName}
                onChange={(event) => setNewFloorName(event.target.value)}
                placeholder="e.g., 2nd Floor, Main Floor, Mezzanine"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all"
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                A new empty floor will be created immediately. You can then select it to start adding workspaces and zones.
              </p>
            </div>
          </div>
          <ModalActions
            onCancel={() => {
              setShowAddFloorModal(false);
              setNewFloorName('');
            }}
            onConfirm={() => void handleAddFloor()}
            confirmLabel="Add Floor"
          />
        </ModalFrame>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">{icon}</div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{helper}</p>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Exclude<NoticeState, null> }) {
  const palette = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  }[notice.tone];

  const Icon = {
    info: AlertCircle,
    success: CheckCircle2,
    warning: AlertCircle,
    error: AlertCircle,
  }[notice.tone];

  return (
    <div className={`rounded-lg border p-4 ${palette}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">{notice.title}</p>
          <p className="text-sm mt-1">{notice.message}</p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

function ReadinessRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      {ok ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />}
      <span className={ok ? 'text-gray-800' : 'text-yellow-900'}>{text}</span>
    </div>
  );
}

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  confirmLabel,
  confirmClassName = 'bg-[#009689] hover:opacity-90',
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmClassName?: string;
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${confirmClassName}`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function zoneToMapElement(zone: ZoneArea, index: number): MapElementInput {
  return {
    id: persistableElementId(zone.id),
    elementRole: 'STRUCTURE',
    elementType: zone.elementType,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    rotation: 0,
    zIndex: index,
    label: zone.name,
    properties: {
      color: zone.color,
    },
    isLocked: false,
  };
}

function spaceToMapElement(space: FloorSpace, index: number): MapElementInput {
  return {
    id: persistableElementId(space.id),
    elementRole: space.workspaceInstanceId ? 'WORKSPACE' : 'EDITOR_AID',
    elementType: space.type,
    workspaceInstanceId: space.workspaceInstanceId,
    x: space.x,
    y: space.y,
    width: space.width,
    height: space.height,
    rotation: 0,
    zIndex: index + 100,
    label: space.label,
    properties: {
      kind: 'workspace-shape',
      spaceType: space.type,
      zone: space.zone,
    },
    isLocked: false,
  };
}

function mapDraftToSpaces(draft: FloorMap | null): FloorSpace[] {
  if (!draft) return [];

  return draft.elements
    .filter(
      (element) =>
        element.elementRole === 'WORKSPACE' ||
        (element.elementRole === 'EDITOR_AID' && element.properties.kind === 'workspace-shape')
    )
    .map((element) => {
      const spaceType = normalizeSpaceType(element.properties.spaceType, element.elementType);
      return {
        id: element.id,
        type: spaceType,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        label: element.label ?? spaceLabels[spaceType],
        zone: typeof element.properties.zone === 'string' ? element.properties.zone : 'Open Area',
        workspaceInstanceId: element.workspaceInstanceId ?? null,
      };
    });
}

function mapDraftToZones(draft: FloorMap | null): ZoneArea[] {
  if (!draft) return [];

  return draft.elements
    .filter(
      (element) =>
        element.elementRole === 'STRUCTURE' &&
        (element.elementType === 'zone' || element.elementType === 'pantry' || element.elementType === 'restroom')
    )
    .map((element) => ({
      id: element.id,
      name: element.label ?? defaultZoneLabel(element.elementType),
      elementType: normalizeZoneElementType(element.elementType),
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      color: typeof element.properties.color === 'string' ? element.properties.color : defaultZoneColors[0],
    }));
}

function normalizeSpaceType(value: unknown, fallback: string): SpaceType {
  if (value === 'desk' || value === 'meeting-room' || value === 'phone-booth') return value;
  if (fallback === 'meeting-room' || fallback === 'phone-booth') return fallback;
  return 'desk';
}

function persistableElementId(id: string): string | undefined {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : undefined;
}

function inferZoneFromInstance(instance?: AdminWorkspaceSpace | null): string {
  if (!instance) return 'Open Area';
  if (instance.type === 'meeting-room') return 'Meeting Rooms';
  if (instance.type === 'phone-booth') return 'Phone Booth Area';
  return 'Workspace Area';
}

function detectZoneName(space: FloorSpace, zones: ZoneArea[]): string | null {
  const centerX = space.x + space.width / 2;
  const centerY = space.y + space.height / 2;

  for (const zone of zones) {
    if (
      centerX >= zone.x &&
      centerX <= zone.x + zone.width &&
      centerY >= zone.y &&
      centerY <= zone.y + zone.height
    ) {
      return zone.name;
    }
  }

  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapToGrid(value: number) {
  return Math.round(value / MAP_GRID_SIZE) * MAP_GRID_SIZE;
}

function createStarterZones(): ZoneArea[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Pantry',
      elementType: 'pantry',
      x: 40,
      y: 60,
      width: 240,
      height: 140,
      color: defaultZoneColors[0],
    },
    {
      id: crypto.randomUUID(),
      name: 'Restroom',
      elementType: 'restroom',
      x: 320,
      y: 60,
      width: 120,
      height: 120,
      color: defaultZoneColors[1],
    },
    {
      id: crypto.randomUUID(),
      name: 'Meeting Rooms',
      elementType: 'zone',
      x: 40,
      y: 300,
      width: 520,
      height: 150,
      color: defaultZoneColors[2],
    },
  ];
}

function formatSaveState(value: SaveState): string {
  if (value === 'saving') return 'Saving';
  if (value === 'saved') return 'Saved';
  if (value === 'error') return 'Error';
  return 'Draft';
}

function inferTemplateSpaceType(template: WorkspaceTemplate): SpaceType {
  const normalized = `${template.name} ${template.defaultShape}`.toLowerCase();
  if (normalized.includes('meeting') || normalized.includes('room')) return 'meeting-room';
  if (normalized.includes('booth') || normalized.includes('phone')) return 'phone-booth';
  return 'desk';
}

function getNextTemplatePlacementLabel(template: WorkspaceTemplate, floorInstances: AdminWorkspaceSpace[]): string {
  const baseName = deriveTemplatePlacementBaseName(template.name);
  let highestSequence = 0;

  for (const instance of floorInstances.filter((entry) => entry.templateId === template.id)) {
    const match = new RegExp(`^${escapeForRegExp(baseName)}\\s+(\\d+)$`, 'i').exec(instance.name);
    if (!match) continue;
    highestSequence = Math.max(highestSequence, Number.parseInt(match[1], 10));
  }

  return `${baseName} ${highestSequence + 1}`;
}

function deriveTemplatePlacementBaseName(templateName: string): string {
  const words = templateName.trim().split(/\s+/);
  const trailingGenericWords = new Set(['table', 'desk', 'seat', 'spot', 'workspace']);

  if (words.length > 1 && trailingGenericWords.has(words[words.length - 1].toLowerCase())) {
    return words.slice(0, -1).join(' ');
  }

  return templateName.trim();
}

function normalizeZoneElementType(value: string): ZoneArea['elementType'] {
  if (value === 'pantry' || value === 'restroom') {
    return value;
  }
  return 'zone';
}

function defaultZoneLabel(value: string): string {
  if (value === 'pantry') return 'Pantry';
  if (value === 'restroom') return 'Restroom';
  return 'Zone';
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
