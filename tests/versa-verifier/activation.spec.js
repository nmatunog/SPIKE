import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACTS = path.resolve('docs/versa/artifacts');

async function shot(page, name) {
  await mkdir(ARTIFACTS, { recursive: true });
  await page.screenshot({
    path: path.join(ARTIFACTS, `${name}.png`),
    fullPage: true,
  });
}

async function openHarness(page) {
  await page.goto('/dev/versa-activate');
  await expect(page.getByTestId('versa-verifier-harness')).toBeVisible();
  await page.request.post('/api/versa/demo-reset');
}

async function verifyCode(page, code) {
  await page.getByTestId('versa-access-code').fill(code);
  await page.getByTestId('versa-verify').click();
  await expect(page.getByTestId('versa-enrollment-state')).toBeVisible();
}

test.describe('portable Versa activation harness', () => {
  test('success', async ({ page }) => {
    await openHarness(page);
    await verifyCode(page, 'SYN-L1-VALID-A1B2');
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'success');
    await shot(page, 'success');
  });

  test('invalid', async ({ page }) => {
    await openHarness(page);
    await verifyCode(page, 'SYN-UNKNOWN-XXXX');
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'invalid');
    await shot(page, 'invalid');
  });

  test('expired', async ({ page }) => {
    await openHarness(page);
    await verifyCode(page, 'SYN-L1-EXPIRED-J0');
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'expired');
    await shot(page, 'expired');
  });

  test('already redeemed', async ({ page }) => {
    await openHarness(page);
    await verifyCode(page, 'SYN-L1-REUSED-E5');
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'already-redeemed');
    await shot(page, 'already-redeemed');
  });

  test('identity mismatch', async ({ page }) => {
    await openHarness(page);
    await verifyCode(page, 'SYN-L1-WRONG-ID-C3');
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'identity-mismatch');
    await shot(page, 'identity-mismatch');
  });

  test('wrong course/level', async ({ page }) => {
    await openHarness(page);
    await verifyCode(page, 'SYN-L1-ROUTE-H8');
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'wrong-course-level');
    await shot(page, 'wrong-course-level');
  });

  test('free L1 / FEP needs no code', async ({ page }) => {
    await openHarness(page);
    await page.getByTestId('versa-free-no-code').click();
    await expect(page.getByTestId('versa-enrollment-state')).toHaveAttribute('data-state', 'free-no-code');
    await shot(page, 'free-no-code');
  });
});
