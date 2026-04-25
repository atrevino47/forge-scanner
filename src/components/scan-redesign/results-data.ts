export interface StageScore {
  stage: string;
  score: number;
  severity: string;
  key: string;
  weakest?: boolean;
}

export const SAMPLE_SCORE_DATA: StageScore[] = [
  { stage: 'Traffic sources', score: 62, severity: 'Weak', key: 'traffic' },
  { stage: 'Landing experience', score: 41, severity: 'Critical', key: 'landing' },
  { stage: 'Lead capture', score: 28, severity: 'Critical', key: 'capture' },
  {
    stage: 'Offer & conversion',
    score: 22,
    severity: 'Critical',
    key: 'offer',
    weakest: true,
  },
  { stage: 'Follow-up system', score: 18, severity: 'Critical', key: 'followup' },
];

export interface MoneyLayer {
  k: string;
  score: 'present' | 'weak' | 'missing';
  note: string;
  leak: string;
  biggest?: boolean;
}

export const SAMPLE_MONEY_LAYERS: MoneyLayer[] = [
  { k: 'Attraction', score: 'weak', note: 'Paid ads present. No lead magnet.', leak: '$48k' },
  {
    k: 'Front-end cash',
    score: 'weak',
    note: 'One service, one price. No tripwire.',
    leak: '$72k',
  },
  {
    k: 'Upsell / downsell',
    score: 'missing',
    note: 'No post-purchase path.',
    leak: '$164k',
    biggest: true,
  },
  { k: 'Continuity', score: 'missing', note: 'No membership, no retainer.', leak: '$38k' },
];
