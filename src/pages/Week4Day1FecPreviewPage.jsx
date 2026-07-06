import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Week4Day1FecPreview } from '../components/playbook/week4/Week4Day1FecPreview.jsx';

/**
 * @param {{ viewerRole?: string, defaultParticipantId?: string }} props
 */
export function Week4Day1FecPreviewPage({ viewerRole = 'intern', defaultParticipantId = '' }) {
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participant') || defaultParticipantId || '';
  const participantName = searchParams.get('name') || '';

  if (!participantId && viewerRole === 'intern') {
    return (
      <PageContainer>
        <p className="text-sm text-slate-600">Sign in to preview your FEC.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 print:py-4">
      <Week4Day1FecPreview participantId={participantId} participantName={participantName} />
    </PageContainer>
  );
}
