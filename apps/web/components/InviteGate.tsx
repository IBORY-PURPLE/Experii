import { LogoMark, Wordmark } from './Logo';

export function InviteGate({ wrongCode }: { wrongCode: boolean }) {
  return (
    <main className="gate">
      <div className="gate-card">
        <div className="gate-brand">
          <LogoMark size={40} ink />
          <Wordmark />
        </div>
        <h1 className="gate-title">초대 링크가 필요해요</h1>
        <p className="gate-desc">
          Experii 웹은 지금 초대한 분들과 먼저 써 보고 있어요. 받은 초대 링크로 다시 들어와 주세요.
        </p>
        {wrongCode && (
          <p className="err-text" role="alert">
            초대 코드가 맞지 않거나 끝났어요. 링크를 다시 확인해 주세요.
          </p>
        )}
        <p className="gate-note">
          AI와 대화하며 공부하다 화면을 캡쳐해 붙이면, AI가 필기를 만들어 주는 공부 보드예요.
        </p>
      </div>
    </main>
  );
}
