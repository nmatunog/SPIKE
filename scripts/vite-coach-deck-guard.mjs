import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  isPublicCoachDeckPath,
  sanitizeCoachDeckRelativePath,
} from '../functions/_shared/facultyDeckPaths.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const STAFF_ROLES = new Set(['FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER']);

/** @param {string} relPath */
function resolveCoachDeckFile(relPath) {
  const publicPath = join(root, 'public', 'content', relPath);
  if (existsSync(publicPath)) return publicPath;
  const sourceName = relPath.split('/').pop() ?? '';
  const sourcePath = join(root, 'content', relPath.replace(/\/[^/]+$/, ''), 'source', sourceName);
  if (existsSync(sourcePath)) return sourcePath;
  return null;
}

/** @param {string | undefined} authHeader */
async function verifyCoachToken(authHeader) {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!url || !anon || !token) return false;

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error } = await client.auth.getUser();
  if (error || !userData?.user?.id) return false;

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  return STAFF_ROLES.has(String(profile?.role ?? '').toUpperCase());
}

/** @param {string} relPath */
function contentTypeForDeck(relPath) {
  const ext = relPath.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'ppt') return 'application/vnd.ms-powerpoint';
  return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
}

export function coachDeckGuardPlugin() {
  return {
    name: 'coach-deck-guard',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const pathname = new URL(req.url || '/', 'http://localhost').pathname;

          if (isPublicCoachDeckPath(pathname)) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }

          if (!pathname.startsWith('/api/coach/faculty-deck/')) {
            next();
            return;
          }

          const rel = sanitizeCoachDeckRelativePath(
            pathname.slice('/api/coach/faculty-deck/'.length),
          );
          if (!rel) {
            res.statusCode = 400;
            res.end('Invalid deck path');
            return;
          }

          const allowed = await verifyCoachToken(req.headers.authorization);
          if (!allowed) {
            res.statusCode = 403;
            res.end('Coach access required');
            return;
          }

          const filePath = resolveCoachDeckFile(rel);
          if (!filePath) {
            res.statusCode = 404;
            res.end('Coach deck not found');
            return;
          }

          const data = readFileSync(filePath);
          res.statusCode = 200;
          res.setHeader('Content-Type', contentTypeForDeck(rel));
          res.setHeader('Content-Disposition', `attachment; filename="${rel.split('/').pop()}"`);
          res.setHeader('Cache-Control', 'private, no-store');
          res.end(data);
        } catch {
          res.statusCode = 500;
          res.end('Coach deck download failed');
        }
      });
    },
  };
}
