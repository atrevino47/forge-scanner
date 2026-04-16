// contracts/api.ts
// API request/response types — shared between Frontend and Backend
// Only the Orchestrator modifies this file

import type {
  FunnelStage,
  ScanResult,
  BlueprintData,
  Lead,
  Booking,
  Channel,
  ProvidedSocials,
} from './types';

// ============================================================
// SCAN API
// ============================================================

// POST /api/scan/start
export interface StartScanRequest {
  url: string; // website URL — the only required field
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface StartScanResponse {
  scanId: string;
  leadId: string;
  streamUrl: string; // SSE endpoint: /api/scan/status/{scanId}
}

// POST /api/scan/capture-info
export interface CaptureInfoRequest {
  scanId: string;
  leadId: string;
  email?: string; // Optional when socialConfirmation is provided
  phone?: string;
  fullName?: string;
  businessName?: string;
  providedSocials?: ProvidedSocials;
  socialConfirmation?: {
    platform: string;
    confirmedHandle: string;
  };
}

export interface CaptureInfoResponse {
  success: boolean;
  lead: Lead;
}

// GET /api/scan/results/[id]
export interface ScanResultsResponse {
  scan: ScanResult;
  lead: Lead;
  blueprintAvailable: boolean;
  blueprintId?: string;
}

// ============================================================
// BLUEPRINT API
// ============================================================

// POST /api/blueprint/generate/[scanId]
export interface GenerateBlueprintRequest {
  scanId: string;
}

export interface GenerateBlueprintResponse {
  blueprint: BlueprintData;
}

// ============================================================
// CHAT API (AI Sales Agent)
// ============================================================

// POST /api/chat/start/[scanId]
export interface StartChatRequest {
  scanId: string;
  leadId: string;
}

export interface StartChatResponse {
  conversationId: string;
  streamUrl: string; // SSE: /api/chat/stream/{conversationId}
  initialMessage: string; // AI's first contextual message
}

// POST /api/chat/message
export interface SendMessageRequest {
  conversationId: string;
  content: string;
  channel?: Channel; // defaults to 'web'
}

export interface SendMessageResponse {
  messageId: string;
  streamUrl: string; // SSE for the AI's response
}

// ============================================================
// FOLLOW-UP API
// ============================================================

// POST /api/followup/trigger
export interface TriggerFollowupRequest {
  scanId: string;
  leadId: string;
  reason: 'exit_intent' | 'no_booking' | 'abandoned_scan';
}

export interface TriggerFollowupResponse {
  scheduled: boolean;
  sequenceId: string;
  firstMessageAt: string | null; // ISO timestamp, null when no email to schedule for
}

// POST /api/followup/scrape-contact
export interface ScrapeContactRequest {
  scanId: string;
  websiteUrl: string;
}

export interface ScrapeContactResponse {
  found: boolean;
  email?: string;
  phone?: string;
  source?: 'website' | 'gbp' | 'whois' | 'social';
}

// ============================================================
// PAYMENTS API (Team-initiated)
// ============================================================

// POST /api/payments/create-intent
export interface CreatePaymentIntentRequest {
  leadId: string;
  scanId?: string;
  amountCents: number;
  currency?: string; // default 'usd'
  productType: 'setup_fee' | 'monthly_retainer' | 'custom_package';
  description?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// ============================================================
// AUTH API
// ============================================================

// POST /api/auth/link-scan
export interface LinkScanRequest {
  scanId: string;
}

export interface LinkScanResponse {
  success: boolean;
  userId: string;
}

// ============================================================
// ADMIN API
// ============================================================

// GET /api/admin/leads
export interface AdminLeadsQuery {
  page?: number;
  limit?: number;
  status?: 'all' | 'has_email' | 'no_email' | 'booked' | 'converted';
  source?: 'organic' | 'outreach' | 'ad';
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminLeadsResponse {
  leads: Array<
    Lead & {
      scanCount: number;
      latestScanId: string | null;
      hasBooked: boolean;
      hasPaid: boolean;
    }
  >;
  total: number;
  page: number;
  limit: number;
}

// GET /api/admin/payments
export interface AdminPaymentsQuery {
  page?: number;
  limit?: number;
  status?: 'all' | 'succeeded' | 'pending' | 'failed' | 'refunded';
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminPaymentRow {
  id: string;
  createdAt: string;
  scanId: string | null;
  leadEmail: string | null;
  leadName: string | null;
  amountCents: number;
  currency: string;
  productType: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
}

export interface AdminPaymentsResponse {
  payments: AdminPaymentRow[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalRevenueCents: number;
    thisMonthCents: number;
    thisWeekCents: number;
  };
}

// GET /api/admin/scans
export interface AdminScansQuery {
  page?: number;
  limit?: number;
  status?: 'all' | 'scanning' | 'complete' | 'failed';
  hasLead?: 'all' | 'yes' | 'no';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AdminScanRow {
  id: string;
  createdAt: string;
  websiteUrl: string;
  status: string;
  leadEmail: string | null;
  leadName: string | null;
  overallScore: number | null;
  stagesCompleted: number;
}

export interface AdminScansResponse {
  scans: AdminScanRow[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/admin/dashboard
export interface AdminDashboardResponse {
  totalScans: number;
  totalLeads: number;
  leadsWithEmail: number;
  leadsWithPhone: number;
  totalBookings: number;
  totalRevenue: number; // cents
  conversionRate: number; // scan → booking percentage
  recentScans: Array<{
    id: string;
    websiteUrl: string;
    leadEmail: string | null;
    status: string;
    createdAt: string;
  }>;
}

// ============================================================
// WORKBOOK API
// ============================================================

// POST /api/workbook/save
export interface SaveWorkbookRequest {
  id?: string; // omit to create, include to update
  clientName?: string;
  businessName?: string;
  locale?: string;
  answers: Record<string, string>;
}

export interface SaveWorkbookResponse {
  id: string;
  savedAt: string;
}

// GET /api/admin/workbooks
export interface AdminWorkbooksQuery {
  page?: number;
  limit?: number;
}

export interface AdminWorkbookRow {
  id: string;
  clientName: string | null;
  businessName: string | null;
  locale: string;
  completedCount: number;
  totalFields: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkbooksResponse {
  workbooks: AdminWorkbookRow[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/admin/workbooks/[id]
export interface AdminWorkbookDetailResponse extends AdminWorkbookRow {
  answers: Record<string, string>;
}

// ============================================================
// WEBHOOK PAYLOADS
// ============================================================

// POST /api/followup/webhook/calcom
export interface CalcomWebhookPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED';
  payload: {
    uid: string;
    eventTypeId: number;
    title: string;
    startTime: string;
    endTime: string;
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    metadata?: Record<string, string>; // includes leadId, scanId if pre-filled
  };
}

// ============================================================
// ERROR RESPONSE (all endpoints)
// ============================================================

export interface ApiError {
  error: {
    code: string; // 'RATE_LIMITED', 'INVALID_INPUT', 'NOT_FOUND', 'UNAUTHORIZED', 'INTERNAL'
    message: string; // user-friendly
    details?: unknown; // dev-only context
  };
}
