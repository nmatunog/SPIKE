/**
 * In-memory Supabase-shaped admin used by Checkpoint 01 tests.
 * Serializes inventory consume so concurrent redeem can prove single-use.
 */

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function matchesFilters(row, filters) {
  return filters.every(({ col, val }) => String(row[col]) === String(val));
}

export function createMemoryAdmin(seed = {}) {
  const tables = {
    versa_code_inventory: [...(seed.versa_code_inventory || [])],
    versa_entitlements: [...(seed.versa_entitlements || [])],
    versa_code_attempts: [...(seed.versa_code_attempts || [])],
    intern_progress: [...(seed.intern_progress || [])],
    profiles: [...(seed.profiles || [])],
    activation_codes: [...(seed.activation_codes || [])],
  };
  let nextId = {
    versa_code_inventory: tables.versa_code_inventory.length + 1,
    versa_entitlements: tables.versa_entitlements.length + 1,
    versa_code_attempts: tables.versa_code_attempts.length + 1,
    intern_progress: tables.intern_progress.length + 1,
    profiles: tables.profiles.length + 1,
  };
  let consumeChain = Promise.resolve();

  function serialize(fn) {
    const run = consumeChain.then(fn, fn);
    consumeChain = run.catch(() => {});
    return run;
  }

  function from(table) {
    if (!tables[table]) tables[table] = [];
    /** @type {{ filters: {col:string,val:unknown}[], patch: object | null, insertRows: object[] | null, columns: string | null, op: string }} */
    const state = {
      filters: [],
      patch: null,
      insertRows: null,
      columns: '*',
      op: 'select',
      upsert: false,
      onConflict: null,
    };

    const builder = {
      select(columns = '*') {
        state.columns = columns;
        if (!state.op || state.op === 'select') state.op = state.patch ? 'update' : state.insertRows ? 'insert' : 'select';
        return builder;
      },
      insert(row) {
        state.op = 'insert';
        state.insertRows = Array.isArray(row) ? row : [row];
        return builder;
      },
      upsert(row, opts = {}) {
        state.op = 'upsert';
        state.upsert = true;
        state.onConflict = opts.onConflict || null;
        state.insertRows = Array.isArray(row) ? row : [row];
        return builder;
      },
      update(patch) {
        state.op = 'update';
        state.patch = patch;
        return builder;
      },
      eq(col, val) {
        state.filters.push({ col, val });
        return builder;
      },
      order() {
        return builder;
      },
      limit() {
        return builder;
      },
      maybeSingle() {
        return execute(true);
      },
      then(resolve, reject) {
        return execute(false).then(resolve, reject);
      },
    };

    async function execute(single) {
      const run = async () => {
        if (state.op === 'insert' || state.op === 'upsert') {
          const inserted = [];
          for (const raw of state.insertRows || []) {
            const row = { ...raw };
            if (table === 'versa_code_inventory') {
              const dup = tables[table].some(
                (existing) => existing.code_digest && existing.code_digest === row.code_digest,
              );
              if (dup) {
                return { data: null, error: { message: 'duplicate key value violates unique constraint', code: '23505' } };
              }
            }
            if (state.op === 'upsert' && state.onConflict) {
              const keys = String(state.onConflict).split(',').map((k) => k.trim());
              const existing = tables[table].find((item) => keys.every((k) => String(item[k]) === String(row[k])));
              if (existing) {
                Object.assign(existing, row);
                inserted.push(clone(existing));
                continue;
              }
            }
            if (row.id == null) {
              row.id = nextId[table] ?? tables[table].length + 1;
              nextId[table] = row.id + 1;
            }
            tables[table].push(row);
            inserted.push(clone(row));
          }
          const data = single ? inserted[0] ?? null : inserted;
          return { data, error: null };
        }

        if (state.op === 'update') {
          const matched = tables[table].filter((row) => matchesFilters(row, state.filters));
          for (const row of matched) {
            Object.assign(row, state.patch);
          }
          const data = single ? clone(matched[0] ?? null) : clone(matched);
          return { data, error: null };
        }

        const matched = tables[table].filter((row) => matchesFilters(row, state.filters));
        const data = single ? clone(matched[0] ?? null) : clone(matched);
        return { data, error: null };
      };

      if (table === 'versa_code_inventory' && state.op === 'update') {
        return serialize(run);
      }
      return run();
    }

    return builder;
  }

  async function rpc(name, args) {
    if (name !== 'redeem_versa_code_row') {
      return { data: null, error: { message: `unknown rpc ${name}`, code: 'PGRST202' } };
    }
    return serialize(async () => {
      const row = tables.versa_code_inventory.find(
        (item) => item.id === args.p_id && item.status === 'available',
      );
      if (!row) return { data: null, error: null };
      row.status = 'redeemed';
      row.redeemed_at = new Date().toISOString();
      row.redeemed_by = args.p_user_id;
      return { data: clone(row), error: null };
    });
  }

  return {
    from,
    rpc,
    tables,
    auth: {
      getUser: async () => ({ data: { user: seed.authUser || null }, error: null }),
      admin: {
        createUser: async ({ email }) => {
          const user = { id: seed.nextUserId || 'user-created-1', email };
          return { data: { user }, error: null };
        },
      },
    },
  };
}
