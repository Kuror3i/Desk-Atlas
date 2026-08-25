export type { AppRole, DeskAtlasUser } from './models/user';
export { createDemoUser } from './services/userService';
export type {
  FloorMap,
  MapElement,
  MapElementInput,
  MapElementRole,
  MapPublishResult,
  MapRepository,
  MapVersion,
  MapVersionStatus,
  PublishMapDraftInput,
  SaveMapDraftInput,
  WorkspaceInstancePlacement,
} from './models/map';
export type {
  AdminWorkspaceSpace,
  AdminWorkspaceStatus,
  AdminWorkspaceType,
  CreateWorkspaceInstanceInput,
  CreateWorkspaceTemplateInput,
  DuplicateWorkspaceInstanceInput,
  Floor,
  PricingUnit,
  UpdateWorkspaceInstanceInput,
  UpdateWorkspaceTemplateInput,
  WorkspaceCatalog,
  WorkspaceInstance,
  WorkspaceInstanceDetails,
  WorkspaceOperationalStatus,
  WorkspaceRepository,
  WorkspaceTemplate,
} from './models/workspace';
export {
  WorkspaceConflictError,
  WorkspaceValidationError,
  createWorkspaceService,
  inferAdminType,
  mapAdminStatusToOperationalStatus,
  mapCatalogToAdminSpaces,
  mapInstanceToAdminSpace,
  mapOperationalStatusToAdminStatus,
  normalizeCreateInstanceInput,
  normalizeCreateTemplateInput,
  normalizeDuplicateInstanceInput,
  normalizeUpdateInstanceInput,
  normalizeUpdateTemplateInput,
} from './services/workspaceService';
export { InMemoryWorkspaceRepository } from './services/workspaceMemoryRepository';
export {
  MapConflictError,
  MapValidationError,
  createMapService,
  sortMapElements,
  validateMapForPublish,
} from './services/mapService';
export { InMemoryMapRepository } from './services/mapMemoryRepository';
