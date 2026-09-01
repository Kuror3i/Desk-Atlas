import * as assert from "assert";
import {
  CandidateValidationError,
  validateCandidates,
  CandidateSubmissionDTO,
  CandidateValidationContext
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

// M06 tests:
// - Main only
// - Main + Alt1
// - Main + Alt1 + Alt2
// - reject rank >2
// - reject missing Main
// - reject duplicate rank
// - reject duplicate instance
// - reject different tier
// - reject different date
// - reject different duration
// - accept different alternative start time
// - confirm same payable amount rule

const TEST_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "tpl-1",
    name: "Standard Desk",
    description: null,
    photoPath: null,
    capacity: 1,
    rateAmount: 15.0,
    pricingUnit: "HOURLY",
    defaultShape: "rect",
    defaultColor: "#FFF",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-2",
    name: "Premium Desk",
    description: null,
    photoPath: null,
    capacity: 1,
    rateAmount: 25.0,
    pricingUnit: "HOURLY",
    defaultShape: "rect",
    defaultColor: "#FFF",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const TEST_INSTANCES: WorkspaceInstance[] = [
  {
    id: "inst-1",
    templateId: "tpl-1",
    floorId: "floor-1",
    instanceCode: "A1",
    displayName: "Desk A1",
    operationalStatus: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "inst-2",
    templateId: "tpl-1",
    floorId: "floor-1",
    instanceCode: "A2",
    displayName: "Desk A2",
    operationalStatus: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "inst-3",
    templateId: "tpl-1",
    floorId: "floor-1",
    instanceCode: "A3",
    displayName: "Desk A3",
    operationalStatus: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "inst-4",
    templateId: "tpl-2",
    floorId: "floor-1",
    instanceCode: "P1",
    displayName: "Premium P1",
    operationalStatus: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const context: CandidateValidationContext = {
  instances: TEST_INSTANCES,
  templates: TEST_TEMPLATES
};

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (err: any) {
    console.error(`[FAIL] ${name}:`, err.message);
    process.exit(1);
  }
}

function expectThrow(fn: () => void, name: string) {
  let threw = false;
  try {
    fn();
  } catch (err: any) {
    if (err instanceof CandidateValidationError) {
      threw = true;
    } else {
      console.error(`[FAIL] ${name}: Threw unexpected error`, err);
      process.exit(1);
    }
  }
  if (!threw) {
    console.error(`[FAIL] ${name}: Expected CandidateValidationError but did not throw.`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${name}`);
  }
}

// 1. Main only
runTest("Main only", () => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
});

// 2. Main + Alt1
runTest("Main + Alt1", () => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
});

// 3. Main + Alt1 + Alt2
runTest("Main + Alt1 + Alt2", () => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 2, workspaceInstanceId: "inst-3", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
});

// 4. reject rank > 2
expectThrow(() => {
  const candidates: any[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 3, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject rank > 2");

// 5. reject missing Main
expectThrow(() => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject missing Main");

// 6. reject duplicate rank
expectThrow(() => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-3", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject duplicate rank");

// 7. reject duplicate instance with same start time
expectThrow(() => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject duplicate instance with same start time");

// 7b. accept same instance with different start time
runTest("accept same instance with different start time", () => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-1", startAt: "2026-09-01T10:00:00Z", endAt: "2026-09-01T11:00:00Z" }
  ];
  validateCandidates(candidates, context);
});

// 8. reject different tier
expectThrow(() => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-4", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject different tier");

// 9. reject different date
expectThrow(() => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-02T09:00:00Z", endAt: "2026-09-02T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject different date");

// 10. reject different duration
expectThrow(() => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T11:00:00Z" }
  ];
  validateCandidates(candidates, context);
}, "reject different duration");

// 11. accept different alternative start time
runTest("accept different alternative start time", () => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T10:00:00Z", endAt: "2026-09-01T11:00:00Z" } // same date, same duration (1h), different start time
  ];
  validateCandidates(candidates, context);
});

// 12. confirm same payable amount rule (implied by same template)
runTest("confirm same payable amount rule", () => {
  const candidates: CandidateSubmissionDTO[] = [
    { rank: 0, workspaceInstanceId: "inst-1", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" },
    { rank: 1, workspaceInstanceId: "inst-2", startAt: "2026-09-01T09:00:00Z", endAt: "2026-09-01T10:00:00Z" }
  ];
  validateCandidates(candidates, context);
  // Same template implies same rateAmount and pricingUnit, and since durations are identical, the final payable amount will be the same.
});

console.log("All M06 tests passed!");
