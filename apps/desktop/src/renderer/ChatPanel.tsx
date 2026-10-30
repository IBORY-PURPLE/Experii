import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import type { ConversationView } from '../shared/ipc';
import { ArrowUp, Stop } from './icons';
import { Markdown } from './Markdown';

// Banner actions are all secondary buttons, so a banner never adds a second filled button to the screen.
export type Banner = {
  tone: 'err' | 'info';
  title: string;
  body: string;
  actions: Array<{ label: string; run(): void }>;
};

type Props = {
  subjectTitle: string | null;
  conversation: ConversationView | null;
  streamingText: string | null;
  banner: Banner | null;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  headAction: ReactNode;
  // The open conversation's card is being made: the head gives 새 대화's room to the title until it lands.
  makingCard: boolean;
  onInput(text: string): void;
  onSend(): void;
  onStop(): void;
  onNewConversation(): void;
  onOpenUsage(): void;
};

export function ChatPanel(p: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [composing, setComposing] = useState(false);
  const streaming = p.streamingText !== null;
  const disabled = !p.conversation;

  // A banner shortens the list too, so its arrival also brings the latest message back into view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [
    p.conversation?.messages.length,
    p.streamingText,
    p.conversation?.id,
    p.banner,
  ]);

  // Korean IME: Enter that confirms a syllable must not send the message.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (composing || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    if (!streaming && p.input.trim()) p.onSend();
  };

  return (
    <section className="chat" aria-label="GPT 대화">
      <header className="chat-head">
        <div className="ttl">
          <h2 className="band-title" title={p.conversation?.title}>
            {p.conversation?.title ?? '과목을 먼저 만들어 주세요'}
          </h2>
          <p>{p.subjectTitle ? `${p.subjectTitle} · 대화` : '대화'}</p>
        </div>
        {(p.conversation || p.headAction) && (
          <div className="actions">
            {p.conversation && !p.makingCard && (
              <button
                className="btn small"
                onClick={p.onNewConversation}
                disabled={streaming}
              >
                새 대화
              </button>
            )}
            {p.headAction}
          </div>
        )}
      </header>
      <div className="messages" ref={scroller}>
        {p.conversation && (
          <div className="day">
            {p.conversation.saved ? '이어서 공부하는 중' : '새 대화'}
          </div>
        )}
        {p.conversation?.messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="msg-user">
              {m.text}
            </div>
          ) : (
            <div key={i} className="msg-ai">
              <div className="who">ChatGPT</div>
              <Markdown text={m.text} />
            </div>
          ),
        )}
        {streaming && (
          <div className="msg-ai" aria-live="polite">
            <div className="who">ChatGPT</div>
            {p.streamingText ? (
              <Markdown text={p.streamingText} caret />
            ) : (
              <span className="cursor" aria-hidden />
            )}
          </div>
        )}
      </div>
      {p.banner && (
        <div
          className={`banner ${p.banner.tone === 'err' ? 'err' : ''}`}
          role={p.banner.tone === 'err' ? 'alert' : 'status'}
        >
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
            placeholder={
              p.subjectTitle
                ? `${p.subjectTitle}에 대해 물어보세요`
                : '대화는 늘 과목 안에서 시작해요'
            }
            onChange={(e) => p.onInput(e.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
          />
          {streaming ? (
            <button
              className="icon-btn send"
              onClick={p.onStop}
              aria-label="멈추기"
            >
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
          <span>Using ChatGPT plan</span>
          <button className="link" onClick={p.onOpenUsage}>
            Manage usage
          </button>
        </div>
      </div>
    </section>
  );
}
