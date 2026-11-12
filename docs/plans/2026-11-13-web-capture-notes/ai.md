# 웹 앱 공개 실험 v0: 캡쳐 → 자동 필기 (AI용 실행 계획)

- **승인:** 2026-11-13 03:10 사전 승인. 창업자: "아침 9시에 확인하러 올게. 계획 수립하고 진행해줘." 1쪽 요약의 "정해 줄 것"은 추천안으로 진행한다.
- **1쪽 요약:** `docs/plans/2026-11-13-web-capture-notes/human.md`
- **사람이 본 것은 1쪽 요약이고 이 파일이 실행 기준이다.** 단계를 마칠 때마다 맨 아래 "진행 기록"에 한 줄을 남긴다.
- **창업자 요청 원문:** 같은 폴더 `founder-request.md`(메인 작업본 `prompt.md` 복사본).
- **작업 위치:** 워크트리 `C:\Users\chewo\Experii\.claude\worktrees\web-capture-notes`, 브랜치 `claude/web-capture-notes`(upstream 없음), 기준 `origin/main` d3bc1ca. 대화형 로컬 세션이라 이 브랜치 push와 PR 열기까지 한다. main push와 병합은 하지 않는다.
- **마감:** 09:00 창업자 확인. 07:50에는 남은 일과 상관없이 S7b(배포·PR)를 시작한다.
- **초안:** planner 에이전트(opus)가 03:10~03:24에 썼고, 실행 AI가 실제로 막힌 것과 확인한 것을 반영해 고쳤다(2장 "초안에서 바뀐 것").

## 0. 시간표와 줄일 순서

| 목표 시각 | 단계 | 병렬 |
|---|---|---|
| 03:10–03:40 | S1 골격, S2 DB | 함께 |
| 03:30–04:30 | S0 문서 | writer 하위 에이전트, S3~S5와 병렬(파일 안 겹침) |
| 03:40–04:40 | S3 어댑터·목·라우트 | S1·S2 뒤 |
| 04:40–06:10 | S4 보드·캡쳐 UI | S3 뒤 |
| 06:10–06:50 | S5 대화 패널(목) | S4와 일부 병렬 |
| 06:50–07:50 | S6 테스트·E2E·화면 확인, S7a Vercel 자리 | |
| 07:50–08:35 | S7b 운영 배포·PR | S6 뒤 |
| 08:35–08:55 | S8 보고 | 마지막 |

늦어지면 이 순서로 줄인다. ① drag-from-chat(S5b) ② 좁은 화면 다듬기(가로 넘침 0만 남김) ③ 대화 패널 표·코드 다듬기. **줄이지 않는 것:** 초대 게이트, 캡쳐 → 제안 → 넣기 → 새로고침 뒤 유지, 목 전용, 운영 배포, PR, 보고서.

## 1. 목표와 완료 조건

`apps/web/` Next.js 웹 앱. 초대 링크로 로그인 없이 들어와 AI(지금은 목)와 대화한다. 캡쳐를 보드에 붙이면 60초 안에 필기 제안(NoteBlock)이 생기고, 확인한 제안은 스티키로 보드에 남는다. 데이터는 Supabase에 서버 저장한다. experii.vercel.app에 배포하고 PR을 연다.

| ID | 조건 | 판정 |
|---|---|---|
| C1 | PRD 정식 개정 | `docs/app/prd.md`에 웹 공개 실험 v0 장과 FR-W 목록이 있다. `docs/desktop/prd.md`는 `git mv`로 옮겨 없다. `docs/web/tsd.md`가 있다. `PRD.md` 색인에 `apps/web/` 행과 PR #21 충돌 항목이 있다. 현재 문서의 옛 경로 링크가 없다(과거 계획 기록 `docs/plans/2026-10-30-*`는 둔다) |
| C2 | 빌드 | `apps/web`에서 `npm run typecheck && npm test && npm run build`가 종료 코드 0 |
| C3 | 로컬 E2E | `apps/web`에서 `npx playwright test --project=local` 전부 통과: 게이트, 붙여넣기 → 60초 안에 제안 1개 이상 → 모두 넣기 → 새로고침 뒤 유지, 실패·빈 결과, 대화, 1440·1280·390 가로 넘침 0 |
| C4 | 실 API 없음 | `git grep -nE "sk-ant-[A-Za-z0-9]" -- apps/web docs`가 비어 있다. Vercel env가 `CLAUDE_ADAPTER=mock`이고 `ANTHROPIC_API_KEY`가 없다(`vercel env ls`). 단위 테스트가 "env가 없으면 mock, `CLAUDE_ADAPTER=anthropic`과 키가 둘 다 있을 때만 anthropic"을 확인한다 |
| C5 | DB | `web_pages`, `web_messages`, `web_captures`, `web_notes`, `web_usage` RLS 켜짐. 헤더 없는 publishable 요청은 빈 결과, 방문자 B는 A의 행·이미지를 읽거나 쓰지 못한다(시험 스크립트 결과). `get_advisors(security)`에 `web_` 관련 ERROR 없음. 버킷 `web-captures`가 `public=false` |
| C6 | 운영 배포 | `vercel inspect <운영 URL>` READY, target production. https://experii.vercel.app(안 되면 기록한 대체 주소)에서 `--project=prod` 스모크 통과 |
| C7 | 미리보기 | PR에 Vercel 미리보기 배포 READY(Git 연결이면 `gh pr checks`, 아니면 CLI 미리보기 URL과 `vercel inspect`를 PR 본문에) |
| C8 | PR | `gh pr view --json state,baseRefName,headRefName`이 OPEN, `main` ← `claude/web-capture-notes`. 본문에 실연동 체크리스트, 초대 코드·키·토큰 모양 문자열 없음 |
| C9 | 다른 앱 영향 없음 | `git diff --stat origin/main...HEAD -- landing apps/desktop/src apps/desktop/tests apps/desktop/package.json`가 비어 있다 |
| C10 | 보고서 | `C:\Users\chewo\reports\Experii\2026-11-13-web-capture-notes.html`이 `check.sh` "판정: 통과", `open.ps1 -NoOpen`이 URL 출력 |

## 2. 확인된 사실

| 사실 | 근거 | 설계에 주는 영향 |
|---|---|---|
| 창업자 결정: 웹 범위 "보드+캡쳐필기만", 톤 B, 키는 서버(창업자 부담, 지금은 목), 서버 저장, PRD 정식 개정 | `founder-request.md:164-169` | 범위와 문서 방식 |
| 성공 정의: 초대 링크가 있는 누구나, 로그인 없이 바로 학습, 첫 안내 문구, UI는 데스크톱과 동일, `experii.vercel.app`, 60초 안에 필기 블록 N개 + Vercel Preview 통과 | `founder-request.md:28-31` | C3·C6·C7 |
| 앱은 데스크톱·웹 두 버전, PRD는 같고 TSD는 다를 수 있다. 랜딩은 별도 PRD·TSD | `founder-request.md:55` | `docs/app/prd.md` 공통, TSD 둘, 랜딩 그대로 |
| 실 Anthropic 호출·키 요구 금지, 단일 인터페이스 + 목(지연·실패 흉내), 어댑터 경계, 키는 서버 env만 | `founder-request.md:75-81` | S3 |
| NoteBlock 필드와 규칙(사실만, `[redacted]`, 0개+이유, 최대 8개, 확인 후 넣기 추천) | `founder-request.md:87-120` | S3 스키마와 프롬프트 |
| 데스크톱 PRD: FR-16 원문 그대로, 6장 "GPT가 필기를 다듬어 주는 기능" 미룸, 8장 "SQLite에만, Experii 서버 없음" | `docs/desktop/prd.md:54`, `:61`, `:73-77` | 웹 단계는 다듬기(톤 B)와 서버 저장의 예외임을 PRD에 적는다 |
| TSD 원칙: 각 앱은 독립 npm 프로젝트(workspaces 안 씀) | `docs/desktop/tsd.md:94-95` | `apps/web` 독립, 데스크톱 코드는 복사 |
| 보드 구현 `NotePage.tsx`, `canvas.ts`(MIN 0.25, MAX 2, NOTE_W 264), View는 localStorage | `apps/desktop/src/renderer/` | S4에서 보드만 옮긴다(Pin·Next·탭 제외) |
| 디자인 토큰 원본 `styles/tokens.css` 외 11개 | `apps/desktop/src/renderer/styles/` | 전부 `apps/web/app/styles/`로 복사(출처 d3bc1ca) |
| 비밀 가림 정규식 | `apps/desktop/src/main/redact.ts:7-23` | `apps/web/lib/redact.ts`로 복사, 표시는 `[redacted]` |
| 저장소 `IBORY-PURPLE/Experii`는 **PUBLIC** | `gh repo view` | 초대 코드, 키, publishable 키도 커밋·PR 본문에 넣지 않는다 |
| GitGuardian은 PR 커밋의 토큰 모양 문자열을 잡는다 | 메모리 experii-gitguardian-fixtures | 가림 테스트의 가짜 토큰은 실행 중에 이어 붙여 만든다 |
| Supabase Experii(ref `swbkvwcznphawuredshr`)가 일시정지(INACTIVE)였다. 03:10 MCP `restore_project` 성공, ACTIVE_HEALTHY 확인 | MCP | 무료 플랜은 7일 무요청 시 정지(R5) |
| **Supabase secret 키를 CLI로 꺼내는 명령은 권한 규칙(Credential Materialization)에 막혔다** | 03:3x 도구 거부 | 서버는 secret 키 없이 publishable 키 + `x-visitor-id` 헤더 + RLS로 쓴다(3.4). 시험 스크립트로 격리 확인 |
| **Supabase 인증 설정 `config push`는 확인 질문에 n을 넣었는데도 첫 실행이 적용됐다.** 바뀐 값: site_url `localhost:3000→127.0.0.1:3000`, redirect URL 추가, MFA TOTP 끔, 이메일 가입 확인 끔(`mailer_autoconfirm: true`), 이메일 발송 간격 1m→1s, 이메일 OTP 8→6자리. 되돌리는 push는 권한 규칙(Modify Shared Resources)에 막혀 못 했다. 익명 로그인은 꺼진 그대로다 | 첫 diff 출력, `GET /auth/v1/settings` | 이 프로젝트는 Supabase Auth를 쓰지 않아 지금 영향은 없다. 창업자가 대시보드에서 되돌린다(5장) |
| Claude: 현재 기본 모델 `claude-opus-5-5`, 강제 `tool_choice`(any/tool)는 Opus 5.5·Sonnet 5.5에서 400. 구조화 출력은 `output_config.format`(`messages.parse` + zod 헬퍼). 이미지 긴 변 2576px까지(고해상도 모델). 5.x 모델은 서버 쪽 `fallbacks: "default"`(베타 `server-side-fallback-2026-07-01`) 권장 | `claude-api` 스킬 | 어댑터는 `client.beta.messages.parse` + `betaZodOutputFormat`, 거절(`refusal`)은 실패로 처리 |
| `@anthropic-ai/sdk` 1.8.0에 `helpers/beta/zod`의 `betaZodOutputFormat`, `beta.messages.parse`, `fallbacks` 타입이 있다 | `node_modules/@anthropic-ai/sdk` d.ts, `tsc` 통과 | |
| Vercel 함수 요청 본문 한도 약 4.5MB(planner 지적, 문서 확인은 S3에서) | | 업로드는 4MB 이하로 막는다 |
| Next.js 16은 `middleware`가 `proxy.ts`로 이름이 바뀌었다 | `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` | 초대 처리는 `proxy.ts` |

### 초안에서 바뀐 것

1. DB 접근: secret 키 + 서명 쿠키(`SESSION_SECRET`) → **publishable 키 + `x-visitor-id` 헤더 + RLS 정책**. 방문자 ID는 무작위 UUID, httpOnly 쿠키. 이유: secret 키 꺼내기가 막혔고, 이 방식은 서버에 비밀이 없고 DB가 격리를 강제한다.
2. 구조화 응답: 강제 도구 호출 → **구조화 출력(`output_config.format`)**. 이유: 현재 모델에서 강제 `tool_choice`가 400.
3. 기본 모델: "코드에 기본 ID 없음" → **기본 `claude-opus-5-5`, `CLAUDE_MODEL`로 바꿈**. 창업자 프롬프트 후보 `claude-sonnet-4-5`도 넣으면 그대로 쓴다(이 경우 `CLAUDE_EFFORT`는 비워 둔다).
4. 목 시나리오: 파일 이름 → **목 모드에서만 받는 `x-experii-mock` 헤더(ok/empty/fail/slow)와 아주 작은 이미지(48px 미만)는 빈 결과**. 붙여넣기 이미지는 이름이 늘 `image.png`라서다.
5. 이미지: 브라우저에서 긴 변 2048px로 줄이고 업로드 본문 4MB 이하.
6. SQL: `apps/web/db/0001_web_board.sql`(표·버킷), `0002_visitor_policies.sql`(RLS·캡쳐 생성 RPC·Storage 정책), `0003_quota.sql`(전체 한도·대화 한도). `supabase/migrations`에 두지 않는다(누가 `db push`를 하면 랜딩 기록과 섞인다). 적용은 `supabase db query --linked -f`(마이그레이션 기록을 남기지 않음, scratchpad의 링크 폴더 사용).

## 3. 설계 요약

### 3.1 폴더

```
apps/web/
  package.json  tsconfig.json  next.config.ts  vercel.json  .gitignore  .env.example
  vitest.config.mts  playwright.config.ts  proxy.ts
  app/layout.tsx  app/page.tsx  app/robots.ts  app/styles/*.css(데스크톱 복사 + web.css)
  app/api/pages/route.ts                     GET 목록, POST 새 페이지
  app/api/pages/[id]/route.ts                GET 상세, PATCH 제목, DELETE
  app/api/pages/[id]/chat/route.ts           POST 대화(스트리밍)
  app/api/pages/[id]/captures/route.ts       POST 업로드 → after()로 필기 생성
  app/api/pages/[id]/notes/route.ts          POST drag-from-chat(S5b)
  app/api/captures/[id]/route.ts             GET 상태+제안, PATCH 위치, DELETE
  app/api/captures/[id]/retry/route.ts       POST
  app/api/captures/[id]/image/route.ts       GET 이미지(방문자 소유만)
  app/api/notes/place/route.ts               POST 제안 넣기(여러 개)
  app/api/notes/[id]/route.ts                PATCH 위치, DELETE
  components/  App, Sidebar, Board, CaptureTile, ChatPanel, Markdown, Panes, Logo, icons, canvas, image(리사이즈), api(fetch)
  lib/claude/  types.ts prompt.ts mock.ts anthropic.ts normalize.ts index.ts
  lib/  types.ts invite.ts redact.ts  lib/server/ db.ts http.ts store.ts
  db/0001_web_board.sql  db/0002_visitor_policies.sql  db/0003_quota.sql
  tests/unit/*.test.ts  tests/e2e/*.spec.ts
```

### 3.2 Claude 어댑터 계약 (`lib/claude/types.ts`)

- `ClaudeAdapter { name: 'mock'|'anthropic'; model; generateNotesFromCapture(input, signal) → CaptureNotesResult; streamChat(turns, signal) → AsyncIterable<string> }`
- `CaptureNotesResult = { notes: NoteBlock[]; reason: string|null; redacted: number }`, `NoteBlock = { text, kind, source_region: top|middle|bottom|full|null, confidence: number|null, raw_excerpt: string|null }`.
- 앱이 부르는 함수는 `generateNotesFromCapture(input)`(`lib/claude/index.ts`) 하나다. 어댑터 결과는 늘 `normalizeResult`(zod 검증, 8개 자르기, 길이 자르기, 정규식 가림 2차, 0개면 이유 채우기)를 거친다.
- 고르기: `CLAUDE_ADAPTER=anthropic`이고 `ANTHROPIC_API_KEY`가 있으면 anthropic, 아니면 mock. `CLAUDE_MODEL`(기본 `claude-opus-5-5`), `CLAUDE_EFFORT`(선택, 비우면 보내지 않음).
- anthropic(작성만, 실행 안 함): `client.beta.messages.parse` + `betaZodOutputFormat(CaptureNotesSchema)`, base64 이미지 블록 + 지시문(`lib/claude/prompt.ts`), 5.x 모델이면 `fallbacks: 'default'`, `refusal`이면 실패. 대화는 `messages.stream`의 text_delta.
- mock: 기본 1.5초(`MOCK_DELAY_MS`), 결과의 첫 필기는 "[데모 필기] …"로 목임을 밝힌다. 대화는 "(데모 응답 …)"으로 시작하는 표·목록 예시 답을 조각으로 흘린다.

### 3.3 캡쳐 파이프라인

1. 보드 위 Ctrl+V(입력창이 아닐 때), 이미지 파일 끌어 놓기, [캡쳐 올리기] 버튼. png·jpg·webp만, 원본 20MB까지.
2. 브라우저(`components/image.ts`)가 긴 변 2048px 이하로 줄여 webp(안 되면 jpeg)로 다시 만든다. 4MB를 넘으면 거절.
3. `POST /api/pages/[id]/captures`(multipart `file,x,y,width,height`): 매직 바이트 확인 → Storage `web-captures/{visitor}/{page}/{uuid}.{ext}` 업로드 → RPC `web_create_capture`(페이지 소유·경로·하루 한도 확인 후 행 생성, `status=pending`) → 201 응답 → `after()`로 `runCapture`(어댑터 호출 58초 제한 → 제안 `state=suggested` 저장 → `done|empty|failed`).
4. 화면은 1.2초마다 `GET /api/captures/[id]`로 상태를 본다. 제안 목록: kind 이름표, 글, 확신 낮으면 흐리게 "확인해 보세요", [넣기]·[모두 넣기]·[빼기]. 넣으면 캡쳐 오른쪽 열에 아래로 쌓는다(`POST /api/notes/place`).
5. 실패: 원본 타일은 남기고 오류 + [다시 시도](최대 3번), 토스트. 150초 넘게 pending이면 서버가 실패로 바꾼다.
6. 첫 업로드 안내: "캡쳐는 Experii 서버에 저장되고, 필기를 만들려고 AI로 보내요. 비밀번호나 개인정보가 보이는 화면은 올리지 마세요." `redacted>0`이면 "비밀로 보이는 n곳을 가렸어요".

### 3.4 입장과 보안

- `proxy.ts`: `/?invite=<code>`가 `INVITE_CODES`(쉼표 구분)에 있으면 `exp_inv`(코드)와 `exp_vid`(무작위 UUID) 쿠키(httpOnly, SameSite=Lax, 운영은 Secure, 180일)를 주고 주소에서 코드를 지운다. `/api/*`는 두 쿠키가 맞아야 통과(401). 코드를 env에서 빼면 그 코드로 들어온 사람이 끊긴다. 바꾸는 API 요청은 Origin이 같은 호스트일 때만.
- 서버 → Supabase: publishable 키 + `x-visitor-id` 헤더. RLS(`public.web_visitor()`가 헤더에서 UUID를 읽음)가 행·이미지를 그 방문자 것으로 제한한다. 캡쳐 행은 RPC로만 만든다(한도 우회 방지). 브라우저에는 Supabase 키를 주지 않는다.
- 남는 위험: publishable 키는 공개 키라 누구나 무작위 방문자 ID로 자기 행을 만들 수 있다(남의 것은 못 봄). 캡쳐 수는 RPC 한도와 전체 한도가 막고, Storage 업로드는 버킷 크기·형식 제한만 있다(R3).
- 헤더: CSP(`img-src 'self' blob: data:`, `connect-src 'self'`, `frame-ancestors 'none'`), `X-Robots-Tag: noindex`, nosniff, Referrer-Policy. `robots.ts` Disallow.
- 대화 답은 데스크톱 `Markdown.tsx`(HTML 실행 안 함), 필기는 일반 텍스트로만 그린다.
- 목 모드 띠: "연습 모드예요. 지금 보이는 답과 필기는 예시예요."

### 3.5 env

| 이름 | 값 | 비밀 |
|---|---|---|
| `SUPABASE_URL` | `https://swbkvwcznphawuredshr.supabase.co` | 아님 |
| `SUPABASE_PUBLISHABLE_KEY` | MCP `get_publishable_keys`의 publishable 키 | 아님(공개 키), 그래도 저장소에는 안 넣는다 |
| `INVITE_CODES` | 무작위 코드 2개(창업자용, 공유용) | 반비밀. scratchpad와 로컬 보고서에만 |
| `CLAUDE_ADAPTER` | `mock` | 아님 |
| `CAPTURE_DAILY_LIMIT` / `CHAT_DAILY_LIMIT` | 30 / 100(코드 기본값과 같음) | 아님 |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_EFFORT` | **넣지 않는다**(창업자 몫) | 키는 비밀 |

## 4. 단계별 작업

- **S0 문서(writer 하위 에이전트):** `git mv docs/desktop/prd.md docs/app/prd.md` 후 앱 공통으로 고치고 웹 장(FR-W1~)을 더한다. `docs/web/tsd.md` 새로 쓴다. `PRD.md` 색인(apps/web 행, PR #21 충돌), `README.md`, `docs/archive/README.md`, `docs/desktop/tsd.md`의 PRD 링크, `apps/desktop/DESIGN.md`·`PRODUCT.md`의 링크를 고친다. 검증: C1.
- **S1 골격:** `apps/web` 패키지(2장 버전 고정), 설정 파일, 데스크톱 스타일 복사. 검증: `npm run typecheck`.
- **S2 DB:** `db/0001`, `0002`, `0003`을 `supabase db query --linked --workdir <scratchpad>/sb -f <절대경로>`로 적용. 검증: 표·정책 목록, 시험 스크립트(A/B 격리, 직접 insert 거부, 한도), `get_advisors(security)`.
- **S3 어댑터·라우트:** 3.2·3.3·3.4. 단위 테스트(normalize 9개 자르기·빈 결과 이유·범위, getAdapter 분기, mock 시나리오, redact(토큰은 실행 중 이어 붙임), 매직 바이트, 초대 코드). 검증: `npm run typecheck && npm test`.
- **S4 보드·캡쳐 UI, S5 대화 패널:** 데스크톱 `NotePage`·`ChatPanel`·`Sidebar`·`Panes` 옮기기, 새 요소(CaptureTile, 제안 목록, 첫 안내, 목 띠, 토스트, [캡쳐 올리기]). `apps/desktop/DESIGN.md` 규칙(칠한 버튼 하나, 파랑 자리 제한, 1px 윤곽선). 900px 미만은 패널을 기본으로 접는다. UI 시안 3개는 건너뛴다(창업자가 "데스크톱과 동일"로 정했고 자리에 없음, 보고서에 새 요소를 밝힘). S5b drag-from-chat은 07:30 전에 S6이 통과했을 때만.
- **S6 테스트:** Playwright `local`(build + start, `.env.local`)과 `prod`(`BASE_URL`, `E2E_INVITE` env) 프로젝트. 스펙: gate, capture(붙여넣기 → 60초 안 제안 → 모두 넣기 → 새로고침 유지 → 정리), failure(목 헤더 fail/empty), chat, layout(1440·1280·390 넘침 0, 콘솔 오류 0). 스크린샷은 `screen-reviewer`에게 넘긴다.
- **S7a Vercel 자리:** `vercel project add experii`(쓰이면 `experii-web`), Root Directory `apps/web`, `vercel git connect`(실패 시 CLI 미리보기), env 넣기(값 출력 금지), `vercel link`가 만든 `.env.local`의 토큰은 지운다.
- **S7b 운영 배포·PR:** 토큰 모양 검사(`git diff origin/main...HEAD | grep -nE "eyJ[A-Za-z0-9_-]{8,}\.|sb_publishable_|sb_secret_|sk-ant-"`가 비어야 함), `vercel deploy --prod`, `vercel inspect`, prod 스모크, 미리보기 READY, `gh pr create`(본문에 실연동 체크리스트·PR #21 정리 방법·새 UI 요소).
- **S8 보고:** `docs/web/tsd.md` 실제 값으로 마무리, HTML 보고서(`~/.claude/rules/html-report.md`), 채팅 맨 위 `# 할 일`.

## 5. 사람 차례 (09:00 창업자)

| 순서 | 할 일 |
|---|---|
| 1 | 보고서를 열고 초대 링크로 연습 모드 흐름을 한 번 해 본다 |
| 2 | **Supabase 인증 설정 되돌리기**(대시보드 Authentication): 이메일 가입 확인 켜기, Site URL `http://localhost:3000`, Redirect URL 비우기, MFA TOTP 켜기, 이메일 발송 간격 1분, OTP 8자리. 지금 Supabase Auth를 안 써서 급하지 않지만 원래대로 둔다 |
| 3 | Anthropic 콘솔에서 API 키 발급, 월 사용 한도 설정 |
| 4 | Vercel 프로젝트 env(production)에 `ANTHROPIC_API_KEY`, `CLAUDE_ADAPTER=anthropic`, 필요하면 `CLAUDE_MODEL`(기본 `claude-opus-5-5`, 더 싸게는 `claude-sonnet-5-5`)과 `CLAUDE_EFFORT=low`(응답 속도) |
| 5 | 다시 배포(대시보드 Redeploy 또는 `vercel deploy --prod`) |
| 6 | 실제 캡쳐 3장으로 60초 안, 톤 B, 한국어, 이미지에 없는 내용 없음, 비밀 가림을 본다 |
| 7 | PR 검토·병합, PR #21과의 순서 결정, 초대 링크 배포 여부와 데이터 보관 기간 결정 |

## 6. 멈춤 조건

창업자가 자리에 없으므로 "멈춘다"는 그 일만 멈추고 기록한 뒤 다른 단계를 계속한다는 뜻이다. 멈춘 일은 보고서와 채팅 `# 할 일`에 올린다.

- M1 Supabase가 안 되면 서버 저장 검증을 멈춘다. 새 프로젝트를 만들거나 다른 프로젝트를 정지하지 않는다.
- M2 Vercel 이름 `experii`가 안 되면 `experii-web`으로 진행·기록. M3 `experii.vercel.app` 별칭이 안 붙으면 받은 주소로 진행·기록.
- M4 Git 연결 실패 시 CLI 미리보기로 대체·기록.
- M5 실 Anthropic 키·호출이 필요해지면 그 일을 멈춘다.
- M6 로그인·2단계 인증·CAPTCHA·결제·유료 플랜이 필요하면 사람에게 넘긴다.
- M7 `landing/`이나 `apps/desktop/src` 수정이 필요해지면 멈춘다.
- M8 비밀값이 출력·파일·커밋에 노출되면 즉시 멈추고 지운다. push했으면 교체 필요를 기록한다.
- M9 목표·범위·비용이 human.md와 달라져야 하면 결정하지 않고 보고서에 선택지를 적는다.
- M10 권한 규칙에 막힌 동작은 우회하지 않고 사람 할 일로 올린다.

## 7. 위험과 대응

| ID | 위험 | 대응 |
|---|---|---|
| R1 | PR #21과 파일 이동·내용·결정 충돌 | 이동 커밋을 분리, 색인 "결정되지 않은 충돌"과 PR 본문에 정리 방법 (a) 이 PR 먼저 (b) #21 먼저 |
| R2 | anthropic 어댑터를 실제로 못 불러 봄 | 단위 테스트로 형식 고정, 오류 문구 표시, 아침 확인 목록 |
| R3 | 공개 링크 비용·남용 | 초대 코드, 한 사람 하루 캡쳐 30·대화 100, 전체 하루 캡쳐 300, RPC 상한 50. Anthropic 월 한도는 창업자 |
| R4 | 캡쳐 속 개인정보가 서버와 Anthropic으로 감 | 첫 업로드 안내, 모델+정규식 2중 가림, 캡쳐 지우기, 비공개 버킷. 보관 기간·처리방침은 열린 항목 |
| R5 | Supabase 무료 플랜 7일 무요청 정지 | 보고서에 keepalive 제안(이번에는 안 함) |
| R6 | Vercel 본문 한도 | 브라우저 리사이즈, 4MB 검사 |
| R7 | 미리보기가 Vercel 보호에 막힘 | 미리보기는 READY만, 화면 스모크는 운영 주소 |
| R8 | 데스크톱 스타일 두 벌 | TSD에 출처 커밋과 "함께 고친다" 규칙 |
| R9 | 목 필기를 진짜로 오해 | 목 띠, 첫 필기 "[데모 필기]", 응답의 `adapter` |
| R10 | Vercel Hobby 비상업 제한 | 초대 실험이라 그대로, 열린 항목 |
| R11 | 시간 부족 | 0장 줄일 순서, 07:50 S7b 시작 |
| R12 | Supabase 인증 설정이 의도와 달리 바뀐 채 남음 | 5장 2번, 보고서 맨 위 |

## 8. 범위 밖

로드맵, 경험 카드, 과목, 모델 고르기, ChatGPT 로그인, 계정, 동기화, 결제 / 실 Anthropic 호출, 키 발급·입력 / 데스크톱·랜딩 코드, 랜딩 PRD·TSD, PR #21·#22 수정 / 휴대폰 최적화(넘침 0과 안내까지) / 웹 CI 워크플로, 공유 디자인 패키지 / AI 정리(캡쳐 연결), 추천, keepalive cron, 직접 타이핑 메모 / 처리방침 문서, 자동 삭제

## 9. 진행 기록

| 날짜 | 단계 | 결과 | 근거 |
|---|---|---|---|
| 2026-11-13 03:10 | 조사 | Supabase Experii 일시정지 확인 후 복구 요청 | MCP restore_project success |
| 2026-11-13 03:15 | S1 | 워크트리·브랜치 생성(upstream 해제), `apps/web` 패키지 설치, 데스크톱 스타일·컴포넌트 복사 | `npm install` 179개 |
| 2026-11-13 03:20 | S3 일부 | 어댑터 계약·목·anthropic(작성만)·정규화 작성, 타입 검사 통과 | `npx tsc --noEmit` |
| 2026-11-13 03:25 | S2 | `db/0001_web_board.sql` 적용(표 5개 RLS on, 버킷 비공개) | `supabase db query --linked` 결과 |
| 2026-11-13 03:28 | S2 | secret 키 꺼내기 거부됨(권한 규칙) → 설계 변경 | 도구 거부 |
| 2026-11-13 03:30 | S2 | `config push` 미리보기가 첫 실행에 적용됨, 되돌리기 push는 권한 규칙에 거부 → 창업자 할 일 | 첫 diff, `/auth/v1/settings`(mailer_autoconfirm true, anonymous false) |
| 2026-11-13 03:35 | S2 | `db/0002_visitor_policies.sql` 적용, 시험: A만 자기 행·이미지 접근, B 읽기·쓰기·위조 거부, 헤더 없음 빈 결과, 캡쳐 직접 insert 거부 | 시험 스크립트 출력 |
