import { spikeLifeRoomTableTopic } from '@spike-life/infrastructure'

/**
 * Subscribe to SPIKE LIFE room updates via Supabase Realtime (postgres_changes).
 * Falls back to interval polling when Supabase is not configured.
 */
export function subscribeSpikeLifeRoom(supabase, roomId, onRefresh, { intervalMs = 3000 } = {}) {
  if (!roomId || typeof onRefresh !== 'function') {
    return () => {}
  }

  let disposed = false
  let pollId = null
  let channel = null

  function cleanup() {
    disposed = true
    if (pollId != null) clearInterval(pollId)
    if (channel && supabase) {
      supabase.removeChannel(channel)
    }
  }

  if (supabase) {
    channel = supabase
      .channel(`spike-life:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: spikeLifeRoomTableTopic(),
          filter: `id=eq.${roomId}`,
        },
        () => {
          if (!disposed) onRefresh()
        },
      )
      .subscribe()
    return cleanup
  }

  pollId = setInterval(() => {
    if (!disposed) onRefresh()
  }, intervalMs)
  return cleanup
}
