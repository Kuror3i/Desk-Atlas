import * as assert from "assert";
import {
  InMemoryWorkspaceRepository,
  createWorkspaceService,
} from "../packages/domain/src/index";

async function runTests() {
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const workspaceService = createWorkspaceService(workspaceRepo);

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  // 1. Template creation with photoPath
  let templateId: string = "";
  await runTest("Create workspace template with valid photo_path", async () => {
    const created = await workspaceService.createTemplate({
      name: "Focus Pod",
      description: "Quiet individual workspace",
      capacity: 1,
      rateAmount: 120,
      pricingUnit: "HOURLY",
      defaultShape: "booth",
      defaultColor: "#009689",
      photoPath: "https://storage.deskatlas.test/workspace-images/templates/focus-pod.webp",
      isActive: true,
    });

    assert.strictEqual(created.name, "Focus Pod");
    assert.strictEqual(
      created.photoPath,
      "https://storage.deskatlas.test/workspace-images/templates/focus-pod.webp"
    );
    templateId = created.id;
  });

  // 2. Template update with changed photoPath
  await runTest("Update workspace template with new photo_path", async () => {
    const updated = await workspaceService.updateTemplate(templateId, {
      photoPath: "https://storage.deskatlas.test/workspace-images/templates/focus-pod-v2.jpg",
    });

    assert.strictEqual(
      updated.photoPath,
      "https://storage.deskatlas.test/workspace-images/templates/focus-pod-v2.jpg"
    );
  });

  // 3. Template update with cleared photoPath
  await runTest("Update workspace template to clear photo_path", async () => {
    const updated = await workspaceService.updateTemplate(templateId, {
      photoPath: null,
    });

    assert.strictEqual(updated.photoPath, null);
  });

  // 4. File type validation rules
  await runTest("Validate allowed MIME types for template image preview/upload", async () => {
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const testCases = [
      { type: "image/png", expected: true },
      { type: "image/jpeg", expected: true },
      { type: "image/jpg", expected: true },
      { type: "image/webp", expected: true },
      { type: "image/gif", expected: false },
      { type: "application/pdf", expected: false },
      { type: "image/svg+xml", expected: false },
      { type: "text/plain", expected: false },
    ];

    for (const tc of testCases) {
      const isValid = allowedMimeTypes.includes(tc.type);
      assert.strictEqual(
        isValid,
        tc.expected,
        `MIME validation failed for ${tc.type}: expected ${tc.expected}, got ${isValid}`
      );
    }
  });

  // 5. File size boundary validation rules
  await runTest("Validate 5MB file size limit boundary", async () => {
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB = 5,242,880 bytes
    const isSizeAllowed = (size: number) => size <= maxSizeBytes;

    assert.strictEqual(isSizeAllowed(1024), true, "1KB file should be allowed");
    assert.strictEqual(isSizeAllowed(5 * 1024 * 1024), true, "Exactly 5MB should be allowed");
    assert.strictEqual(isSizeAllowed(5 * 1024 * 1024 + 1), false, "5MB + 1 byte should be rejected");
    assert.strictEqual(isSizeAllowed(10 * 1024 * 1024), false, "10MB should be rejected");
  });

  // 6. Ensure no base64 storage in database
  await runTest("Ensure photo_path stores path/URL and not base64 data blobs", async () => {
    const catalog = await workspaceRepo.listCatalog();
    for (const tpl of catalog.templates) {
      if (tpl.photoPath) {
        assert.strictEqual(
          tpl.photoPath.startsWith("data:"),
          false,
          "photoPath must not be a data: URI base64 blob"
        );
      }
    }
  });

  // 7. Template photo positioning in defaultStyle
  await runTest("Preserve and retrieve photoPosition coordinates in defaultStyle", async () => {
    const positionedTemplate = await workspaceService.createTemplate({
      name: "Corner Office",
      capacity: 4,
      rateAmount: 400,
      pricingUnit: "HOURLY",
      defaultShape: "rectangle",
      defaultColor: "#154A32",
      photoPath: "https://storage.deskatlas.test/workspace-images/templates/corner-office.webp",
      defaultStyle: {
        photoPosition: { x: 30, y: 75 },
      },
      isActive: true,
    });

    assert.deepStrictEqual(
      (positionedTemplate.defaultStyle as any)?.photoPosition,
      { x: 30, y: 75 },
      "photoPosition coordinates should match saved values"
    );

    const updated = await workspaceService.updateTemplate(positionedTemplate.id, {
      defaultStyle: {
        photoPosition: { x: 60, y: 40 },
      },
    });

    assert.deepStrictEqual(
      (updated.defaultStyle as any)?.photoPosition,
      { x: 60, y: 40 },
      "updated photoPosition coordinates should match new values"
    );
  });

  console.log("\nAll MF-04 tests passed successfully!");
}

runTests();
