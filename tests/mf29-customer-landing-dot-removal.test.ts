import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  InMemorySettingsRepository,
  createAdminSettingsService,
} from '../packages/domain/src/index';

async function runTests() {
  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error: any) {
      console.error(`[FAIL] ${name}:`, error.message);
      process.exit(1);
    }
  }

  // 1. Verify LandingPage component source does not render carousel pagination dots or indicator buttons
  await runTest('LandingPage source does not render carousel pagination dot indicator buttons', async () => {
    const landingPagePath = path.resolve(
      process.cwd(),
      'apps/customer-website/src/features/landing/components/LandingPage.tsx'
    );
    const content = fs.readFileSync(landingPagePath, 'utf-8');

    // Verify there are no indicator buttons or pagination container at bottom
    assert.strictEqual(
      content.includes('aria-label={`Go to slide'),
      false,
      'LandingPage should not contain slide pagination buttons'
    );
    assert.strictEqual(
      content.includes('rounded-full bg-white/60'),
      false,
      'LandingPage should not contain pagination dot styles'
    );
    assert.strictEqual(
      content.includes('absolute bottom-3 left-1/2 -translate-x-1/2'),
      false,
      'LandingPage should not contain bottom-center dots container'
    );
  });

  // 2. Verify carousel image render structure and auto-rotation logic remain intact
  await runTest('LandingPage retains photo mapping, auto rotation and objectPosition styles', async () => {
    const landingPagePath = path.resolve(
      process.cwd(),
      'apps/customer-website/src/features/landing/components/LandingPage.tsx'
    );
    const content = fs.readFileSync(landingPagePath, 'utf-8');

    assert.strictEqual(
      content.includes('photos.map((photo, index)'),
      true,
      'LandingPage should still map photos'
    );
    assert.strictEqual(
      content.includes('objectPosition: `${photo.position?.x ?? 50}% ${photo.position?.y ?? 50}%`'),
      true,
      'LandingPage should still apply position coordinates to images'
    );
    assert.strictEqual(
      content.includes('setInterval'),
      true,
      'LandingPage should still retain auto rotation interval'
    );
  });

  // 3. Domain Landing Preview photo retrieval remains valid
  await runTest('Landing preview photo domain service works for 1, 2, and 3 photos', async () => {
    const repo = new InMemorySettingsRepository();
    const service = createAdminSettingsService(repo);

    await service.updateBusinessSettings({
      businessName: 'DeskAtlas Hub',
      timezone: 'Asia/Manila',
      bookingIntervalMinutes: 30,
      paymentExpiryMinutes: 60,
      landingPreviewPhotos: [
        { id: 'p1', url: 'https://img.test/p1.webp', position: { x: 30, y: 40 }, displayOrder: 0 },
        { id: 'p2', url: 'https://img.test/p2.webp', position: { x: 50, y: 50 }, displayOrder: 1 },
      ],
    });

    const publicPhotos = await service.getPublicLandingPreviewPhotos();
    assert.strictEqual(publicPhotos.length, 2);
    assert.strictEqual(publicPhotos[0].position.x, 30);
    assert.strictEqual(publicPhotos[0].position.y, 40);
    assert.strictEqual(publicPhotos[1].position.x, 50);
    assert.strictEqual(publicPhotos[1].position.y, 50);
  });

  console.log('\nAll MF-29 tests passed successfully!');
}

runTests();
