// src/lib/db/admin-queries.ts
// Admin-specific database queries using service role client (bypasses RLS)

import { createServiceClient } from './client';
import type { AdminDashboardResponse, AdminLeadsResponse } from '../../../contracts/api';
import type { DbLead } from './types';

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
