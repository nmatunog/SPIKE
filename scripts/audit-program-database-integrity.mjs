#!/usr/bin/env node
/**
 * Audit SPIKE Internship vs RA-SPIKE Supabase projects for cross-contamination.
 *
 * Usage:
 *   node scripts/audit-program-database-integrity.mjs
 *   node scripts/audit-program-database-integrity.mjs --json
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';

const jsonOut = process.argv.includes('--json');

const PROJECTS = [
  { ref: 'lzbfjbtjropoaynbcxew', label: 'SPIKE Internship' },
  { ref: 'yruwfdjqigxxwbqsqhho', label: 'RA-SPIKE' },
];

function serviceKey(ref) {
  const out = execSync(`supabase projects api-keys --project-ref ${ref} -o json`, { encoding: 'utf8' });
  const key = JSON.parse(out).find((k) => k.name === 'service_role')?.api_key;
  if (!key) throw new Error(`No service_role key for ${ref}`);
  return key;
}

async function countTable(admin, table) {
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
  return error ? { error: error.message } : { count };
}

async function auditProject({ ref, label }) {
  const admin = createClient(`https://${ref}.supabase.co`, serviceKey(ref), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profiles } = await admin.from('profiles').select('id,email,role,name').order('email');
  const { data: progress } = await admin.from('intern_progress').select('user_id,program_slug,ra_spike_current_week');

  const progDist = {};
  for (const row of progress ?? []) {
    const slug = row.program_slug || '(null)';
    progDist[slug] = (progDist[slug] || 0) + 1;
  }

  const tables = await Promise.all([
    countTable(admin, 'playbook_completions'),
    countTable(admin, 'venture_portfolio_entries'),
    countTable(admin, 'ra_spike_week_progress'),
  ]);

  const emailById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email?.toLowerCase()]));

  return {
    ref,
    label,
    profiles: profiles ?? [],
    progress: progress ?? [],
    progDist,
    tables: {
      playbook_completions: tables[0],
      venture_portfolio_entries: tables[1],
      ra_spike_week_progress: tables[2],
    },
    emailById,
    emails: (profiles ?? []).map((p) => p.email?.toLowerCase()).filter(Boolean),
  };
}

const reports = [];
for (const project of PROJECTS) {
  reports.push(await auditProject(project));
}

const internReport = reports.find((r) => r.ref === 'lzbfjbtjropoaynbcxew');
const raReport = reports.find((r) => r.ref === 'yruwfdjqigxxwbqsqhho');

const internEmails = new Set(internReport.emails);
const raEmails = new Set(raReport.emails);
const overlap = [...internEmails].filter((e) => raEmails.has(e));

const raOnInternship = internReport.progress.filter((r) => r.program_slug === 'ra-spike');
const internOnRa = raReport.progress.filter((r) => r.program_slug !== 'ra-spike');

const rookiesOnlyOnRa = raReport.profiles
  .filter((p) => p.role === 'INTERN')
  .map((p) => p.email)
  .filter((email) => email && !internEmails.has(email.toLowerCase()));

const internsOnlyOnInternship = internReport.profiles
  .filter((p) => p.role === 'INTERN')
  .map((p) => p.email)
  .filter((email) => email && !raEmails.has(email.toLowerCase()));

if (jsonOut) {
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    overlapEmails: overlap,
    raSpikeRowsOnInternshipDb: raOnInternship.length,
    rookieEmailsOnlyOnRaSpike: rookiesOnlyOnRa,
    internEmailsOnlyOnInternship: internsOnlyOnInternship,
    internPlaybookOnInternshipDb: internReport.tables.playbook_completions?.count ?? 0,
    projects: reports.map((r) => ({
      label: r.label,
      ref: r.ref,
      profileCount: r.profiles.length,
      programSlugDistribution: r.progDist,
      tables: r.tables,
    })),
  }, null, 2));
  process.exit(0);
}

console.log('Program database integrity audit\n');
for (const r of reports) {
  console.log(`## ${r.label} (${r.ref})`);
  console.log(`  profiles: ${r.profiles.length}`);
  console.log(`  intern_progress: ${r.progress.length}`);
  console.log(`  program_slug: ${JSON.stringify(r.progDist)}`);
  console.log(`  playbook_completions: ${r.tables.playbook_completions.error ?? r.tables.playbook_completions.count}`);
  console.log('');
}

console.log('## Cross-database');
console.log(`  emails in BOTH: ${overlap.join(', ') || '(none)'}`);
console.log(`  ra-spike rows on INTERNSHIP DB: ${raOnInternship.length}`);
console.log(`  rookie emails ONLY on RA-SPIKE: ${rookiesOnlyOnRa.length}`);
console.log(`  intern playbook rows on INTERNSHIP DB: ${internReport.tables.playbook_completions?.count ?? 0}`);
