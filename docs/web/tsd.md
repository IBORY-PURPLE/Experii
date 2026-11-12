# Experii 웹 앱 TSD: 웹 공개 실험 v0

요구사항은 [앱 PRD](../app/prd.md) 10장이 기준이고, 이 문서는 `apps/web/`을 어떻게 만드는지 다룬다. 데스크톱 앱의 설계는 [데스크톱 TSD](../desktop/tsd.md)에 있다. 두 앱은 PRD를 같이 쓰고 TSD는 따로 둔다.

- **작성:** 2026-11-13. 근거는 [실행 계획 ai.md](../plans/2026-11-13-web-capture-notes/ai.md)의 2장 "확인된 사실"·"초안에서 바뀐 것"과 3장 "설계 요약"이다.
- **상태:** 이 문서를 쓸 때 API 라우트, 화면 컴포넌트 일부, `db/0003`은 아직 없었다. 그 부분은 설계 기준으로 적었고, 맨 아래 "확인 못 한 것"에 모았다.
- **갱신:** 2026-11-13 배포 뒤 실제 값으로 채웠다(배포 주소, 한도 함수, 테스트 결과).

## 1. 한눈에 보기

Next.js 앱 하나가 화면과 API를 함께 맡는다. 데이터는 Supabase(Postgres DB와 파일 저장소)에 두고, AI는 어댑터(바꿔 끼울 수 있는 연결부) 뒤에 둔다.

```
브라우저 ── 쿠키 exp_inv, exp_vid ──> proxy.ts ──> app/api/* (Vercel 함수)
                                                     ├─ lib/server ── publishable 키 + x-visitor-id ──> Supabase
                                                     │                                              (표 web_*, 버킷 web-captures, RLS)
                                                     └─ lib/claude ──> 목 어댑터 | Anthropic API
```

- 브라우저는 우리 API만 부른다. Supabase 키와 Claude 키는 브라우저에 가지 않는다.
- 캡쳐 이미지도 Supabase에서 바로 받지 않고 우리 API(`/api/captures/[id]/image`)로 받는다.

## 2. 스택

버전은 `apps/web/package.json` 기준이다(정확한 버전으로 고정).

| 항목 | 버전 | 쓰는 곳 |
|---|---|---|
| Node | 22.12 이상 | `engines` |
| Next.js (App Router) | 16.4.6 | 화면과 API 라우트 |
| React, React DOM | 19.3.1 | 화면 |
| TypeScript | 6.0.3 | 전체 |
| zod | 4.6.7 | 입력과 AI 응답 검증 |
| @supabase/supabase-js | 2.118.0 | 서버에서 DB와 저장소 접근 |
| @anthropic-ai/sdk | 1.8.0 | 실 Claude 어댑터 |
| react-markdown, remark-gfm | 10.1.0, 4.0.1 | 대화 답 표시(표, 코드) |
| pretendard | 1.3.9 | 글꼴 |
| server-only | 0.0.1 | 서버 전용 파일을 브라우저 묶음에서 막음 |
| vitest | 5.0.5 | 단위 테스트 |
| @playwright/test | 1.64.1 | 브라우저 E2E 테스트 |

- `apps/web`은 독립 npm 프로젝트다. 루트 `package.json`과 npm workspaces를 쓰지 않는다(데스크톱 TSD 1장과 같은 원칙).
- Next.js 16에서는 미들웨어 파일 이름이 `proxy.ts`로 바뀌었다. 초대 처리는 `apps/web/proxy.ts`에 있다.
- 데스크톱 코드는 가져다 쓰지 않고 복사한다(보드, 스타일, 비밀 가림 정규식).

## 3. 폴더 구조

```
apps/web/
  package.json  tsconfig.json  next.config.ts  vercel.json  .gitignore  .env.example
  vitest.config.mts  playwright.config.ts  proxy.ts
  app/layout.tsx  app/page.tsx  app/robots.ts
  app/styles/*.css                            데스크톱 복사본 11개 + web.css
  app/api/pages/route.ts                      GET 목록, POST 새 페이지
  app/api/pages/[id]/route.ts                 GET 상세, PATCH 제목, DELETE
  app/api/pages/[id]/chat/route.ts            POST 대화(스트리밍)
  app/api/pages/[id]/captures/route.ts        POST 업로드 → after()로 필기 생성
  app/api/pages/[id]/notes/route.ts           POST drag-from-chat
  app/api/captures/[id]/route.ts              GET 상태와 제안, PATCH 위치, DELETE
  app/api/captures/[id]/retry/route.ts        POST 다시 시도
  app/api/captures/[id]/image/route.ts        GET 이미지(그 방문자 것만)
  app/api/notes/place/route.ts                POST 제안 넣기(여러 개)
  app/api/notes/[id]/route.ts                 PATCH 위치, DELETE
  components/   App, Sidebar, Board, CaptureTile, ChatPanel, Markdown, Panes, Logo, icons,
                canvas(보드 좌표), image(브라우저 리사이즈), api(fetch 묶음)
  lib/claude/   types.ts prompt.ts mock.ts anthropic.ts normalize.ts index.ts
  lib/          types.ts invite.ts redact.ts
  lib/server/   db.ts http.ts store.ts
  db/           0001_web_board.sql  0002_visitor_policies.sql  0003_quota.sql
  tests/unit/*.test.ts  tests/e2e/*.spec.ts
```

## 4. 데이터 모델

SQL 원본은 `apps/web/db/`에 있다. 모든 표와 함수 이름은 `web_`으로 시작한다(5장).

### 4.1 표

| 표 | 주요 열 | 메모 |
|---|---|---|
| `web_pages` | `id`, `visitor_id`, `title`(1~80자, 기본 "새 공부"), `created_at`, `updated_at` | 공부 페이지. 방문자별 최근순 색인 |
| `web_messages` | `page_id`, `visitor_id`, `seq`, `role`(`user`·`assistant`), `content`(4만 자 이하) | 대화. `(page_id, seq)` 유일. 페이지를 지우면 같이 지워짐 |
| `web_captures` | `page_id`, `visitor_id`, `storage_path`, `media_type`(png·jpeg·webp), `bytes`(5MB 이하), `width`, `height`, `x`, `y`, `status`, `reason`, `error`, `adapter`, `model`, `redacted`, `attempts` | 캡쳐. `status`는 `pending`·`done`·`empty`·`failed` |
| `web_notes` | `page_id`, `visitor_id`, `capture_id`, `source`, `state`(`suggested`·`placed`), `kind`, `text`(1~4000자), `source_region`, `confidence`(0~1), `raw_excerpt`(2000자 이하), `question_no`, `ord`, `x`, `y` | 필기와 제안. `source`는 `drag-from-chat`·`capture-vision`. 캡쳐를 지우면 그 캡쳐의 필기도 지워짐 |
| `web_usage` | `(visitor_id, day)` 기본키, `captures` | 방문자의 하루 캡쳐 수. 날짜는 서울 시간 기준 |

저장소 버킷 `web-captures`: 비공개, 파일 하나 5MB, png·jpeg·webp만. 경로는 `{visitor}/{page}/{uuid}.{ext}`다.

### 4.2 권한과 정책 (`0002_visitor_policies.sql`)

- `web_visitor()`: 요청 헤더의 `x-visitor-id`를 UUID로 읽는다. 헤더가 없으면 null이다.
- 표 5개 모두 RLS(행 단위 보안 정책)가 켜져 있다.
- `anon`(publishable 키로 들어온 요청) 권한:
  - `web_pages`, `web_messages`, `web_notes`: 읽기·쓰기·고치기·지우기
  - `web_captures`: 읽기·고치기·지우기. 새로 만들기는 없다(RPC로만)
  - `web_usage`: 권한 없음
- 정책: 모든 표에서 `visitor_id = web_visitor()`인 행만 보이고 바뀐다. `web_messages`와 `web_notes`는 쓸 때 그 페이지도 같은 방문자 것이어야 한다.
- 저장소 정책: `web-captures` 버킷에서 첫 폴더 이름이 방문자 ID인 파일만 읽고, 올리고, 지운다.

### 4.3 RPC

| 함수 | 하는 일 |
|---|---|
| `web_create_capture(p_page, p_path, p_media, p_bytes, p_width, p_height, p_x, p_y, p_limit)` | 캡쳐 행을 만드는 유일한 길이다. 방문자 헤더가 없으면 `no_visitor`, 남의 페이지면 `page_not_found`, 경로 첫 폴더가 방문자 ID가 아니면 `bad_path`로 거절한다. `web_usage`를 1 올리고, `least(p_limit 또는 30, 50)`을 넘으면 `daily_limit`로 거절한다. 거절하면 올린 수도 함께 되돌아간다 |
| `web_retry_capture(p_capture, p_limit)` | [다시 시도]를 한 문장으로 차지한다(`failed`·`empty`이고 3번 미만일 때만 `pending`으로). 그래서 두 번 눌러도 한 번만 돈다. 남은 제안을 지우고, 새 캡쳐와 같은 한 사람·전체 하루 한도에서 뺀다. 거절 코드: `capture_not_found`, `too_many_attempts`, `cannot_retry`, `daily_limit`, `daily_total` (0004) |
| `web_take_chat(p_limit)` | 대화 메시지 한 번을 한 사람 한도(`least(p_limit 또는 100, 200)`)와 전체 한도에서 뺀다. `ok`, `daily_limit`, `daily_total`, `no_visitor` 중 하나를 돌려준다 (0004) |
| `web_take_retry()` | 0003에서 만들었다가 0004에서 지웠다 |
| `web_take_capture` | 0001에서 만들었다가 0002에서 지웠다 |

한도 함수는 모두 `security definer`이고 `anon`만 실행할 수 있다. Supabase 보안 점검이 이것을 경고(WARN)로 보여 주지만 의도한 것이다: 서버가 publishable 키로 부르고, 함수 안에서 `web_visitor()`로 방문자를 확인한다.

### 4.4 전체 한도·대화 한도 (`0003_quota.sql`)

- `web_usage`에 `chats` 열을 더했다. 날짜는 서울 기준이다.
- 전체(모든 방문자 합계) 하루 한도: 캡쳐 300회, 대화 3000회. SQL에 박혀 있고 env로 바꾸지 않는다. 바꾸려면 다음 번호 SQL로 함수를 다시 만든다.
- 한 사람 하루 한도: 캡쳐는 env `CAPTURE_DAILY_LIMIT`(기본 30, DB 상한 50), 대화는 `CHAT_DAILY_LIMIT`(기본 100, DB 상한 200).
- `web_create_capture`는 0003에서 전체 한도 검사를 더해 다시 만들었다(넘으면 `daily_total`).

### 4.5 서버 키 (`0004_server_key_and_retry.sql`)

- 서버는 요청마다 `x-web-key` 헤더에 env `WEB_DB_KEY`를 실어 보낸다. `web_visitor()`(security definer)는 이 값이 `web_private.settings.web_key`와 같을 때만 방문자 ID를 돌려준다. 다르면 null이라 어떤 정책·함수·저장소 정책에도 맞지 않는다.
- 그래서 publishable 키만 아는 사람은 행을 읽지도 쓰지도, 이미지를 올리지도, 한도를 쓰지도 못한다(2026-11-13 시험: 키 없음·틀린 키 모두 0건, 쓰기·업로드 거부, 한도 함수 `no_visitor`).
- `web_private` 스키마는 API에 노출되지 않고 anon·authenticated 권한이 없다. 키 값은 SQL 파일에 없고 따로 넣는다: `insert into web_private.settings (web_key) values ('<WEB_DB_KEY>')`.
- `web_visitor()` 실행 권한은 `anon`에만 둔다(0005). RLS 검사가 anon 역할로 돌기 때문이다.
- 키를 바꿀 때: 새 값으로 `update web_private.settings set web_key = '<새 값>'`과 Vercel env `WEB_DB_KEY`를 함께 바꾸고 다시 배포한다. 둘이 다른 동안은 앱이 DB에 닿지 못한다.

## 5. DB 적용 방법

- **프로젝트:** Supabase 프로젝트 "Experii"(ref `swbkvwcznphawuredshr`, URL `https://swbkvwcznphawuredshr.supabase.co`). 랜딩 사전 신청과 같은 프로젝트를 쓴다. 그래서 웹 객체는 모두 `web_` 접두사를 붙인다.
- **적용 명령:** 파일마다 한 번, 순서대로(0001 → 0002 → 0003 → 0004 → 0005) 적용한다. 0004 뒤에 서버 키 한 줄을 따로 넣는다(4.5).

  ```bash
  supabase db query --linked --workdir <링크 정보를 둔 폴더> -f <SQL 파일 절대 경로>
  ```

  `--workdir`은 `supabase link`로 프로젝트를 연결해 둔 폴더다. 2026-11-13 작업은 세션 임시 폴더에 링크를 따로 두고 적용했다.
- **`supabase/migrations`와 `db push`를 쓰지 않는 이유:** `db push`는 마이그레이션 기록을 남기고, 그 기록은 랜딩 마이그레이션(`landing/supabase/migrations`)과 같은 프로젝트에 쌓인다. 웹 SQL이 그 기록에 섞이면 누가 `db push`를 할 때 두 앱의 기록이 엉킨다. `db query`는 SQL만 실행하고 기록을 남기지 않는다.
- **다시 실행하지 않는다:** 파일은 `create table`, `create function`, `create policy`로 되어 있어 두 번 돌리면 오류가 난다. 바꿀 일이 생기면 다음 번호 파일을 새로 만든다.
- **적용 뒤 확인:** 표 5개의 RLS가 켜졌는지, 버킷이 `public=false`인지 본다. Supabase 보안 점검(`get_advisors(security)`)에 `web_` 관련 ERROR가 없어야 한다. 시험 스크립트로 "헤더 없는 요청은 빈 결과, 방문자 B는 A의 행과 이미지를 읽거나 쓰지 못함, 캡쳐 직접 insert 거부"를 확인한다.
- **주의 1:** 무료 플랜은 7일 동안 요청이 없으면 프로젝트가 정지된다. 2026-11-13 작업 시작 때도 정지 상태여서 복구했다.
- **주의 2:** 2026-11-13 `supabase config push`가 확인 질문에 n을 넣었는데도 적용되어 인증(Auth) 설정 일부가 바뀌었다. 웹 앱은 Supabase Auth를 쓰지 않아 지금 영향은 없다. 창업자가 대시보드에서 되돌린다(ai.md 5장 2번).

## 6. 입장과 보안 모델

### 6.1 초대 링크와 쿠키 (`proxy.ts`, `lib/invite.ts`)

- 초대 코드는 env `INVITE_CODES`에 쉼표로 나눠 넣는다. 4자보다 짧은 코드는 무시한다. env가 비어 있으면 아무도 들어오지 못한다.
- `/?invite=<코드>`로 들어오면:
  - 코드가 맞으면 쿠키 두 개를 주고, 주소에서 코드를 지운 곳으로 다시 보낸다.
  - 코드가 틀리면 `invite_error=1`을 붙여 보낸다. 화면은 "초대 링크가 필요해요"를 띄운다(FR-W1).
- 쿠키:

  | 이름 | 값 | 설정 |
  |---|---|---|
  | `exp_inv` | 초대 코드 | httpOnly, SameSite=Lax, https면 Secure, 180일, path `/` |
  | `exp_vid` | 방문자 ID(무작위 UUID v4). 이미 있으면 그대로 둔다 | 같음 |

- `/api/*`는 두 쿠키가 모두 맞아야 통과한다. 아니면 401 `invite_required`다. 라우트 안에서도 `requireVisitor()`가 한 번 더 확인한다.
- 코드를 env에서 빼면 그 코드로 들어온 사람은 다음 요청부터 막힌다.
- 바꾸는 API 요청(POST, PATCH, DELETE)은 `Origin`이 같은 호스트일 때만 받는다.

### 6.2 DB 접근: publishable 키 + `x-visitor-id` + RLS

- 서버는 publishable 키(공개해도 되는 Supabase 키)로 Supabase를 부르고, 요청마다 헤더 `x-visitor-id`에 쿠키의 방문자 ID를, `x-web-key`에 서버 키를 넣는다(`lib/server/db.ts`의 `dbFor`, 4.5).
- RLS가 그 방문자의 행과 이미지로만 접근을 제한한다(4.2). 격리를 앱 코드가 아니라 DB가 강제한다.
- 서버에 secret 키(RLS를 건너뛰는 관리자 키)가 없다. 계획 초안은 secret 키를 썼지만, 키를 꺼내는 명령이 권한 규칙에 막혀 이 방식으로 바꿨다. 서버에 비밀이 하나 줄어든 셈이다.

### 6.3 남는 위험

- publishable 키만으로는 아무것도 못 한다(4.5). 서버 키 `WEB_DB_KEY`까지 새면 무작위 방문자 ID로 자기 행을 만들고 전체 하루 한도를 일부러 다 쓸 수 있다. 그때는 4.5의 순서로 서버 키를 바꾼다.
- 남의 방문자 ID(무작위 UUID)를 모르면 남의 행과 이미지는 서버 키가 있어도 볼 수 없다.
- 캡쳐 행은 RPC로만 만들어져 하루 한도를 건너뛸 수 없다. 반면 저장소 업로드에는 버킷의 크기·형식 제한만 있다. `web_pages`, `web_messages`, `web_notes` 직접 쓰기에도 한도가 없다.
- AI 호출은 모두 우리 API를 거치므로, AI 비용은 앱의 한도(FR-W10)와 Anthropic 월 한도로 막는다.

### 6.4 응답 헤더와 화면 표시

- 헤더: CSP(`img-src 'self' blob: data:`, `connect-src 'self'`, `frame-ancestors 'none'`), `X-Robots-Tag: noindex`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. `app/robots.ts`는 모든 경로를 Disallow한다.
- 대화 답은 데스크톱에서 복사한 `Markdown.tsx`로 그린다. 답에 든 HTML은 실행하지 않는다. 필기는 일반 텍스트로만 그린다.
- 업로드 파일은 확장자가 아니라 파일 앞부분의 바이트(매직 바이트)로 형식을 확인한다.

## 7. Claude 어댑터 (`lib/claude/`)

### 7.1 계약 (`types.ts`)

```ts
interface ClaudeAdapter {
  readonly name: 'mock' | 'anthropic';
  readonly model: string;
  generateNotesFromCapture(input: CaptureInput, signal?: AbortSignal): Promise<CaptureNotesResult>;
  streamChat(turns: ChatTurn[], signal?: AbortSignal): AsyncIterable<string>;
}
// CaptureNotesResult = { notes: NoteBlock[]; reason: string | null; redacted: number }
// NoteBlock = { text, kind, source_region, confidence, raw_excerpt }
```

- 앱이 부르는 함수는 `lib/claude/index.ts`의 `generateNotesFromCapture(input)` 하나다. 목을 실 어댑터로 바꿔도 다른 코드는 그대로다.
- 오류는 `AdapterError`로 묶는다. 코드는 `refused`, `invalid_output`, `rate_limited`, `upstream`, `mock_failure`다.

### 7.2 어댑터 고르기와 env

`CLAUDE_ADAPTER=anthropic`이고 `ANTHROPIC_API_KEY`가 있을 때만 실 어댑터를 쓴다. 둘 중 하나라도 없으면 목이다.

| env | 값 | 기본 | 비밀 |
|---|---|---|---|
| `CLAUDE_ADAPTER` | `mock` \| `anthropic` | `mock` | 아님 |
| `ANTHROPIC_API_KEY` | Anthropic API 키 | 없음 | **비밀.** 창업자만 넣는다 |
| `CLAUDE_MODEL` | 모델 ID | `claude-opus-5-5` | 아님 |
| `CLAUDE_EFFORT` | `low` \| `medium` \| `high` \| `xhigh` \| `max` | 비움(보내지 않음) | 아님 |
| `MOCK_DELAY_MS` | 목 응답 지연(ms) | 1500 | 아님 |

- 키는 서버 env에만 둔다. 브라우저로 나가는 `NEXT_PUBLIC_` 이름을 쓰지 않는다.
- 4.x 모델(예: `claude-sonnet-4-5`)을 넣을 때는 `CLAUDE_EFFORT`를 비워 둔다.

### 7.3 결과 정리 (`normalize.ts`)

어댑터 결과는 저장 전에 반드시 `normalizeResult`를 거친다.

1. zod로 형식을 검사한다.
2. 빈 필기는 버리고, `text` 400자, `raw_excerpt` 800자, `reason` 200자에서 자른다.
3. 정규식으로 비밀을 한 번 더 가린다(`lib/redact.ts`, 데스크톱 `apps/desktop/src/main/redact.ts`에서 복사). 가린 수를 `redacted`에 더한다.
4. 범위 밖 `kind`는 `other`, 범위 밖 `source_region`은 null, `confidence`는 0~1로 맞춘다.
5. 8개까지만 남긴다. 0개인데 이유가 없으면 기본 이유를 채운다.

### 7.4 실 어댑터 (`anthropic.ts`)

코드만 있고 아직 한 번도 실제로 부르지 않았다.

- **캡쳐 → 필기:** `client.beta.messages.create`에 base64 이미지와 지시문(`prompt.ts`의 `CAPTURE_SYSTEM_PROMPT`)을 보낸다. 응답 형식은 구조화 출력(`output_config.format` + `betaZodOutputFormat(CaptureNotesSchema)`)이다. `parse`를 쓰지 않는 이유: 거절·잘림 응답에서 종료 이유를 읽기 전에 예외를 던진다(2026-11-13 리뷰).
  - 순서: `stop_reason`이 `refusal`이면 `refused`, `max_tokens`이면 `invalid_output`. 그다음 마지막 `fallback` 블록 뒤의 text를 JSON으로 읽고 zod로 검사한다(`readNotes`). `max_tokens` 16000.
  - 강제 도구 호출(`tool_choice`)을 쓰지 않는 이유: 현재 모델(Opus 5.5, Sonnet 5.5)에서 400 오류가 난다.
- **fallbacks:** 5.x 모델이면 베타 `server-side-fallback-2026-07-01`과 `fallbacks: 'default'`를 붙인다. 서버 쪽에서 거절 시 다른 모델로 넘기는 기능이다.
- **거절과 오류:** `stop_reason`이 `refusal`이면 `refused`, 파싱 결과가 없으면 `invalid_output`, 사용량 초과는 `rate_limited`, 그 밖 API 오류는 `upstream`이다. 화면에는 실패와 [다시 시도]로 보인다.
- **설정:** 캡쳐는 재시도 없음(라우트 마감 안에서 한 번), 대화는 재시도 1번. 끊김·시간 초과는 "시간이 너무 오래 걸렸어요"로 보인다. 어댑터 오류는 코드와 메시지를 Vercel 로그에 남긴다(본문은 남기지 않음).
- **대화:** `client.messages.stream`의 `text_delta`를 흘려보낸다. `max_tokens` 4000, 최상위 `cache_control: ephemeral`로 다시 보내는 대화 앞부분을 캐시한다. 거절이면 답 끝에 안내 한 줄을 붙인다.

### 7.5 목 어댑터 (`mock.ts`)

- 기본 1.5초 뒤 예시 필기 5개를 돌려준다. 첫 필기는 "[데모 필기] …"로 시작해 예시임을 밝힌다.
- 시나리오는 `ok`, `empty`, `fail`, `slow`(지연 4배)다. 목 모드일 때만 요청 헤더 `x-experii-mock`으로 고른다. 테스트용이다.
- 긴 변이나 짧은 변이 48px 미만인 이미지는 빈 결과(0개 + 이유)를 돌려준다.
- 대화는 "(데모 응답 · …)"으로 시작하는 표·목록 예시 답을 조각으로 흘려보낸다.

### 7.6 지킬 것

- 개발 중에는 AI나 에이전트가 실제 Anthropic API를 부르지 않는다. 키를 요구하거나 `.env`에 실값을 넣지 않는다. 실연동은 창업자가 한다(12장).

## 8. 캡쳐 파이프라인

1. **입력:** Ctrl+V(창 어디서든, 클립보드에 이미지가 있으면 보드로 간다. 글만 있으면 평소처럼 붙여 넣는다), 이미지 파일 끌어 놓기, [캡쳐 올리기] 버튼. png·jpg·webp만, 원본 20MB까지.
2. **브라우저 리사이즈** (`components/image.ts`): 긴 변을 2048px 이하로 줄여 webp(안 되면 jpeg)로 다시 만든다. 4MB를 넘으면 올리지 않는다. Vercel 함수의 요청 본문 한도(약 4.5MB) 때문이다.
3. **업로드** `POST /api/pages/[id]/captures` (multipart: `file`, `x`, `y`, `width`, `height`):
   1. 매직 바이트로 형식을 확인한다.
   2. 저장소 `web-captures/{visitor}/{page}/{uuid}.{ext}`에 올린다.
   3. RPC `web_create_capture`가 페이지 소유, 경로, 하루 한도를 확인하고 `status=pending` 행을 만든다.
   4. 201로 바로 응답한다.
   5. 응답을 보낸 뒤 `after()`로 필기 생성을 돌린다. 라우트는 `maxDuration` 120초이고, 어댑터 호출은 요청이 들어온 뒤 100초에 끊는다(결과를 쓸 시간을 남긴다). 실 어댑터는 재시도 없이 한 번만 부른다.
   6. 제안을 `web_notes`에 `state=suggested`로 저장하고 상태를 바꾼다.
4. **상태:**

   ```
   pending ──> done    (제안 1개 이상)
           ├─> empty   (0개, reason 있음)
           └─> failed  (오류) ──[다시 시도, 최대 3번]──> pending
   ```

   - 화면은 1.2초마다 `GET /api/captures/[id]`로 상태를 본다.
   - 150초 넘게 `pending`이면 함수가 중간에 멈춘 것으로 보고, 읽을 때 `failed`로 바꾼다(`lib/server/store.ts`의 `STALE_MS`). 아직 `pending`이고 여전히 오래된 행만 바꿔, 방금 끝난 결과를 덮지 않는다.
   - 대화 라우트는 `maxDuration` 300초, 답 `max_tokens` 4000이다. 답 저장은 `after()`로 붙잡아 두어, 읽는 쪽이 중간에 멈춰도 저장된다.
5. **제안 넣기:** 제안마다 kind 이름표와 글이 보이고, 확신이 낮으면 흐리게 "확인해 보세요"가 붙는다. [넣기]·[모두 넣기]는 `POST /api/notes/place`로 `state=placed`로 바꾸고 캡쳐 오른쪽 열에 아래로 쌓는다. [빼기]는 제안을 지운다.
6. **안내:** 첫 안내 카드에 "캡쳐는 Experii 서버에 저장되고, 필기를 만들려고 AI로 보내요. 비밀번호나 개인정보가 보이는 화면은 올리지 마세요."가 있고, 첫 업로드 때 같은 뜻의 알림을 한 번 더 띄운다. `redacted`가 1 이상이면 "비밀로 보이는 n곳을 가렸어요"를 띄운다.
7. **배치:** 붙여 넣은 캡쳐는 화면 가운데에 놓이고, 넣은 필기는 그 오른쪽 열에 그린 높이대로 다시 쌓인다. 화면은 캡쳐와 필기 열이 보이게 따라가고, 좁은 화면에서는 축소한다.

## 9. 화면과 디자인 출처

- **배치:** 데스크톱과 같은 3단(Sidebar, Board, ChatPanel, Panes). 보드는 데스크톱 `NotePage.tsx`와 `canvas.ts`(확대 0.25~2배, 필기 폭 264px)를 옮겼다. 핀, 다음 공부, 탭은 옮기지 않았다. 900px보다 좁으면 패널을 기본으로 접는다.
- **스타일 출처:** `apps/desktop/src/renderer/styles` @ `d3bc1ca`에서 복사했다(`tokens.css`, `base.css`, `card.css`, `chat.css`, `controls.css`, `dialog.css`, `note.css`, `panes.css`, `path.css`, `sidebar.css`, `tabs.css`). **토큰을 바꿀 때는 두 앱을 함께 고친다.**
- **새 요소:** 웹에만 있는 요소(캡쳐 타일, 제안 목록, 첫 안내, 연습 모드 띠, 토스트, [캡쳐 올리기])의 스타일은 `app/styles/web.css`에 둔다. 부품 규칙은 `apps/desktop/DESIGN.md`를 따른다(칠한 버튼은 하나, 파랑은 정해진 자리에만, 1px 윤곽선).
- **연습 모드 띠:** 목으로 돌 때 "연습 모드예요. 지금 보이는 답과 필기는 예시예요."를 띄운다(FR-W13).
- **UI 시안 3개 절차를 건너뛴 이유:** 창업자가 "UI는 데스크톱 앱과 동일"로 정했고 작업 시간에 자리에 없었다. 새 요소는 보고서와 PR에 밝힌다.

## 10. 배포

| 항목 | 값 |
|---|---|
| Vercel 프로젝트 | `experii`(팀 iborys-projects, `prj_L4xUtqPPEj2hq6aspJMFq8M0F47o`) |
| 운영 URL | https://experii.vercel.app (별칭 `experii-iborys-projects.vercel.app`) |
| Root Directory | `apps/web` |
| Framework, Node, 지역 | Next.js, 22.x, `icn1`(`vercel.json`) |
| Git 연결 | GitHub `IBORY-PURPLE/Experii`, 운영 브랜치 `main`. 다른 브랜치 push는 미리보기 배포 |
| 미리보기 툴바 | 끔(Vercel이 끼워 넣는 스크립트가 CSP에 막혀 콘솔 오류를 냈다) |

- **2026-11-13 운영 배포:** 브랜치 `claude/web-capture-notes`의 Git 미리보기 배포를 `vercel promote`로 운영에 올렸다. 그래서 운영 코드는 main이 아니라 이 브랜치다. PR이 main에 병합되면 main push가 운영을 다시 배포한다.
- **처음 생긴 배포:** 프로젝트의 첫 배포는 운영 대상이 된다(Vercel 동작). 그 배포는 빌드 건너뛰기로 취소돼 영향이 없었다.

- **빌드 건너뛰기:** 프로젝트 설정 "루트가 안 바뀐 커밋은 배포 건너뛰기"(affected projects)만 쓴다. `vercel.json`의 `ignoreCommand`는 두지 않는다. 2026-11-13에 두 가지를 써 봤다. 직전 커밋만 비교하면 코드 커밋 뒤 문서 커밋을 함께 push할 때 코드가 배포되지 않았다. 마지막 성공 배포와 비교하면 같은 커밋을 다시 빌드하는 운영 승격(promote)과 Redeploy까지 건너뛰었다(실제로 승격 한 번이 취소됨). env를 바꾼 뒤 Redeploy가 꼭 빌드되어야 하므로 둘 다 뺐다.
- **env:** 값은 Vercel 대시보드나 `vercel env add`로 넣는다. 저장소, PR 본문, 로그에 값을 쓰지 않는다.

  | 이름 | 운영 값 | 비밀 여부 |
  |---|---|---|
  | `SUPABASE_URL` | `https://swbkvwcznphawuredshr.supabase.co` | 아님 |
  | `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable 키 | 공개 키지만 저장소에는 넣지 않는다 |
  | `WEB_DB_KEY` | 서버 키(64자 무작위, DB `web_private.settings`와 같은 값) | **비밀.** 저장소·로그에 쓰지 않는다 |
  | `INVITE_CODES` | 초대 코드(쉼표 구분) | 반비밀. 저장소에 넣지 않는다 |
  | `CLAUDE_ADAPTER` | `mock`(실연동 뒤 `anthropic`) | 아님 |
  | `CAPTURE_DAILY_LIMIT`, `CHAT_DAILY_LIMIT` | 30, 100(코드 기본값과 같음) | 아님 |
  | 전체 하루 한도 | env 아님. SQL에 캡쳐 300·대화 3000(4.4) | - |
  | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_EFFORT` | 실연동 전에는 넣지 않는다 | 키는 비밀 |

- **로컬:** `apps/web/.env.local`에 같은 이름으로 넣는다. `.gitignore`가 `.env*`를 막고 `.env.example`(이름만)은 둔다.
- **함정:** `vercel link`가 `.env.local`에 Vercel 토큰을 써 넣는다. 링크한 뒤 그 줄을 지운다.
- **무료 플랜:** Vercel Hobby는 비상업 용도 제한이 있다. 초대 실험이라 지금은 그대로 쓴다(PRD 10.10 열린 항목).

## 11. 테스트

`apps/web`에서 실행한다.

| 종류 | 명령 | 내용 |
|---|---|---|
| 타입·단위·빌드 | `npm run typecheck && npm test && npm run build` | 완료 판정. 모두 종료 코드 0 |
| 단위(vitest) | `npm test` | `tests/unit` 21개: 정규화(8개 자르기, 빈 결과 이유, 범위, 비밀 가림), 어댑터 고르기, 목 시나리오, 실 어댑터 요청 형식(가짜 fetch로, 네트워크 없이: 이미지 블록, 구조화 출력, fallbacks), 대화 순서 맞추기, 매직 바이트, 초대 코드 |
| E2E 로컬 | `npm run test:e2e` | Playwright `local` 프로젝트. build + start, `.env.local` 사용 |
| E2E 운영 | `npm run test:e2e:prod` | Playwright `prod` 프로젝트. env `BASE_URL`, `E2E_INVITE` 필요 |

- E2E 스펙 14개: 입장 3(초대 없음·틀린 코드·맞는 코드), 캡쳐 2(붙여넣기 → 60초 안에 제안 → 모두 넣기 → 새로고침 뒤 유지, 하나 넣고 하나 빼기), 실패 5(목 `fail` → 다시 시도, 작은 이미지 빈 결과, 이미지 아닌 파일, 이름만 바꾼 파일 415, 글 붙여넣기), 대화 1, 화면 3(1440·1280·390px 가로 넘침 0, 도구 막대와 확대 버튼 안 겹침, 콘솔 오류 0).
- 2026-11-13 결과: 로컬 14개 통과, 운영 https://experii.vercel.app 14개 통과(캡쳐 → 넣기 → 새로고침까지 약 9초). 미리보기에서는 툴바 스크립트 때문에 화면 3개가 실패해 툴바를 껐다.
- 비밀 가림 테스트의 가짜 토큰은 실행 중에 문자열을 이어 붙여 만든다. 토큰 모양 문자열을 커밋하면 GitGuardian이 PR을 잡는다.
- 키가 저장소에 없는지 확인: `git grep -nE "sk-ant-[A-Za-z0-9]" -- apps/web docs`가 비어야 한다.
- 웹용 CI 워크플로는 아직 없다(이번 범위 밖).

## 12. 실연동 절차 (창업자)

목에서 실제 Claude로 바꾸는 순서다. 코드는 고치지 않는다.

1. **키 발급:** Anthropic 콘솔에서 API 키를 만들고 월 사용 한도를 정한다.
2. **env 넣기:** Vercel 프로젝트 env(Production)에 `ANTHROPIC_API_KEY`와 `CLAUDE_ADAPTER=anthropic`을 넣는다. 필요하면 `CLAUDE_MODEL`(기본 `claude-opus-5-5`, 더 싸게는 `claude-sonnet-5-5`)과 `CLAUDE_EFFORT=low`(응답 속도)도 넣는다.
3. **다시 배포:** 대시보드 Redeploy 또는 `vercel deploy --prod`. env는 배포할 때 읽힌다.
4. **확인:** 실제 캡쳐 3장을 올려 본다.
   - 60초 안에 제안이 나오는가
   - 톤 B(짧은 학습 필기)이고 `text`가 한국어인가
   - 이미지에 없는 내용이 없는가
   - 비밀이 `[redacted]`로 가려지는가
5. **되돌리기:** `CLAUDE_ADAPTER=mock`으로 바꾸거나 키를 지우고 다시 배포하면 목으로 돌아간다.

## 13. 확인 못 한 것

- **업로드 상한:** 브라우저와 서버 모두 4MB(`MAX_UPLOAD_BYTES`)로 막는다. DB `bytes`와 버킷 한도 5MB는 그 위의 안전선이다. Vercel 요청 본문 한도(약 4.5MB)는 문서로 다시 확인하지 않았다.
- **실 어댑터:** 실제 Anthropic API로 한 번도 불러 보지 않았다. 요청 형식은 가짜 fetch 단위 테스트로만 맞췄다. 실연동 뒤 처음 몇 번의 응답 시간과 품질은 12장 순서로 확인한다.
- **휴대폰:** 390px에서 넘침은 없지만 손가락 확대·이동은 지원하지 않는다(범위 밖).
