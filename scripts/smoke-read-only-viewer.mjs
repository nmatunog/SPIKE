#!/usr/bin/env node
import {
  ADMIN_VIEWER_EMAIL,
  normalizeLoginIdentifier,
  isReadOnlyViewerUser,
  isReadOnlyViewerProfile,
  assertPortalCanWriteUser,
} from '../src/lib/readOnlyViewer.js';

function fail(message) {
  console.error(`smoke:read-only-viewer FAIL — ${message}`);
  process.exit(1);
}

if (normalizeLoginIdentifier('Admin01') !== ADMIN_VIEWER_EMAIL) {
  fail('Admin01 should map to viewer email');
}
if (normalizeLoginIdentifier('admin01@viewer.1cma.online') !== ADMIN_VIEWER_EMAIL) {
  fail('viewer email should pass through');
}

if (!isReadOnlyViewerProfile({ role: 'ADMIN', email: ADMIN_VIEWER_EMAIL })) {
  fail('viewer email profile should be read-only');
}

const viewer = { role: 'ADMIN', readOnlyViewer: true };
if (!isReadOnlyViewerUser(viewer)) fail('readOnlyViewer flag should be detected');

try {
  assertPortalCanWriteUser(viewer);
  fail('viewer should block writes');
} catch (err) {
  if (!/view-only/i.test(err.message)) fail('unexpected error message');
}

console.log('smoke:read-only-viewer OK');
