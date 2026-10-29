# Experii 데스크톱 앱 TSD: 설계와 단계별 계획

2026-10-29 창업자가 승인한 계획을 그대로 옮겼다. 요구사항은 [prd.md](prd.md)가 기준이고, 이 문서는 어떻게 만들지를 다룬다. 단계 1(M0)에서 확인한 사실은 맨 아래 "M0 확인된 사실" 표에 채운다. 본문의 `Pre_MVP/`, `PRD_MVP_V1.md`, `TSD_MVP_V1.md`는 이제 `docs/archive/` 아래에 있다.

기준: `main@e4f14b9`, 2026-10-29. 근거 자료는 다음과 같다.
- 읽기 전용 조사 워크플로 2회: 문서 4종 리더, 비평가, 3관점 설계, 통합, 반박 검토 2건
- 다른 세션('로렌 탄의 3층 구조 계획')이 넘겨준 이 PC 환경 사실

## Context

창업자는 Pre-MVP(Claude Code 파이썬 스킬로 만드는 경험 카드)와 MVP V1(웹 + MCP + Supabase)을 접고, 둘을 Windows 데스크톱 앱 하나로 합치려 한다. 앱의 핵심 루프는 다음과 같다.

- 오른쪽 GPT 패널에서 공부한다.
- 대화가 끝나면 버튼 한 번으로 경험 카드를 남긴다.
- 왼쪽 사이드바에 과목별로 경험이 쌓인다.
- 가운데에는 듀오링고식 로드맵이 있다. 지난 학습 칸과 잠긴 추천 칸 1~2개가 보이고, 각 칸에 무엇을 배웠는지 표시된다.
- 칸이나 카드를 누르면 그때의 GPT 대화를 다시 불러와 이어서 공부할 수 있다.

언어는 TypeScript 하나로 통일한다. 창업자는 TS를 조금 알고 Rust는 써 본 적이 없다.

같은 기회에 저장소도 정리한다.
- `apps/` 아래에 데스크톱 앱과 랜딩을 둔다.
- 문서는 `docs/`로 모은다.
- 하네스(게이트, CI, 규칙, 스킬)가 새 경로를 따라가게 고친다.

### 창업자 결정 (확정)

| 항목 | 결정 |
|---|---|
| 스택 | Electron + React + TypeScript, Windows 우선, 창업자 PC에서 먼저 도그푸딩 |
| 저장 | 사용자 PC에만 둔다(SQLite). v1에는 서버, 동기화, 계정이 없다 |
| GPT 연결 | **Phase A** 로컬 도그푸딩: "Sign in with ChatGPT" 셀프 등록. 상업 파트너 관심 신청서는 지금 제출한다. **Phase B** 상업 출시 초기: 창업자 API 키를 쥔 릴레이 서버로 비용을 창업자가 낸다. v1에서는 만들지 않는다. **Phase C** 승인 뒤: 사용자가 ChatGPT로 로그인한다 |
| 로드맵 칸 | 지난 학습(1칸 = 대화 1개 = 카드 1장)과 GPT가 제안한 잠긴 추천 칸 1~2개 |
| 카드 생성 | 대화 끝에 "경험으로 남기기" 버튼을 한 번 누른다 |
| v1 범위 | 채팅, 카드, 로드맵, 이어 하기만 넣는다. 현장 과제, 면접 답변, 리마인더, 모바일, 동기화, 릴레이는 넣지 않는다 |
| 기존 문서 | Pre-MVP와 MVP V1 문서는 `docs/archive/`로 보관한다. 데스크톱 PRD와 TSD를 새로 쓴다. 파이썬 스킬은 접는다. 카드 양식(한 줄 요약, 면접 한 마디, STAR, 배운 개념, 다음 할 일, useful 평가)과 H2 지표("평가한 카드의 60% 이상이 면접에 쓸 만함")는 이어받는다 |
| 폴더 | `apps/desktop`을 새로 만든다. `landing/`은 `apps/landing`으로 옮긴다. 문서는 `docs/`로 옮긴다 |

### OpenAI 제약 (모든 Phase 공통, 공식 문서 확인)

- 쓸 수 있는 API는 `POST /v1/responses` 하나뿐이다.
- 모든 요청에 `store:false`와 `stream:true`를 넣어야 한다.
- `previous_response_id`, `conversation`, `instructions`, `temperature`, `max_output_tokens`, `truncation` 같은 파라미터는 쓰지 않는다.
- 그래서 **앱이 대화 원형을 로컬에 저장해 두고 매 턴 `input`으로 다시 보낸다.**
- Plus·Pro 사용자만 쓸 수 있다.
- UI 문구는 정해져 있다. 로그인 버튼은 "Continue with ChatGPT"이고, 입력창 근처에 "Using ChatGPT plan"과 "Manage usage" 링크를 둔다.
- 셀프 등록 흐름은 다음과 같다.
  - `client_id=dynamic_agent_client`로 시작한다.
  - 콜백은 `http://127.0.0.1:<port>/auth/callback`이다. `localhost`는 쓰지 않고, 포트만 바꿀 수 있다.
  - PKCE는 S256이다.
  - scope는 `openid profile email offline_access resource.invoke chatgpt.tokens.use.direct`이고, `resource=https://api.openai.com/v1`을 함께 보낸다.
  - `ext_agent_host_id`를 영구 저장한다.
  - refresh token은 쓸 때마다 바뀐다.

---

## 1. 목표 폴더 구조

```
Experii/
  README.md             # 신규: 데스크톱 앱 소개(무엇·핵심 루프·화면·폴더·실행 방법·현재 단계)
  PRD.md  CLAUDE.md  AGENTS.md  .gitignore  .nvmrc(22.18)
  apps/
    landing/            # 구 landing/ 전체. 내부 파일, 랜딩 PRD·TSD는 그대로
    desktop/            # 신규 Electron 앱
  docs/
    desktop/prd.md      # 신규 데스크톱 PRD (한국어, 2쪽 이내)
    desktop/tsd.md      # 신규 TSD: 이 계획의 3~5장과 "M0 확인된 사실" 표
    archive/            # 이전 내용 전부. 보관만 하고 작업 기준으로 쓰지 않는다
      README.md         # "보관용, 따르지 않음"과 현재 기준 문서 링크
      Pre_MVP/  PRD_MVP_V1.md  TSD_MVP_V1.md
      demo/experii-demo.html  human-plan.html
      reports/          # 구 reports/
      research_notes/   # 구 research_notes/
  scripts/agents/  .agents/  .claude/  .github/  .codex/   # 위치는 유지, 본문 경로만 수정
```

```
apps/desktop/
  package.json  package-lock.json  .gitignore(node_modules/ out/ .vite/ test-results/ playwright-report/)
  forge.config.ts  tsconfig.json  index.html  vite.{main,preload,renderer}.config.ts
  vitest.config.*  playwright.config.ts  scripts/h2.mjs
  src/shared/{ipc.ts, card.ts}
  src/main/{index.ts, paths.ts, security.ts, ipc.ts, db.ts, migrations.ts,
            auth.ts, tokens.ts, transport.ts, responses.ts, cards.ts, redact.ts}
  src/preload/index.ts
  src/renderer/{main.tsx, App.tsx, Sidebar.tsx, Roadmap.tsx, ChatPanel.tsx, CardView.tsx, SignIn.tsx, styles.css}
  tests/unit/  tests/e2e/{smoke.spec.ts, mock-openai.ts}  tests/fixtures/sse/
```

- 루트 `package.json`과 npm workspaces는 쓰지 않는다. `.agents/hitl/slack-relay`(Deno)와 pstack 스크립트(bun)까지 함께 잡히기 때문이다. 각 앱은 지금 landing처럼 독립 npm 프로젝트로 둔다.
- ORM과 상태관리 라이브러리도 쓰지 않는다.
- 모든 이동은 `git mv`로 한다. 순수 이동 커밋과 경로 수정 커밋을 나눠야 rename 이력이 남는다.

---

## 2. 저장소 재구성

**사람이 커밋한다.** R0, R1, desktop 의존성 추가, CI, 하네스 변경이 모두 해당한다. 보호 경로와 의존성 변경 금지 규칙이 다음 네 곳에 있기 때문이다.
- `.agents/plan.md:105`
- `.agents/routines/implementer.md:59-60`
- `.agents/routines/verifier.md:21`
- `.agents/briefs/_TEMPLATE.md:22`

작업은 창업자와 함께하는 로컬 세션에서 브랜치로 진행한다. push와 PR은 창업자가 한다.

### 사전 조건 (R0, R1 공통)

1. **진행 중인 landing "서비스 가이드" 작업을 먼저 끝낸다.** 다른 세션이 main 체크아웃에서 작업 중이고 커밋되지 않았다.
   - 수정된 파일: `landing/TSD.md`, `Landing.tsx`, `next.config.ts` 외 8개.
   - 새 파일: `landing/app/docs/`, `components/docs/`, `content/docs.ts`, `SiteHeader.tsx`, `tests/e2e/docs.spec.ts`.
   - 이 작업이 커밋되어 main에 들어가기 전에는 `landing/TSD.md`를 고치거나 `landing/`을 옮기지 않는다.
2. 경로 수정은 **줄 번호가 아니라 문자열을 grep해서** 한다. 작업이 들어올 때마다 줄 번호가 바뀐다.
3. 추적되지 않는 `.agents/skills/verify-landing`과 `.codex/agents/*`(Codex 변환본)를 커밋할지 지울지 정한다. 이 계획에서는 열린 항목 O8이다.

### R0. 문서와 색인 (0.5~1일, desktop 코드 작업의 선행 조건)

`CLAUDE.md`의 "PRD에 없는 기능 금지" 규칙과 `PRD.md:10`의 "지금 범위 아님" 때문에, 색인이 바뀌기 전에는 desktop 코드를 쓸 수 없다.

1. 이전 내용을 모두 `docs/archive/`로 옮긴다(`git mv`). 보관만 하고 작업 기준으로 쓰지 않는다.
   - `Pre_MVP/`, `PRD_MVP_V1.md`, `TSD_MVP_V1.md`, `demo/`, `human-plan.html`, `reports/`, `research_notes/`
2. 링크를 고친다.
   - `landing/TSD.md`의 `../PRD_MVP_V1.md`, `../TSD_MVP_V1.md`, `../Pre_MVP/` → `../docs/archive/...`
   - `landing/TSD.md` 본문의 `demo/experii-demo.html` → `docs/archive/demo/experii-demo.html`
   - `docs/archive/reports/overnight-plan-2026-10-26.md`의 `../.agents/` → `../../../.agents/`
   - `Pre_MVP` 내부의 `../PRD_MVP_V1.md` 링크는 이동 뒤 형제 위치가 되므로 그대로 유효하다.
   - 메모리 `experii-demo-artifact`의 `demo/experii-demo.html` 경로도 새 위치로 고친다.
3. 문서 네 개를 쓴다.
   - `docs/archive/README.md`: "보관용, 따르지 않음"이라고 적고 현재 기준 문서 링크를 둔다.
   - `docs/desktop/prd.md`, `docs/desktop/tsd.md`.
   - **루트 `README.md`(신규)**: 처음 보는 사람이 데스크톱 앱을 이해하게 쓴다. 내용은 다음과 같다.
     - Experii가 무엇인지 한 문단.
     - 핵심 루프: 공부 → 경험으로 남기기 → 로드맵 → 이어 하기.
     - 화면 구성: 왼쪽 사이드바, 가운데 로드맵, 오른쪽 GPT.
     - GPT 연결 Phase A/B/C 한 줄씩.
     - 데이터는 내 PC에만 저장된다는 점.
     - 폴더 지도: `apps/desktop`, `apps/landing`, `docs/`, 하네스.
     - 실행 방법: `npm --prefix apps/desktop ci`, `start`, `test`. Terminal 패널에서 실행하라는 주의.
     - 현재 단계와 기준 문서 링크: `PRD.md`, `docs/desktop/`.
     - 실행 방법은 M0 scaffold 뒤에 실제 명령으로 맞추고, M4에서 설치본 만드는 법을 추가한다.
   - PRD에 넣을 것: 목적, H2, 사용자(창업자, 다음은 Plus·Pro 사용자), 루프, FR, v1 제외 항목, Phase A/B/C와 공통 제약, 데이터 경계(로컬만), 측정 규칙.
   - 측정 규칙: H2에 못 미치면 프롬프트와 형식만 고치고 `prompt_version`을 올려 다시 잰다.
   - TSD에는 이 계획의 3~5장과 비어 있는 "M0 확인된 사실" 표를 넣는다.
4. `PRD.md`를 고친다.
   - `skill/` 행을 지운다.
   - `apps/desktop/` 행을 추가한다. 단계는 "데스크톱 MVP v1: 창업자 PC 도그푸딩, H2 검증"이고 `docs/desktop/prd.md`와 `tsd.md`를 가리킨다.
   - MVP V1 행은 "보관 (따르지 않음)"으로 바꾸고 `docs/archive/...`를 가리킨다.
   - 14행 충돌 메모는 "제품 형태 = Windows 데스크톱(2026-10-29). 랜딩 PRD 6장의 '모바일' 문구를 고칠지는 창업자가 판단"으로 바꾼다.
5. 하네스 문서를 고친다.
   - `.agents/briefs/_TEMPLATE.md`
     - 영역: "landing/ 또는 skill/" → "landing/ 또는 apps/desktop/"
     - 게이트와 증거 줄: 앱별로 나눈다. landing은 `verify-landing`, desktop은 `_electron` 스모크 스크린샷이다.
   - `.agents/plan.md`
     - "Windows CI… `skill/` 코드가 생기면" 줄을 지운다.
     - spawn.ps1 용도를 "데스크톱 M0와 도그푸딩 검증"으로 바꾼다. `.agents/README.md`도 같다.
   - 보호 경로 목록 네 곳에 `docs/desktop/`을 추가한다. 범위 문서가 클라우드 PR로 바뀌지 않게 하려는 것이다.
   - `.agents/routines/chief-of-staff.md`, `implementer.md`: desktop 일감은 7장의 바통(작업권) 규칙을 따른다. 트랙 B가 끝나기 전까지는 클라우드 implementer가 `desktop-*` 일감을 집지 않는다.
6. 루트에 `.nvmrc`(22.18)를 추가한다.
7. **저장소 밖 작업:** OpenAI 상업 파트너 관심 신청서를 제출한다(https://openai.com/form/sign-in-with-chatgpt-interest/). `landing/TSD.md`에 체크되지 않은 할 일로 남아 있다.

### R1. `landing/` → `apps/landing` (0.5~1일, 사전 조건 1 해소 뒤, M1의 하네스 변경보다 먼저)

**준비 (창업자):**
- 열린 `claude/*` landing PR, 브리프, worktree가 없는지 확인한다.
- 클라우드 루틴 일정을 잠시 끈다.
- `git tag pre-apps-layout`을 만든다.
- dev, preview 서버와 편집기를 닫는다.
- `landing/node_modules`, `.next`, `tsconfig.tsbuildinfo`를 지운다. Windows는 열린 핸들이나 거대한 `node_modules` 때문에 이동이 중간에 실패할 수 있다.

**커밋 1:** `git mv landing apps/landing`만 담는다.

**커밋 2:** 경로를 고친다. 경로 문자열 `landing`을 `apps/landing`으로 바꾼다.

| 파일 | 고칠 내용 |
|---|---|
| `scripts/agents/gates.mjs` | 앱 표 `{landing:{dir,steps}, desktop:{dir,steps}}`로 바꾸고 `--app=` 인자를 받는다(기본값 landing). 결과는 `<dir>/test-results/gates.json`에 쓰고 `app` 필드를 추가한다. desktop 항목은 M1에서 채운다 |
| `scripts/agents/session-start.mjs` | `'../../apps/landing'`. 그리고 **버그**: `.session-start.log` 위치를 `join(landing,'..')`로 정하고 있어서, 옮기면 `apps/`를 가리킨다. 저장소 루트를 `resolve(here,'../..')`로 따로 구한다 |
| `scripts/agents/verify-doctor.mjs` | 경로와 안내 문구 `npm --prefix apps/landing ...` |
| `.github/workflows/landing-ci.yml` | paths `apps/landing/**`, `cache-dependency-path`, `working-directory`, artifact 경로 |
| `.claude/launch.json` | `["--prefix","apps/landing","run","dev"]` |
| `.claude/skills/verify-landing/SKILL.md`와 `features/*.md` | `--prefix apps/landing`, `apps/landing/...`. `test-results/gates.json` 줄과 `reports/overnight-summary.md` 줄도 포함한다 |
| `.claude/rules/tool-priority.md` | `apps/landing/` Playwright 하네스. "desktop UI는 실제 Electron 창과 `_electron` 스모크로 확인한다" 한 줄을 추가한다 |
| `.agents/plan.md`, `.agents/README.md`, `routines/implementer.md`, `routines/verifier.md`, `briefs/_TEMPLATE.md` | gates와 evidence 경로, `npm ci --prefix apps/landing`. 보호 경로의 `landing/playwright.config.ts`를 `apps/landing/playwright.config.ts`로 바꾼다 |
| `apps/landing/TSD.md` | `../../docs/archive/...`, Vercel Root Directory `apps/landing`, 트리 루트 표기 |
| `PRD.md` | landing 행 링크를 `apps/landing/...`으로 |

**바꾸지 않는 것:**
- `apps/landing` 내부 코드와 설정. 상대 경로라 그대로 맞는다.
- `guard.mjs`, `publish-evidence.mjs`, `spawn.ps1`, `sync-pstack.ps1`, `.claude/settings.json`, `.codex/config.toml`.
- 과거 기록 문서의 본문.

**확인:**
- 아래 명령의 결과에 과거 기록만 남는다. 슬래시가 없는 참조까지 잡기 위해 패턴을 넓혔다.
  ```
  git grep -nE '(^|[^/])landing/|prefix landing|directory: landing|\.\./\.\./landing|"landing"'
  ```
- `node scripts/agents/gates.mjs`가 PASS한다.
- landing-ci가 녹색이다.
- `npm ci`는 Terminal 패널이나 일반 터미널에서 실행한다(6장 함정 1).

**저장소 밖 수동 단계:**
- PR이 녹색이 되면 병합 직전에 Vercel Root Directory를 `landing`에서 `apps/landing`으로 바꾼다. refactor PR의 preview가 그 전까지 실패하는 것은 정상이다.
- 병합한 뒤 production 배포를 확인한다.
- 클라우드 환경 설정 스크립트를 점검한다. Playwright 1.64.1을 고정하고 있고 `plan.md`가 동기화를 요구한다.
- 예약 루틴 프롬프트 3개에 `landing` 경로가 있는지 확인한다.
- 루틴 일정을 다시 켠다.
- 클라우드 세션 하나에서 gates가 녹색인지 확인한다.

---

## 3. 데스크톱 아키텍처

### 3.1 스택

**버전 (scaffold 시점의 정확한 패치로 고정):**
- `electron` 45.x: 최신 안정판이고 Node 24.22를 담고 있다. 8주마다 새 메이저가 나오고, 45는 2027-04에 EOL이다.
- Electron Forge 8, `@electron-forge/plugin-vite`: 8.0에서 실험 딱지가 떨어졌다. Vite 8용이고 ESM 전용이다.
- react·react-dom 19.3.1, typescript 6.0.3, zod 4.6.7, vitest 5.0.5, @playwright/test 1.64.1. landing과 같은 버전이다.
- `engines.node >=22.17`. 이 PC는 22.18.0이라 맞는다.

**scaffold:**
```
npx create-electron-app@latest apps/desktop --template=vite-typescript --skip-git
```
- 템플릿에는 React가 없으므로 `@vitejs/plugin-react`를 직접 붙인다.
- 템플릿이 추가한 것(ESLint 등)과 모듈 형식(`type`, 설정 확장자)을 M0 사실 표에 적는다.

**대체 수단:** Forge 8 + React + Vite 8 조합이 막히면 electron-vite + electron-builder로 간다.

**npm scripts:** `start`, `package`, `make`, `typecheck`, `test`, `test:e2e`, `h2`.

### 3.2 프로세스와 시작 순서 (`main/index.ts`)

1. `electron-squirrel-startup` 검사. 설치 프로그램이 `--squirrel-*` 인자로 실행하면 바로 종료한다.
2. `paths.ts`에서 `app.setPath('userData', …)`를 호출한다.
   - 개발 실행이면 `Experii-dev`.
   - 패키지되지 않은 빌드에서만 `EXPERII_USER_DATA`를 읽는다.
   - 단일 인스턴스 잠금이 userData 기준이라 반드시 그 전에 해야 한다.
3. `app.requestSingleInstanceLock()`. 실패하면 종료한다.
4. `app.enableSandbox()`, `protocol.registerSchemesAsPrivileged(app)`. 둘 다 `ready` 전에 한다.
5. `ready` 뒤에 DB를 열고 마이그레이션한다. 그다음 보안 훅을 걸고 IPC를 등록한 뒤 창을 만든다.

**역할 분리:**
- **main**: 네트워크(OpenAI, OAuth), DB, 토큰, 가리기를 모두 맡는다. 외부 호출은 Electron `net.fetch`로 한다. 시스템 프록시와 인증서 저장소를 따르기 때문이다.
- **preload**: sandbox 안에서 번들되어 실행된다. 채널마다 함수 하나만 노출한다.
- **renderer**: 화면만 맡고 네트워크를 쓰지 않는다. 토큰은 renderer로 오지 않는다.

`db`, `redact`, `card`, `sse`, `buildInput`, PKCE 모듈은 `electron`을 import하지 않는다. `safeStorage` 같은 것은 주입받는다. 그래야 vitest에서 바로 테스트할 수 있다.

### 3.3 보안 기준선 (`main/security.ts`, Electron 보안 체크리스트 기준)

- **창 설정.** `contextIsolation:true`, `sandbox:true`, `nodeIntegration:false`. 패키지 빌드에서는 devTools를 끈다.
- **renderer 출처.** prod와 e2e는 `app://` 커스텀 프로토콜(`protocol.handle`)이다. 경로 이탈(`..`, 절대경로)은 404로 막는다. 개발에서는 Vite 서버다. 어느 쪽인지는 `MAIN_WINDOW_VITE_DEV_SERVER_URL`이 정의되어 있는지로 판단한다(`isPackaged`가 아니다).
- **CSP.** `session.webRequest.onHeadersReceived`로 응답 헤더에 건다.
  - prod: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
  - dev만: React Fast Refresh 프리앰블과 Vite 인라인 스타일 때문에 `'unsafe-inline'`과 `ws:`를 추가한다.
- **모든 webContents 공통.**
  - `will-navigate`는 `preventDefault`.
  - `setWindowOpenHandler`는 항상 deny.
  - `will-attach-webview`는 차단.
  - 권한 요청은 모두 거부하되 `clipboard-sanitized-write`만 허용한다.
- **IPC sender 검사.** `event.senderFrame`이 메인 창의 `mainFrame`과 같은 프레임인지, URL이 `protocol === 'app:'`이고 host가 기대값인지(dev는 Vite 출처) 확인한다. `app://`의 `URL.origin`은 `"null"`이 나오므로 origin 비교는 쓰지 않는다. `senderFrame`이 null이면 거부한다.
- **모델 출력.** 원시 HTML을 렌더하지 않는다. v1은 링크를 텍스트로만 보여 준다. `shell.openExternal`은 고정 허용 목록(`chatgpt.com` 사용량 관리, OAuth 인가 URL)에만 쓴다.
- **로그.** 토큰, Authorization 헤더, 메시지 본문을 남기지 않는다. crashReporter는 켜지 않는다.
- **금지 패턴 단위 테스트.** `src/`에 다음이 있으면 실패한다. Electron 46 업그레이드와 보안 회귀를 함께 막는다.
  - `encryptString(`, `decryptString(` (Electron 46에서 제거되는 sync API)
  - `nodeIntegration: true`, `contextIsolation: false`, `sandbox: false`, `webSecurity: false`
  - `dangerouslySetInnerHTML`
  - preload의 `ipcRenderer.send`

### 3.4 타입 IPC (`shared/ipc.ts`, 모든 handler에서 sender 검사와 zod parse)

**invoke (renderer → main):**

| 채널 | 비고 |
|---|---|
| `auth:status`, `auth:signIn`, `auth:signOut` | `signIn`은 진행 중인 Promise 하나를 공유한다(중복 클릭 방지). 오류: `not_eligible_plan`, `cancelled`, `timeout` |
| `subjects:list`, `subjects:create {title}` | |
| `roadmap:get {subjectId}` | `{subject, nodes: Done \| Locked (+ O5에 따라 Current)}` |
| `conversations:open {subjectId, recommendedNodeId?}` | 추천 칸에서 시작하면 입력창 초안을 함께 준다. DB 행은 첫 턴을 저장할 때 만든다 |
| `conversations:get {id}` | 표시용 메시지와 카드 ID |
| `chat:send {conversationId, streamId, text}`, `chat:cancel {streamId}` | `streamId`는 renderer가 만든다. 같은 대화에 스트림이 이미 진행 중이면 거부한다 |
| `cards:generate {conversationId}` | 결과는 `{card, redactions}`, 또는 `no_learning`, `invalid`, `too_long`. 타임아웃과 중단을 지원한다 |
| `cards:get {id}`, `cards:rate {id, useful}` | |
| `links:openUsage` | 고정 URL만 연다 |

**event (main → renderer):**
- `chat:event {streamId, conversationId, type: delta | done | error, text?, code?}`
- `auth:changed`
- 구독하면 해제 함수를 돌려준다. 이벤트는 요청을 보낸 창에만 보낸다.

### 3.5 로컬 DB (`userData/experii.db`, `node:sqlite` `DatabaseSync`)

- PRAGMA: `foreign_keys=ON`, `journal_mode=WAL`, `synchronous=NORMAL`.
- 마이그레이션은 `PRAGMA user_version`과 `migrations.ts`의 문자열 배열로 한다. 적용 전에 `VACUUM INTO 'experii.db.bak-v{n}'`으로 백업한다. WAL에서는 파일 복사가 일관되지 않기 때문이다.
- `node:sqlite`가 번들에서 사라지지 않도록 Vite main 설정의 `external`에 명시한다.
- 대체 드라이버: M0에서 `node:sqlite`가 실패하면 better-sqlite3로 바꾼다. external로 두고 Forge가 자동 rebuild한다.

```sql
settings(key PK, value)                       -- ext_agent_host_id, default_model, issued_client_id (토큰 없음)
subjects(id PK, title UNIQUE COLLATE NOCASE, created_at, updated_at)
conversations(id PK, subject_id → subjects RESTRICT, from_recommended_node_id NULL,
  model, title, created_at, updated_at)       -- 첫 턴이 저장될 때 생성
items(id PK, conversation_id → conversations CASCADE, seq, type, role NULL, text NULL,
  item_json NOT NULL, created_at, UNIQUE(conversation_id, seq))   -- item_json = Responses item 원형(재전송용)
experience_cards(id PK, conversation_id UNIQUE → conversations CASCADE, title, summary, interview_line,
  star_situation, star_task, star_action, star_result NULL, concepts_json, next_steps,
  useful NULL CHECK(0,1), rated_at NULL, redactions_json, model, prompt_version, created_at, updated_at)
recommended_nodes(id PK, subject_id → subjects, source_card_id → experience_cards CASCADE,
  title, reason, rank)                        -- 항상 잠긴 칸으로 표시
```

**규칙:**
- **로드맵.** 과목의 대화를 `created_at` 순으로 놓아 만든다. 카드가 있는 대화가 done 칸이고, 카드 제목과 한 줄 요약을 보여 준다. 그 뒤에 `recommended_nodes`를 `rank` 순으로 잠긴 칸 1~2개로 붙인다. 이미 시작한 추천 칸(`from_recommended_node_id`)은 숨긴다.
- **턴 저장.** `response.completed`를 받으면 user item과 모든 output item을 한 트랜잭션으로 넣는다. 실패, 취소, 비정상 종료면 아무것도 저장하지 않는다. `before-quit`에서 진행 중인 스트림을 abort한다.
- **카드 저장.** `ON CONFLICT(conversation_id) DO UPDATE`로 카드 ID를 유지한다. 다시 만들면 확인을 받은 뒤 덮어쓰고 `useful`과 `rated_at`을 초기화한다. 추천 칸은 그 카드의 대화가 해당 과목의 **최신 대화일 때만** 교체한다. 모두 한 트랜잭션이다.
- **과목.** 대화는 항상 과목 안에서 시작한다. 사용자가 사이드바에서 고르거나 새로 만든다. GPT가 자동으로 분류하지 않는다.

### 3.6 AI provider (Phase A/B/C를 최소 코드로)

```ts
// main/transport.ts
type Transport = {
  baseUrl: string;
  headers(): Promise<Record<string, string>>;
  onUnauthorized(): Promise<boolean>;   // A·C: refresh 한 번 / B: 재로그인
  planLabel: 'chatgpt-plan' | 'experii'; // "Using ChatGPT plan" 표시 여부
};
chatgptTransport(tokens)               // A·C: https://api.openai.com/v1, 만료 60초 전 refresh(single-flight)
// relayTransport(session)             // B: 만들지 않는다. TSD에 요구사항만 적는다
// main/responses.ts
streamResponse(t, body, signal): AsyncIterable<ResponsesEvent>  // net.fetch + SSE 파서(TextDecoder stream:true)
buildInput(items, userText): InputItem[]                      // item_json을 seq 순으로 + 새 user 메시지
```

- **요청 본문.** 세 Phase가 모두 같다.
  ```
  {model, input, store:false, stream:true, include:['reasoning.encrypted_content']?}
  ```
  `include`는 M0에서 허용되는 경우에만 넣는다. 금지 필드가 빠졌는지는 단위 테스트로 고정한다.
- **reasoning item.** `buildInput`은 `encrypted_content`가 없는 reasoning item을 뺀다. item `id`를 남길지 지울지는 M0에서 정한다.
- **모델.** `GET /v1/models`에서 `visibility:"list"`만 거른다. `settings.default_model`이 있으면 그것을, 없으면 첫 항목을 쓴다. 모델 선택 UI는 v1에 없다.
- **Phase별 차이.**
  - Phase B: `Transport`와 로그인 화면만 바뀐다. 릴레이의 요구사항은 TSD에 적는다. 사용자별 인증, rate limit, `store:false` 강제, 모델 허용 목록이다.
  - Phase C: 기본적으로 `client_id` 출처만 바뀐다. 승인 조건이 다르면 그때 다시 본다.

### 3.7 OAuth loopback (`main/auth.ts`)과 토큰 (`main/tokens.ts`)

**로그인 흐름:**
1. `ext_agent_host_id`(`urn:uuid:…`)가 없으면 만들어 `settings`에 영구 저장한다.
2. PKCE verifier와 S256 challenge, 일회용 `state`를 만든다.
3. `http.createServer`를 `127.0.0.1`에만 연다. 1455를 먼저 시도하고, listen 오류가 나면 종류와 관계없이 `:0`으로 연다. `EADDRINUSE`뿐 아니라 Hyper-V 예약 포트의 `EACCES`도 있다. **listen이 끝난 뒤에** 브라우저를 연다.
4. `shell.openExternal`로 `https://auth.openai.com/api/accounts/authorize`를 연다. 파라미터는 1장의 OpenAI 제약 목록 그대로다.
5. 콜백을 처리한다.
   - `/auth/callback` 외의 경로는 404.
   - `state`가 다르거나 `error` 파라미터가 오면 실패로 끝낸다.
   - 브라우저에는 고정 한국어 HTML을 보여 준다. 쿼리를 되비추지 않는다.
   - 서버는 바로 닫는다. 5분이 지나면 timeout으로 끝낸다.
6. `/api/accounts/oauth/token`에서 토큰을 교환한다. 부여된 scope에 `chatgpt.tokens.use.direct`가 없으면 토큰을 버리고 "ChatGPT Plus·Pro 계정이 필요해요"를 띄운다.
7. refresh는 single-flight Promise 하나로 묶는다. 바뀐 4개 필드를 한꺼번에 갱신한다. `invalid_grant`가 오면 토큰을 지우고 `auth:changed`를 보낸다.

**토큰 저장:**
- 대상은 `{access_token, refresh_token, expires_at, scopes, email}`이다.
- `safeStorage.encryptStringAsync`로 암호화해 `auth.bin.tmp`에 쓰고 rename해서 `userData/auth.bin`으로 교체한다.
- 읽을 때 `shouldReEncrypt`가 true면 다시 저장한다.
- **async API만 쓴다.** sync API는 Electron 46에서 제거된다.
- 암호화를 쓸 수 없으면 디스크에 쓰지 않고 메모리에만 둔다.
- 발급받은 `client_id`는 `settings`에 두고 로그아웃해도 유지한다. 로그아웃 뒤 처리는 M0 결과로 확정한다.
- 한계: DPAPI는 같은 Windows 사용자로 도는 다른 앱을 막지 못한다. TSD에 적는다.

### 3.8 스트리밍과 채팅 입력

- 이벤트별 처리:
  - `response.output_text.delta` → `chat:event delta`
  - `response.output_item.done` → item 버퍼에 모은다
  - `response.completed` → 트랜잭션으로 커밋한 뒤 `done`
  - `failed`, `incomplete`, HTTP 오류 → `error{code}`. 컨텍스트 초과면 "대화가 너무 길어요"를 띄운다
- 다른 칸으로 바꾸면 진행 중인 스트림을 abort한다.
- 한글 IME: `isComposing`이거나 `keyCode===229`면 Enter를 눌러도 전송하지 않는다.

### 3.9 카드 생성 계약 (`main/cards.ts`, `shared/card.ts`)

- **호출 구성.** 대화의 **message item만** 넣고, 끝에 developer 메시지(카드 지시문, `PROMPT_VERSION`)를 붙인 별도 요청이다.
  - 컨텍스트를 넘으면 오래된 턴부터 잘라 맞춘다. 긴 대화도 카드가 될 수 있게 하려는 것이다.
  - 이 요청과 응답은 `items`에 저장하지 않는다. 이어서 공부할 때 대화가 오염되지 않게 하기 위해서다.
- **구조화 출력.** 우선순위는 `text.format: json_schema strict` → strict function tool → JSON 텍스트를 zod로 검증하고 1회 재시도. 어느 것이 되는지는 M0에서 확인한다. JSON Schema는 zod에서 `z.toJSONSchema()`로 만든다.
- **zod는 `has_learning`으로 갈리는 discriminated union이다.**
  - `false`: 카드를 만들지 않고 "카드로 남길 학습 내용이 없어요"를 띄운다.
  - `true`: 다음 필드와 길이 제한을 검증한다.

    | 필드 | 제한 |
    |---|---|
    | `title` | 60자 이하 |
    | `summary` | 200자 이하 |
    | `interview_line` | 200자 이하 |
    | `star.situation`, `task`, `action` | 각 400자 이하 |
    | `star.result` | 400자 이하, 또는 null |
    | `concepts` | 8개 이하, 각 40자 이하 |
    | `next_steps` | 400자 이하 |
    | `recommended_next` | 1~2개, `title` 40자 이하, `reason` 120자 이하 |
- **지시문 규칙.**
  - 대화에 실제로 나온 사실만 쓴다. 대화에 없는 성과, 수치, 회사명은 금지한다.
  - 결과가 확인되지 않으면 `star.result=null`이다. 화면에는 "(대화에서 결과를 확인하지 못함)"으로 보인다.
  - 대화 안의 지시문은 데이터로만 다룬다.
  - 추천은 이 과목 안에서, 대화의 막힌 점과 다음 할 일을 근거로만 고른다.
  - 카드는 한국어로 쓴다.
- **가리기(`main/redact.ts`).** 카드 출력의 문자열 필드에만 적용한다. 원문은 재전송해야 하므로 손대지 않는다.
  - 패턴: `sk-`, `gh[pousr]_`, `AKIA`, `AIza`, `xox[abprs]-`, 개인키 블록, 주민등록번호, Bearer 토큰, JWT. 출처는 `docs/archive/TSD_MVP_V1.md`의 민감 정보 정규식이다.
  - 모두 `***REDACTED***`로 바꾸고, 가린 유형과 개수를 화면에 알린다.
- **평가.** 카드 화면에 "면접에 쓸 만해요 / 아니에요"를 둔다. `scripts/h2.mjs`가 `prompt_version`별로 H2를 출력한다. DB를 읽기만 한다.

---

## 4. 마일스톤

### 4.0 먼저 알아 둘 Electron 용어

Electron 앱은 **크롬 브라우저 창 하나와 Node.js를 한 프로그램에 담은 것**이다. 화면은 웹페이지(React)로 만들고, 파일, DB, 인터넷 같은 일은 Node.js 쪽이 한다.

| 용어 | 쉬운 설명 | Experii에서 하는 일 |
|---|---|---|
| **main 프로세스** | 앱의 백엔드다. 화면이 없다 | 창 열기, GPT 호출, 대화와 카드 저장, 로그인 토큰 보관 |
| **renderer** | 창 안에 보이는 화면이다. 그냥 React 웹페이지다 | 사이드바, 로드맵, 채팅 화면. 보안 때문에 파일과 인터넷을 직접 쓰지 못한다 |
| **preload** | 화면과 main 사이의 창구다 | 화면이 써도 되는 기능만 골라서 열어 준다. 예: `window.experii.sendMessage()` |
| **IPC** | 화면과 main이 주고받는 메시지다 | 화면이 "이 말을 GPT에 보내 줘"라고 하면 main이 답을 글자 단위로 흘려 보낸다 |
| **Forge, Vite** | 프로젝트를 만들고 실행하고 설치 파일을 만드는 도구와, 코드를 고치면 화면이 바로 바뀌게 해 주는 도구다 | `npm start`로 개발하고, `npm run make`로 `Setup.exe`를 만든다 |

### 4.1 단계별 계획 (도그푸딩 전까지 약 12~14 작업일, 그다음 2주 사용)

```
단계 0 정리 ─┬─ 단계 1 실험 ─┐
             └─ 단계 2 시안 ─┴─ 단계 3 뼈대 ─ 단계 4 로그인·채팅 ─ 단계 5 카드·로드맵 ─ 단계 6 설치본 ─ 단계 7 2주 써 보기
옆 트랙 A: landing을 apps/landing으로 옮기기 (단계 3의 자동 검사 설정 전에 끝낸다)
옆 트랙 B: PC↔클라우드 이어달리기 (단계 3 뒤, 하네스 4단계 "지켜보는 1회" 뒤. 7장)
```

**단계 0. 정리하고 지도 다시 그리기** (R0, 반나절~1일, 코드 0줄)
- **왜:** 프로젝트 규칙상 `PRD.md` 색인에 없는 것은 만들 수 없다. 먼저 데스크톱 앱을 공식 작업으로 등록한다.
- **하는 일:**
  - 옛 문서를 `docs/archive/`로 옮긴다.
  - 데스크톱 PRD·TSD와 루트 `README.md`를 쓴다.
  - `PRD.md`에 데스크톱 행을 추가한다.
  - OpenAI 신청서를 낸다.
- **끝나면 보이는 것:** 루트 `README.md`가 데스크톱 앱을 설명하고, `PRD.md`가 데스크톱 문서를 가리킨다.

**단계 1. 막힐 만한 것을 먼저 작게 시험하기** (M0, 1.5~2일)
- **왜:** 본격적으로 만들기 전에 "이게 정말 되나?"를 확인한다. 안 되면 지금 계획을 바꾸는 게 가장 싸다.
- **실험 A, 로그인과 대화:** 작은 스크립트로 한다. 커밋하지 않는다.
  1. 내 Plus 계정으로 "Continue with ChatGPT" 로그인을 한다.
  2. GPT에 두 번 말을 건다.
  3. 저장한 대화를 다시 보냈을 때 GPT가 앞 내용을 기억하고 이어 가는지 본다.
- **실험 B, 빈 Electron 앱:** 명령 한 줄로 빈 앱을 만들고 다음을 본다.
  1. 창이 뜨는가.
  2. 코드를 고치면 바로 반영되는가.
  3. 내장 SQLite에 저장하고 읽을 수 있는가.
  4. 토큰 금고(`safeStorage`)가 동작하는가.
  5. 자동 테스트 도구가 앱을 켤 수 있는가.
- **끝나면 보이는 것:**
  - 빈 "Experii" 창이 뜬다.
  - TSD의 "M0 확인된 사실" 표가 통과·실패로 채워져 있다.
  - 실패한 항목은 표에 적힌 대안으로 바꾼다. 로그인이 막히면 창업자에게 묻는다.

**단계 2. 화면 시안 3개 중에서 고르기** (D, 1일, 단계 1과 동시에)
- **왜:** 프로젝트 규칙상 화면은 시안 3개를 보고 고른 뒤에 코딩한다. 그림 같은 HTML로 바꾸는 게 코드로 바꾸는 것보다 훨씬 빠르다.
- **하는 일:**
  - 진짜 앱이 아닌 HTML 시안 A·B·C를 내장 브라우저에 띄운다.
  - 세 안 모두 "왼쪽 사이드바, 가운데 로드맵, 오른쪽 GPT" 배치는 같고, 그 안의 정보 배치만 다르다.
  - 첫 실행 빈 화면, 오류 화면, "Plus·Pro 계정이 필요해요" 화면도 함께 본다.
- **끝나면:** 창업자가 하나를 고른다. 열린 항목 O1, O4, O5, O9(추천 칸 동작, 유닛 헤더, 진행 중 대화 표시, 마크다운)도 이때 정한다.

**단계 3. 보이지 않는 뼈대 만들기** (M1, 2일)
- **왜:** 화면 밑에 깔리는 저장, 보안, 통신 부품을 먼저 만들고 자동 테스트로 굳힌다. 그래야 화면을 붙일 때 흔들리지 않는다.
- **하는 일:**
  - DB 표를 만든다.
  - 보안 설정을 한다.
  - 화면과 main 사이의 메시지 목록을 정한다.
  - 비밀번호·키 가리기, 카드 형식 검사기, 로그인 부품을 만든다.
- **끝나면 보이는 것:** 화면은 아직 비어 있다. 하지만 자동 검사 `node scripts/agents/gates.mjs --app=desktop`이 내 PC와 GitHub의 Windows 서버 양쪽에서 초록불이다.

**단계 4. 로그인하고 GPT와 대화하기** (M2, 3일)
- **끝나면 할 수 있는 것:**
  1. "Continue with ChatGPT"를 누르면 브라우저에서 로그인하고 앱으로 돌아온다.
  2. 왼쪽에서 과목을 만든다.
  3. 오른쪽에서 GPT와 대화한다. 답이 글자 단위로 흘러나온다.
  4. 앱을 껐다 켜도 대화가 남아 있고 이어서 말할 수 있다.
- **확인:** 창업자가 직접 해 보고 화면을 캡처한다.

**단계 5. 경험 카드와 로드맵** (M3, 3일, 핵심 기능 완성)
- **끝나면 할 수 있는 것:**
  1. 대화 끝에 "경험으로 남기기"를 누르면 카드(한 줄 요약, 면접 한 마디, STAR)가 생긴다.
  2. 가운데 길에 칸이 하나 생기고, 그 뒤에 잠긴 추천 칸이 1~2개 붙는다.
  3. 칸을 누르면 그때의 대화가 오른쪽에 다시 열려 이어서 공부할 수 있다.
  4. 카드마다 "면접에 쓸 만해요 / 아니에요"를 누를 수 있다.
- **확인:**
  - 자동 테스트가 이 흐름 전체를 대신 눌러 본다.
  - 실제 대화 3개로 만든 카드에 지어낸 내용이 없는지 창업자가 본다.

**단계 6. 내 PC에 설치하기** (M4, 1~2일)
- **끝나면 보이는 것:**
  - `Setup.exe` 파일 하나가 생긴다. 설치하면 시작 메뉴에서 Experii를 실행할 수 있다.
  - 코드 서명을 하지 않아서 Windows 경고가 뜬다. "추가 정보 → 실행"을 누르면 된다.
- **하는 일:** 오류 화면을 다듬고, 5.4 체크리스트를 통과한다.

**단계 7. 2주 동안 실제로 써 보기** (M5)
- **하는 일:** 공부할 때마다 앱을 쓰고, 카드마다 평가한다.
- **판단:**
  - 2주 뒤 `npm --prefix apps/desktop run h2`로 "면접에 쓸 만한 카드 비율"을 본다.
  - 60%에 못 미치면 카드를 만드는 지시문만 고쳐서 다시 잰다.

**옆 트랙. landing을 `apps/landing`으로 옮기기** (R1, 반나절~1일)
- 다른 세션이 하고 있는 landing 작업이 끝난 뒤에 한다.
- Vercel 설정 한 칸(Root Directory)을 바꾸는 일이 포함된다.
- 데스크톱 개발과는 따로 진행한다. 다만 단계 3의 자동 검사 설정보다 먼저 끝내야 한다. 같은 파일을 고치기 때문이다.

**모든 단계에 공통인 약속:**
- 화면을 바꿀 때는 시안 3개를 먼저 본다.
- 만든 화면은 실제 Electron 창에서 확인한다.
- 트랙 B가 생기기 전까지 데스크톱 작업은 창업자 PC의 로컬 세션에서 하고, push는 창업자가 한다. 트랙 B 뒤에는 7장의 바통 규칙을 따른다. 자리를 비울 때는 지금도 "Continue in cloud"를 손으로 쓸 수 있다(7.2).
- `npm` 설치와 설치 파일 만들기는 Terminal 패널이나 일반 터미널에서 한다. Claude 앱 안의 셸로 하면 일부 파일이 숨겨진 폴더로 들어간다.

### 4.2 구현 담당용 상세 표

단계 번호와 코드의 대응: 단계 0=R0, 1=M0, 2=D, 3=M1, 4=M2, 5=M3, 6=M4, 7=M5, 옆 트랙=R1.

**순서:** 사전 조건 → R0 → (M0 ∥ D) → M1 → M2 → M3 → M4 → M5. R1은 사전 조건이 풀리면 M1의 하네스(gates, CI) 변경보다 먼저 넣는다. M1의 앱 코드는 R1을 기다리지 않는다.

| 단계 | 내용 | 완료 조건 | 크기 |
|---|---|---|---|
| **R0** | 2장 R0 | 사람이 커밋했다. 이전 내용이 모두 `docs/archive/`에 있다. `PRD.md`에 `apps/desktop/` 행이 있다. 루트 `README.md`가 데스크톱 앱을 설명한다. 신청서를 냈다 | 0.5~1일 |
| **M0** 스파이크 (로컬 Windows) | **S1 SIWC**: scratchpad의 Node 스크립트로 하고 커밋하지 않는다. 로그인은 창업자가 한다. 확인할 것: 셀프 등록, 포트 변경, scope 부여, `/v1/models`, `store:false` 2턴 재전송, reasoning item 재전송, `include`, item id 유지와 제거, 구조화 출력 3방식, refresh 회전, 로그아웃 뒤 `client_id`. SSE fixture는 **합성 프롬프트로만** 녹화하고 토큰과 계정 식별자를 지운다. **S2 스택**: `apps/desktop` scaffold. Forge 8, Vite 8, plugin-react의 HMR. 번들된 main에서 `node:sqlite`의 WAL 읽기·쓰기와 `VACUUM INTO`. `safeStorage` async 왕복. app:// 위에서 자산 경로. `_electron` 실행 | `docs/desktop/tsd.md`의 "M0 확인된 사실" 표가 통과, 실패, 결정으로 채워져 있다. 결정 대상은 sqlite 드라이버, 구조화 방식, `include`, app:// 또는 loadFile이다. S1이 실패하면 대체안을 창업자에게 묻는다(O10). scaffold 커밋은 사람이 한다 | 1.5~2일 |
| **D** UI 시안 (`ui-change.md`, renderer 코드보다 먼저) | scratchpad에 독립 HTML과 모의 데이터로 A·B·C를 만든다. 내장 브라우저(`preview_start` url)에서 1440과 1280 폭으로 띄운다. 세 안 모두 **왼쪽 사이드바, 가운데 경로, 오른쪽 채팅**의 3단 배치는 고정하고, 차이는 그 안의 정보 위계로 낸다. 포함할 상태: 듀오링고식 세로 경로(유닛 헤더, done과 잠긴 칸), 카드 보기와 평가, "Continue with ChatGPT", 첫 실행 빈 상태, 과목 만들기, 덮어쓰기 확인, 가림 알림, 학습 없음, Plus·Pro 필요, 재로그인·네트워크·컨텍스트 초과 오류. 참고 재료: `landing/components/app-window/AppWindow.tsx`, `landing/components/loop/ExperienceCard.tsx`, `landing/design/DESIGN.md`, pretendard. 이 단계에서 O1, O4, O5, O9를 정한다 | 창업자가 하나를 골랐다. 섞은 안이면 다시 띄워 확인받는다. 시안은 커밋하지 않고, 고른 뒤 지운다. launch.json에 임시 항목을 넣지 않는다 | 1일 |
| **M1** 기반 (UI 없음) | `paths`, `security`, `db`와 마이그레이션, IPC 골격, `redact`, `card` zod, SSE 파서, `buildInput`, PKCE, `tokens`, 금지 패턴 테스트. R1 뒤에 `gates.mjs --app=desktop`과 `desktop-ci.yml`(사람 커밋) | `gates.mjs --app=desktop --skip-e2e`가 로컬과 windows-latest CI에서 녹색이다 | 2일 |
| **R1** | 2장 R1과 Vercel | landing gates PASS, CI 녹색, production 정상, 클라우드 gates 녹색 | 0.5~1일 |
| **M2** 인증·채팅·사이드바 | `auth`, `transport`, `responses`, IPC의 `auth`·`subjects`·`conversations`·`chat`. 고른 시안대로 SignIn, ChatPanel, Sidebar. `mock-openai.ts`와 e2e 1차 | 실계정으로 로그인 → 2턴 스트리밍 → 재시작 → 이어 보내기에서 mock으로 전체 이력이 재전송되는 것을 확인했다. 중단한 뒤 저장된 부분 item이 0개다. Electron 창 스크린샷을 창업자가 확인했다(CLAUDE.md:44) | 3일 |
| **M3** 카드·로드맵·다시 열기 | `cards`, CardView(평가), Roadmap, 칸이나 카드를 눌러 대화 복원, 잠긴 칸을 눌러 새 대화와 초안, 다시 만들 때 덮어쓰기 | e2e 스모크 전체가 통과한다. 실제 대화 3개로 만든 카드에 지어낸 내용이 0건이다(창업자 검토) | 3일 |
| **M4** 도그푸딩 준비 | 오류 상태, Terminal 패널에서 `npm run make`로 서명 없는 Squirrel `Setup.exe` 생성, fuse 확인, `h2.mjs`, 로컬에서 3회 연속 안정되면 CI e2e 켜기 | 설치한 빌드로 실제 공부 1회를 했다. 5.4 체크리스트를 통과했다 | 1~2일 |
| **M5** 도그푸딩 | 2주 실사용 | `npm --prefix apps/desktop run h2`로 H2를 측정했다. 미달이면 프롬프트와 형식만 고치고 `prompt_version`을 올려 다시 잰다 | 2주 |

**공통 규칙:**
- desktop 작업은 창업자와 함께하는 로컬 세션이나 로컬 레인(`spawn.ps1`)에서만 한다. push는 창업자가 한다.
- 화면 구성을 바꿀 때마다 시안 3개 규칙을 적용한다.
- 모든 UI 변경은 실제 Electron 창에서 확인한다.

---

## 5. 검증

### 5.1 단위 테스트 (vitest, `apps/desktop/tests/unit`)

- `redact`: 패턴마다 걸리는 예, 그리고 SQL, 코드, base64, UUID에서 오탐이 없는 예.
- `card`: `has_learning` 두 갈래, 경계값, `result:null`.
- `sse`: 정상, failed, incomplete, chunk 분할, **한글 멀티바이트가 중간에서 잘린 경우**.
- `buildInput`: seq 순서, reasoning item 처리, 금지 필드 없음, `store:false`와 `stream:true`.
- `auth`: authorize URL 파라미터, state 불일치, error 파라미터, 잘못된 경로, scope 미부여, timeout, signIn과 refresh의 single-flight.
- `tokens`: 원자적 쓰기, 암호화 불가일 때 디스크에 쓰지 않음, `shouldReEncrypt`.
- `db`: **임시 파일 DB**로 마이그레이션과 `VACUUM INTO` 백업, 카드 트랜잭션 롤백, ID를 유지하는 upsert, 최신 대화일 때만 추천 교체, 시작한 추천 칸 숨김, 로드맵 쿼리.
- `ipc`: 잘못된 payload 거부, sender 거부, 같은 대화에 동시 전송 거부.
- 금지 패턴 검사.

vitest는 시스템 Node 22.18에서 돈다. Electron 런타임에서의 동작은 e2e가 확인한다.

### 5.2 Playwright `_electron` 스모크 (`tests/e2e/smoke.spec.ts`, Windows, workers 1)

먼저 `npm run package`로 빌드한다. 테스트가 `mock-openai.ts`(127.0.0.1에서 fixture 재생)를 띄운 뒤 다음 환경 변수로 앱을 실행한다.

```
_electron.launch({args:['.'], env:{EXPERII_API_BASE_URL, EXPERII_TEST_ACCESS_TOKEN, EXPERII_USER_DATA:<tmp>}})
```

이 환경 변수들은 패키지되지 않은 빌드에서만 읽는다. fuse는 릴리스 빌드에만 켜져 있으므로 e2e는 패키지되지 않은 빌드로 돌린다.

1. 보안: renderer에서 `typeof require === 'undefined'`이고, `window.experii`의 키가 허용 목록과 같고, navigation과 `window.open`이 차단된다.
2. 과목을 만들고 2턴 대화한다. delta가 화면에 나온다.
3. 경험으로 남기기를 누른다. 면접 한 마디, STAR, 가림 표시가 보이고, 경로에 done 칸 1개와 잠긴 칸 1~2개가 생긴다.
4. 앱을 재시작하고 칸을 누르면 대화가 복원된다. 한 턴 더 보낸다. **mock이 받은 본문을 assert한다**: 전체 이력이 들어 있고, `store:false`이며, `previous_response_id`가 없다.
5. 잠긴 칸을 누르면 새 대화와 초안이 생기고, 그 칸은 숨겨진다.
6. 스트림 중간에 앱을 강제 종료한다. 프로세스가 끝날 때까지 기다렸다가 재시작하면 부분 출력이 0이다.
7. 장면마다 스크린샷을 `apps/desktop/test-results/`에 남긴다. 이 폴더는 gitignore 대상이다.

### 5.3 gates와 CI

- `gates.mjs --app=desktop`의 단계는 typecheck → unit → build(`npm run package`) → e2e다. e2e는 `--skip-e2e`로 뺄 수 있다.
- win32가 아닌 곳에서 e2e를 돌리면 `fail(needs-win32)`로 기록한다.
- `--app`의 기본값은 landing이다. 그래서 기존 루틴과 `cloud.md`의 "gates 통과"가 뜻하는 바가 그대로다.
- `session-start.mjs`는 계속 landing 의존성만 설치한다. 클라우드에서 Electron을 받지 않기 위해서다.
- 신규 `.github/workflows/desktop-ci.yml`:
  - `windows-latest`, paths `apps/desktop/**`, `gates.mjs`, 이 파일.
  - 단계: node 22 → `npm ci` → `gates.mjs --app=desktop --skip-e2e` → artifact.
  - 비공개 저장소에서 Windows 러너는 Actions 분을 더 쓰므로 paths 필터로 꼭 필요할 때만 돈다.
  - M4에서 e2e를 켠다.

### 5.4 도그푸딩 체크리스트 (창업자 PC, 서명 없는 설치본)

- [ ] SmartScreen의 "추가 정보 → 실행"을 거쳐 설치하고 실행한다.
- [ ] "Continue with ChatGPT"로 로그인하면 "Using ChatGPT plan"이 보인다. 재실행하고 하루가 지나도 로그인이 유지된다.
- [ ] dev 전용 스크립트로 실제 토큰 값을 검색했을 때 `auth.bin` 밖에 평문이 없다. `eyJ` 문자열 검색은 오탐이 많아서 쓰지 않는다.
- [ ] 한글 IME 입력 중에 Enter를 눌러도 전송되지 않는다. 스트리밍 중단과 네트워크 오류 안내가 동작한다.
- [ ] 과목 2개에서 각각 대화하고 카드를 만든다. 카드에 지어낸 수치나 성과가 없다. 학습 내용이 없는 대화는 카드가 되지 않는다. 키 모양 문자열은 가려진다.
- [ ] 평가하고 재시작해도 평가가 유지된다. 칸을 눌러 다시 열고 이어서 공부한 뒤 다시 만들면 덮어써지고 평가가 초기화된다.
- [ ] 로그아웃 뒤 다시 로그인된다. `Experii`와 `Experii-dev` 데이터가 분리되어 있다. 마이그레이션 백업 파일이 있다. 릴리스 빌드의 fuse를 확인했다.
- [ ] (M4 전, 선택) `security-review`로 한 번 더 검토한다.

---

## 6. 위험, 함정, 열린 항목

### 이 PC 환경의 함정 (다른 세션이 확인한 사실)

1. **Claude 데스크톱 앱이 MSIX 패키지다.** 앱 안의 도구 셸이 `%LOCALAPPDATA%`에 쓰는 파일(Electron 다운로드 캐시 등)은 패키지 가상 폴더로 들어가서 일반 터미널에서 보이지 않는다. `npm ci`, `npm run make`, Electron 다운로드는 **Terminal 패널이나 일반 터미널**에서 실행한다.
2. **도구 상태.**
   - WiX, NSIS, Inno Setup이 없고 코드 서명 인증서도 없다.
   - Forge Squirrel maker는 이 도구들이 없어도 동작한다. 서명은 도그푸딩 동안 하지 않는다.
   - 외부 배포 때는 OV 인증서나 MS Store MSIX를 쓴다. 한국 개인은 Azure Artifact Signing을 쓸 수 없다.
3. **비공개 저장소.** GitHub Release 파일은 로그인 없이 받을 수 없다. 공개 다운로드와 자동 업데이트에는 별도 위치(R2·S3 등)가 필요하다. Phase B 출시 과제다.
4. **`python` 명령이 hermes venv로 잡힌다.** 파이썬 스킬 트랙을 접었으므로 영향이 없다.

### 위험

0. **도그푸딩 로그인 자격 (2026-10-29 공식 문서로 확인).**
   - **승인과 데모 앱 없이 바로 시험할 수 있다.**
     - Cookbook은 대상을 "open-source projects, personal projects that run locally, and selected private apps"로 적는다.
     - 셀프 등록 흐름은 "needs neither a client secret nor a partner API key"이다.
     - 관심 신청서는 "paid or remotely hosted app"으로 사용자에게 내놓기 전에만 필요하다.
   - 신청서에 무엇을 적는지, 데모가 필요한지는 공개되어 있지 않다.
   - M0 S1에서 추가로 확인할 것:
     - 동의 화면에서 `chatgpt.tokens.use.direct`가 부여되는지
     - `subscription_sharing_user_not_eligible` 오류(403, 사용자·워크스페이스·정책 제한)나 지역 정책 403이 나오는지
   - 배포하기 전에 OpenAI 약관과 DevKit 라이선스를 검토한다.
1. **SIWC 자격.** 셀프 등록 흐름은 "로컬에서 도는 개인 프로젝트"까지만 허용한다. Phase A 빌드는 창업자 PC 밖으로 내보내지 않는다. 랜딩 다운로드 버튼은 계속 fake door로 둔다. 테스터에게 주려면 Phase B나 C가 먼저 필요하다.
2. **확인되지 않은 프리뷰 파라미터.** reasoning item 재전송, `include`, 구조화 출력, 포트 변경이 해당한다. M0에서 확인하고, 영향은 `responses.ts`, `auth.ts`, `cards.ts` 안에 가둔다.
3. **매 턴 전체 이력 재전송.** 플랜 사용량을 빨리 쓰고 컨텍스트 한도에 걸린다. v1은 오류를 안내하는 데서 멈춘다. 압축은 범위 밖이다.
4. **Electron 45 main의 `node:sqlite`와 Forge 8 + React + Vite 8 호환.** 둘 다 확인되지 않았다. M0에서 확인하고, 막히면 better-sqlite3나 electron-vite로 간다.
5. **Electron 8주 주기.** 46(2027-01 예정)에서 sync safeStorage가 제거된다. async만 쓰고 금지 패턴 테스트로 막는다.
6. **랜딩 약속 문구.** "내 ChatGPT 구독(Plus·Pro)으로 써요"는 Phase B(창업자가 비용 부담) 때 다시 봐야 한다.

### 열린 항목 (창업자 결정, 괄호 안은 제안)

- **O1** 잠긴 추천 칸을 눌렀을 때 동작. (설명과 "이걸로 시작" 버튼으로 새 대화와 초안. D에서 확정)
- **O4** 유닛 헤더("섹션 n, 유닛 m")를 무엇에 대응시킬지. (과목명과 경험 수. D에서 확정)
- **O5** 카드를 아직 만들지 않은 진행 중 대화를 경로의 "진행 중" 칸으로 보일지, 사이드바 목록에만 둘지. (D에서 확정. 어느 쪽이든 item이 0개인 대화는 보이지 않는다)
- **O8** 추적되지 않는 Codex 변환본(`.agents/skills/verify-landing`, `.codex/agents/*`)을 커밋할지 지울지.
- **O9** 채팅 답변을 마크다운으로 렌더할지(`react-markdown`, raw HTML 끔, 링크는 텍스트), 평문으로 둘지. (D에서 확정)
- **O10** M0 S1이 실패했을 때 Phase A를 무엇으로 대신할지.
- **O11** 기본 모델 ID. (M0의 `/v1/models` 결과를 보고 정함)
- **O12** 앱 이름과 ID(Experii/Experi). `appUserModelId`, userData 폴더 이름, 설치 파일 이름에 쓰인다.
- **O13** 랜딩 PRD 6장의 "모바일" 문구 정리.

### 이 계획 밖에서 따로 하는 일

- **Grok PR 리뷰 봇**은 별도 세션에서 계획한다. 하네스 작업이다.
  - 구성: GitHub Actions에서 xAI API를 불러 PR을 리뷰하고, "merge 가능 / 수정 필요" 라벨과 댓글을 단다.
  - 최종 merge는 창업자가 승인한다.
- 이 데스크톱 계획의 PR들도 봇이 생기면 그 흐름을 탄다. 생기기 전에는 창업자가 직접 리뷰하고 merge한다.

### 구현 때 볼 핵심 파일

- `README.md`(신규), `PRD.md`, `docs/desktop/{prd,tsd}.md`(신규), `docs/archive/README.md`(신규)
- `scripts/agents/gates.mjs`, `scripts/agents/session-start.mjs`(log 경로 버그), `.github/workflows/landing-ci.yml`, `desktop-ci.yml`(신규)
- `.agents/plan.md`(보호 경로, 범위 밖 줄), `.agents/routines/{implementer,verifier,chief-of-staff}.md`, `.agents/briefs/_TEMPLATE.md`
- `.claude/skills/verify-landing/`, `.claude/rules/tool-priority.md`, `.claude/launch.json`
- `apps/desktop/src/main/{index,security,responses,auth,cards}.ts`(신규)
- 참고 재료: `landing/components/app-window/AppWindow.tsx`, `landing/components/loop/ExperienceCard.tsx`, `landing/design/DESIGN.md`, `docs/archive/TSD_MVP_V1.md`(민감 정보 정규식), `docs/archive/Pre_MVP/prd.md`(카드 템플릿)
- 트랙 B: `scripts/agents/{handoff,resume,register-tasks}.ps1`(신규), `.agents/routines/{implementer,verifier}.md`, `.claude/skills/verify-desktop/`(신규), `scripts/agents/session-start.mjs`, `scripts/agents/guard.mjs`

---

## 7. 트랙 B: PC↔클라우드 이어달리기 (하이브리드 개발)

### 7.1 목표

| 상황 | 누가 개발하나 |
|---|---|
| PC를 쓰는 동안 | 창업자와 로컬 세션 |
| PC가 절전에 들어가면 | 같은 일감을 클라우드 세션이 이어서 |
| PC를 다시 켜면 | 클라우드가 멈춘 지점부터 PC가 다시 |

두 곳이 같은 브랜치를 동시에 고치지 않도록 **바통(작업권)은 하나만** 둔다. 바통을 쥔 쪽만 커밋하고 push한다.

### 7.2 지금 바로 쓸 수 있는 수동 방법 (설치할 것 없음)

- **자리를 뜰 때:** Claude 앱 제목 표시줄의 "Continue in cloud"를 누르거나, 세션에 "클라우드로 이어서 해 줘"라고 말한다.
  - 앱이 브랜치를 push하고, 대화 요약을 붙인 클라우드 세션을 만든다. 대화 맥락이 그대로 넘어간다.
  - 커밋되지 않은 변경이 있으면 거부되므로 먼저 커밋한다.
- **절전에 대해:** 앱은 Claude가 일하는 동안 PC가 유휴 절전에 들어가지 않게 막는다. 뚜껑을 닫거나 직접 절전을 고르는 것은 막지 못한다.
- **돌아올 때:** 브랜치를 pull해서 이어 간다. 클라우드 세션을 다시 로컬 세션으로 가져오는 기능이 있는지는 B0에서 확인한다.

### 7.3 자동 방법 설계

> **루틴과 루틴 API란.**
> - **루틴(예약 작업)**: claude.ai 클라우드에 저장해 둔 Claude 작업이다. 정해진 시각에 저절로 돈다.
>   - 이 저장소에는 이미 3개가 있다: `experii-chief-of-staff`, `experii-implementer`, `experii-verifier`.
>   - 지시 내용은 `.agents/routines/*.md` 파일에 있다.
> - **루틴 API**: 루틴을 시각과 상관없이 "지금 실행"시키는 인터넷 주소다. 외부 프로그램이 토큰을 붙여 부른다. 앱의 "지금 실행" 버튼과 같은 일을 한다.
>   - 이미 쓰는 곳이 있다. Slack 중계 앱 Experii Relay가 인입 채널의 글을 보면 이 API로 Chief of Staff를 바로 띄운다. 토큰은 Relay의 `ROUTINE_TOKEN`이고, `.agents/hitl.md`에 적혀 있다.
>   - 트랙 B에서는 `handoff.ps1`이 PC가 잠들기 직전에 이 API로 `experii-implementer`를 깨운다.
>   - 이 토큰이 있으면 누구나 루틴을 실행할 수 있다. 그래서 Windows 자격 증명 관리자에만 보관한다.
>
> **왜 루틴을 쓰나.** PC가 잠든 뒤에는 PC가 아무것도 시작할 수 없다. 그래서 PC 밖에서 클라우드 작업을 깨워 줄 것이 필요하다.
>
> | 방법 | 사람 필요 | 비용 | 판단 |
> |---|---|---|---|
> | "Continue in cloud" | 창업자가 깨어 있어야 함 | Claude 플랜 | 수동 방법(7.2)으로만 쓴다 |
> | **루틴** | 없음. 시각, API, GitHub 이벤트로 저절로 시작 | Claude 플랜 | **채택.** 하네스의 implementer, verifier, CoS가 이미 루틴이고, 같은 클라우드 환경(`experii`)과 운영 파일을 그대로 쓴다. 매시간 일정(놓친 경우 대비)과 API "지금 실행"(즉시 넘기기)을 둘 다 지원한다 |
> | GitHub Actions에서 Claude Code 실행 (`claude-code-action`) | 없음 | Max 플랜(`claude setup-token`으로 만든 `CLAUDE_CODE_OAUTH_TOKEN`) 또는 API 키 + 비공개 저장소 Actions 분 | 대안. Windows 러너에서 바로 돌아 Electron 화면 검증이 쉽다. 하지만 Windows 러너는 Actions 분을 더 쓰고, 하네스를 새로 짜야 한다 |

**바통과 코드 위치:**
- 바통은 Linear 일감(SON-n)의 라벨이다: `lane:local`, `lane:cloud`, `lane:local-requested`.
- 같은 일감에 고정 댓글 `[lease] local until <시각>`을 하나 두고, 새로 달지 않고 계속 고쳐 쓴다. 폰에서도 보인다.
- 코드는 브랜치 `claude/son-n`에 있다.

**동작:**
1. **체크포인트마다 push.** 로컬 세션은 테스트를 통과한 커밋마다 `claude/son-n`을 push하고 lease를 45분 뒤로 늘린다. 갑자기 절전되어도 잃는 것은 마지막 체크포인트 이후의 작업뿐이다.
2. **절전 직전 넘기기** (`handoff.ps1`).
   - 실행 시점: Windows 작업 스케줄러가 다음 두 경우에 실행한다.
     - 유휴 N분. N은 절전 시간보다 짧게 잡는다.
     - 절전 진입 이벤트(Kernel-Power 42).
   - 하는 일:
     1. wip 커밋을 만들고 push한다.
     2. 라벨을 `lane:cloud`로 바꾼다.
     3. 루틴 API로 `experii-implementer`를 "지금 실행"한다.
     4. Slack `#experii-ops`에 `[handoff:cloud SON-n]`을 남긴다.
3. **놓친 경우 대비.** 뚜껑을 닫았거나 배터리가 떨어졌거나 충돌한 경우다. implementer 루틴이 매시간 돌면서 `lane:local`인데 lease가 만료된 desktop 일감을 집어, 마지막으로 push된 지점부터 이어 간다.
4. **PC로 돌아오기** (`resume.ps1`).
   - 실행 시점: 절전에서 깨어남, 로그온, 잠금 해제 이벤트.
   - 흐름:
     1. 스크립트가 라벨을 `lane:local-requested`로 바꾼다.
     2. 클라우드 implementer는 커밋할 때마다 라벨을 확인한다. 이 라벨이 보이면 wip를 push하고 `lane:local`로 바꾼 뒤 멈춘다.
     3. 스크립트가 브랜치를 pull하고 Slack에 `[handoff:local SON-n]`과 클라우드 세션 링크를 남긴다.
     4. 창업자가 Claude 앱에서 그 일감으로 세션을 연다. 브리프, 브랜치, 클라우드 세션 기록을 읽고 이어 간다.
5. **클라우드(Linux)가 할 수 있는 것과 없는 것.**

   | 일 | 하는 곳 |
   |---|---|
   | 코드, 단위 테스트, 타입 검사 | 클라우드. `ELECTRON_SKIP_BINARY_DOWNLOAD=1`로 돌린다 |
   | Windows 전용 확인, `_electron` 스모크 | GitHub `desktop-ci`(windows-latest). 스크린샷을 artifact로 남긴다 |
   | 판정 | verifier가 그 스크린샷을 증거로 판정한다(신규 `verify-desktop` 스킬) |
   | 화면 시안이 필요한 일 | 클라우드가 시안 스크린샷을 Slack `[ask SON-n]`으로 올리고 그 일감만 멈춘다(`ui-change.md`의 브리프 규칙) |

### 7.4 바뀌는 하네스 규칙 (사람이 커밋하고 창업자가 승인)

- **로컬 레인 push.** "push 금지"를 "`claude/*` 브랜치만 push 허용, main push와 병합은 계속 금지"로 바꾼다.
  - 고칠 곳: `CLAUDE.md` 하네스 절, `.agents/plan.md` 원칙 5 보완.
  - `guard.mjs`를 로컬에서도 켠다. 지금은 클라우드에서만 켜진다.
- **implementer.** `desktop-*` 일감은 바통이 cloud일 때만 집는다. 커밋할 때마다 바통을 확인한다.
- **session-start.mjs.** desktop 의존성도 설치한다. Electron 바이너리는 받지 않는다.
- **무인 허용 (pstack 원칙 1).** 첫 클라우드 이어받기 1회를 "지켜보는 1회"로 본다. 창업자가 확인한 뒤에 `unattended.md`에 `desktop-feature`를 올린다.
- **토큰 보관.** 루틴 API 토큰과 Linear 토큰은 Windows 자격 증명 관리자에만 둔다. 레포와 로그에는 쓰지 않는다.
- **push 충돌.** force push는 계속 금지다. 동시 작업으로 push가 충돌하면 non-fast-forward로 거부되므로 덮어써지는 일은 없다.

### 7.5 단계

| 단계 | 내용 | 완료 조건 | 크기 |
|---|---|---|---|
| **B0** 확인 | `powercfg /a`로 이 PC의 절전 방식(Modern Standby 또는 S3)을 본다. 절전 진입 이벤트에서 스크립트가 push까지 끝내는지, 유휴 트리거, 루틴 API 호출, Linear 댓글 갱신, 클라우드 환경에서 desktop `npm ci`의 네트워크 허용, 클라우드 세션을 로컬로 다시 가져오는 기능을 확인한다 | TSD에 결과 표가 있다 | 반나절 |
| **B1** 바통과 스크립트 | `handoff.ps1`, `resume.ps1`, 작업 스케줄러 등록 스크립트, implementer와 CoS 루틴 수정, session-start 수정 | 손으로 넘기기 → 클라우드 실행 → 되돌아오기 왕복 1회가 된다 | 1일 |
| **B2** verify-desktop | desktop-ci 스크린샷 artifact, `verify-desktop` 스킬, verifier 루틴 | 미끼 PR은 fail, 진짜 PR은 pass | 1일 |
| **B3** 지켜보는 1회 | 실제로 절전에 들어가 넘기고, 아침에 결과를 확인한다 | `unattended.md`에 등록되었다 | 하룻밤 |

**선행 조건:**
- 단계 3(뼈대와 `desktop-ci`)이 끝나야 한다.
- 하네스 4단계(landing 지켜보는 1회)가 끝나야 한다. 3층 구조가 한 번 검증된 뒤에 desktop을 얹는다.
- 하네스 파일을 '로렌 탄의 3층 구조 계획' 세션과 같이 고치므로 두 세션의 순서를 맞춘다.

**위험:**
- **절전 순간 네트워크가 끊겨 push가 실패할 수 있다.** 체크포인트 push와 lease 만료가 보완한다.
- **클라우드 사용량.** 밤새 도는 만큼 쓴다. implementer는 1레인으로 시작한다.
- **클라우드는 Windows 화면을 직접 볼 수 없다.** 화면 판정은 Windows CI 스크린샷과 창업자의 폰 확인으로 한다.

---

## M0 확인된 사실

단계 1(M0)에서 채운다. 결과마다 통과·실패와 그에 따른 결정을 적는다.

| 항목 | 결과 | 결정 |
|---|---|---|
| SIWC 셀프 등록(`dynamic_agent_client`)과 발급 `client_id` | | |
| loopback 포트 변경 허용 | | |
| `chatgpt.tokens.use.direct` 부여, 지역·정책 403 여부 | | |
| `/v1/models` 목록과 기본 모델 | | |
| `store:false` 2턴 재전송, reasoning item·`include`, item id 유지·제거 | | |
| 구조화 출력: `json_schema` strict / strict tool / zod 재시도 | | |
| refresh 회전, 로그아웃 뒤 `client_id` | | |
| Forge 8 + Vite 8 + plugin-react HMR (Windows) | **통과** (2026-10-29). Electron 45.1.0(Node 24.22.1), Forge 8.0.1, Vite 8.3.5, `@vitejs/plugin-react` 6.1.2. 파일을 고치면 새로고침 없이 반영된다(Playwright로 확인). scaffold 명령은 `npx create-electron-app@latest apps/desktop --template vite --typescript --skip-git`이다. `--template=vite-typescript`는 Forge 8에서 없어졌다. `npm start`는 터미널을 탭형 화면으로 바꾼다(`q` 종료, `r` 재시작) | Forge 8 유지. electron-vite로 바꾸지 않는다 |
| 번들된 main에서 `node:sqlite` WAL, `VACUUM INTO` | **통과**(SQLite 3.53.4, 한글 왕복, 개발 빌드와 패키지 exe 모두). 처음에는 실패했다. Vite가 접두사 전용 내장 모듈 `node:sqlite`를 몰라 빈 객체로 바꿔 넣었다. `vite.main.config.mts`의 `build.rolldownOptions.external`에 `node:sqlite`를 넣어 해결했다 | **`node:sqlite` 채택.** better-sqlite3는 쓰지 않는다 |
| `safeStorage` async 왕복 | **통과**. `isAsyncEncryptionAvailable()`은 `Promise<boolean>`이고 true였다. `decryptStringAsync`는 `{result, shouldReEncrypt}`를 돌려준다. sync API는 타입 정의에 Deprecated로 표시돼 있다 | 계획대로 async만 쓴다 |
| `app://` 위 Vite 자산 경로 | **통과**(개발 빌드와 fuse가 켜진 패키지 exe 모두). renderer 출력 `../renderer/main_window`를 `protocol.handle`로 내보냈고 콘솔 오류와 로드 실패가 0건이다 | **app:// 채택** |
| Playwright `_electron` 실행 | **통과**. `npm run package` 뒤 `electron .`을 실행하는 스모크가 2.2초에 끝난다. dev 모드에서는 템플릿이 DevTools 창을 따로 열어서 `firstWindow()`가 DevTools를 잡을 수 있다 | e2e는 빌드 결과로 돌린다. M1에서 DevTools 자동 열기를 뺀다 |
| 템플릿이 추가한 것과 모듈 형식(`type`, 설정 확장자) | `package.json`에 `type`이 없다. 설정은 `.mts`, main과 preload 출력은 `.vite/build/{main,preload}.cjs`다. 템플릿이 oxlint와 oxfmt(`lint` 스크립트), maker 4종(squirrel, zip, rpm, deb), FusesPlugin을 넣었다. 템플릿 oxfmt 0.41의 하위 패키지 tinypool에 치명 취약점 2건이 있어 최신으로 올렸다. 운영 의존성 취약점은 0건이다 | 엔트리는 `src/main.ts`, `src/preload.ts`로 둔다. `index.ts`로 바꾸면 출력 이름이 겹친다. 모듈은 `src/main/*`에 둔다. 패키지 이름과 productName(`desktop`)은 O12 결정 뒤 바꾼다 |
