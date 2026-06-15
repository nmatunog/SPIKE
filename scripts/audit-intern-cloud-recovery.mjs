#!/usr/bin/env node
/**
 * Audit intern work in Supabase — who has recoverable cloud backups.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/audit-intern-cloud-recovery.mjs
 *
 * Optional:
 *   --json                         machine-readable output
 *   --emails=a@x.com,b@y.com       only audit these accounts
 *   node scripts/audit-intern-cloud-recovery.mjs a@x.com b@y.com
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jsonOut = process.argv.includes('--json');

function parseEmailFilter(argv) {
  /** @type {Set<string>} */
  const emails = new Set();
  for (const arg of argv) {
    if (arg === '--json') continue;
    if (arg.startsWith('--emails=')) {
      for (const part of arg.slice('--emails='.length).split(/[,;\s]+/)) {
        const email = part.trim().toLowerCase();
        if (email.includes('@')) emails.add(email);
      }
      continue;
    }
    if (arg.startsWith('--')) continue;
    const email = arg.trim().toLowerCase();
    if (email.includes('@')) emails.add(email);
  }
  return emails;
}

const emailFilter = parseEmailFilter(process.argv.slice(2));

function loadEnvFile() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"'))
      || (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(
  /\/(rest|auth|storage)\/v1\/?$/i,
  '',
);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in env or .env',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** @param {unknown} value */
function hasContent(value) {
  if (value == null) return false;
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => hasContent(entry));
  }
  return String(value).trim().length > 0;
}

/** @param {Record<string, unknown> | null | undefined} payload */
function builderPayloadHasContent(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (hasContent(payload.data)) return true;
  return hasContent(payload);
}

async function fetchInternRoster() {
  const { data: profiles, error: profileErr } = await admin
    .from('profiles')
    .select('id, email, name, role')
    .eq('role', 'INTERN')
    .order('name');
  if (profileErr) throw profileErr;

  const { data: progressRows, error: progressErr } = await admin
    .from('intern_progress')
    .select('user_id, squad, cohort_id, onboarding_complete');
  if (progressErr) throw progressErr;

  const progressByUser = new Map((progressRows ?? []).map((row) => [row.user_id, row]));

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name || profile.email || profile.id,
    email: profile.email,
    squad: progressByUser.get(profile.id)?.squad ?? null,
    cohortId: progressByUser.get(profile.id)?.cohort_id ?? null,
  }));
}

async function assessParticipant(userId) {
  const [
    { data: builderRows },
    { data: blueprintRows },
    { data: playbookRows },
    { data: surveyRows },
    { data: canvasRows },
  ] = await Promise.all([
    admin.from('day1_builder_progress').select('builder_id, payload, completed_at').eq('user_id', userId),
    admin.from('venture_blueprint_entries').select('section_slug, field_key, field_value').eq('user_id', userId),
    admin.from('playbook_completions').select('item_type, item_id, payload').eq('user_id', userId),
    admin.from('survey_responses').select('id, survey_id, survey_response_answers(answer)').eq('user_id', userId),
    admin.from('canvas_entries').select('engine_key, field_key, field_value').eq('user_id', userId),
  ]);

  const substantiveBuilders = (builderRows ?? []).filter((row) =>
    builderPayloadHasContent(row.payload),
  );
  const substantiveBlueprint = (blueprintRows ?? []).filter((row) =>
    hasContent(row.field_value),
  );
  const substantivePlaybook = (playbookRows ?? []).filter((row) => hasContent(row.payload));
  const substantiveSurveys = (surveyRows ?? []).filter((row) =>
    (row.survey_response_answers ?? []).some((a) => hasContent(a.answer)),
  );
  const substantiveCanvas = (canvasRows ?? []).filter((row) => hasContent(row.field_value));

  const substantiveScore =
    substantiveBuilders.length * 12
    + substantiveBlueprint.length * 4
    + substantivePlaybook.length * 3
    + substantiveSurveys.length * 3
    + substantiveCanvas.length * 2;

  const coachRows = substantiveBuilders.filter((row) =>
    String(row.builder_id).startsWith('coach:'),
  );
  const classicBuilders = substantiveBuilders.filter(
    (row) => !String(row.builder_id).startsWith('coach:'),
  );

  return {
    builderRows: builderRows?.length ?? 0,
    substantiveBuilders: substantiveBuilders.length,
    classicBuilders: classicBuilders.length,
    coachSections: coachRows.length,
    blueprintRows: blueprintRows?.length ?? 0,
    substantiveBlueprint: substantiveBlueprint.length,
    playbookRows: playbookRows?.length ?? 0,
    substantivePlaybook: substantivePlaybook.length,
    surveyRows: surveyRows?.length ?? 0,
    substantiveSurveys: substantiveSurveys.length,
    canvasRows: canvasRows?.length ?? 0,
    substantiveCanvas: substantiveCanvas.length,
    substantiveScore,
    recoverable: substantiveScore >= 12,
  };
}

async function main() {
  const roster = await fetchInternRoster();
  let interns = roster;

  if (emailFilter.size > 0) {
    interns = roster.filter((intern) => emailFilter.has(String(intern.email ?? '').toLowerCase()));
    const found = new Set(interns.map((i) => String(i.email).toLowerCase()));
    const missing = [...emailFilter].filter((email) => !found.has(email));
    if (missing.length) {
      console.warn(`\nWarning: no INTERN profile found for: ${missing.join(', ')}\n`);
    }
    if (!interns.length) {
      console.error('No matching intern accounts in Supabase for the emails provided.');
      process.exit(1);
    }
  }

  const results = [];

  for (const intern of interns) {
    const cloud = await assessParticipant(intern.id);
    results.push({ ...intern, cloud });
  }

  const recoverable = results.filter((r) => r.cloud.recoverable);
  const empty = results.filter((r) => r.cloud.substantiveScore === 0);
  const partial = results.filter(
    (r) => r.cloud.substantiveScore > 0 && !r.cloud.recoverable,
  );

  const summary = {
    auditedAt: new Date().toISOString(),
    totalInterns: results.length,
    recoverableInCloud: recoverable.length,
    partialCloud: partial.length,
    noCloudBackup: empty.length,
    participants: results.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      squad: r.squad,
      ...r.cloud,
    })),
  };

  if (jsonOut) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`\nSPIKE intern cloud recovery audit — ${summary.auditedAt}`);
  if (emailFilter.size > 0) {
    console.log(`Filtered to ${emailFilter.size} email(s) — ${results.length} matched in Supabase\n`);
  } else {
    console.log('');
  }
  console.log(`Total interns:        ${summary.totalInterns}`);
  console.log(`Recoverable in cloud: ${summary.recoverableInCloud} (substantive Day 1 / blueprint / playbook data)`);
  console.log(`Partial cloud only:   ${summary.partialCloud}`);
  console.log(`No cloud backup:      ${summary.noCloudBackup}\n`);

  if (recoverable.length) {
    console.log('── Recoverable (ask intern to sign in once; app restores from cloud) ──');
    for (const row of recoverable) {
      console.log(
        `  ${row.name} <${row.email}>${row.squad ? ` (${row.squad})` : ''} — score ${row.cloud.substantiveScore}`
        + ` | builders ${row.cloud.substantiveBuilders}`
        + ` | blueprint ${row.cloud.substantiveBlueprint}`
        + ` | playbook ${row.cloud.substantivePlaybook}`,
      );
    }
    console.log('');
  }

  if (partial.length) {
    console.log('── Partial cloud (may be incomplete) ──');
    for (const row of partial) {
      console.log(`  ${row.name} <${row.email}> — score ${row.cloud.substantiveScore}`);
    }
    console.log('');
  }

  if (empty.length) {
    console.log('── No cloud backup (work may only exist on device, or never uploaded) ──');
    for (const row of empty) {
      console.log(`  ${row.name} <${row.email}>${row.squad ? ` (${row.squad})` : ''}`);
    }
    console.log('');
  }

  console.log(
    'Next step: affected interns sign in at https://portal.1cma.online and keep the tab open until sync finishes.',
  );
}

main().catch((err) => {
  const cause = err?.cause;
  console.error('audit-intern-cloud-recovery failed:', err.message || err);
  if (cause) {
    console.error('  cause:', cause.code || cause.message || cause);
  }
  console.error(`  supabase url: ${url || '(not set)'}`);
  console.error(`  service key length: ${serviceKey ? serviceKey.length : 0} (expect ~200+ chars, one line in .env)`);
  if (serviceKey?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.error('  fix: .env has a duplicated key on one line — keep only one SUPABASE_SERVICE_ROLE_KEY=...');
  }
  process.exit(1);
});
