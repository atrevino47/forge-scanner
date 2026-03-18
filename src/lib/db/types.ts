// src/lib/db/types.ts
// Database row types — snake_case to match PostgreSQL columns exactly.
// The API layer converts these to camelCase contract types from /contracts/.

import type {
  FunnelStage,
  ScanStatus,
  StageStatus,
  AnnotationType,
  SourceType,
  Viewport,
  Channel,
  MessageRole,
  ConversationStatus,
  FollowupStatus,
  BookingSource,
  CaptureMethod,
  PaymentProductType,
  Annotation,
  StageSummary,
  FunnelMapData,
} from '../../../contracts/types';

// ============================================================
// LEADS
// ============================================================

export interface DbLead {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  website_url: string;
  business_name: string | null;
  source: 'organic' | 'outreach' | 'ad';
  capture_method: CaptureMethod | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SCANS
// ============================================================

export interface DbScan {
  id: string;
  lead_id: string;
  user_id: string | null;
  website_url: string;
  status: ScanStatus;
  detected_socials: Record<string, unknown>;
  provided_socials: Record<string, unknown> | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  completed_at: string | null;
  created_at: string;
}

// ============================================================
// FUNNEL STAGES
// ============================================================

export interface DbFunnelStage {
  id: string;
  scan_id: string;
  stage: FunnelStage;
  status: StageStatus;
  summary: StageSummary | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ============================================================
// SCREENSHOTS
// ============================================================

export interface DbScreenshot {
  id: string;
  scan_id: string;
  stage: FunnelStage;
  source_type: SourceType;
  source_url: string;
  storage_url: string;
  viewport: Viewport;
  annotations: Annotation[];
  analyzed_at: string | null;
  created_at: string;
}

// ============================================================
// BLUEPRINTS
// ============================================================

export interface DbBlueprint {
  id: string;
  scan_id: string;
  funnel_map: FunnelMapData;
  mockup_html: string;
  mockup_target: string;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  created_at: string;
}

// ============================================================
// CONVERSATIONS
// ============================================================

export interface DbConversation {
  id: string;
  scan_id: string;
  lead_id: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================
// MESSAGES
// ============================================================

export interface DbMessage {
  id: string;
  conversation_id: string;
  channel: Channel;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// FOLLOWUPS
// ============================================================

export interface DbFollowup {
  id: string;
  lead_id: string;
  scan_id: string | null;
  channel: Channel;
  status: FollowupStatus;
  reason: 'exit_intent' | 'no_booking' | 'abandoned_scan';
  content: string | null;
  scheduled_at: string;
  sent_at: string | null;
  sequence_id: string;
  sequence_step: number;
  created_at: string;
}

// ============================================================
// BOOKINGS
// ============================================================

export interface DbBooking {
  id: string;
  lead_id: string;
  scan_id: string | null;
  cal_event_id: string | null;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  source: BookingSource;
  created_at: string;
}

// ============================================================
// PAYMENTS
// ============================================================

export interface DbPayment {
  id: string;
  lead_id: string;
  scan_id: string | null;
  stripe_payment_intent_id: string;
  amount_cents: number;
  currency: string;
  product_type: PaymentProductType;
  description: string | null;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
}

// ============================================================
// RATE LIMITS
// ============================================================

export interface DbRateLimit {
  id: string;
  key: string;
  type: 'ip_scan' | 'email_scan' | 'ip_api';
  count: number;
  window_start: string;
  created_at: string;
}

// Re-export enums used in database queries for convenience
export type {
  FunnelStage,
  ScanStatus,
  StageStatus,
  AnnotationType,
  SourceType,
  Viewport,
  Channel,
  MessageRole,
  ConversationStatus,
  FollowupStatus,
  BookingSource,
  CaptureMethod,
  PaymentProductType,
};
