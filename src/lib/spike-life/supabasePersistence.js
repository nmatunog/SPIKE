import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import {
  SupabaseGameRoomRepository,
  SupabaseSimulationRepository,
} from '@spike-life/infrastructure';
import { configureWorkshopPersistence } from '../../../SPIKE_LIFE/apps/web/src/lib/spike-life-workshop-client.js';

let configured = false;

/** Wire SPIKE LIFE workshop to Supabase when Portal env is configured. */
export function ensureSpikeLifeSupabasePersistence() {
  if (configured || !isSupabaseConfigured || !supabase) return;
  configureWorkshopPersistence({
    gameRoomRepo: new SupabaseGameRoomRepository(supabase),
    simulationRepo: new SupabaseSimulationRepository(supabase),
  });
  configured = true;
}
