import type {
  FunnelStage,
  SourceType,
  Annotation,
  StageStatus,
  StageSummary,
} from '../../../contracts/types';

export interface ScreenshotEntry {
  id: string;
  stage: FunnelStage;
  source: SourceType;
  thumbnailUrl: string;
  viewport: 'desktop' | 'mobile';
  annotations: Annotation[];
  isNew: boolean;
}

export interface StageState {
  status: StageStatus;
  summary: StageSummary | null;
}
