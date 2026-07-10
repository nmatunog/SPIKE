#!/usr/bin/env node
/**
 * Smoke check — RA-SPIKE Week 2 FEC intro wizard content + completion helpers.
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const server = await createServer({
  root,
  server: { middlewareMode: true },
  logLevel: 'error',
});

try {
  const content = await server.ssrLoadModule('/src/lib/raSpikeContentLoader.js');
  const wizard = await server.ssrLoadModule('/src/lib/raSpikeCanvasWizard.js');
  const paths = await server.ssrLoadModule('/src/routes/paths.js');

  const week2 = content.getRaSpikeWeekContent(2);
  if (week2.steps?.assignment?.action?.type !== 'fec-intro-wizard') {
    throw new Error('week-2 assignment must use fec-intro-wizard action');
  }

  const intro = wizard.getRaSpikeFecIntroWizardConfig();
  if (!intro?.steps?.length || intro.steps.length !== 3) {
    throw new Error(`expected 3 intro wizard steps, got ${intro?.steps?.length ?? 0}`);
  }

  if (week2.steps?.workshop?.action?.type !== 'discovery-canvas') {
    throw new Error('week-2 workshop must use discovery-canvas action');
  }

  const discovery = await server.ssrLoadModule('/src/lib/raSpikeDiscoveryCanvas.js');
  const dcConfig = discovery.getRaSpikeDiscoveryCanvasConfig();
  if (!dcConfig?.title?.includes('Customer Discovery')) {
    throw new Error('discovery canvas config missing');
  }

  const fieldKeys = intro.steps.map((s) => s.fields?.[0]?.key).join(',');
  if (fieldKeys !== 'customer_segments,customer_problem,value_offering') {
    throw new Error(`unexpected intro field keys: ${fieldKeys}`);
  }

  if (!intro.principle?.includes('customer needs')) {
    throw new Error('intro wizard should state the Week 2 pedagogical principle');
  }

  if (intro.lockedSections?.length < 5) {
    throw new Error('intro wizard should list locked sections for Week 3');
  }

  const parsed = paths.parseRaSpikePlaybookPath(paths.ROUTES.raSpikePlaybookFecIntro);
  if (parsed?.view !== 'fec-intro') {
    throw new Error('fec-intro route not parsed correctly');
  }

  const parsedCanvas = paths.parseRaSpikePlaybookPath(paths.ROUTES.raSpikePlaybookDiscoveryCanvas);
  if (parsedCanvas?.view !== 'discovery-canvas') {
    throw new Error('discovery-canvas route not parsed correctly');
  }

  if (!paths.isRaSpikePlaybookPath(paths.ROUTES.raSpikePlaybook)) {
    throw new Error('isRaSpikePlaybookPath should match playbook root');
  }
  if (!paths.rolesForRoute(paths.ROUTES.raSpikePlaybook).includes('faculty')) {
    throw new Error('faculty must access RA-SPIKE playbook preview');
  }

  const preview = await server.ssrLoadModule('/src/lib/raSpikeCoachPreview.js');
  const coachUser = preview.buildRaSpikeCoachPreviewUser({ id: 'coach-1', name: 'Coach' });
  if (!preview.isRaSpikeCoachPreviewUser(coachUser)) {
    throw new Error('coach preview user flag missing');
  }
  if (coachUser.internProgress?.ra_spike_current_week !== 8) {
    throw new Error('coach preview should unlock all weeks');
  }

  console.log(
    `smoke:ra-spike-week2 OK — "${week2.title}" with ${intro.steps.length} FEC intro blocks`,
  );
} catch (error) {
  console.error('smoke:ra-spike-week2 FAIL —', error.message);
  process.exitCode = 1;
} finally {
  await server.close();
}
