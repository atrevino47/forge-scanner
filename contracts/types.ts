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

export interface DetectedSocials {
  instagram?: { handle: string; url: string; confidence: 'high' | 'low' };
  facebook?: { handle: string; url: string; confidence: 'high' | 'low' };
  tiktok?: { handle: string; url: string; confidence: 'high' | 'low' };
  linkedin?: { handle: string; url: string; confidence: 'high' | 'low' };
}

export interface ProvidedSocials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
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
  mockupHtml: string; // generated HTML for the key piece
  mockupTarget: string; // what was mocked up
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  createdAt: string;
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
  platform: 'instagram' | 'tiktok' | 'facebook' | 'google_maps';
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
