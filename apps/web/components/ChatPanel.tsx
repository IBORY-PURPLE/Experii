'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { Message } from '@/lib/types';
import { useCollect, type Pick, type Refusal } from './collect';
import { ArrowUp, Stop } from './icons';
import { Markdown } from './Markdown';
import { PaneToggle } from './Panes';

export type Banner = {
  tone: 'err' | 'info';
  title: string;
  body: string;
  actions: Array<{ label: string; run(): void }>;
};

type Props = {
  pageId: string | null;
  title: string | null;
  messages: Message[] | null;
  streamingText: string | null;
  banner: Banner | null;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  mock: boolean;
  onInput(text: string): void;
  onSend(): void;
  onStop(): void;
  onNewPage(): void;
  onFold(): void;
  onAddNote(pick: Pick): void;
  onNoteRefused(why: Refusal): void;
};

// An answer's question number is how many questions came before it.
const questionNumbers = (messages: Message[]) => {
  let asked = 0;
  return messages.map((m) => (m.role === 'user' ? ++asked : asked));
};

const WHO = 'Claude';

export function ChatPanel(p: Props) {
  const panel = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [composing, setComposing] = useState(false);
  const streaming = p.streamingText !== null;
  const disabled = p.messages === null;
  const asked = questionNumbers(p.messages ?? []);
  const collect = useCollect({
    panel,
    root: scroller,
    pageId: p.pageId,
    onAdd: p.onAddNote,
    onRefuse: p.onNoteRefused,
  });

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [p.messages?.length, p.streamingText, p.banner, p.title]);

  // Korean IME: Enter that confirms a syllable must not send the message.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (composing || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    if (!streaming && p.input.trim()) p.onSend();
  };

  return (
    <section className="chat" aria-label="AI 대화" ref={panel}>
      <header className="chat-head">
        <div className="ttl">
          <h2 className="band-title" title={p.title ?? undefined}>
            {p.title ?? '공부 페이지를 여는 중…'}
          </h2>
          <p>공부 · 대화</p>
        </div>
        <div className="actions">
          <button className="btn small" onClick={p.onNewPage} disabled={streaming}>
            새 공부
          </button>
          <PaneToggle panel="chat" onFold={p.onFold} />
        </div>
      </header>
      {p.mock && (
        <p className="mock-strip" role="note">
          <b>연습 모드</b> 지금은 AI 연결 전이라 답과 필기가 예시로 나와요.
        </p>
      )}
      <div
        className="messages"
        ref={scroller}
        onDragStart={collect.onDragStart}
        onDragEnd={collect.onDragEnd}
      >
        {p.messages && p.messages.length === 0 && !streaming && (
          <div className="chat-empty">
            <b>무엇을 공부하고 있나요?</b>
            <p>
              궁금한 걸 물어보세요. 답에서 남기고 싶은 부분은 캡쳐해서 왼쪽 보드에 붙이거나, 글을 골라
              보드로 끌어 놓으면 돼요.
            </p>
          </div>
        )}
        {p.messages?.map((m, i) =>
          m.role === 'user' ? (
            <div key={m.id} className="msg-user">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="msg-ai" data-seq={m.seq} data-q={asked[i]}>
              <div className="who">{WHO}</div>
              <Markdown text={m.content} />
            </div>
          ),
        )}
        {streaming && (
          <div className="msg-ai" aria-live="polite">
            <div className="who">{WHO}</div>
            {p.streamingText ? <Markdown text={p.streamingText} caret /> : <span className="cursor" aria-hidden />}
          </div>
        )}
      </div>
      {collect.button}
      {p.banner && (
        <div className={`banner ${p.banner.tone === 'err' ? 'err' : ''}`} role={p.banner.tone === 'err' ? 'alert' : 'status'}>
          <b>{p.banner.title}</b>
          <p>{p.banner.body}</p>
          {p.banner.actions.length > 0 && (
            <div className="actions">
              {p.banner.actions.map((a) => (
                <button key={a.label} className="btn small" onClick={a.run}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="composer">
        <div className="inputbox">
          <textarea
            ref={p.inputRef}
            aria-label="메시지"
            value={p.input}
            disabled={disabled}
            placeholder="공부하다 궁금한 걸 물어보세요"
            onChange={(e) => p.onInput(e.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
          />
          {streaming ? (
            <button className="icon-btn send" onClick={p.onStop} aria-label="멈추기">
              <Stop />
            </button>
          ) : (
            <button
              className="icon-btn send"
              onClick={p.onSend}
              disabled={disabled || !p.input.trim()}
              aria-label="보내기"
            >
              <ArrowUp />
            </button>
          )}
        </div>
        <div className="plan-row">
          <span className="plan">{p.mock ? 'Claude · 연습 모드' : 'Claude'}</span>
          <span className="plan">캡쳐는 Ctrl+V로 보드에</span>
        </div>
      </div>
    </section>
  );
}
