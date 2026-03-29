// src/lib/db/admin-queries.ts
// Admin-specific database queries using service role client (bypasses RLS)

import { createServiceClient } from './client';
import type {
  AdminDashboardResponse,
  AdminLeadsResponse,
  AdminPaymentsResponse,
  AdminScanRow,
  AdminScansResponse,
} from '../../../contracts/api';
import type { DbLead, DbPayment, DbScan } from './types';

/**
 * Fetches aggregate metrics for the admin dashboard.
 */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardResponse> {
  const db = createServiceClient();

  const [
    { count: totalScans },
    { count: totalLeads },
    { count: leadsWithEmail },
    { count: leadsWithPhone },
    { count: totalBookings },
    paymentsResult,
    recentScansResult,
  ] = await Promise.all([
    db.from('scans').select('*', { count: 'exact', head: true }),
    db.from('leads').select('*', { count: 'exact', head: true }),
    db.from('leads').select('*', { count: 'exact', head: true }).not('email', 'is', null),
    db.from('leads').select('*', { count: 'exact', head: true }).not('phone', 'is', null),
    db.from('bookings').select('*', { count: 'exact', head: true }),
    db.from('payments').select('amount_cents').eq('status', 'succeeded'),
    db.from('scans')
      .select('id, website_url, lead_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Calculate total revenue
  const totalRevenue = (paymentsResult.data ?? []).reduce(
    (sum, p) => sum + (p.amount_cents as number),
    0,
  );

  // Calculate conversion rate (scans → bookings)
  const scanCount = totalScans ?? 0;
  const bookingCount = totalBookings ?? 0;
  const conversionRate =
    scanCount > 0 ? Math.round((bookingCount / scanCount) * 1000) / 10 : 0;

  // Fetch lead emails for recent scans
  const recentScans = recentScansResult.data ?? [];
  const leadIds = [...new Set(recentScans.map((s) => s.lead_id as string).filter(Boolean))];
  const { data: leads } = leadIds.length > 0
    ? await db.from('leads').select('id, email').in('id', leadIds)
    : { data: [] as Array<{ id: string; email: string | null }> };

  const leadEmailMap = new Map((leads ?? []).map((l) => [l.id, l.email]));

  return {
    totalScans: totalScans ?? 0,
    totalLeads: totalLeads ?? 0,
    leadsWithEmail: leadsWithEmail ?? 0,
    leadsWithPhone: leadsWithPhone ?? 0,
    totalBookings: bookingCount,
    totalRevenue,
    conversionRate,
    recentScans: recentScans.map((s) => ({
      id: s.id as string,
      websiteUrl: s.website_url as string,
      leadEmail: leadEmailMap.get(s.lead_id as string) ?? null,
      status: s.status as string,
      createdAt: s.created_at as string,
    })),
  };
}

/**
 * Fetches paginated leads with scan/booking/payment enrichment.
 */
export async function getAdminLeads(opts: {
  page: number;
  limit: number;
  status: string;
  source?: string;
  sortBy: string;
  sortOrder: string;
  search?: string;
}): Promise<AdminLeadsResponse> {
  const db = createServiceClient();
  const { page, limit, status, source, sortBy, sortOrder, search } = opts;
  const offset = (page - 1) * limit;

  // Build lead query
  let query = db.from('leads').select('*', { count: 'exact' });

  // Status filters
  if (status === 'has_email') {
    query = query.not('email', 'is', null);
  } else if (status === 'no_email') {
    query = query.is('email', null);
  }

  // Source filter
  if (source) {
    query = query.eq('source', source);
  }

  // Search (email, phone, website_url, business_name)
  if (search) {
    query = query.or(
      `email.ilike.%${search}%,phone.ilike.%${search}%,website_url.ilike.%${search}%,business_name.ilike.%${search}%`,
    );
  }

  // Sorting and pagination
  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: leadsRaw, count } = await query;
  const leads = (leadsRaw ?? []) as DbLead[];

  if (leads.length === 0) {
    return { leads: [], total: count ?? 0, page, limit };
  }

  // Enrich leads with scan count, latest scan, booking, and payment status
  const leadIds = leads.map((l) => l.id);

  const [scansResult, bookingsResult, paymentsResult] = await Promise.all([
    db.from('scans')
      .select('id, lead_id, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false }),
    db.from('bookings')
      .select('lead_id')
      .in('lead_id', leadIds),
    db.from('payments')
      .select('lead_id')
      .in('lead_id', leadIds)
      .eq('status', 'succeeded'),
  ]);

  const scans = scansResult.data ?? [];
  const bookingLeadIds = new Set((bookingsResult.data ?? []).map((b) => b.lead_id as string));
  const paymentLeadIds = new Set((paymentsResult.data ?? []).map((p) => p.lead_id as string));

  // Group scans by lead
  const scansByLead = new Map<string, Array<{ id: string; created_at: string }>>();
  for (const s of scans) {
    const lid = s.lead_id as string;
    if (!scansByLead.has(lid)) scansByLead.set(lid, []);
    scansByLead.get(lid)!.push({ id: s.id as string, created_at: s.created_at as string });
  }

  // For 'booked' and 'converted' status filters, filter in-memory
  // (since these require joins)
  let enrichedLeads = leads.map((lead) => {
    const leadScans = scansByLead.get(lead.id) ?? [];
    return {
      id: lead.id,
      email: lead.email,
      phone: lead.phone,
      fullName: lead.full_name,
      websiteUrl: lead.website_url,
      businessName: lead.business_name,
      source: lead.source,
      captureMethod: lead.capture_method,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      scanCount: leadScans.length,
      latestScanId: leadScans[0]?.id ?? null,
      hasBooked: bookingLeadIds.has(lead.id),
      hasPaid: paymentLeadIds.has(lead.id),
    };
  });

  if (status === 'booked') {
    enrichedLeads = enrichedLeads.filter((l) => l.hasBooked);
  } else if (status === 'converted') {
    enrichedLeads = enrichedLeads.filter((l) => l.hasPaid);
  }

  return {
    leads: enrichedLeads,
    total: count ?? 0,
    page,
    limit,
  };
}

/**
 * Fetches paginated payments with lead enrichment and revenue summary.
 */
export async function getAdminPayments(opts: {
  page: number;
  limit: number;
  status: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AdminPaymentsResponse> {
  const db = createServiceClient();
  const { page, limit, status, dateFrom, dateTo } = opts;
  const offset = (page - 1) * limit;

  let query = db
    .from('payments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: paymentsRaw, count } = await query;
  const payments = (paymentsRaw ?? []) as DbPayment[];

  // Revenue summary (across all matching statuses — always 'succeeded' only)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalResult, monthResult, weekResult] = await Promise.all([
    db.from('payments').select('amount_cents').eq('status', 'succeeded'),
    db.from('payments').select('amount_cents').eq('status', 'succeeded').gte('created_at', monthStart),
    db.from('payments').select('amount_cents').eq('status', 'succeeded').gte('created_at', weekStart),
  ]);

  const sumCents = (rows: Array<{ amount_cents: number }> | null) =>
    (rows ?? []).reduce((s, r) => s + r.amount_cents, 0);

  // Enrich with lead data
  const leadIds = [...new Set(payments.map((p) => p.lead_id).filter(Boolean))];
  const { data: leads } = leadIds.length > 0
    ? await db.from('leads').select('id, email, full_name').in('id', leadIds)
    : { data: [] as Array<{ id: string; email: string | null; full_name: string | null }> };

  const leadMap = new Map((leads ?? []).map((l) => [l.id, l]));

  return {
    payments: payments.map((p) => {
      const lead = leadMap.get(p.lead_id);
      return {
        id: p.id,
        createdAt: p.created_at,
        scanId: p.scan_id,
        leadEmail: lead?.email ?? null,
        leadName: lead?.full_name ?? null,
        amountCents: p.amount_cents,
        currency: p.currency,
        productType: p.product_type,
        status: p.status,
        stripePaymentIntentId: p.stripe_payment_intent_id,
      };
    }),
    total: count ?? 0,
    page,
    limit,
    summary: {
      totalRevenueCents: sumCents(totalResult.data),
      thisMonthCents: sumCents(monthResult.data),
      thisWeekCents: sumCents(weekResult.data),
    },
  };
}

/**
 * Fetches paginated scans with lead enrichment.
 */
export async function getAdminScans(opts: {
  page: number;
  limit: number;
  status: string;
  hasLead: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<AdminScansResponse> {
  const db = createServiceClient();
  const { page, limit, status, hasLead, dateFrom, dateTo, search } = opts;
  const offset = (page - 1) * limit;

  let query = db
    .from('scans')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }
  if (search) {
    query = query.ilike('website_url', `%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: scansRaw, count } = await query;
  const scans = (scansRaw ?? []) as DbScan[];

  if (scans.length === 0) {
    return { scans: [], total: count ?? 0, page, limit };
  }

  const leadIds = [...new Set(scans.map((s) => s.lead_id).filter(Boolean))];
  const { data: leads } = leadIds.length > 0
    ? await db.from('leads').select('id, email, full_name').in('id', leadIds)
    : { data: [] as Array<{ id: string; email: string | null; full_name: string | null }> };

  const leadMap = new Map((leads ?? []).map((l) => [l.id, l]));

  // Fetch stage completion counts
  const scanIds = scans.map((s) => s.id);
  const { data: stages } = await db
    .from('funnel_stages')
    .select('scan_id, status')
    .in('scan_id', scanIds)
    .eq('status', 'complete');

  const stageCountByScan = new Map<string, number>();
  for (const stage of stages ?? []) {
    const sid = stage.scan_id as string;
    stageCountByScan.set(sid, (stageCountByScan.get(sid) ?? 0) + 1);
  }

  let enrichedScans: AdminScanRow[] = scans.map((s) => {
    const lead = leadMap.get(s.lead_id);
    return {
      id: s.id,
      createdAt: s.created_at,
      websiteUrl: s.website_url,
      status: s.status,
      leadEmail: lead?.email ?? null,
      leadName: lead?.full_name ?? null,
      overallScore: null, // Computed from stage summaries — not stored on scan row
      stagesCompleted: stageCountByScan.get(s.id) ?? 0,
    };
  });

  // Filter by hasLead after enrichment (requires lead data)
  if (hasLead === 'yes') {
    enrichedScans = enrichedScans.filter((s) => s.leadEmail !== null);
  } else if (hasLead === 'no') {
    enrichedScans = enrichedScans.filter((s) => s.leadEmail === null);
  }

  // Secondary search by lead email (not possible with DB ilike on scans table)
  if (search && search.includes('@')) {
    enrichedScans = enrichedScans.filter(
      (s) => s.leadEmail?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  return { scans: enrichedScans, total: count ?? 0, page, limit };
}
