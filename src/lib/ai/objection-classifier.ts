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
- "avoidance": Prospect has INTERNAL CONFLICT — they're hesitating, not ready to commit, need to process. Triggers: "I need to think about it", "let me sleep on it", "I'm not ready to commit", "I want to look into it more", "I'm just browsing", "not today". Key signal: they haven't decided yet and are avoiding the decision itself.
- "stall": Prospect is DEFLECTING — politely trying to end the conversation without saying no. Triggers: "send me an email", "send me a proposal", "let me check my calendar", "I'll call you back", "just send me the details", "let me compare options", "give me a few days". Key signal: they're requesting an off-ramp to exit the conversation gracefully.
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
