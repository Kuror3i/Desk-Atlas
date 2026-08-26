import type { Floor, PricingUnit, WorkspaceAvailabilityBlockReason, WorkspaceOperationalStatus } from './workspace';

export interface PublishedMapVersion {
  id: string;
  versionNumber: number;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  publishedAt: string | null;
}

export interface PublishedWorkspaceSummary {
  workspaceInstanceId: string;
  templateId: string;
  floorId: string;
  instanceCode: string;
  displayName: string;
  templateName: string;
  description: string | null;
  photoPath: string | null;
  capacity: number;
  rateAmount: number;
  pricingUnit: PricingUnit;
  operationalStatus: WorkspaceOperationalStatus;
  isBookable: boolean;
  blockingReason: WorkspaceAvailabilityBlockReason | null;
}

export interface PublishedMapElement {
  id: string;
  elementRole: 'WORKSPACE' | 'STRUCTURE' | 'AMENITY' | 'INFORMATION';
  elementType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  zIndex: number;
  label: string | null;
  style: Record<string, string | number | boolean | null>;
  workspace: PublishedWorkspaceSummary | null;
}

export interface PublishedFloorMap {
  floor: Floor;
  version: PublishedMapVersion;
  elements: PublishedMapElement[];
}

export interface PublishedMapRepository {
  listPublishedFloors(): Promise<Floor[]>;
  loadPublishedFloorMap(floorId: string): Promise<PublishedFloorMap | null>;
}
