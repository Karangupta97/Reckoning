"use client";

import { useState } from "react";
import { Send, Smile } from "lucide-react";

interface CommentInputProps {
  onSubmit: (text: string) => void;
}

export function CommentInput({ onSubmit }: CommentInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-card)]"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[0.65rem] font-bold text-[var(--color-text-muted)] shrink-0">
        You
      </div>

      {/* Input */}
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you think?"
          rows={1}
          className="w-full pl-3 pr-16 py-2.5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none max-h-[4.5rem] overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            outline: "none",
            boxShadow: "none",
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
            <Smile size={18} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="p-1.5 rounded-full transition-all disabled:opacity-30"
            style={{ color: text.trim() ? "var(--color-amber)" : "var(--color-text-muted)" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
