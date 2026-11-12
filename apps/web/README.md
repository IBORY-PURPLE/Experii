# Experii 웹 (`apps/web`)

초대 링크로 들어와 AI와 대화하며 공부하고, 화면 캡쳐를 보드에 붙이면 AI가 필기를 제안하는 웹 앱이다. 요구사항은 [앱 PRD 10장](../../docs/app/prd.md), 설계는 [웹 TSD](../../docs/web/tsd.md)를 따른다.

## 로컬 실행

```bash
cd apps/web
npm install
cp .env.example .env.local   # SUPABASE_PUBLISHABLE_KEY, INVITE_CODES를 채운다
npm run dev                  # http://localhost:3000/?invite=<INVITE_CODES의 코드>
```

- `CLAUDE_ADAPTER=mock`이면 AI는 예시 답과 예시 필기를 돌려준다(연습 모드). 실제 Claude는 `CLAUDE_ADAPTER=anthropic`과 `ANTHROPIC_API_KEY`가 둘 다 있을 때만 쓴다.
- DB 스키마는 `db/*.sql`이다. 적용 방법은 TSD의 DB 장을 본다(`supabase db push`를 쓰지 않는다).

## 검사

```bash
npm run typecheck
npm test                      # 단위 테스트, 네트워크 없이 돈다
npm run build
npx playwright test --project=local   # build 뒤에. 3100 포트로 next start를 띄운다
BASE_URL=https://<배포 주소> E2E_INVITE=<코드> npx playwright test --project=prod
```

E2E는 실제 Supabase에 새 방문자로 페이지를 만들고 끝나면 지운다.
