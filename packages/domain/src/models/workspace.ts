export type PricingUnit = 'HOURLY';

export type WorkspaceOperationalStatus =
  | 'ACTIVE'
  | 'UNAVAILABLE'
  | 'MAINTENANCE'
  | 'BROKEN'
  | 'INACTIVE';

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string | null;
  photoPath: string | null;
  capacity: number;
  rateAmount: number;
  pricingUnit: PricingUnit;
  defaultShape: string;
  defaultColor: string;
  defaultStyle: Record<string, unknown>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Floor {
  id: string;
  name: string;
  floorNumber: number | null;
  displayOrder: number;
  isActive: boolean;
}

export interface WorkspaceInstance {
  id: string;
  templateId: string;
  floorId: string;
  instanceCode: string;
  displayName: string;
  operationalStatus: WorkspaceOperationalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceInstanceDetails extends WorkspaceInstance {
  template: WorkspaceTemplate;
  floor: Floor;
}

export interface WorkspaceCatalog {
  templates: WorkspaceTemplate[];
  floors: Floor[];
  instances: WorkspaceInstanceDetails[];
}

export interface CreateWorkspaceTemplateInput {
  name: string;
  description?: string | null;
  photoPath?: string | null;
  capacity: number;
  rateAmount: number;
  pricingUnit?: PricingUnit;
  defaultShape?: string;
  defaultColor?: string;
  defaultStyle?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateWorkspaceTemplateInput {
  name?: string;
  description?: string | null;
  photoPath?: string | null;
  capacity?: number;
  rateAmount?: number;
  defaultShape?: string;
  defaultColor?: string;
  defaultStyle?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreateWorkspaceInstanceInput {
  templateId: string;
  floorId: string;
  instanceCode: string;
  displayName: string;
  operationalStatus?: WorkspaceOperationalStatus;
}

export interface UpdateWorkspaceInstanceInput {
  displayName?: string;
  operationalStatus?: WorkspaceOperationalStatus;
}

export interface DuplicateWorkspaceInstanceInput {
  instanceCode: string;
  displayName: string;
}

export type AdminWorkspaceType = 'desk' | 'meeting-room' | 'phone-booth';
export type AdminWorkspaceStatus = 'available' | 'occupied' | 'maintenance';

export interface AdminWorkspaceSpace {
  id: string;
  templateId: string;
  floorId: string;
  instanceCode: string;
  name: string;
  type: AdminWorkspaceType;
  zone: string;
  capacity?: number;
  hourlyRate: number;
  dayRate: number;
  status: AdminWorkspaceStatus;
  recommendations?: string[];
}

export interface WorkspaceRepository {
  listCatalog(): Promise<WorkspaceCatalog>;
  createTemplate(input: CreateWorkspaceTemplateInput): Promise<WorkspaceTemplate>;
  updateTemplate(id: string, input: UpdateWorkspaceTemplateInput): Promise<WorkspaceTemplate>;
  createInstance(input: CreateWorkspaceInstanceInput): Promise<WorkspaceInstanceDetails>;
  updateInstance(id: string, input: UpdateWorkspaceInstanceInput): Promise<WorkspaceInstanceDetails>;
  deactivateInstance(id: string): Promise<WorkspaceInstanceDetails>;
  duplicateInstance(id: string, input: DuplicateWorkspaceInstanceInput): Promise<WorkspaceInstanceDetails>;
}
