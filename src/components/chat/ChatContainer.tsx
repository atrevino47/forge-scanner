'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { ChatSSEEvent } from '../../../contracts/events';
import type { StartChatResponse, SendMessageResponse } from '../../../contracts/api';
import { ChatMessage } from './ChatMessage';
import { ChatInput, type ChatInputHandle } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    type?: string;
    screenshotId?: string;
    calcomUrl?: string;
  };
}

interface ChatContainerProps {
  scanId: string;
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

export function ChatContainer({
  scanId,
  leadId,
  isOpen,
  onClose,
  onNewMessage,
}: ChatContainerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const sseRef = useRef<EventSource | null>(null);

  // ── Smooth auto-scroll to bottom ──
  useEffect(() => {
    if (scrollRef.current) {
      gsap.to(scrollRef.current, {
        scrollTop: scrollRef.current.scrollHeight,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [messages, streamingContent]);

  // ── Slide-in animation ──
  useGSAP(
    () => {
      if (!isOpen || !panelRef.current) return;
      const isMobile = window.innerWidth < 640;

      gsap.fromTo(
        panelRef.current,
        isMobile
          ? { y: '100%', opacity: 0 }
          : { x: '100%', opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power3.out',
        },
      );
    },
    { dependencies: [isOpen] },
  );

  // ── Auto-focus input when panel opens ──
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Delay to let panel slide-in animation complete
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Initialize conversation on first open ──
  useEffect(() => {
    if (!isOpen || conversationId || isInitializing) return;

    setIsInitializing(true);

    fetch(`/api/chat/start/${scanId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanId, leadId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to start chat');
        return res.json() as Promise<StartChatResponse>;
      })
      .then((data) => {
        setConversationId(data.conversationId);
        setMessages([
          {
            id: 'initial',
            role: 'assistant',
            content: data.initialMessage,
          },
        ]);
      })
      .catch(() => {
        setMessages([
          {
            id: 'error',
            role: 'assistant',
            content:
              'Something went wrong starting the chat. Please refresh the page and try again.',
          },
        ]);
      })
      .finally(() => setIsInitializing(false));
  }, [isOpen, conversationId, isInitializing, scanId, leadId]);

  // ── Handle incoming SSE events ──
  const handleSSEEvent = useCallback((event: ChatSSEEvent) => {
    switch (event.type) {
      case 'typing_start':
        setIsStreaming(true);
        setStreamingContent('');
        break;

      case 'token':
        setStreamingContent((prev) => prev + event.content);
        break;

      case 'typing_end':
        break;

      case 'message_complete':
        setMessages((prev) => [
          ...prev,
          {
            id: event.messageId,
            role: 'assistant',
            content: event.content,
            metadata: event.metadata as DisplayMessage['metadata'],
          },
        ]);
        setStreamingContent('');
        setIsStreaming(false);
        // Notify parent for new-message badge when panel is closed
        if (!isOpen && onNewMessage) onNewMessage();
        break;

      case 'data_card':
        setMessages((prev) => [
          ...prev,
          {
            id: `dc-${Date.now()}`,
            role: 'assistant',
            content: '',
            metadata: {
              type: 'data_card',
              screenshotId: event.screenshotId,
            },
          },
        ]);
        break;

      case 'calcom_embed':
        setMessages((prev) => [
          ...prev,
          {
            id: `cal-${Date.now()}`,
            role: 'assistant',
            content: '',
            metadata: {
              type: 'calcom_embed',
              calcomUrl: event.url,
            },
          },
        ]);
        break;

      case 'error':
        setIsStreaming(false);
        setStreamingContent('');
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: event.message,
          },
        ]);
        break;
    }
  }, [isOpen, onNewMessage]);

  // ── Send message ──
  const handleSend = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      // Add user message immediately
      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content },
      ]);

      try {
        const res = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            content,
            channel: 'web',
          }),
        });

        if (!res.ok) throw new Error('Send failed');

        const data = (await res.json()) as SendMessageResponse;

        // Close previous SSE connection if any
        if (sseRef.current) sseRef.current.close();

        // Connect to SSE for the response
        const es = new EventSource(data.streamUrl);
        sseRef.current = es;

        es.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data as string) as ChatSSEEvent;
            handleSSEEvent(event);

            // Close connection when response is complete
            if (
              event.type === 'message_complete' ||
              event.type === 'error'
            ) {
              es.close();
              sseRef.current = null;
            }
          } catch {
            /* ignore parse errors */
          }
        };

        es.onerror = () => {
          setIsStreaming(false);
          es.close();
          sseRef.current = null;
        };
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Failed to send your message. Please try again.',
          },
        ]);
      }
    },
    [conversationId, handleSSEEvent],
  );

  // ── Cleanup SSE on unmount ──
  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-40 flex flex-col overflow-hidden border-forge-border bg-forge-base/95 backdrop-blur-xl
        inset-x-0 bottom-0 h-[75vh] rounded-t-xl border-t border-x
        sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-auto sm:w-[400px] sm:rounded-none sm:rounded-l-xl sm:border-t-0 sm:border-r-0 sm:border-l"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-forge-border px-4 py-3">
        <div>
          <p className="font-display text-sm tracking-display text-forge-text">
            Forge Advisor
          </p>
          <p className="text-[10px] text-forge-text-muted">
            {isStreaming ? 'Typing...' : 'Online'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-forge-text-muted transition-colors duration-200 hover:text-forge-text"
        >
          <span className="text-xs font-medium">Close</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {isInitializing && (
          <div className="flex justify-center py-8">
            <p className="text-sm text-forge-text-muted">
              Starting conversation...
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            metadata={msg.metadata}
          />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <ChatMessage
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}

        {/* Typing indicator (before any streaming content) */}
        {isStreaming && !streamingContent && <TypingIndicator />}
      </div>

      {/* Input */}
      <ChatInput
        ref={inputRef}
        onSend={handleSend}
        disabled={isStreaming || !conversationId}
        isStreaming={isStreaming}
      />
    </div>
  );
}
