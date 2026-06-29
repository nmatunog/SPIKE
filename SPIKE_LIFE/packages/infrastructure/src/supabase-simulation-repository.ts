import type { SupabaseClient } from '@supabase/supabase-js'
import type { SimulationRepository, SimulationState } from '@spike-life/domain'

export class SupabaseSimulationRepository implements SimulationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(session: SimulationState): Promise<void> {
    const { error } = await this.client.from('spike_life_simulations').upsert({
      id: session.id,
      room_id: session.id.includes(':') ? session.id.split(':')[0] : null,
      state_json: session,
      updated_at: session.updatedAt,
    })
    if (error) throw new Error(error.message)
  }

  async findById(id: string): Promise<SimulationState | null> {
    const { data, error } = await this.client
      .from('spike_life_simulations')
      .select('state_json')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data?.state_json as SimulationState | undefined) ?? null
  }
}
