const SIGN_IN_ERRORS: Record<string, string> = {
  timeout: '5분 안에 로그인을 마치지 않아 멈췄어요. 다시 시도해 주세요.',
  denied: '로그인이 취소됐어요. 다시 시도해 주세요.',
  state_mismatch: '로그인 응답이 맞지 않아 멈췄어요. 다시 시도해 주세요.',
  exchange_failed: '로그인을 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  internal: '로그인 중 문제가 생겼어요. 다시 시도해 주세요.',
};

type Props = {
  mode: 'sign_in' | 'plan_required';
  waiting: boolean;
  error: string | null;
  account?: string | null;
  onSignIn(): void;
  onCancel(): void;
};

export function Gate(p: Props) {
  return (
    <main className="gate">
      <div className="gate-card">
        <div className="brand">Experii</div>
        {p.mode === 'sign_in' ? (
          <h1>공부한 과정이 면접 경험으로 쌓여요</h1>
        ) : (
          <>
            <h1>ChatGPT Plus·Pro 계정이 필요해요</h1>
            <p className="fine" style={{ margin: '-8px 0 20px' }}>
              {p.account ? `${p.account} 계정은 ` : '로그인한 계정은 '}
              Plus·Pro 플랜이 아니라서 Experii에서 쓸 수 없어요.
            </p>
          </>
        )}
        {p.waiting ? (
          <>
            <button className="btn" disabled>
              브라우저에서 로그인을 마쳐 주세요…
            </button>
            <p className="fine">
              <button className="link" onClick={p.onCancel}>
                취소
              </button>
            </p>
          </>
        ) : (
          <button className="btn primary" onClick={p.onSignIn}>
            {p.mode === 'sign_in'
              ? 'Continue with ChatGPT'
              : '다른 계정으로 Continue with ChatGPT'}
          </button>
        )}
        {p.error && (
          <p className="err-text" role="alert">
            {SIGN_IN_ERRORS[p.error] ?? SIGN_IN_ERRORS.internal}
          </p>
        )}
        <p className="fine">ChatGPT Plus·Pro 계정으로 로그인해요</p>
        <p className="note">
          대화와 카드는 이 PC에만 저장돼요. 답을 받으려고 대화 내용은 OpenAI로
          보내요.
        </p>
      </div>
    </main>
  );
}
