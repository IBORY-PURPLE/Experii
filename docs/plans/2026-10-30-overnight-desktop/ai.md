# 10월 30일 밤 데스크톱 개발: AI용 실행 계획

- **승인:** 2026-10-30 19:45 창업자. 1쪽 요약은 [human.md](human.md)다.
- **기준:** 사람이 본 것은 1쪽 요약이고, 실행 기준은 이 파일이다.
- **영역:** `apps/desktop/` 데스크톱 MVP v1. 기준 문서는 `docs/desktop/prd.md`(2026-10-30 개정, 루프 v2와 FR-10~17)와 `docs/desktop/tsd.md`.
- **오케스트레이터:** 창업자와 대화하는 세션 "Experii 일렉트론 개발 계획"(`local_288f0e38-e3f0-44f4-882e-9754d397bd90`). 작업 세션을 띄우고, 끝난 세션의 결과를 확인하고, 다음 세션을 띄우고, [밤 보고](report.md)를 쓴다.

## 0. 결정

| # | 질문 | 결정 | 근거 |
|---|---|---|---|
| 1 | 범위 | 기본(맥락 알리기, 모델 바꾸기, 표·코드 표시, 사이드바 접기, 카드 속도) + 앱 안 도구 1개(내 경험 카드 검색). MCP는 설계만 | 창업자 |
| 2 | PRD | 밤 작업 첫 PR(①)로 개정 | 창업자 |
| 3 | 밤 결정 | 추천안으로 진행하고 PR과 밤 보고에 적는다 | 창업자 |
| 4 | 순서 | 기능 PR은 main 위에서 만든다. 디자인 통일(`claude/desktop-design-system`)은 아침에 main을 다시 합친다 | 창업자 |
| 5 | 권한 | 자동 승인. 세션은 묻지 않고 진행한다. 위험한 명령은 이 계획의 금지 목록과 auto 모드 분류기가 막는다 | 창업자. 오케스트레이터가 auto라서 작업 세션도 auto로 띄운다(더 높은 모드는 앱이 받지 않는다) |
| 6 | 필기 단위 | 대화 세션 1개 = 필기 페이지(섹션) 1개 = 로드맵 칸 1개. 한 세션에서 질문 N개, 필기 N개. 한 페이지에 대화 여러 개 붙이기는 추후 | 창업자: "섹션1개 필기 N개 대화세션은 일단 1개로 세팅" |
| 7 | 필기 페이지 | 칸·카드를 누르면 열리는 FigJam 같은 캔버스이고, 경험 카드는 그 요약. 시안 3개를 오늘 밤 보여 주고 승인하면 바로 개발한다 | 창업자 |
| 8 | 모델 드롭다운 자리 | 입력창 아래 옵션 줄("Using ChatGPT plan" 옆) | 답 없음, 추천안 |
| 9 | 사이드바 | 접기, 단축키(Ctrl+B 왼쪽, Ctrl+Shift+B 오른쪽), 상태 저장만. 드래그 리사이즈 없음 | 답 없음, 추천안 |
| 10 | 도구 루프 | 앱이 직접 Responses API function calling을 돌린다. Codex app-server는 쓰지 않는다 | 답 없음, 추천안 |
| 11 | 필기 저장 | 드래그한 원문 그대로, 출처 질문 번호와 시각. GPT가 다듬는 기능은 추후 | 답 없음, 추천안 |
| 12 | 세션 나누기 | 1쪽 요약의 ③(대화 두뇌)에서 카드 속도를 ④ 세션으로 떼어 함께 돌린다. 목표·범위·비용은 같고, 밤 안에 끝내려고 병렬로 나눴다 | 오케스트레이터 판단(진행 기록에 적음) |

## 1. 완료 조건

모두 만족해야 밤 작업이 끝난다. 못 한 항목은 [밤 보고](report.md)에 이유와 함께 남긴다.

1. ① 문서 PR이 열려 있다(PRD·TSD·README·이 계획).
2. 코드 PR ③ ④ ⑤a ⑥ ⑤b가 각각 main을 향해 열려 있고, 그 브랜치에서 아래 검사가 모두 통과했다. 화면을 바꾼 PR에는 실제 Electron 창 스크린샷이 있다.
   - `npm run typecheck`, `npm test`, `npx oxlint`, LF로 푼 내용에서 `oxfmt --check`(3.0 참고), `npm run package`, `npx playwright test`
3. 문서 세션 두 개의 결과물이 PR로 열려 있다: 메인 화면 use flow 설계서, 다음 공부 추천 근거 보고서.
4. 밤 보고에 세션별 결과, 밤에 정한 것, 못 한 것, 아침 확인 순서가 있다.
5. main push, 강제 push, 브랜치 삭제, OpenAI 실계정 호출이 0건이다.

## 2. 확인된 사실

### 코드 (main `b6e4ce5`)

- 채팅 요청 본문은 `{model, input, store:false, stream:true}`뿐이다(`src/main/responses.ts`의 `buildRequestBody`). 채팅에는 developer·system 메시지가 없다(`src/main/chat.ts`의 `send`). 금지 키 목록은 `FORBIDDEN_BODY_KEYS`다.
- `runTurn`은 `response.output_item.done`의 item을 종류와 상관없이 모두 모은다. 그래서 `function_call` item은 이미 수집된다. 없는 것은 `tools` 본문과, 호출 뒤 다시 요청하는 루프다.
- `codeForError`가 `subscription_sharing_*` 오류 코드를 앱 오류 코드로 바꾼다. `error.param`은 보존하지 않는다.
- 모델: `Session.resolveModel`이 `settings.default_model`을 먼저 보고, 없으면 `/v1/models`의 `models[]`에서 `visibility == "list"`인 첫 `slug`를 쓴다. 대화의 모델은 첫 턴을 저장할 때 `conversations.model`(NOT NULL)에 고정된다. `default_model`을 쓰는 코드는 없다.
- 카드(`src/main/cards.ts`): LLM 요청 1회, `text.format` json_schema strict, zod 검증과 1회 재시도, 120초 제한. `onDelta`가 빈 함수라 진행 상황을 화면에 보내지 않는다. 대화와 같은 모델을 쓴다. 카드 입력은 `turnsOf`가 고른 message item뿐이다.
- 렌더러의 `chat:event` 처리(`App.tsx`)는 `delta`, `done`이 아니면 모두 오류로 본다. 새 이벤트 종류는 **새 채널**로 보내야 기존 화면이 깨지지 않는다.
- 노출 API 키 목록 `API_KEYS`(`src/shared/api.ts`)를 e2e가 정확히 비교한다. 새 API를 더하면 `api.ts`, `preload.ts`, `ipc.ts`를 함께 고친다.
- 마크다운: `react-markdown` 10.1.0과 한글 굵은 글씨 보정(`Markdown.tsx`의 `unstick`)만 있고 `remark-gfm`이 없다. 그래서 표가 문단 한 줄로 보인다. `.md table` CSS는 이미 있다.
- 레이아웃: `.app{grid-template-columns:248px minmax(0,1fr) 380px}`(`styles.css`). 접기·단축키·localStorage 코드는 없다. `app://`는 standard 스킴이라 localStorage를 쓸 수 있다.
- 모의 서버(`tests/e2e/mock-openai.ts`): 카드 요청을 **input에 developer 메시지가 있는지**로 판별한다. 채팅에 developer 메시지를 넣으면 이 판별부터 고쳐야 한다. 모델 목록은 `models:[{slug, display_name, visibility}]`. 오류 트리거 `#네트워크오류 #너무김 #재로그인 #플랜 #느리게 #학습없음`. tools와 function_call 이벤트는 없다.
- e2e(`tests/e2e/smoke.spec.ts`): 테스트마다 임시 userData(`EXPERII_USER_DATA`)와 임의 포트의 모의 서버를 쓴다. 그래서 여러 worktree에서 동시에 돌려도 서로 부딪치지 않는다.
- 보안: prod CSP는 `style-src 'self'`(런타임 `<style>` 주입 불가), `connect-src 'self'`. 권한은 `clipboard-sanitized-write`만 허용한다. fuse `RunAsNode`가 꺼져 있어 앱 실행 파일로 MCP stdio 서버를 띄울 수 없다.

### OpenAI 플랜 토큰(SIWC) 문서

- 출처: <https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations>, <https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference>, <https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery>, <https://developers.openai.com/api/docs/guides/function-calling>
- 모든 요청에 `store:false`, `stream:true`. 금지: `background`, `conversation`, `max_output_tokens`, `max_tool_calls`, `metadata`, `moderation`, `multi_agent`, `prompt`, `prompt_cache_retention`, `safety_identifier`, `temperature`, `top_logprobs`, `top_p`, `truncation`, `user`, `previous_response_id`.
- `role:"system"` item은 거부된다. developer 메시지는 된다(카드 요청이 실계정에서 통과, TSD "M0 확인된 사실").
- function tool과 custom tool은 지원한다. 문서는 `namespace`로 묶거나 `additional_tools` 입력 item으로 넣으라고 권한다. 평면 top-level function이 되는지는 확인 못 했다. 지원 안 함: 이미지 생성, file search, Code Interpreter, computer use, hosted MCP·커넥터, `tool_search`.
- `tool_choice`, `parallel_tool_calls`, `reasoning`, `include`, `text`는 문서에 언급이 없다. Codex는 `reasoning`과 `include`를 매번 보낸다. M0에서 `include`와 json_schema strict는 실계정으로 통과했다.
- `subscription_sharing_unsupported_capability`(400)는 `error.param`이 가리키는 입력·도구·기능을 빼고 **다른 본문**으로 다시 보내라고 한다. `subscription_sharing_usage_limit_exceeded`(429)는 다시 보내지 않는다. `subscription_sharing_usage_unavailable`(503)은 간격을 두고 다시 보낸다. 사용량 오류는 스트림 중간에 `response.failed`로도 온다.
- function calling 형식: 정의 `{type:"function", name, description, parameters, strict}`, 출력 item `{type:"function_call", id, call_id, name, arguments}`, 입력 item `{type:"function_call_output", call_id, output}`. 스트림 이벤트는 `response.output_item.added`, `response.function_call_arguments.delta`·`.done`, `response.output_item.done`. 도구 호출과 함께 온 reasoning item은 도구 출력과 함께 되돌려 보낸다.
- 모델 목록은 2026-10-30 기준 `list` 8개다: `gpt-6.1-sol`(첫 항목, 기본), `gpt-6-astra`, `gpt-6.1-terra`, `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`. 목록은 카탈로그일 뿐 권한 확인이 아니다.
- Plus는 5시간 사용 한도를 모든 앱이 같이 쓴다. 밤에는 실계정을 부르지 않는다.

### 하네스와 이 PC

- 로컬 대화형 세션은 `claude/*` 브랜치 push와 PR 열기까지 하고, 병합은 창업자가 한다(PR #9 선례). 가드 훅(`guard.mjs`)은 클라우드에서만 켜진다.
- 이 PC는 `core.autocrlf=true`라 작업본의 `oxfmt --check`가 손대지 않은 파일 수십 개를 실패로 낸다. 커밋 내용은 LF로 풀어 확인한다(3.0).
- Claude 앱이 MSIX 패키지라 앱 안 셸로 `npm ci`를 하면 Electron 캐시가 숨겨진 폴더로 들어갈 수 있다. 설치는 Terminal 패널에서 한다.
- GitGuardian은 PR의 새 커밋에서 토큰 모양 문자열(`eyJ…`, 긴 `Bearer …`)을 잡는다. 테스트용 토큰은 실행할 때 만든다(`tests/unit/jwt.ts`).

## 3. 작업 세션

| 세션 | 브랜치(앱이 앞뒤를 붙임) | 시작 | 끝나면 |
|---|---|---|---|
| ③ 대화 두뇌 | `night-brain` | 20:30 | PR |
| ④ 카드 속도 | `night-cards` | 20:30 | PR |
| ⑤a 화면 A | `night-view` | 20:30 | PR |
| 설계서 | `night-flow` | 20:30 | PR(문서) |
| 리서치 | `night-research` | 20:30 | PR(문서) |
| ⑥ 필기 페이지 | `night-notes` | 시안 선택 직후 | PR |
| ⑤b 화면 B | `night-view2` | ③과 ④의 PR이 열린 뒤 | PR |

### 3.0 공통 규칙 (모든 작업 세션)

- **기준:** 브리프(세션 첫 메시지)와 이 파일의 0·2·3.0장, 자기 장이 실행 계약이다. 먼저 `PRD.md`, `docs/desktop/prd.md`, 이 파일을 읽는다.
- **시작점:** worktree는 `claude/desktop-night-docs`(① 문서 PR)에서 갈라진다.
- **설치:** `apps/desktop`에서 `npm ci`를 Terminal 패널 도구(`mcp__terminal__run_in_terminal`)로 실행한다. 앱 안 셸로 하지 않는다.
- **검사:** `apps/desktop`에서 `npm run typecheck`, `npm test`, `npx oxlint`, `npm run package`, `npx playwright test`. 서식은 `git -c core.autocrlf=false archive HEAD apps/desktop | tar -x -C <scratchpad 폴더>`로 풀고, 그 폴더에서 작업본의 `node_modules/.bin/oxfmt --check`를 돌린다. 고친 파일만 `oxfmt --write`로 다듬는다. e2e는 오래 걸리면 백그라운드로 돌리고 끝까지 기다린다.
- **실계정 금지:** OpenAI 실계정 호출과 로그인 시도는 하지 않는다. 확인은 모의 서버로만 한다. `npm run dev:mock`을 쓰면 `MOCK_PORT`를 세션별로 다르게(③ 8791, ④ 8792, ⑤a 8793, ⑥ 8794, ⑤b 8795) 주고 `EXPERII_USER_DATA`를 임시 폴더로 준다. 창업자 PC의 `%APPDATA%/Experii-dev`, `%APPDATA%/Experii`, `%APPDATA%/Experii-siwc`는 건드리지 않는다.
- **커밋:** 단계마다 커밋한다. 작성자는 git 기본값(창업자)이고, 메시지는 기존 형식(영어 명령형 제목 한 줄, 빈 줄, 본문)에 `Co-Authored-By: Claude <81847+claude@users.noreply.github.com>`를 끝에 붙인다.
- **push:** `git push origin HEAD:refs/heads/<자기 브랜치>`만 한다. 단계마다 push해서 세션이 끊겨도 남게 한다. main push, 강제 push, 브랜치 삭제, 다른 세션 브랜치 push는 하지 않는다.
- **통합(충돌 방지):** PR을 열기 직전에 `git fetch origin`을 하고, 오늘 밤 이미 열린 PR 중 head 브랜치 이름에 `night-`가 들어간 것을 모두 자기 브랜치에 merge한다(`gh pr list --state open --json number,headRefName`). 충돌은 두 쪽의 의도를 모두 살려 풀고 검사를 처음부터 다시 돌린다. 그래서 아침에는 PR이 열린 순서대로 병합하면 충돌이 없다. PR이 열린 뒤 오케스트레이터가 다시 merge해 달라고 하면 같은 방법으로 한다.
- **PR:** `gh pr create --base main --head <자기 브랜치>`. 한국어 본문 순서: 핵심 정리 3줄 → 스크린샷(화면을 바꿨으면) → 왜 → 무엇을 바꿨나 → 범위와 영향 → 검증(명령과 결과 숫자) → 밤 결정 기록(추천안으로 정한 것) → 남은 일. 본문에 토큰 모양 문자열을 넣지 않는다.
- **스크린샷:** 화면을 바꾼 세션은 Playwright `_electron`(`smoke.spec.ts`의 `shot` 패턴)으로 `test-results/shots/`에 찍고, `node scripts/agents/publish-evidence.mjs`로 올려 나온 마크다운을 PR 본문에 넣는다.
- **e2e 추가 위치:** `smoke.spec.ts` 끝에 자기 `test.describe` 묶음으로 덧붙인다. 통합할 때 파일 끝 충돌은 둘 다 살린다.
- **의존성:** 자기 장에 적힌 것만, 정확한 버전으로 넣는다.
- **건드리지 않는 곳:** `.agents/`, `.claude/`, `.github/`, `scripts/agents/`, `CLAUDE.md`, `AGENTS.md`, `PRD.md`, `docs/desktop/`(문서 개정은 오케스트레이터만 한다), 디자인 통일 worktree(`.claude/worktrees/desktop-design-system`)와 그 브랜치.
- **멈춤:** 같은 검사가 3번 연속 같은 이유로 실패하면 멈추고, PR을 draft로 열어 막힌 곳과 시도한 것을 적는다. 결정이 필요하면 추천안으로 진행하고 PR의 "밤 결정 기록"에 적는다. 창업자에게 묻지 않는다(자는 중이다).
- **끝:** 턴의 마지막 메시지에 PR 링크, 통과한 검사, 못 한 것을 3~6줄로 쓴다.

### 3.1 ③ 대화 두뇌 (`night-brain`)

목표: FR-10(모델 선택의 뒷단), FR-11(앱 맥락), FR-12(도구 1개). 화면 코드는 바꾸지 않는다(⑤b가 한다).

1. **모의 서버 먼저(첫 커밋):** 카드 요청 판별을 `body.text?.format?.name === 'experience_card'`로 바꾼다. `/v1/models`에 `list` 모델을 2개 이상 둔다. 트리거 `#도구`: tools가 있고 input에 `function_call_output`이 없으면 `output_item.added(function_call)` → `function_call_arguments.delta`·`.done` → `output_item.done` → `completed`를 보내고, 다음 요청에서는 `function_call_output` 내용을 인용한 답을 보낸다. 트리거 `#도구거부`: 도구가 어떤 형식으로든 오면 400 `subscription_sharing_unsupported_capability`와 도구를 가리키는 `param`을 돌려준다.
2. **앱 맥락 메시지:** `src/main/context.ts`의 `appContext({subject, model, modelName, toolsOn})`와 `CONTEXT_VERSION = 'ctx-v1'`. `chat.ts`가 매 요청 input 맨 앞에 developer 메시지로 넣고 저장하지 않는다. 한국어 15줄 안팎으로 쓴다.
   - Experii가 무엇인지, 지금 과목, 지금 모델 이름(모델은 사용자가 입력창 아래에서 바꾼다고 안내한다)
   - 쓸 수 있는 도구와 쓰는 때, 할 수 없는 일(웹 검색, 파일, 이미지, 코드 실행, 외부 플러그인)
   - 사용자가 답을 드래그해 필기하고 "경험으로 남기기"로 카드를 만든다는 것
   - 답 형식: 핵심 먼저. 결과 집합은 GFM 표로, 앞뒤 빈 줄과 구분선 줄을 꼭 넣고 행마다 줄을 바꾼다. 코드는 언어 표시가 있는 코드 블록. NULL은 `NULL`
   - 마지막 줄 `맥락 버전: ctx-v1`
3. **모델:**
   - `Session.listModels()`: `{models:[{slug, displayName}], current}`. 메모리 캐시와 `settings.models_cache_json`(마지막 성공 목록). 실패하면 캐시, 캐시도 없으면 현재 모델 하나. 로그인·로그아웃 때 캐시를 비운다.
   - IPC `models:list`, `conversations:setModel {id, model}`. 저장된 대화는 `conversations.model`을 바꾸고, 아직 저장 안 된 대화는 메모리의 대화 정보를 바꾼다. 같은 호출에서 `settings.default_model`도 바꾼다. 바뀐 모델은 다음 전송부터 쓴다. 모델 이름은 zod `string().min(1).max(80)`.
   - `ConversationView`에 `model: string | null`을 더한다.
   - reasoning item은 모델마다 다르다. 저장할 때 item JSON에 `x_model`을 붙이고, `buildInput`은 `x_`로 시작하는 키를 지운 뒤 보낸다. 요청 모델과 `x_model`이 다르거나 `x_model`이 없는 reasoning item은 빼고 보낸다.
4. **도구:**
   - `src/main/tools.ts`: 도구 목록과 실행. 첫 도구 `search_experience_cards`(설명은 한국어), 인자 strict `{query: string}`.
   - `Store.searchCards(query, limit=5)`: 공백으로 나눈 낱말을 모두 포함(AND)하는 카드. 대상 열은 title, summary, interview_line, concepts_json, star_action, next_steps. `LIKE ? ESCAPE '\'`로 와일드카드를 막는다. 과목 이름을 붙이고 최신순. 결과 JSON `{total, cards:[{subject, title, summary, interview_line, concepts, created_at}]}`.
   - 요청 형식은 공식 문서(2장 출처)를 WebFetch로 다시 읽어 정확한 모양을 확인한다. 시도 순서는 `namespace` 묶음 → `additional_tools` 입력 item → 평면 `tools` → 끔. 400 `unsupported_capability`의 `param`이 도구를 가리킬 때만 다음 방식으로 바꿔, 같은 전송 안에서 바로 다시 보낸다(스트림이 열리기 전이라 안전하다). 성공한 방식은 `settings.tools_mode`에 기억한다. `settings.tools_enabled = '0'`이면 도구를 보내지 않는다(되돌리기 스위치).
   - `ResponsesError`에 `param?`을 더하고, `codeForError`가 `unsupported`와 `param`을 돌려준다.
   - `chat.ts` 루프: `runTurn` → `function_call` item을 골라 실행 → 이번 응답의 output item 전부(reasoning 포함)와 `function_call_output`을 input 뒤에 붙여 다시 요청. 최대 3번이고, 넘으면 오류 `tool_limit`. delta는 같은 `streamId`로 계속 흘려보낸다. 성공하면 user item, 모든 output item, `function_call_output`, 마지막 답을 한 트랜잭션으로 저장한다. 실패하면 아무것도 저장하지 않는다(지금 규칙과 같다).
   - 화면용 이벤트는 새 채널 `chat:tool`: `{streamId, conversationId, callId, name, label, query, status:'running'|'done'|'error', count?}`. preload에 `onToolEvent`를 더한다.
   - 가능하면 `ConversationView`에 `toolCalls: [{afterMessage, name, label, query, count}]`를 더해, 다시 열었을 때도 도구 사용을 보여 줄 수 있게 한다. `messages()`의 모양은 바꾸지 않는다.
5. **MCP 설계 메모:** `docs/plans/2026-10-30-overnight-desktop/mcp-design.md`. 코드는 없다.
   - 이 도구 목록에 MCP 도구를 얹는 방법: main에서 `@modelcontextprotocol/sdk` 클라이언트. stdio는 fuse 때문에 시스템 node가 필요하고, Streamable HTTP는 `net.fetch`로 한다.
   - 설정 화면, 도구 실행 승인 UX, 보안(로컬 명령 실행 위험).
6. **테스트:**
   - 단위: 오류 코드와 param, function_call 쌍과 reasoning 처리, 루프 2회와 call_id, 도구 방식 강등과 기억, 3회 제한, 맥락 메시지가 맨 앞이고 저장되지 않음, 모델 바꾸기 뒤 다음 본문의 model, listModels 캐시, searchCards의 AND·이스케이프·개수.
   - 기존 테스트 중 developer 메시지 때문에 바뀌는 단언(`smoke.spec.ts`의 전체 이력 재전송, `chat.test.ts`)을 고친다.
   - e2e: `#도구`로 도구 이벤트와 답, `#도구거부` 뒤 두 번째 요청에 도구 없음, 모델 바꾸기 뒤 요청 본문의 model, 재시작 뒤 function_call 쌍 재전송.

### 3.2 ④ 카드 속도 (`night-cards`)

목표: FR-15의 뒷단. 화면 코드는 바꾸지 않는다(⑤b가 한다).

1. **측정:** `CardService.request`에 구간 시간(요청 시작 → 첫 SSE 이벤트, 첫 delta, 완료, zod 통과), 받은 바이트, 모델을 `console.warn('[cards] …')`로 남긴다. 내용은 남기지 않는다.
2. **점진 표시 이벤트:** `onDelta`로 버퍼를 쌓고, `card` 안의 `title` → `summary` → `interview_line` 문자열 값이 닫히는 순간 필드마다 한 번 보낸다.
   - 새 채널 `cards:event` `{conversationId, type:'progress', field, text}`, preload `onCardEvent`.
   - `has_learning:false`면 보내지 않는다. `recommended_next[].title`과 헷갈리지 않게 `card` 객체 안의 첫 `title`만 쓴다.
   - 정규식 대신 작은 상태 기계로 문자열 이스케이프와 조각 경계를 안전하게 다룬다.
3. **추론 강도 낮춤:** `buildRequestBody`가 `reasoning?: {effort}`를 받는다. 카드 요청은 `reasoning:{effort:'low'}`로 보낸다. 400 `unsupported_capability`의 `param`이 `reasoning`이면 빼고 바로 다시 보내고 `settings.card_reasoning = 'off'`로 기억한다. 카드 생성 방식이 바뀌므로 `PROMPT_VERSION`을 `card-v1.1`로 올려 H2를 따로 잰다(지시문 내용은 그대로).
4. **만드는 동안 대화 계속:** 지금도 막혀 있지 않은지 e2e로 확인한다. 카드는 버튼을 누른 때의 대화만 쓴다는 것을 코드 주석 한 줄과 PR에 적는다.
5. **모의 서버:** 카드 JSON을 조각으로 나눠 보내는 `pace.cardDelay`를 더한다.
6. **테스트:**
   - 단위: 필드 추출이 조각 경계·이스케이프·한글·`has_learning:false`에서 맞음, reasoning 거부 뒤 재요청과 기억, 측정 로그에 내용 없음.
   - e2e: 진행 이벤트가 title → summary → interview_line 순서로 완료 전에 온다, 카드를 만드는 동안 메시지를 보낼 수 있다.

### 3.3 ⑤a 화면 A (`night-view`)

목표: FR-13(표·코드), FR-14(접기). main 쪽 코드와 IPC는 바꾸지 않는다.

1. **의존성:** `remark-gfm`(react-markdown 10과 맞는 4.x 최신, 정확한 버전) 하나만.
2. **답 표시:**
   - `Markdown.tsx`의 `remarkPlugins`를 `[remarkGfm, () => stripMark]`로 바꾼다.
   - 표는 `<div class="md-table">`로 감싸 가로 스크롤한다. 머리글 굵게와 옅은 바탕, 줄무늬, 값은 고정폭, 칸 값이 정확히 `NULL`이면 회색 기울임.
   - 인라인 코드와 코드 블록 모양을 정리한다. 링크는 지금처럼 글자로만, 원시 HTML은 계속 글자로 둔다.
   - 스트리밍 중 반쯤 온 표가 문단으로 보이다가 표로 바뀌는 것은 허용한다.
3. **접기:**
   - 왼쪽 사이드바와 오른쪽 채팅 패널. 머리의 토글 버튼과 접힌 쪽 가장자리의 펴기 손잡이, Ctrl+B(왼쪽)·Ctrl+Shift+B(오른쪽).
   - 상태는 localStorage `experii.layout.v1`에 저장하고 다시 켜도 남는다.
   - grid 열 전환과 translateX로 200~250ms ease-out. `prefers-reduced-motion`이면 움직임 없음.
   - 토글에 `aria-expanded`·`aria-controls`, 접힌 패널은 `inert`. 접어도 1200px 창에서 가로 스크롤이 없다.
4. **모의 서버:** 트리거 `#표`로 GFM 표, sql 코드 블록, NULL이 든 답을 보낸다(스크린샷과 e2e용).
5. **테스트:**
   - 단위(`markdown.test.ts`): 표, NULL, 표 안 한글 굵은 글씨, 원시 HTML이 글자로 남음.
   - e2e: `#표` 답이 table로 그려지고 래퍼가 가로 스크롤, 접기 두 쪽과 단축키, 재시작 뒤 유지, 1280 폭 가로 스크롤 없음.
   - 스크린샷: 표 답, 양쪽 접힘.

### 3.4 설계서 (`night-flow`, 문서만)

산출물: `docs/plans/2026-10-30-overnight-desktop/flow-v2.md`.

- **메인 화면 use flow:** 화면(페이지) 목록과 오가는 길(로드맵 ↔ 필기 페이지 ↔ 대화, 뒤로·앞으로). 첫 실행부터 다음 공부까지의 흐름도(Mermaid). 상태별 화면(빈 상태, 저장 전 대화, 카드 없음·있음, 오류).
- **드래그 → 필기 규칙:** 무엇을 끌 수 있나(답 글, 표, 코드), 어디에 놓나, 저장 전 대화에서 끌면, 같은 글을 두 번 끌면, 긴 글, 지우기와 되돌리기.
- **필기 페이지와 카드:** 카드가 요약으로 보이는 자리, 카드 만들기 전·후, 다시 만들기, 평가(H2 측정이 끊기지 않게).
- **다음 공부 정하기:** 추천 칸 고르기, GPT와 상의하기의 흐름. 추천 근거는 리서치 보고서(3.5)와 맞춘다.
- **저장 구조 제안:** `notes` 표(⑥이 구현)와, 앞으로의 "대화 여러 개 붙이기"를 막지 않는 모양.
- **스텝 상세(수업기록):** 창업자 초안의 아이디어(요약·면접 한 마디, 시각화, 실무 예시 문제, 내 질문 기록)를 필기 페이지의 다음 단계로 정리한다. 열린 질문 4개(채점 방식, 앱 안 SQL 실행, 그래프 우선순위, 잠금 해제 규칙)에 추천안과 이유를 붙인다.
- 열린 질문은 추천안을 붙여 끝낸다. 창업자가 시안을 고르면 오케스트레이터가 알려 주니, 그 방향으로 이동 방식 절을 맞춘다.

### 3.5 리서치 (`night-research`, 문서만)

산출물: `docs/plans/2026-10-30-overnight-desktop/research-next-step.md`.

- **질문:** 다음 공부 스텝을 GPT 추측만이 아니라 근거 있는 방법으로 추천하려면 무엇을 써야 하나.
- **다룰 것:** 지식 추적(BKT, DKT와 후속), 지식 공간 이론(ALEKS), 간격 반복과 인출 연습(메타분석, FSRS 같은 스케줄러), 숙달 학습, 지능형 튜터 효과 메타분석, 선수 관계 그래프와 학습 경로 추천 서베이, LLM 튜터의 효과와 위험(2023~2026 무작위 대조 실험 포함), LLM 추천의 신뢰성 문제.
- **기법마다:** 주장, 근거(효과 크기와 표본), 출처(저자, 연도, 학회·저널, DOI 또는 URL), Experii에 있는 데이터(필기, 카드, 평가, 시각)로 할 수 있는지, 한계.
- **결론:** Experii에 맞는 조합 1개와 GPT의 역할(후보를 만드는 쪽이 아니라 고르고 설명하는 쪽 등), 첫 버전 범위, 효과를 재는 방법.
- **모든 인용은 실제로 찾아 확인한다.** 찾지 못한 논문은 쓰지 않는다. 확인한 날짜를 적는다.

### 3.6 ⑥ 필기 페이지 (`night-notes`)

**시안 결정(2026-10-30 22:40 창업자 "A로 진행"):** 시안 A "탭 브라우저 + 자유 캔버스". 구현은 라이브러리 없이 직접 구현(DOM 절대 위치 + CSS transform). 근거: 캔버스 라이브러리 비교(tldraw는 상용 키 필요·가격 비공개, Excalidraw는 스티커·미니맵 없음, React Flow는 대안). 첫 버전 도구는 선택·손·메모, 글·펜·연결선·미니맵은 다음 단계. 시작 브랜치는 #16(`claude/night-view2`). 정해진 것:

- **데이터:** 마이그레이션 2로 `notes` 표(id, conversation_id → conversations CASCADE, source_seq, question_no, text 1~4000자, x, y, w, h, kind 기본 `excerpt`, created_at, updated_at, conversation_id 인덱스). 마이그레이션 전 백업은 지금 규칙(`VACUUM INTO`)을 따른다.
- **IPC:** `notes:list {conversationId}`, `notes:create {conversationId, text, sourceSeq?, x, y}`, `notes:update {id, x?, y?, w?, h?, text?}`, `notes:delete {id}`. 저장 전 대화에서는 `not_saved` 오류와 안내 문구.
- **출처:** 채팅의 assistant 메시지에 `seq`를 함께 내려 보내 출처 질문 번호를 남긴다.
- **이동:** 칸(완료·진행 중)·카드·사이드바 경험을 누르면 필기 페이지가 열리고 오른쪽에 그 대화가 열린다. 잠긴 칸은 지금처럼 말풍선.
- **카드:** 필기 페이지에 경험 카드 요약과 평가가 보인다(H2 측정이 끊기지 않게).
- **필기 만들기:** 드래그(HTML5, text/plain과 출처 정보)와 [필기에 추가] 버튼. 옮기기, 지우기.

### 3.7 ⑤b 화면 B (`night-view2`)

목표: FR-10·12·15의 화면. 시작할 때 오늘 밤 열린 `night-` PR 브랜치를 모두 merge한다.

- **모델 드롭다운:** 입력창 아래 옵션 줄 왼쪽. `models:list`로 채우고 지금 대화의 모델을 보여 준다. 바꾸면 `conversations:setModel`. 스트리밍 중에는 잠근다. 목록을 못 받으면 지금 모델 하나만 보이고 잠근다.
- **도구 호출 표시:** `chat:tool` 이벤트로 스트리밍 답 위에 한 줄(예: "내 경험 카드 검색 · 'JOIN' · 3장"). ③이 `toolCalls`를 넣었으면 다시 열 때도 보인다.
- **카드 점진 표시:** `cards:event`로 만드는 중인 칸과 사이드바 항목에 제목과 한 줄 요약을 먼저 보여 준다. 채팅이 스트리밍 중이면 카드가 다 돼도 자동으로 펼치지 않는다.
- **e2e와 스크린샷:** 드롭다운 변경 → 다음 요청 model, `#도구` 표시, 카드 점진 표시.

## 4. 사람 차례

- **오늘 밤(23시 전):** 필기 페이지 시안 3개를 내장 브라우저로 보고 하나를 고른다(약 15분). 섞으라고 하면 섞은 안을 다시 보여 준다.
- **아침:**
  1. [밤 보고](report.md)를 읽는다.
  2. PR을 열린 순서대로 "Create a merge commit"으로 병합한다. squash로 병합하면 뒤 PR에 앞 PR의 변경이 다시 보인다.
  3. 실계정으로 10회 이내 확인한다: 표, "지금 모델 뭐야, 내 카드에서 JOIN 찾아줘", 모델 바꾸기, 카드 점진 표시, 접기, 필기 드래그와 재시작 뒤 유지.
  4. 설계서와 리서치 보고서를 읽고 다음 단계를 정한다.
  5. 디자인 통일 세션에 main을 다시 합치라고 한다.

## 5. 멈춤 조건 (오케스트레이터)

- 세션이 draft PR로 막혀 끝나면 한 번만 다시 시도시키고, 또 막히면 아침으로 넘긴다.
- 23시 30분까지 시안 선택이 없으면 ⑥을 띄우지 않고 아침으로 넘긴다.
- 실계정 호출, main 변경, 돈이 드는 일이 필요해지면 멈추고 아침에 묻는다.

## 6. 위험과 대응

| 위험 | 대응 |
|---|---|
| 디자인 세션과 같은 화면 파일을 고친다 | 기능 PR은 main 위에서 만들고, 디자인 쪽이 아침에 main을 다시 합친다(그 계획의 "뒤에 오는 쪽이 충돌을 푼다"). 잠금 파일은 `npm install`로 다시 만든다 |
| 밤 PR끼리 공유 파일(`ipc.ts`, `api.ts`, `preload.ts`, `responses.ts`, 모의 서버, `smoke.spec.ts`)이 겹친다 | 3.0 통합 규칙. 나중에 끝난 세션이 먼저 열린 PR을 merge하고 푼다 |
| 플랜 토큰이 도구를 거부한다 | 방식을 차례로 바꾸고, 다 거부되면 도구 없이 대화한다. 실계정 판정은 아침에 |
| reasoning 설정이 거부된다 | 빼고 다시 보내고 기억한다 |
| 캔버스 라이브러리가 CSP·라이선스에 걸린다 | 시안 단계 비교표로 거르고, 막히면 직접 구현 |
| 세션이 끊기거나 멈춘다 | 단계마다 push. 오케스트레이터가 30분마다 점검 |

## 7. 범위 밖

필기 페이지 하나에 대화 여러 개, 다음 공부 추천 엔진 코드, MCP 클라이언트와 플러그인 설정 화면, 사이드바 드래그 리사이즈, 코드 복사 버튼, 수식, 로고와 설치 아이콘, 랜딩 파일.

## 8. 진행 기록

| 날짜 | 단계 | 결과 | 근거 |
|---|---|---|---|
| 2026-10-30 19:45 | 승인 | 1쪽 요약 승인. 필기 단위(세션 1 = 페이지 1 = 칸 1)와 "시안 승인 뒤 바로 개발" 확정 | 창업자 대화 |
| 2026-10-30 19:55 | 시안 | 필기 페이지 시안 3개(탭 브라우저 + 자유 캔버스 / 질문별 정리 보드 / 길 위에서 확대)와 캔버스 라이브러리 비교를 워크플로로 시작 | 워크플로 `wf_57f8b154-c46` |
| 2026-10-30 20:20 | ① 문서 | PRD 루프 v2와 FR-10~17, TSD 범위·모델 줄, PRD 색인, README, 이 계획 | 이 PR |
| 2026-10-30 20:20 | 세션 나누기 | ③에서 카드 속도를 ④로 뗐다(0장 12번) | 밤 안에 끝내기 위한 병렬화 |
| 2026-10-30 20:40~22:05 | ④ ③ ⑤a 설계서 리서치 ⑤b | PR #11~#16 열림. 예약 점검 턴에서는 앱이 새 세션을 띄우지 않아 ⑤b는 오케스트레이터의 백그라운드 작업자로 돌렸다 | [밤 보고](report.md) |
| 2026-10-30 22:25 | 시안 전달 | 시안 A·B·C 캡처(1440·1280, 콘솔 오류·가로 스크롤 없음)와 추천 A를 창업자에게 보냄 | 시안 워크플로 `wf_57f8b154-c46` |
| 2026-10-30 22:40 | ⑥ 시작 | 창업자가 A 선택. ⑥ 세션을 #16 위에서 시작, 설계서 세션에 A로 좁히라고 알림 | 창업자 "A로 진행" |
