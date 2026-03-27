// src/lib/vault/event-writer.ts
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export type VaultEventType =
  | 'conversation_started' | 'message_exchanged' | 'message_complete'
  | 'lead_captured' | 'lead_exited' | 'booking_confirmed';

export interface VaultEventData {
  type: VaultEventType;
  scanId: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  businessName?: string | null;
  websiteUrl?: string | null;
  weakestStage?: string | null;
  weakestScore?: number | null;
  overallHealth?: number | null;
  chatChannel?: string;
  details?: Record<string, unknown>;
}

const VAULT_EVENTS_DIR = resolve(
  process.cwd(),
  '../../agents/sales-orchestrator/events/forge-scanner'
);

export function writeVaultEvent(data: VaultEventData): void {
  try {
    mkdirSync(VAULT_EVENTS_DIR, { recursive: true });
    const timestamp = new Date().toISOString();
    const safeTimestamp = timestamp.replace(/[:.]/g, '-');
    const filename = `${safeTimestamp}-${data.type}.md`;
    const filepath = resolve(VAULT_EVENTS_DIR, filename);
    const content = `# EVENT: ${data.type}
**Timestamp:** ${timestamp}
**Project:** forge-scanner
**Scan ID:** ${data.scanId}
**Lead:** ${data.leadEmail ?? 'unknown'} | ${data.leadPhone ?? 'unknown'}
**Business:** ${data.businessName ?? 'unknown'} (${data.websiteUrl ?? 'unknown'})
**Weakest Stage:** ${data.weakestStage ?? 'unknown'} (score: ${data.weakestScore ?? 'N/A'})
**Overall Health:** ${data.overallHealth ?? 'N/A'}/100
**Chat Channel:** ${data.chatChannel ?? 'web'}
**Details:** ${data.details ? JSON.stringify(data.details, null, 2) : 'none'}
`;
    writeFileSync(filepath, content, 'utf-8');
    console.log(`[vault-event] Wrote ${data.type} → ${filename}`);
  } catch (error) {
    console.error(`[vault-event] Failed to write ${data.type}:`, error);
  }
}
