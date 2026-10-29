import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Dialog(p: {
  title: string;
  children?: ReactNode;
  onClose(): void;
  actions: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') p.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p.onClose]);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && p.onClose()}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={p.title}
      >
        <h2>{p.title}</h2>
        {p.children}
        <div className="row">{p.actions}</div>
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
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(await p.onCreate(title.trim()));
    setBusy(false);
  };
  return (
    <Dialog
      title="새 과목"
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
      <p>대화와 경험 카드는 과목별로 쌓여요.</p>
      <input
        ref={input}
        aria-label="과목 이름"
        placeholder="예: SQLD, 운영체제"
        maxLength={40}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) void submit();
        }}
      />
      {error && <p className="err-text">{error}</p>}
    </Dialog>
  );
}
