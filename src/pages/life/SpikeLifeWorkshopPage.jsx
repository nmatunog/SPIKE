import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkshopLobby from '../../../SPIKE_LIFE/apps/web/src/components/workshop/WorkshopLobby.jsx';
import WorkshopWorkspace from '../../../SPIKE_LIFE/apps/web/src/components/workshop/WorkshopWorkspace.jsx';
import { leaveActiveRoom } from '../../../SPIKE_LIFE/apps/web/src/lib/spike-life-workshop-client.js';
import { ensureSpikeLifeSupabasePersistence } from '../../lib/spike-life/supabasePersistence.js';
import { ROUTES } from '../../routes/paths.js';

ensureSpikeLifeSupabasePersistence();

export function SpikeLifeWorkshopPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  if (session) {
    return (
      <div className="h-full min-h-0">
        <WorkshopWorkspace
          session={session}
          onExit={() => {
            leaveActiveRoom();
            setSession(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <WorkshopLobby
        onBack={() => navigate(ROUTES.life)}
        onEnter={setSession}
      />
    </div>
  );
}
