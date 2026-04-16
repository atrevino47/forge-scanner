'use client';

import type {
  ScanStatus,
  FunnelStage,
  BlueprintData,
} from '../../../../contracts/types';
import type { ScanCompletedSummary } from '../../../../contracts/events';
import type { ScreenshotEntry, StageState } from '../types';
import { ScanProgressBeat } from './ScanProgressBeat';
import { SocialsPrompt } from './SocialsPrompt';
import { EmailGate } from './EmailGate';
import { Beat1BigIdea } from './Beat1BigIdea';
import { Beat2ScoreReveal } from './Beat2ScoreReveal';
import { Beat3Situation } from './Beat3Situation';
import { Beat4Complication } from './Beat4Complication';
import { Beat5Evidence } from './Beat5Evidence';
import { Beat6PatternInsight } from './Beat6PatternInsight';
import { Beat7RevenueImpact } from './Beat7RevenueImpact';
import { Beat8CTA } from './Beat8CTA';

interface Props {
  scanId: string;
  leadId: string | null;
  status: ScanStatus | 'connecting';
  websiteUrl: string;
  stages: Partial<Record<FunnelStage, StageState>>;
  screenshots: ScreenshotEntry[];
  completedSummary: ScanCompletedSummary | null;
  emailCaptured: boolean;
  progressMessages: string[];
  blueprintData: BlueprintData | null;
  socialsSubmitted: boolean;
  onSocialsComplete: () => void;
  onEmailCaptured: (email: string) => void;
  onBook: () => void;
}

export function StoryScrollContainer(props: Props) {
  const {
    scanId,
    leadId,
    status,
    websiteUrl,
    stages,
    screenshots,
    completedSummary,
    emailCaptured,
    progressMessages,
    socialsSubmitted,
    onSocialsComplete,
    onEmailCaptured,
    onBook,
  } = props;

  const isScanning =
    status === 'scanning' ||
    status === 'capturing' ||
    status === 'analyzing' ||
    status === 'connecting';
  const isComplete = status === 'completed';

  const firstStageComplete = Object.values(stages).some((s) => s?.summary);

  return (
    <div className="pb-24">
      {isScanning && <ScanProgressBeat messages={progressMessages} />}

      {isScanning && leadId && !socialsSubmitted && (
        <SocialsPrompt
          scanId={scanId}
          leadId={leadId}
          onComplete={onSocialsComplete}
        />
      )}

      {firstStageComplete &&
        socialsSubmitted &&
        !emailCaptured &&
        leadId && (
          <EmailGate
            scanId={scanId}
            leadId={leadId}
            onCaptured={onEmailCaptured}
          />
        )}

      {isComplete && emailCaptured && completedSummary && (
        <>
          <Beat1BigIdea summary={completedSummary} websiteUrl={websiteUrl} />
          <Beat2ScoreReveal summary={completedSummary} />
          <Beat3Situation stages={stages} websiteUrl={websiteUrl} />
          <Beat4Complication stages={stages} />
          <Beat5Evidence stages={stages} screenshots={screenshots} />
          <Beat6PatternInsight stages={stages} />
          <Beat7RevenueImpact stages={stages} />
          <Beat8CTA onBook={onBook} />
        </>
      )}
    </div>
  );
}
