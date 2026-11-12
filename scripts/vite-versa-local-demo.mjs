import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSessionIdentityProvider } from '../functions/_shared/versaCode/adapters.js'
import {
  enrollmentUiMessage,
  enrollmentUiState,
} from '../functions/_shared/versaCode/enrollmentUi.js'
import { importVersaCsv, versaHttpDeny } from '../functions/_shared/versaCode/index.js'
import { redeem, verify } from '../functions/_shared/versaCode/service.js'
import { createMemoryAdmin } from '../functions/_shared/versaCode/test/memoryAdmin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_CSV = path.resolve(__dirname, '../docs/versa/synthetic-enrollment.csv')

const DEMO_USERS = {
  intern: {
    id: 'user-l1-1',
    email: 'learner.valid@example.test',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
  },
  other: {
    id: 'user-other-1',
    email: 'other.person@example.test',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
  },
  ra: {
    id: 'user-ra-1',
    email: 'ra.learner@example.test',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
  },
}

const DEMO_ENV = {
  VERSA_CSV_CODE_GATE: '1',
  VERSA_CODE_HMAC_SECRET: 'spike-versa-synthetic-hmac-secret',
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw.trim()) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function resolveDemoUser(req) {
  const header = String(req.headers['x-versa-demo-user'] || 'intern').trim().toLowerCase()
  return DEMO_USERS[header] || DEMO_USERS.intern
}

function createDemoStore(csvPath) {
  const csvText = readFileSync(csvPath, 'utf8')
  const store = {
    admin: createMemoryAdmin(),
    ready: Promise.resolve(),
  }
  async function reset() {
    store.admin = createMemoryAdmin()
    const imported = await importVersaCsv({ env: DEMO_ENV, admin: store.admin, csvText })
    if (!imported.ok) {
      throw new Error(imported.error || 'Synthetic CSV import failed.')
    }
    return store.admin
  }
  store.ready = reset()
  store.reset = reset
  return store
}

function identityFor(user) {
  return createSessionIdentityProvider({
    userId: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at,
  })
}

function toPayload(result) {
  const state = enrollmentUiState(result)
  const body = {
    ok: Boolean(result.ok),
    state,
    message: result.ok ? enrollmentUiMessage(state) : enrollmentUiMessage(state),
    confirmation: enrollmentUiMessage(state),
    alreadyGranted: Boolean(result.alreadyGranted),
    level: result.row?.level || result.offering?.level,
    offeringId: result.row?.offering_id || result.offering?.id,
    programRoute: result.row?.program_route,
    continueLabel: 'Continue to SPIKE Learning',
  }
  return { status: result.ok ? 200 : 403, body }
}

/**
 * Local-only Versa verify/redeem for the standalone harness.
 * Active only when VERSA_DEMO_LOCAL=1. Default `npm run dev` is unchanged.
 */
export function versaLocalDemoPlugin({ csvPath = DEFAULT_CSV } = {}) {
  if (process.env.VERSA_DEMO_LOCAL !== '1') {
    return { name: 'versa-local-demo-skipped' }
  }

  const store = createDemoStore(csvPath)

  return {
    name: 'versa-local-demo',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (!url.startsWith('/api/versa/') && url !== '/api/versa') return next()

        try {
          await store.ready
          const admin = store.admin
          const method = req.method || 'GET'

          if (method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (url === '/api/versa/status' && method === 'GET') {
            sendJson(res, 200, { enabled: true, demo: true })
            return
          }

          if (url === '/api/versa/demo-reset' && method === 'POST') {
            await store.reset()
            sendJson(res, 200, { ok: true, demo: true })
            return
          }

          if ((url === '/api/versa/redeem' || url === '/api/versa/verify') && method === 'POST') {
            const user = resolveDemoUser(req)
            const body = await readJsonBody(req)
            const fn = url.endsWith('/verify') ? verify : redeem
            const result = await fn(
              String(body?.code ?? body?.accessCode ?? ''),
              identityFor(user),
              String(body?.intendedCourse ?? body?.programRoute ?? ''),
              String(body?.intendedLevel ?? body?.level ?? 'L1'),
              {
                env: DEMO_ENV,
                admin,
                offeringId: body?.offeringId,
                programRoute: body?.programRoute,
                // Imported `pro` is paid (Nilo Nov 12). Never take paymentVerified from the body.
                paymentVerified: false,
              },
            )
            if (!result.ok) {
              const deny = versaHttpDeny(result, { demo: true })
              sendJson(res, deny.status, deny.body)
              return
            }
            const payload = toPayload(result)
            sendJson(res, payload.status, { ...payload.body, demo: true })
            return
          }
        } catch (err) {
          sendJson(res, 500, {
            message: err instanceof Error ? err.message : 'Demo verifier failed.',
            demo: true,
          })
          return
        }

        next()
      })
    },
  }
}
