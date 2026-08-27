export type { AppRole, DeskAtlasUser } from './models/user';
export * from './models/reservation';
export * from './models/availability';
export {
  CandidateValidationError,
  validateCandidates,
} from './services/candidateValidationService';
export type { CandidateValidationContext } from './services/candidateValidationService';
export { createDemoUser } from './services/userService';
export type {
  AvailabilityRepository,
  AvailableDate,
  AvailableTimeSlot,
  BlockingReservationWindow,
  BusinessAvailabilitySettings,
  DateAvailabilityQuery,
  DateAvailabilityResult,
  OperatingHoursInterval,
  ScheduleBlock,
  TimeAvailabilityQuery,
  TimeAvailabilityResult,
} from './models/availability';
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
  PublishedFloorMap,
  PublishedMapElement,
  PublishedMapRepository,
  PublishedMapVersion,
  PublishedWorkspaceSummary,
} from './models/publishedMap';
export type {
  AdminWorkspaceSpace,
  WorkspaceAuditActorRole,
  WorkspaceAuditLogEntry,
  AdminWorkspaceStatus,
  AdminWorkspaceType,
  CreateWorkspaceInstanceInput,
  CreateWorkspaceInstanceFromTemplateInput,
  CreateFloorInput,
  CreateWorkspaceTemplateInput,
  DuplicateWorkspaceInstanceInput,
  Floor,
  PricingUnit,
  UpdateWorkspaceInstanceInput,
  UpdateWorkspaceTemplateInput,
  WorkspaceAvailabilityBlockReason,
  WorkspaceAvailabilityStatus,
  WorkspaceCatalog,
  WorkspaceInstance,
  WorkspaceInstanceDetails,
  WorkspaceManagedUpdateResult,
  WorkspaceOperationalStatus,
  WorkspaceRepository,
  WorkspaceStatusImpactReservation,
  WorkspaceTemplate,
} from './models/workspace';
export {
  WorkspaceConflictError,
  WorkspaceValidationError,
  createWorkspaceService,
  getWorkspaceAvailabilityStatus,
  inferAdminType,
  isOperationalStatusBookable,
  mapAdminStatusToOperationalStatus,
  mapCatalogToAdminSpaces,
  mapInstanceToAdminSpace,
  mapOperationalStatusToAdminStatus,
  normalizeCreateInstanceInput,
  normalizeCreateInstanceFromTemplateInput,
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
export { InMemoryPublishedMapRepository } from './services/publishedMapMemoryRepository';
export {
  PublishedMapNotFoundError,
  createPublishedMapService,
} from './services/publishedMapService';
export { SupabasePublishedMapRepository } from './services/publishedMapSupabaseRepository';
export { InMemoryAvailabilityRepository } from './services/availabilityMemoryRepository';
export {
  AvailabilityValidationError,
  createAvailabilityService,
} from './services/availabilityService';
export * from './services/availabilityMemoryRepository';
export * from './services/availabilitySupabaseRepository';

// Reservation Service
export * from './services/reservationRepository';
export * from './services/reservationMemoryRepository';
export * from './services/reservationSupabaseRepository';
export * from './services/reservationService';
export * from './services/paymentSessionRepository';
export * from './services/paymentSessionService';
export * from './services/paymentReviewRepository';
export * from './services/paymentReviewService';
export * from './services/counterPaymentRepository';
export * from './services/counterPaymentService';
export * from './services/candidateValidationService';
export * from './services/bookingAccessRepository';
export * from './services/bookingAccessService';
export * from './services/staffOperationsRepository';
export * from './services/staffOperationsService';
export * from './services/guestReservationTrackingRepository';
export * from './services/guestReservationTrackingService';
export * from './models/reports';
export * from './services/reportsRepository';
export * from './services/reportsService';
