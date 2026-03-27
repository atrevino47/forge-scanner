// src/lib/vault/queue-writer.ts
// Writes follow-up queue entries for the Sales Orchestrator.
// Uses async I/O to avoid blocking the event loop in route handlers.
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

export interface QueueEntryData {
  scanId: string;
  leadEmail: string;
  leadPhone?: string | null;
  businessName: string;
  trigger: 'conversation_abandoned' | 'bounced' | 'no_chat';
  sequencePosition: 1 | 2 | 3;
  channel: 'email' | 'sms';
  scheduledFor: string;
  weakestStage: string;
  weakestScore: number;
  criticalFindings: string[];
  topInsight: string;
}

const QUEUE_DIR = resolve(process.cwd(), 'sales/queues/pending');

export function writeQueueEntry(data: QueueEntryData): void {
  // Fire-and-forget async write — never blocks the caller
  void writeQueueEntryAsync(data);
}

async function writeQueueEntryAsync(data: QueueEntryData): Promise<void> {
  try {
    await mkdir(QUEUE_DIR, { recursive: true });
    const filename = `${data.scanId}-pos${data.sequencePosition}.md`;
    const filepath = resolve(QUEUE_DIR, filename);
    const content = `# FOLLOW-UP: ${data.scanId}-pos${data.sequencePosition}
**Lead:** ${data.leadEmail}
**Phone:** ${data.leadPhone ?? 'unknown'}
**Business:** ${data.businessName}
**Trigger:** ${data.trigger}
**Sequence Position:** ${data.sequencePosition} of 3
**Channel:** ${data.channel}
**Scheduled For:** ${data.scheduledFor}
**Status:** pending

## Scan Context
- Weakest stage: ${data.weakestStage} (${data.weakestScore}/100)
- Critical findings: ${data.criticalFindings.join('; ')}
- Top insight: "${data.topInsight}"

## Generated Content
[To be filled by Sales Orchestrator]

## Send Result
[To be filled when sent]
`;
    await writeFile(filepath, content, 'utf-8');
    console.log(`[vault-queue] Wrote follow-up entry → ${filename}`);
  } catch (error) {
    console.error(`[vault-queue] Failed to write queue entry:`, error);
  }
}
