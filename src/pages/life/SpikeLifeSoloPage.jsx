import { useNavigate } from 'react-router-dom';
import LifeWorkspace from '../../../SPIKE_LIFE/apps/web/src/components/LifeWorkspace.jsx';
import { ROUTES } from '../../routes/paths.js';

export function SpikeLifeSoloPage() {
  const navigate = useNavigate();

  return (
    <LifeWorkspace onOpenWorkshop={() => navigate(ROUTES.lifeWorkshop)} />
  );
}
