// src/lib/ai/objection-classifier.ts
import { analyzeWithHaiku, extractJSON } from './client';

export type ObjectionType =
  | 'time' | 'price' | 'fit' | 'authority'
  | 'avoidance' | 'stall' | 'none' | 'ready_to_book';

interface ClassificationResult {
  type: ObjectionType;
  confidence: number;
}

const CLASSIFIER_SYSTEM_PROMPT = `You are a sales conversation classifier. Analyze the prospect's latest message in context and classify it.

Categories:
- "time": Prospect wants to delay. Triggers: "think about it", "not the right time", "maybe later", "busy", "circle back"
- "price": Prospect concerned about cost. Triggers: "too expensive", "can't afford", "how much", "budget", "pricing"
- "fit": Prospect doubts relevance. Triggers: "not for me", "my business is different", "too small", "does this work for"
- "authority": Prospect defers to others. Triggers: "talk to spouse", "partner", "ask my team", "not the only decision maker"
- "avoidance": Prospect DISENGAGING — pulling away from the conversation entirely. Triggers: "get back to you", "send me info", "let me look into it", requesting to be contacted later, asking for written materials instead of continuing. Key signal: they want to END the current interaction.
- "stall": Prospect still ENGAGED but stuck in a loop. Signs: repeating the same concern after it was addressed, "yeah but...", agreeing then circling back, asking the same question differently. Key signal: they WANT to keep talking but can't move past a specific block.
- "ready_to_book": Prospect showing buying intent. Signs: asking about scheduling, next steps, availability, "how do I sign up"
- "none": Normal conversation, no objection or buying signal detected

Consider the FULL conversation context, not just the last message.

Respond with JSON only: {"type": "<category>", "confidence": <0.0-1.0>}`;

export async function classifyMessage(
  message: string,
  conversationContext: string[],
): Promise<ObjectionType> {
  try {
    const contextWindow = conversationContext.slice(-6).join('\n---\n');
    const result = await analyzeWithHaiku({
      systemPrompt: CLASSIFIER_SYSTEM_PROMPT,
      userPrompt: `Conversation context (last messages):\n${contextWindow}\n\n---\nLatest prospect message to classify:\n"${message}"`,
      maxTokens: 64,
    });
    const parsed = extractJSON<ClassificationResult>(result);
    if (!isValidObjectionType(parsed.type)) return 'none';
    if (parsed.confidence < 0.6) return 'none';
    return parsed.type;
  } catch (error) {
    console.error('[objection-classifier] Classification failed:', error);
    return 'none';
  }
}

function isValidObjectionType(type: string): type is ObjectionType {
  return ['time','price','fit','authority','avoidance','stall','none','ready_to_book'].includes(type);
}
