import type {
  AdminWorkspaceSpace,
  AdminWorkspaceStatus,
  AdminWorkspaceType,
  CreateWorkspaceInstanceInput,
  CreateWorkspaceTemplateInput,
  DuplicateWorkspaceInstanceInput,
  UpdateWorkspaceInstanceInput,
  UpdateWorkspaceTemplateInput,
  WorkspaceCatalog,
  WorkspaceInstanceDetails,
  WorkspaceOperationalStatus,
  WorkspaceRepository,
  WorkspaceTemplate,
} from '../models/workspace';

const VALID_OPERATIONAL_STATUSES: WorkspaceOperationalStatus[] = [
  'ACTIVE',
  'UNAVAILABLE',
  'MAINTENANCE',
  'BROKEN',
  'INACTIVE',
];

export class WorkspaceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceValidationError';
  }
}

export class WorkspaceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceConflictError';
  }
}

export function normalizeCreateTemplateInput(
  input: CreateWorkspaceTemplateInput
): CreateWorkspaceTemplateInput {
  const name = requireNonBlank(input.name, 'Template name');
  const capacity = requirePositiveInteger(input.capacity, 'Template capacity');
  const rateAmount = requireNonNegativeNumber(input.rateAmount, 'Template rate');
  const defaultShape = requireNonBlank(input.defaultShape ?? inferShapeFromName(name), 'Default shape');
  const defaultColor = requireNonBlank(input.defaultColor ?? '#009689', 'Default color');

  return {
    ...input,
    name,
    description: normalizeNullableText(input.description),
    photoPath: normalizeNullableText(input.photoPath),
    capacity,
    rateAmount,
    pricingUnit: 'HOURLY',
    defaultShape,
    defaultColor,
    defaultStyle: requirePlainObject(input.defaultStyle ?? {}),
    isActive: input.isActive ?? true,
  };
}

export function normalizeUpdateTemplateInput(
  input: UpdateWorkspaceTemplateInput
): UpdateWorkspaceTemplateInput {
  const normalized: UpdateWorkspaceTemplateInput = {};

  if (input.name !== undefined) normalized.name = requireNonBlank(input.name, 'Template name');
  if (input.description !== undefined) normalized.description = normalizeNullableText(input.description);
  if (input.photoPath !== undefined) normalized.photoPath = normalizeNullableText(input.photoPath);
  if (input.capacity !== undefined) {
    normalized.capacity = requirePositiveInteger(input.capacity, 'Template capacity');
  }
  if (input.rateAmount !== undefined) {
    normalized.rateAmount = requireNonNegativeNumber(input.rateAmount, 'Template rate');
  }
  if (input.defaultShape !== undefined) {
    normalized.defaultShape = requireNonBlank(input.defaultShape, 'Default shape');
  }
  if (input.defaultColor !== undefined) {
    normalized.defaultColor = requireNonBlank(input.defaultColor, 'Default color');
  }
  if (input.defaultStyle !== undefined) {
    normalized.defaultStyle = requirePlainObject(input.defaultStyle);
  }
  if (input.isActive !== undefined) normalized.isActive = Boolean(input.isActive);

  return normalized;
}

export function normalizeCreateInstanceInput(
  input: CreateWorkspaceInstanceInput
): CreateWorkspaceInstanceInput {
  return {
    templateId: requireNonBlank(input.templateId, 'Template id'),
    floorId: requireNonBlank(input.floorId, 'Floor id'),
    instanceCode: normalizeInstanceCode(input.instanceCode),
    displayName: requireNonBlank(input.displayName, 'Instance display name'),
    operationalStatus: normalizeOperationalStatus(input.operationalStatus ?? 'ACTIVE'),
  };
}

export function normalizeUpdateInstanceInput(
  input: UpdateWorkspaceInstanceInput
): UpdateWorkspaceInstanceInput {
  const normalized: UpdateWorkspaceInstanceInput = {};

  if (input.displayName !== undefined) {
    normalized.displayName = requireNonBlank(input.displayName, 'Instance display name');
  }
  if (input.operationalStatus !== undefined) {
    normalized.operationalStatus = normalizeOperationalStatus(input.operationalStatus);
  }

  return normalized;
}

export function normalizeDuplicateInstanceInput(
  input: DuplicateWorkspaceInstanceInput
): DuplicateWorkspaceInstanceInput {
  return {
    instanceCode: normalizeInstanceCode(input.instanceCode),
    displayName: requireNonBlank(input.displayName, 'Instance display name'),
  };
}

export function mapCatalogToAdminSpaces(catalog: WorkspaceCatalog): AdminWorkspaceSpace[] {
  return catalog.instances
    .filter((instance) => instance.operationalStatus !== 'INACTIVE')
    .map(mapInstanceToAdminSpace);
}

export function mapInstanceToAdminSpace(instance: WorkspaceInstanceDetails): AdminWorkspaceSpace {
  return {
    id: instance.id,
    templateId: instance.templateId,
    floorId: instance.floorId,
    instanceCode: instance.instanceCode,
    name: instance.displayName,
    type: inferAdminType(instance.template),
    zone: instance.floor.name,
    capacity: instance.template.capacity,
    hourlyRate: instance.template.rateAmount,
    dayRate: instance.template.rateAmount * 8,
    status: mapOperationalStatusToAdminStatus(instance.operationalStatus),
    recommendations: extractRecommendationTags(instance.template.defaultStyle),
  };
}

export function mapAdminStatusToOperationalStatus(
  status: AdminWorkspaceStatus
): WorkspaceOperationalStatus {
  if (status === 'available') return 'ACTIVE';
  if (status === 'maintenance') return 'MAINTENANCE';
  return 'UNAVAILABLE';
}

export function mapOperationalStatusToAdminStatus(
  status: WorkspaceOperationalStatus
): AdminWorkspaceStatus {
  if (status === 'ACTIVE') return 'available';
  if (status === 'MAINTENANCE' || status === 'BROKEN') return 'maintenance';
  return 'occupied';
}

export function inferAdminType(template: WorkspaceTemplate): AdminWorkspaceType {
  const name = `${template.name} ${template.defaultShape}`.toLowerCase();
  if (name.includes('meeting') || name.includes('room')) return 'meeting-room';
  if (name.includes('booth') || name.includes('phone')) return 'phone-booth';
  return 'desk';
}

export function createWorkspaceService(repository: WorkspaceRepository) {
  return {
    async listCatalog() {
      return repository.listCatalog();
    },
    async listAdminSpaces() {
      return mapCatalogToAdminSpaces(await repository.listCatalog());
    },
    async createTemplate(input: CreateWorkspaceTemplateInput) {
      return repository.createTemplate(normalizeCreateTemplateInput(input));
    },
    async updateTemplate(id: string, input: UpdateWorkspaceTemplateInput) {
      return repository.updateTemplate(requireNonBlank(id, 'Template id'), normalizeUpdateTemplateInput(input));
    },
    async createInstance(input: CreateWorkspaceInstanceInput) {
      return repository.createInstance(normalizeCreateInstanceInput(input));
    },
    async updateInstance(id: string, input: UpdateWorkspaceInstanceInput) {
      return repository.updateInstance(requireNonBlank(id, 'Instance id'), normalizeUpdateInstanceInput(input));
    },
    async deactivateInstance(id: string) {
      return repository.deactivateInstance(requireNonBlank(id, 'Instance id'));
    },
    async duplicateInstance(id: string, input: DuplicateWorkspaceInstanceInput) {
      return repository.duplicateInstance(
        requireNonBlank(id, 'Instance id'),
        normalizeDuplicateInstanceInput(input)
      );
    },
  };
}

function extractRecommendationTags(defaultStyle: Record<string, unknown>): string[] | undefined {
  const tags = defaultStyle.recommendations;
  if (!Array.isArray(tags)) return undefined;
  return tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
}

function inferShapeFromName(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('room')) return 'rectangle';
  if (normalized.includes('booth')) return 'square';
  return 'desk';
}

function normalizeInstanceCode(value: string): string {
  return requireNonBlank(value, 'Instance code').toUpperCase();
}

function normalizeOperationalStatus(value: WorkspaceOperationalStatus): WorkspaceOperationalStatus {
  if (!VALID_OPERATIONAL_STATUSES.includes(value)) {
    throw new WorkspaceValidationError(`Unsupported operational status: ${value}`);
  }
  return value;
}

function requireNonBlank(value: string, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new WorkspaceValidationError(`${label} is required`);
  }
  return value.trim();
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new WorkspaceValidationError(`${label} must be a positive integer`);
  }
  return value;
}

function requireNonNegativeNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new WorkspaceValidationError(`${label} must be non-negative`);
  }
  return Math.round(value * 100) / 100;
}

function requirePlainObject(value: Record<string, unknown>): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new WorkspaceValidationError('Default style must be an object');
  }
  return value;
}
