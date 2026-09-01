import * as assert from 'assert';
import {
  InMemorySettingsRepository,
  createAdminSettingsService,
  SettingsValidationError,
} from '../packages/domain/src/index';

async function runTests() {
  const repository = new InMemorySettingsRepository();
  const service = createAdminSettingsService(repository);

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  // 1. Initial State
  await runTest('Initial landing preview photos list is empty', async () => {
    const publicPhotos = await service.getPublicLandingPreviewPhotos();
    assert.strictEqual(Array.isArray(publicPhotos), true);
    assert.strictEqual(publicPhotos.length, 0);
  });

  // 2. Upload and save 3 preview photos with positioning
  await runTest('Save up to 3 configured landing preview photos with reposition coordinates', async () => {
    const updated = await service.updateBusinessSettings({
      businessName: 'DeskAtlas Coworking',
      timezone: 'Asia/Manila',
      bookingIntervalMinutes: 30,
      paymentExpiryMinutes: 60,
      landingPreviewPhotos: [
        {
          id: 'photo-1',
          url: 'https://storage.deskatlas.test/workspace-images/previews/photo1.webp',
          storagePath: 'previews/photo1.webp',
          position: { x: 45, y: 70 },
          displayOrder: 0,
        },
        {
          id: 'photo-2',
          url: 'https://storage.deskatlas.test/workspace-images/previews/photo2.webp',
          storagePath: 'previews/photo2.webp',
          position: { x: 60, y: 30 },
          displayOrder: 1,
        },
        {
          id: 'photo-3',
          url: 'https://storage.deskatlas.test/workspace-images/previews/photo3.webp',
          storagePath: 'previews/photo3.webp',
          position: { x: 50, y: 50 },
          displayOrder: 2,
        },
      ],
    });

    assert.strictEqual(updated.landingPreviewPhotos?.length, 3);
    assert.strictEqual(updated.landingPreviewPhotos[0].position.x, 45);
    assert.strictEqual(updated.landingPreviewPhotos[0].position.y, 70);
    assert.strictEqual(updated.landingPreviewPhotos[1].position.x, 60);
    assert.strictEqual(updated.landingPreviewPhotos[1].position.y, 30);
  });

  // 3. Public Safe DTO Output
  await runTest('Public safe preview photo DTO excludes storagePath and internal secrets', async () => {
    const publicPhotos = await service.getPublicLandingPreviewPhotos();
    assert.strictEqual(publicPhotos.length, 3);

    for (const photo of publicPhotos) {
      assert.ok(photo.id);
      assert.ok(photo.url);
      assert.ok(photo.position);
      assert.strictEqual(typeof photo.position.x, 'number');
      assert.strictEqual(typeof photo.position.y, 'number');
      assert.strictEqual(typeof photo.displayOrder, 'number');
      // Must not expose storagePath
      assert.strictEqual((photo as any).storagePath, undefined);
    }
  });

  // 4. Repositioning & Done CTA state persistence
  await runTest('Update repositioning coordinates and commit via settings update', async () => {
    const updated = await service.updateBusinessSettings({
      businessName: 'DeskAtlas Coworking',
      timezone: 'Asia/Manila',
      bookingIntervalMinutes: 30,
      paymentExpiryMinutes: 60,
      landingPreviewPhotos: [
        {
          id: 'photo-1',
          url: 'https://storage.deskatlas.test/workspace-images/previews/photo1.webp',
          position: { x: 80, y: 20 },
          displayOrder: 0,
        },
        {
          id: 'photo-2',
          url: 'https://storage.deskatlas.test/workspace-images/previews/photo2.webp',
          position: { x: 10, y: 90 },
          displayOrder: 1,
        },
      ],
    });

    assert.strictEqual(updated.landingPreviewPhotos?.length, 2);
    assert.strictEqual(updated.landingPreviewPhotos[0].position.x, 80);
    assert.strictEqual(updated.landingPreviewPhotos[0].position.y, 20);

    const publicPhotos = await service.getPublicLandingPreviewPhotos();
    assert.strictEqual(publicPhotos.length, 2);
    assert.strictEqual(publicPhotos[0].position.x, 80);
    assert.strictEqual(publicPhotos[0].position.y, 20);
  });

  // 5. Validation - Max 3 photos boundary
  await runTest('Reject when more than 3 preview photos are submitted', async () => {
    await assert.rejects(
      async () => {
        await service.updateBusinessSettings({
          businessName: 'DeskAtlas Coworking',
          timezone: 'Asia/Manila',
          bookingIntervalMinutes: 30,
          paymentExpiryMinutes: 60,
          landingPreviewPhotos: [
            { id: '1', url: 'https://test/1.jpg', position: { x: 0, y: 0 }, displayOrder: 0 },
            { id: '2', url: 'https://test/2.jpg', position: { x: 0, y: 0 }, displayOrder: 1 },
            { id: '3', url: 'https://test/3.jpg', position: { x: 0, y: 0 }, displayOrder: 2 },
            { id: '4', url: 'https://test/4.jpg', position: { x: 0, y: 0 }, displayOrder: 3 },
          ],
        });
      },
      (err: any) => {
        assert.ok(err instanceof SettingsValidationError);
        assert.match(err.message, /Maximum 3 landing preview photos allowed/);
        return true;
      }
    );
  });

  // 6. Validation - Base64 rejection
  await runTest('Reject base64 data URLs in preview photos', async () => {
    await assert.rejects(
      async () => {
        await service.updateBusinessSettings({
          businessName: 'DeskAtlas Coworking',
          timezone: 'Asia/Manila',
          bookingIntervalMinutes: 30,
          paymentExpiryMinutes: 60,
          landingPreviewPhotos: [
            {
              id: '1',
              url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              position: { x: 50, y: 50 },
              displayOrder: 0,
            },
          ],
        });
      },
      (err: any) => {
        assert.ok(err instanceof SettingsValidationError);
        assert.match(err.message, /Base64 data URLs are not permitted/);
        return true;
      }
    );
  });

  // 7. Validation - Coordinate bounds clamping
  await runTest('Clamp out-of-range reposition coordinates to [0, 100]', async () => {
    const updated = await service.updateBusinessSettings({
      businessName: 'DeskAtlas Coworking',
      timezone: 'Asia/Manila',
      bookingIntervalMinutes: 30,
      paymentExpiryMinutes: 60,
      landingPreviewPhotos: [
        {
          id: 'photo-clamp',
          url: 'https://storage.deskatlas.test/workspace-images/previews/clamp.webp',
          position: { x: -50, y: 180 },
          displayOrder: 0,
        },
      ],
    });

    assert.strictEqual(updated.landingPreviewPhotos?.[0].position.x, 0);
    assert.strictEqual(updated.landingPreviewPhotos?.[0].position.y, 100);
  });

  // 8. Graceful clear to 0 photos
  await runTest('Gracefully clear landing preview photos to empty list', async () => {
    const updated = await service.updateBusinessSettings({
      businessName: 'DeskAtlas Coworking',
      timezone: 'Asia/Manila',
      bookingIntervalMinutes: 30,
      paymentExpiryMinutes: 60,
      landingPreviewPhotos: [],
    });

    assert.strictEqual(updated.landingPreviewPhotos?.length, 0);
    const publicPhotos = await service.getPublicLandingPreviewPhotos();
    assert.strictEqual(publicPhotos.length, 0);
  });

  console.log('\nAll MF-17 tests passed successfully!');
}

runTests();
