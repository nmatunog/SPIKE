#!/usr/bin/env node
/**
 * Smoke check — intern logout backup modules are present and export the sign-out pipeline.
 * Runtime backup runs in the browser via AuthContext.logoutWithBackup on sign-out.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  {
    file: 'src/lib/internLocalBackup.js',
    exports: ['saveLocalInternBackup', 'collectInternLocalStorageSnapshot', 'INTERN_WORK_STORAGE_KEYS'],
  },
  {
    file: 'src/lib/internLogoutBackup.js',
    exports: ['runInternLogoutBackup'],
  },
  {
    file: 'src/AuthContext.jsx',
    snippets: ['logoutWithBackup', 'runInternLogoutBackup'],
  },
  {
    file: 'src/components/intern/InternWorkStatusBanner.jsx',
    snippets: ['role="status"', 'aria-live="polite"'],
  },
];

let failed = 0;

for (const item of required) {
  const path = join(root, item.file);
  const text = readFileSync(path, 'utf8');
  const checks = item.exports ?? item.snippets ?? [];
  for (const name of checks) {
    if (!text.includes(name)) {
      console.error(`FAIL ${item.file}: missing "${name}"`);
      failed += 1;
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log('smoke:intern-logout-backup OK — sign-out cloud save + device backup pipeline wired.');
