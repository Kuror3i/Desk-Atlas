import { CandidateSubmissionDTO } from "../models/reservation";
import { WorkspaceInstance, WorkspaceTemplate } from "../models/workspace";

export class CandidateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateValidationError";
  }
}

export interface CandidateValidationContext {
  instances: WorkspaceInstance[];
  templates: WorkspaceTemplate[];
}

export function validateCandidates(
  candidates: CandidateSubmissionDTO[],
  context: CandidateValidationContext
): void {
  if (!candidates || candidates.length === 0) {
    throw new CandidateValidationError("At least one candidate is required.");
  }

  if (candidates.length > 3) {
    throw new CandidateValidationError("Maximum 3 candidates (Main + 2 Alternatives) are allowed.");
  }

  const ranks = new Set<number>();
  const instanceIds = new Set<string>();

  let mainCandidate: CandidateSubmissionDTO | null = null;

  for (const candidate of candidates) {
    if (candidate.rank > 2 || candidate.rank < 0) {
      throw new CandidateValidationError(`Invalid candidate rank: ${candidate.rank}. Rank must be 0, 1, or 2.`);
    }

    if (ranks.has(candidate.rank)) {
      throw new CandidateValidationError(`Duplicate rank detected: ${candidate.rank}.`);
    }
    ranks.add(candidate.rank);

    if (instanceIds.has(candidate.workspaceInstanceId)) {
      throw new CandidateValidationError(`Duplicate workspace instance detected: ${candidate.workspaceInstanceId}. Candidates must use different physical instances.`);
    }
    instanceIds.add(candidate.workspaceInstanceId);

    if (candidate.rank === 0) {
      mainCandidate = candidate;
    }
  }

  if (!mainCandidate) {
    throw new CandidateValidationError("A Main candidate (rank 0) is required.");
  }

  const mainInstance = context.instances.find(
    (i) => i.id === mainCandidate!.workspaceInstanceId
  );
  if (!mainInstance) {
    throw new CandidateValidationError(`Main instance not found: ${mainCandidate.workspaceInstanceId}`);
  }

  const mainTemplate = context.templates.find(
    (t) => t.id === mainInstance.templateId
  );
  if (!mainTemplate) {
    throw new CandidateValidationError(`Main template not found for instance: ${mainInstance.id}`);
  }

  const mainStart = new Date(mainCandidate.startAt);
  const mainEnd = new Date(mainCandidate.endAt);
  const mainDuration = mainEnd.getTime() - mainStart.getTime();

  if (mainDuration <= 0) {
    throw new CandidateValidationError("Invalid duration for Main candidate.");
  }

  const mainDateString = mainStart.toISOString().split('T')[0];

  for (const candidate of candidates) {
    if (candidate.rank === 0) continue;

    const instance = context.instances.find(
      (i) => i.id === candidate.workspaceInstanceId
    );
    if (!instance) {
      throw new CandidateValidationError(`Instance not found: ${candidate.workspaceInstanceId}`);
    }

    if (instance.templateId !== mainInstance.templateId) {
      throw new CandidateValidationError(`Candidates must use the same template/tier. Expected ${mainInstance.templateId}, got ${instance.templateId}.`);
    }

    const start = new Date(candidate.startAt);
    const end = new Date(candidate.endAt);
    const duration = end.getTime() - start.getTime();

    if (duration !== mainDuration) {
      throw new CandidateValidationError(`Candidates must have the same duration.`);
    }

    const dateString = start.toISOString().split('T')[0];
    if (dateString !== mainDateString) {
      throw new CandidateValidationError(`Candidates must have the same booking date.`);
    }
  }
}
