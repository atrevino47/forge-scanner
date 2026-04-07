'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isStreaming?: boolean;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput({ onSend, disabled, isStreaming }, ref) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue('');
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="border-t border-forge-border px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-forge-border bg-forge-surface px-3 py-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="max-h-24 flex-1 resize-none bg-transparent font-body text-sm text-forge-text placeholder:text-forge-text-muted/50 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forge-accent text-white transition-colors duration-200 hover:bg-forge-accent-hover disabled:opacity-30"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  },
);
