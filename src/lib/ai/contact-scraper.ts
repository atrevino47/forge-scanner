// /src/lib/ai/contact-scraper.ts
// Extract contact information from website HTML and GBP data using Haiku

import { analyzeWithHaiku, extractJSON } from './client';
import { getContactScrapePrompt, getGBPContactPrompt } from '../prompts/contact-scrape';

// ============================================================
// Contact scrape result types
// ============================================================

export interface ScrapedEmail {
  address: string;
  source: 'mailto_link' | 'page_text' | 'schema' | 'meta' | 'obfuscated';
  context: string;
  isPrimary: boolean;
}

export interface ScrapedPhone {
  number: string;
  source: 'tel_link' | 'page_text' | 'schema' | 'whatsapp';
  context: string;
  isPrimary: boolean;
}

export interface ScrapedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  full: string | null;
}

export interface ScrapedSocials {
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  tiktok: string | null;
  twitter: string | null;
  youtube: string | null;
}

export interface ContactScrapeResult {
  emails: ScrapedEmail[];
  phones: ScrapedPhone[];
  address: ScrapedAddress | null;
  socials: ScrapedSocials;
  businessName: string | null;
  businessType: string | null;
}

export interface GBPContactResult {
  businessName: string | null;
  phone: string | null;
  website: string | null;
  address: ScrapedAddress | null;
  hours: Record<string, string | null> | null;
  category: string | null;
  rating: number | null;
  reviewCount: number | null;
  serviceArea: string | null;
}

// ============================================================
// Scrape contacts from website HTML
// ============================================================

export async function scrapeContactsFromHtml(
  html: string,
): Promise<ContactScrapeResult> {
  // Truncate to stay within Haiku token limits — contact info is usually in
  // the head (schema, meta) and footer, so include both ends
  const head = html.slice(0, 10000);
  const tail = html.slice(-8000);
  const truncatedHtml = html.length > 18000 ? `${head}\n\n<!-- ... middle truncated ... -->\n\n${tail}` : html;

  const systemPrompt = getContactScrapePrompt();

  const result = await analyzeWithHaiku({
    systemPrompt,
    userPrompt: `Extract all contact information from this website HTML:\n\n${truncatedHtml}`,
    maxTokens: 2048,
  });

  try {
    const parsed = extractJSON<ContactScrapeResult>(result);
    return validateContactResult(parsed);
  } catch (error) {
    console.error('[contact-scraper] Failed to parse contact scrape result:', error);
    return getEmptyContactResult();
  }
}

// ============================================================
// Parse GBP data for business contact info
// ============================================================

export async function scrapeContactsFromGBP(
  gbpData: string,
): Promise<GBPContactResult> {
  const systemPrompt = getGBPContactPrompt();

  const result = await analyzeWithHaiku({
    systemPrompt,
    userPrompt: `Extract structured contact information from this Google Business Profile data:\n\n${gbpData.slice(0, 12000)}`,
    maxTokens: 1024,
  });

  try {
    const parsed = extractJSON<GBPContactResult>(result);
    return validateGBPResult(parsed);
  } catch (error) {
    console.error('[contact-scraper] Failed to parse GBP result:', error);
    return getEmptyGBPResult();
  }
}

// ============================================================
// Merge contacts from multiple sources
// ============================================================

export function mergeContactResults(
  htmlResult: ContactScrapeResult,
  gbpResult?: GBPContactResult,
): { email: string | null; phone: string | null; source: 'website' | 'gbp' } {
  // Prefer primary email from HTML
  const primaryEmail = htmlResult.emails.find((e) => e.isPrimary);
  const fallbackEmail = htmlResult.emails[0];
  const email = primaryEmail?.address ?? fallbackEmail?.address ?? null;

  // Prefer primary phone from HTML, then GBP
  const primaryPhone = htmlResult.phones.find((p) => p.isPrimary);
  const fallbackPhone = htmlResult.phones[0];
  const htmlPhone = primaryPhone?.number ?? fallbackPhone?.number ?? null;
  const gbpPhone = gbpResult?.phone ?? null;

  if (email || htmlPhone) {
    return { email, phone: htmlPhone, source: 'website' };
  }

  if (gbpPhone) {
    return { email: null, phone: gbpPhone, source: 'gbp' };
  }

  return { email: null, phone: null, source: 'website' };
}

// ============================================================
// Validation helpers
// ============================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /[\d+\-() ]{7,}/;

function validateContactResult(raw: ContactScrapeResult): ContactScrapeResult {
  return {
    emails: (raw.emails ?? [])
      .filter((e) => e.address && EMAIL_PATTERN.test(e.address))
      .map((e) => ({
        address: e.address.trim().toLowerCase(),
        source: e.source || 'page_text',
        context: (e.context || '').slice(0, 200),
        isPrimary: e.isPrimary ?? false,
      })),
    phones: (raw.phones ?? [])
      .filter((p) => p.number && PHONE_PATTERN.test(p.number))
      .map((p) => ({
        number: p.number.trim(),
        source: p.source || 'page_text',
        context: (p.context || '').slice(0, 200),
        isPrimary: p.isPrimary ?? false,
      })),
    address: raw.address ? validateAddress(raw.address) : null,
    socials: validateSocials(raw.socials),
    businessName: raw.businessName?.slice(0, 200) ?? null,
    businessType: raw.businessType?.slice(0, 100) ?? null,
  };
}

function validateGBPResult(raw: GBPContactResult): GBPContactResult {
  return {
    businessName: raw.businessName?.slice(0, 200) ?? null,
    phone: raw.phone && PHONE_PATTERN.test(raw.phone) ? raw.phone.trim() : null,
    website: raw.website?.slice(0, 500) ?? null,
    address: raw.address ? validateAddress(raw.address) : null,
    hours: raw.hours ?? null,
    category: raw.category?.slice(0, 100) ?? null,
    rating: typeof raw.rating === 'number' ? Math.max(0, Math.min(5, raw.rating)) : null,
    reviewCount: typeof raw.reviewCount === 'number' ? Math.max(0, raw.reviewCount) : null,
    serviceArea: raw.serviceArea?.slice(0, 200) ?? null,
  };
}

function validateAddress(addr: ScrapedAddress): ScrapedAddress {
  return {
    street: addr.street?.slice(0, 200) ?? null,
    city: addr.city?.slice(0, 100) ?? null,
    state: addr.state?.slice(0, 100) ?? null,
    zip: addr.zip?.slice(0, 20) ?? null,
    country: addr.country?.slice(0, 100) ?? null,
    full: addr.full?.slice(0, 500) ?? null,
  };
}

function validateSocials(raw: ScrapedSocials | undefined): ScrapedSocials {
  const empty: ScrapedSocials = {
    instagram: null,
    facebook: null,
    linkedin: null,
    tiktok: null,
    twitter: null,
    youtube: null,
  };

  if (!raw) return empty;

  return {
    instagram: raw.instagram?.slice(0, 200) ?? null,
    facebook: raw.facebook?.slice(0, 200) ?? null,
    linkedin: raw.linkedin?.slice(0, 200) ?? null,
    tiktok: raw.tiktok?.slice(0, 200) ?? null,
    twitter: raw.twitter?.slice(0, 200) ?? null,
    youtube: raw.youtube?.slice(0, 200) ?? null,
  };
}

function getEmptyContactResult(): ContactScrapeResult {
  return {
    emails: [],
    phones: [],
    address: null,
    socials: {
      instagram: null,
      facebook: null,
      linkedin: null,
      tiktok: null,
      twitter: null,
      youtube: null,
    },
    businessName: null,
    businessType: null,
  };
}

function getEmptyGBPResult(): GBPContactResult {
  return {
    businessName: null,
    phone: null,
    website: null,
    address: null,
    hours: null,
    category: null,
    rating: null,
    reviewCount: null,
    serviceArea: null,
  };
}
