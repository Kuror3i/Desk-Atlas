import assert from 'node:assert/strict';
import {
  InMemorySettingsRepository,
  createAdminSettingsService,
  SettingsValidationError,
  AdminPaymentMethod,
} from '../packages/domain/src/index';

async function run() {
  console.log('--- Starting MF-28 Admin Payment Methods Expanded & QR Assets Tests ---');

  const repository = new InMemorySettingsRepository();
  const service = createAdminSettingsService(repository);

  // 1. Initial Overview Load
  const overview = await service.getSettingsOverview();
  assert.ok(Array.isArray(overview.paymentMethods), 'Payment methods should be returned');
  const initialCount = overview.paymentMethods.length;
  console.log(`[PASS] Initial load returned ${initialCount} payment methods`);

  // 2. Create GCash Payment Method with receiving QR image
  const createdGcash = await service.createPaymentMethod({
    methodType: 'GCASH',
    displayName: 'GCash Merchant Official',
    accountName: 'DeskAtlas Operations Manila',
    accountNumber: '0917-888-9999',
    qrImagePath: 'https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/gcash-qr.png',
    instructions: 'Scan the QR code or send payment to 0917-888-9999, then upload receipt.',
    allowWeb: true,
    allowKiosk: true,
    isActive: true,
  });

  assert.ok(createdGcash.id, 'New payment method must have an ID');
  assert.equal(createdGcash.methodType, 'GCASH');
  assert.equal(createdGcash.displayName, 'GCash Merchant Official');
  assert.equal(createdGcash.accountName, 'DeskAtlas Operations Manila');
  assert.equal(createdGcash.accountNumber, '0917-888-9999');
  assert.equal(createdGcash.qrImagePath, 'https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/gcash-qr.png');
  assert.equal(createdGcash.allowWeb, true);
  assert.equal(createdGcash.allowKiosk, true);
  assert.equal(createdGcash.isActive, true);
  console.log('[PASS] Create GCash payment method with receiving QR asset');

  // 3. Create MariBank (Bank provider choice)
  const createdMariBank = await service.createPaymentMethod({
    methodType: 'BANK',
    displayName: 'MariBank Transfer',
    accountName: 'DeskAtlas Manila Inc.',
    accountNumber: '1099-2345-6789',
    instructions: 'Send money to MariBank account and upload screenshot confirmation.',
    allowWeb: true,
    allowKiosk: false,
    isActive: true,
  });
  assert.equal(createdMariBank.methodType, 'BANK');
  assert.equal(createdMariBank.displayName, 'MariBank Transfer');
  console.log('[PASS] Create MariBank payment method');

  // 4. Create Maya (Bank provider choice with digital bank model)
  const createdMaya = await service.createPaymentMethod({
    methodType: 'BANK',
    displayName: 'Maya Digital Bank',
    accountName: 'DeskAtlas Manila Inc.',
    accountNumber: '0918-777-6666',
    instructions: 'Send money to Maya account / Maya Bank and upload transaction receipt.',
    allowWeb: true,
    allowKiosk: false,
    isActive: true,
  });
  assert.equal(createdMaya.methodType, 'BANK');
  assert.equal(createdMaya.displayName, 'Maya Digital Bank');
  console.log('[PASS] Create Maya payment method');

  // 5. Validation: Reject Cash for Web
  await assert.rejects(
    () =>
      service.createPaymentMethod({
        methodType: 'CASH',
        displayName: 'Counter Cash Web',
        allowWeb: true,
        allowKiosk: true,
      }),
    (err) => err instanceof SettingsValidationError,
    'Cash payment method cannot be enabled for web reservations'
  );
  console.log('[PASS] Validation: Cash for web disallowed');

  // 6. Validation: Reject Empty Display Name
  await assert.rejects(
    () =>
      service.createPaymentMethod({
        methodType: 'BANK',
        displayName: '   ',
        allowWeb: true,
        allowKiosk: false,
      }),
    (err) => err instanceof SettingsValidationError,
    'Display name is required'
  );
  console.log('[PASS] Validation: Reject empty display name');

  // 7. Validation: Reject base64 data URLs for QR asset
  await assert.rejects(
    () =>
      service.createPaymentMethod({
        methodType: 'GCASH',
        displayName: 'GCash Base64',
        qrImagePath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        allowWeb: true,
        allowKiosk: false,
      }),
    (err) => err instanceof SettingsValidationError,
    'Base64 image blobs are not permitted for QR images'
  );
  console.log('[PASS] Validation: Reject base64 QR images');

  // 8. Update Payment Method (Assign QR code, update details)
  const updatedMariBank = await service.updatePaymentMethod({
    id: createdMariBank.id,
    displayName: 'MariBank (SeaBank / MariBank)',
    accountName: 'DeskAtlas Manila Enterprise',
    accountNumber: '1099-2345-6789',
    qrImagePath: 'https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/maribank-qr.png',
    instructions: 'Updated instructions for MariBank transfer.',
    allowWeb: true,
    allowKiosk: true,
    isActive: true,
  });
  assert.equal(updatedMariBank.displayName, 'MariBank (SeaBank / MariBank)');
  assert.equal(updatedMariBank.qrImagePath, 'https://deskatlas.supabase.co/storage/v1/object/public/workspace-images/payment-qrs/maribank-qr.png');
  assert.equal(updatedMariBank.allowKiosk, true);
  console.log('[PASS] Update payment method details & QR asset');

  // 9. Reorder Payment Methods
  const reordered = await service.reorderPaymentMethods([
    createdMariBank.id,
    createdGcash.id,
    createdMaya.id,
  ]);
  assert.equal(reordered[0]?.id, createdMariBank.id);
  assert.equal(reordered[1]?.id, createdGcash.id);
  assert.equal(reordered[2]?.id, createdMaya.id);
  console.log('[PASS] Reorder payment methods');

  // 10. Delete Payment Method
  await service.deletePaymentMethod(createdMaya.id);
  const afterDeleteOverview = await service.getSettingsOverview();
  assert.equal(
    afterDeleteOverview.paymentMethods.some((m) => m.id === createdMaya.id),
    false,
    'Deleted payment method should no longer exist'
  );
  console.log('[PASS] Delete payment method');

  // 11. Deactivate Payment Method
  const deactivatedGcash = await service.updatePaymentMethod({
    id: createdGcash.id,
    displayName: createdGcash.displayName,
    allowWeb: true,
    allowKiosk: true,
    isActive: false,
  });
  assert.equal(deactivatedGcash.isActive, false);
  console.log('[PASS] Deactivate payment method');

  console.log('--- All MF-28 Tests Passed Successfully! ---');
}

run().catch((err) => {
  console.error('MF-28 Test Failed:', err);
  process.exit(1);
});
