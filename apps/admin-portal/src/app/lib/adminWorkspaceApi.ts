import type {
  AdminWorkspaceSpace,
  AdminWorkspaceStatus,
  WorkspaceOperationalStatus,
} from '@deskatlas/domain';
import { mapAdminStatusToOperationalStatus } from '@deskatlas/domain';

export async function fetchAdminWorkspaceSpaces(): Promise<AdminWorkspaceSpace[]> {
  const response = await fetch('/api/admin/workspaces', { cache: 'no-store' });
  const body = await parseJson(response);
  return body.spaces ?? [];
}

export async function updateAdminWorkspaceSpace(
  space: AdminWorkspaceSpace,
  input: {
    name: string;
    hourlyRate: number;
    capacity: number;
    status: AdminWorkspaceStatus;
    recommendations?: string[];
  }
): Promise<AdminWorkspaceSpace> {
  await updateTemplate(space.templateId, {
    rateAmount: input.hourlyRate,
    capacity: input.capacity > 0 ? input.capacity : 1,
    defaultStyle: { recommendations: input.recommendations ?? [] },
  });

  const instance = await updateInstance(space.id, {
    displayName: input.name,
    operationalStatus: mapAdminStatusToOperationalStatus(input.status),
  });

  return {
    ...space,
    name: instance.displayName,
    hourlyRate: input.hourlyRate,
    dayRate: input.hourlyRate * 8,
    capacity: input.capacity > 0 ? input.capacity : undefined,
    status: input.status,
    recommendations: input.recommendations,
  };
}

export async function duplicateAdminWorkspaceSpace(
  space: AdminWorkspaceSpace,
  input: { instanceCode: string; displayName: string }
): Promise<AdminWorkspaceSpace> {
  const response = await fetch(`/api/admin/workspaces/instances/${encodeURIComponent(space.id)}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await parseJson(response);
  const instance = body.instance;

  return {
    ...space,
    id: instance.id,
    instanceCode: instance.instanceCode,
    name: instance.displayName,
    status: mapOperationalStatus(instance.operationalStatus),
  };
}

export async function deactivateAdminWorkspaceSpace(spaceId: string): Promise<void> {
  const response = await fetch(`/api/admin/workspaces/instances/${encodeURIComponent(spaceId)}`, {
    method: 'DELETE',
  });
  await parseJson(response);
}

async function updateTemplate(templateId: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/admin/workspaces/templates/${encodeURIComponent(templateId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

async function updateInstance(
  instanceId: string,
  body: { displayName: string; operationalStatus: WorkspaceOperationalStatus }
) {
  const response = await fetch(`/api/admin/workspaces/instances/${encodeURIComponent(instanceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await parseJson(response);
  return result.instance;
}

async function parseJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Workspace API request failed with status ${response.status}`);
  }
  return body;
}

function mapOperationalStatus(status: WorkspaceOperationalStatus): AdminWorkspaceStatus {
  if (status === 'ACTIVE') return 'available';
  if (status === 'MAINTENANCE' || status === 'BROKEN') return 'maintenance';
  return 'occupied';
}
