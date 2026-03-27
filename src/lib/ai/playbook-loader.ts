// src/lib/ai/playbook-loader.ts
// Reads Hormozi knowledge files from vault. Uses in-process caching —
// files are read once on first access, then served from memory.
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { ObjectionType } from './objection-classifier';

const SECTION_HEADERS: Record<string, string> = {
  time: '## TIME', price: '## PRICE', fit: '## FIT',
  authority: '## AUTHORITY', avoidance: '## AVOIDANCE', stall: '## STALL',
};

let cachedPlaybook: string | null = null;
let cachedPrinciples: string | null = null;

async function getPlaybookContent(): Promise<string> {
  if (cachedPlaybook) return cachedPlaybook;
  const knowledgePath = process.env.SALES_KNOWLEDGE_PATH;
  if (!knowledgePath) { console.warn('[playbook-loader] SALES_KNOWLEDGE_PATH not set'); return ''; }
  try {
    const playbookPath = resolve(process.cwd(), knowledgePath, 'objection-playbook.md');
    cachedPlaybook = await readFile(playbookPath, 'utf-8');
    return cachedPlaybook;
  } catch (error) {
    console.error('[playbook-loader] Failed to read playbook:', error);
    return '';
  }
}

export async function loadPlaybookSection(objectionType: ObjectionType): Promise<string | null> {
  if (objectionType === 'none' || objectionType === 'ready_to_book') return null;
  const header = SECTION_HEADERS[objectionType];
  if (!header) return null;
  const content = await getPlaybookContent();
  if (!content) return null;
  const sectionStart = content.indexOf(header);
  if (sectionStart === -1) return null;
  const afterHeader = content.indexOf('\n', sectionStart);
  const nextSection = content.indexOf('\n## ', afterHeader);
  const section = nextSection === -1
    ? content.substring(sectionStart)
    : content.substring(sectionStart, nextSection);
  return section.trim();
}

export async function loadCorePrinciples(): Promise<string> {
  if (cachedPrinciples) return cachedPrinciples;
  const knowledgePath = process.env.SALES_KNOWLEDGE_PATH;
  if (!knowledgePath) { console.warn('[playbook-loader] SALES_KNOWLEDGE_PATH not set'); return ''; }
  try {
    const principlesPath = resolve(process.cwd(), knowledgePath, 'core-principles.md');
    cachedPrinciples = await readFile(principlesPath, 'utf-8');
    return cachedPrinciples;
  } catch (error) {
    console.error('[playbook-loader] Failed to read core principles:', error);
    return '';
  }
}

export function clearCache(): void {
  cachedPlaybook = null;
  cachedPrinciples = null;
}
