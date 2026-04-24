// contracts/types.ts
// SINGLE SOURCE OF TRUTH — all agents import from here
// Only the Orchestrator modifies this file

// ============================================================
// FUNNEL STAGES
// ============================================================

export type FunnelStage = 'traffic' | 'landing' | 'capture' | 'offer' | 'followup';

export type ScanStatus = 'scanning' | 'capturing' | 'analyzing' | 'completed' | 'failed';

export type StageStatus = 'pending' | 'capturing' | 'analyzing' | 'completed' | 'failed';

export type AnnotationType = 'critical' | 'warning' | 'opportunity' | 'positive';

export type SourceType =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'gbp'
  | 'ads';

export type Viewport = 'desktop' | 'mobile';

export type Channel = 'web' | 'email' | 'sms' | 'whatsapp' | 'voice';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ConversationStatus = 'active' | 'booked' | 'declined' | 'nurturing' | 'expired';

export type FollowupStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed';

export type BookingSource =
  | 'banner_cta'
  | 'ai_agent'
  | 'results_cta'
  | 'email_link'
  | 'sms_link'
  | 'whatsapp_link'
  | 'voice_call';

export type PaymentProductType = 'setup_fee' | 'monthly_retainer' | 'custom_package';

export type CaptureMethod = 'direct' | 'scraped' | 'manual';

// ============================================================
// INDUSTRY DETECTION (runs once per scan, feeds template slots to all prompts)
// ============================================================

export interface IndustryDetection {
  industry_slug: string; // lowercase-kebab-case, e.g. "hvac-contracting", "med-spa", "generic"
  industry_display: string; // human-readable, e.g. "HVAC Contracting"
  confidence: number; // 0-1; consumers fall back to "your industry" when <0.6
  customer_role_singular: string; // "homeowner", "patient", "couple"
  customer_role_plural: string;
  typical_avg_ticket_usd: {
    min: number;
    max: number;
  };
  evidence: string[]; // 1-5 verbatim phrases from scraped content
}

// ============================================================
// ANNOTATIONS
// ============================================================

export interface AnnotationPosition {
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  width?: number; // optional highlight area width (%)
  height?: number; // optional highlight area height (%)
}

export interface Annotation {
  id: string;
  position: AnnotationPosition;
  type: AnnotationType;
  title: string; // short label: "No CTA above fold"
  detail: string; // explanation: "68% of visitors decide..."
  category: string; // "lead_capture", "trust_signals", "ux", etc.
}

export interface ScreenshotData {
  id: string;
  scanId: string;
  stage: FunnelStage;
  sourceType: SourceType;
  sourceUrl: string;
  storageUrl: string; // Supabase Storage public URL
  viewport: Viewport;
  annotations: Annotation[];
  analyzedAt: string | null;
  createdAt: string;
}

// ============================================================
// SCAN RESULTS
// ============================================================

export interface StageFinding {
  id: string;
  title: string;
  detail: string;
  type: AnnotationType;
  impact: 'high' | 'medium' | 'low';
}

export interface StageSummary {
  exists: boolean; // does this stage exist in their funnel?
  score: number; // 0-100 health score for this stage
  headline: string; // "Your landing experience is costing you 40% of visitors"
  findings: StageFinding[];
}

export interface FunnelStageResult {
  stage: FunnelStage;
  status: StageStatus;
  summary: StageSummary | null;
  screenshots: ScreenshotData[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface ScanResult {
  id: string;
  websiteUrl: string;
  status: ScanStatus;
  detectedSocials: DetectedSocials;
  providedSocials: ProvidedSocials | null;
  socialEnrichment: SocialEnrichmentResult | null;
  adDetection: { meta: AdDetectionResult | null; google: GoogleAdsDetectionResult | null } | null;
  stages: FunnelStageResult[];
  completedAt: string | null;
  createdAt: string;
}

export interface SocialEntry {
  handle: string;
  url: string;
  confidence: 'high' | 'low';
}

export function isSocialEntry(value: unknown): value is SocialEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'handle' in value &&
    'url' in value &&
    'confidence' in value &&
    typeof (value as SocialEntry).handle === 'string' &&
    typeof (value as SocialEntry).url === 'string' &&
    ((value as SocialEntry).confidence === 'high' || (value as SocialEntry).confidence === 'low')
  );
}

export interface DetectedSocials {
  instagram?: SocialEntry;
  facebook?: SocialEntry;
  tiktok?: SocialEntry;
  linkedin?: SocialEntry;
  youtube?: SocialEntry;
  twitter?: SocialEntry;
}

export interface ProvidedSocials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
}

// ============================================================
// BLUEPRINT
// ============================================================

export interface FunnelMapNode {
  stage: FunnelStage;
  label: string;
  exists: boolean;
  health: 'good' | 'weak' | 'missing';
  currentDescription: string; // what they have now
  idealDescription: string; // what they should have
  improvements: string[]; // specific changes needed
}

export interface FunnelMapData {
  nodes: FunnelMapNode[];
  overallHealth: number; // 0-100
  biggestGap: FunnelStage;
  revenueImpactEstimate: string; // "Adding a lead magnet could capture 30% more leads"
}

export interface BlueprintData {
  id: string;
  scanId: string;
  funnelMap: FunnelMapData;
  mockupHtml: string; // generated HTML for the key piece (LEGACY — being replaced by diagram)
  mockupTarget: string; // what was mocked up (LEGACY)
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  /**
   * Ideal Hormozi-stacked funnel diagram for the detected industry.
   * Replaces the HTML mockup path. Populated by blueprint-diagram.ts
   * (Minion 2 scope). When null, BlueprintView falls back to the legacy
   * funnel-map render.
   */
  diagram?: BlueprintDiagram | null;
  createdAt: string;
}

// ============================================================
// BLUEPRINT DIAGRAM (industry-ideal Hormozi funnel, JSON-first)
// ============================================================

export type MoneyModelLayerKey =
  | 'attraction'
  | 'front_end_cash'
  | 'upsell_downsell'
  | 'continuity';

export type DiagramStageCategory =
  | 'traffic'
  | 'attraction'
  | 'capture'
  | 'nurture'
  | 'offer'
  | 'upsell'
  | 'continuity';

export type ValueEquationLever =
  | 'Dream Outcome'
  | 'Perceived Likelihood'
  | 'Time Delay'
  | 'Effort & Sacrifice'
  | 'Multiple';

export type GrandSlamStep =
  | 'MAGIC name'
  | '30-word test'
  | 'Value stack'
  | 'Anchor-first tiers'
  | 'Risk reversal';

export interface DiagramNode {
  id: string;
  label: string;
  stage_category: DiagramStageCategory;
  description: string;
  value_equation_lever: ValueEquationLever;
  is_missing_in_prospect: boolean;
  is_critical_upgrade: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label: string;
  benchmark_source: string;
}

export interface GrandSlamChecklistItem {
  step_name: GrandSlamStep;
  description: string;
  present_in_diagram: boolean;
}

export interface OutcomeGuarantee {
  statement: string;
  binary_criterion: string;
  judged_by: string;
}

export interface ObjectionFaqEntry {
  q: string;
  a: string;
}

export interface BlueprintPrimaryCta {
  headline: string;
  body: string;
  /** Locked copy (Adrian 2026-04-23 21:45). */
  button_label: 'Book a call';
  button_subtext: 'If you want this personalized sales funnel implemented in your business, book a call.';
  book_url: string;
}

export interface BlueprintDiagram {
  industry: string;
  customer_role: string;
  weakest_stage: FunnelStage;
  weakest_money_model_layer: MoneyModelLayerKey;
  diagram: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
  };
  grand_slam_checklist: GrandSlamChecklistItem[];
  outcome_guarantee: OutcomeGuarantee;
  objection_faq: ObjectionFaqEntry[];
  primary_cta: BlueprintPrimaryCta;
}

// ============================================================
// AD DETECTION (Traffic stage enrichment)
// ============================================================

export interface MetaAdData {
  id: string;
  creativeBody: string | null;
  creativeLinkTitle: string | null;
  platforms: string[]; // e.g. ['facebook', 'instagram']
  startDate: string;
  status: 'active' | 'inactive';
}

export interface AdDetectionResult {
  isAdvertising: boolean;
  platform: 'meta';
  activeAdCount: number;
  totalAdsFound: number;
  publisherPlatforms: string[]; // unique platforms across all ads
  sampleAds: MetaAdData[]; // up to 5 sample ads for AI context
  detectedAt: string;
}

// ============================================================
// SOCIAL ENRICHMENT (Apify data for Traffic stage)
// ============================================================

export interface SocialProfileMetrics {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'google_maps' | 'youtube' | 'twitter';
  handle: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  engagementRate: number | null; // 0-100 percentage
  avgLikes: number | null;
  avgComments: number | null;
  isVerified: boolean;
  bio: string | null;
  // Google Maps specific
  reviewCount: number | null;
  averageRating: number | null;
  totalPhotos: number | null;
}

export interface SocialEnrichmentResult {
  profiles: SocialProfileMetrics[];
  enrichedAt: string;
}

// ============================================================
// GOOGLE ADS DETECTION (Traffic stage enrichment)
// ============================================================

export interface GoogleAdsDetectionResult {
  hasActiveAds: boolean;
  adCount: number | null;
  transparencyUrl: string;
}

// ============================================================
// AI SALES AGENT
// ============================================================

export interface ChatMessage {
  id: string;
  conversationId: string;
  channel: Channel;
  role: MessageRole;
  content: string;
  metadata?: {
    type?: 'text' | 'data_card' | 'calcom_embed' | 'screenshot_ref';
    screenshotId?: string;
    annotations?: Annotation[];
    calcomUrl?: string;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  scanId: string;
  leadId: string;
  status: ConversationStatus;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// LEAD & BOOKING
// ============================================================

export interface Lead {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  websiteUrl: string;
  businessName: string | null;
  source: 'organic' | 'outreach' | 'ad';
  captureMethod: CaptureMethod | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  leadId: string;
  scanId: string | null;
  calEventId: string | null;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  source: BookingSource;
  createdAt: string;
}

// ============================================================
// VIDEO ANALYSIS (Traffic stage)
// ============================================================

export interface VideoAnalysis {
  platform: 'instagram' | 'tiktok' | 'youtube';
  totalVideosAnalyzed: number;
  topPerformers: VideoData[];
  recentVideos: VideoData[];
  patterns: VideoPattern;
}

export interface VideoData {
  url: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  postedAt: string;
  caption: string;
  hookType?: string; // "question", "bold_claim", "pattern_interrupt", etc.
  ageInDays: number;
}

export interface VideoPattern {
  postingFrequency: string; // "2x/week", "daily", "inconsistent"
  consistencyScore: number; // 0-100
  topTopics: string[];
  doublingDownScore: number; // 0-100 — do they repeat what works?
  bestFormat: string; // "talking_head", "broll", "screen_recording", "text_overlay"
  hookVariety: number; // 0-100
  viralRecency: 'recent' | 'stale' | 'none'; // are viral videos from recently or years ago?
}
