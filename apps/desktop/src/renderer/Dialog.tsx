import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

const FOCUSABLE = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'textarea:not(:disabled)',
  'select:not(:disabled)',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusables = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  );

export function Dialog(p: {
  title: string;
  description: ReactNode;
  children?: ReactNode;
  onClose(): void;
  actions: ReactNode;
}) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Read during the first render, before anything inside takes focus, so closing can hand focus back to the opener.
  const [opener] = useState(() => document.activeElement);
  const onClose = useRef(p.onClose);
  onClose.current = p.onClose;

  useEffect(() => {
    const el = panel.current;
    if (el && !el.contains(document.activeElement)) {
      const first =
        el.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(el)[0];
      (first ?? el).focus();
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !e.isComposing) onClose.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  const keepTabInside = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const items = focusables(e.currentTarget);
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) {
      e.preventDefault();
      return;
    }
    const active = document.activeElement;
    const leaving = e.shiftKey
      ? active === first || active === e.currentTarget
      : active === last;
    if (leaving) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  };

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        // Without this the press would blur the opener right after focus returns to it.
        e.preventDefault();
        p.onClose();
      }}
    >
      <div
        ref={panel}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={keepTabInside}
      >
        <h2 id={titleId} className="dialog-title">
          {p.title}
        </h2>
        <p id={descId} className="dialog-desc">
          {p.description}
        </p>
        {p.children}
        <div className="dialog-actions">{p.actions}</div>
      </div>
    </div>
  );
}

export function NewSubjectDialog(p: {
  onCreate(title: string): Promise<string | null>;
  onClose(): void;
}) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(await p.onCreate(title.trim()));
    setBusy(false);
  };
  return (
    <Dialog
      title="새 과목"
      description="대화와 경험 카드는 과목별로 쌓여요."
      onClose={p.onClose}
      actions={
        <>
          <button className="btn" onClick={p.onClose}>
            취소
          </button>
          <button
            className="btn primary"
            onClick={submit}
            disabled={!title.trim() || busy}
          >
            만들기
          </button>
        </>
      }
    >
      <div className="dialog-field">
        <label className="dialog-label" htmlFor={inputId}>
          과목 이름
        </label>
        <input
          id={inputId}
          className="input"
          data-autofocus
          placeholder="예: SQLD, 운영체제"
          maxLength={40}
          value={title}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit();
          }}
        />
      </div>
      {error && (
        <p id={errorId} className="err-text" role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}

export function RegenerateDialog(p: { onConfirm(): void; onClose(): void }) {
  return (
    <Dialog
      title="카드를 다시 만들까요?"
      // The no-break space keeps 이 with 대화가 so the first line never ends on it.
      description="지금 카드를 새로 만든 카드로 덮어써요. 매긴 평가는 지워지고, 이&nbsp;대화가 과목의 최신 대화면 잠긴 추천 칸도 새로 바뀌어요."
      onClose={p.onClose}
      actions={
        <>
          <button className="btn" onClick={p.onClose} data-autofocus>
            취소
          </button>
          <button className="btn primary" onClick={p.onConfirm}>
            다시 만들기
          </button>
        </>
      }
    />
  );
}
