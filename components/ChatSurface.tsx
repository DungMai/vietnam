'use client';

import { useCallback, useRef, useState } from 'react';
import type { CitationPayload, Locale } from '@/types/domain';
import { ChatBubble } from './ChatBubble';
import { CitationPill } from './CitationPill';
import { CitationModal } from './CitationModal';

type Msg = { id: string; role: 'user' | 'agent'; text: string };

interface Props {
  provinceSlug: string;
  personaName: string;
  accentColor: string;
  locale: Locale;
}

export const ChatSurface = ({ provinceSlug, personaName, accentColor, locale }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [citations, setCitations] = useState<Record<string, CitationPayload>>({});
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);
  const [openCitation, setOpenCitation] = useState<CitationPayload | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  const submit = useCallback(async () => {
    if (!draft.trim() || streaming) return;
    setError(null);

    const userMsgId = crypto.randomUUID();
    const agentMsgId = crypto.randomUUID();
    streamingMsgIdRef.current = agentMsgId;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: draft.trim() },
      { id: agentMsgId, role: 'agent', text: '' },
    ]);
    const message = draft.trim();
    setDraft('');
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinceSlug, message, locale }),
      });
      if (res.status === 429) {
        setGated(true);
        setStreaming(false);
        return;
      }
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;

        // Parse SSE events (event: X\ndata: Y\n\n)
        let idx;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const event = chunk.match(/^event: (.+)$/m)?.[1];
          const data = chunk.match(/^data: (.+)$/m)?.[1];
          if (!event || !data) continue;
          handleEvent(event, JSON.parse(data));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreaming(false);
      streamingMsgIdRef.current = null;
    }
  }, [draft, streaming, provinceSlug, locale]);

  const handleEvent = (event: string, data: unknown) => {
    if (event === 'token') {
      const { delta } = data as { delta: string };
      const targetId = streamingMsgIdRef.current;
      if (!targetId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === targetId ? { ...m, text: m.text + delta } : m)),
      );
    } else if (event === 'citation') {
      const c = data as CitationPayload;
      setCitations((prev) => ({ ...prev, [c.factId]: c }));
    } else if (event === 'error') {
      setError((data as { message: string }).message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="rounded-md border border-ink-secondary/10 bg-surface-raised p-4 text-body-sm text-ink-secondary">
            {locale === 'vi'
              ? `Hỏi ${personaName} bất cứ điều gì — giá taxi, quán bún sáng, chiêu lừa cần tránh.`
              : `Ask ${personaName} anything — taxi prices, breakfast spots, scams to avoid.`}
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} accentColor={m.role === 'agent' ? accentColor : undefined}>
            <RenderWithCitations text={m.text} citations={citations} locale={locale} onCite={setOpenCitation} />
          </ChatBubble>
        ))}
        {error && (
          <ChatBubble role="system">
            <span className="text-feedback-error">{error}</span>
          </ChatBubble>
        )}
        {gated && (
          <ChatBubble role="system">
            <a href="?gate=email" className="underline">
              {locale === 'vi'
                ? 'Bạn đã đạt giới hạn miễn phí. Nhập email để tiếp tục.'
                : 'You\'ve hit the free limit. Enter your email to continue.'}
            </a>
          </ChatBubble>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="sticky bottom-0 flex gap-2 border-t border-ink-secondary/10 bg-surface-base pt-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            locale === 'vi' ? `Hỏi ${personaName}...` : `Ask ${personaName}...`
          }
          className="flex-1 rounded-md border border-ink-secondary/15 bg-surface-raised px-4 py-3 text-body-sm focus:border-ink-primary focus:outline-none"
          disabled={streaming || gated}
        />
        <button
          type="submit"
          disabled={!draft.trim() || streaming || gated}
          className="rounded-md bg-ink-primary px-5 py-3 text-body-sm text-surface-base transition disabled:opacity-40"
        >
          {locale === 'vi' ? 'Gửi' : 'Send'}
        </button>
      </form>

      {openCitation && (
        <CitationModal citation={openCitation} locale={locale} onClose={() => setOpenCitation(null)} />
      )}
    </div>
  );
};

// Render agent text with [^factId] markers replaced by inline citation pills.
const CITATION_RE = /\[\^([a-zA-Z0-9-]+)\]/g;

const RenderWithCitations = ({
  text,
  citations,
  locale,
  onCite,
}: {
  text: string;
  citations: Record<string, CitationPayload>;
  locale: Locale;
  onCite: (c: CitationPayload) => void;
}) => {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  CITATION_RE.lastIndex = 0;
  while ((m = CITATION_RE.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(<span key={`t${lastIdx}`}>{text.slice(lastIdx, m.index)}</span>);
    const factId = m[1];
    const c = citations[factId];
    if (c) {
      parts.push(
        <span key={`c${m.index}`} onClick={() => onCite(c)} className="cursor-pointer">
          <CitationPill citation={c} locale={locale} />
        </span>,
      );
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(<span key={`t${lastIdx}`}>{text.slice(lastIdx)}</span>);
  return <span className="whitespace-pre-wrap">{parts}</span>;
};
