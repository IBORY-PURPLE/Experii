# 00b. Grok 연동 경로와 멀티모델 역할 분담 리서치

- 작성일: 2026-10-26
- 범위: 사용자가 말한 "Cursor, Claude Code, 그록 봇을 연동해 최상의 결과물"을 이 PC에서 실제로 어떻게 묶을지 정리한다. 기준 문서는 `landing/Experii_PRD_v0.1.md`(v0.1, 랜딩페이지 제작용)다.
- 표기
  - `[로컬 확인]`: 이 PC에서 직접 실행하거나 읽어서 확인함
  - `[공식 문서]`: SpaceXSI(xAI), Cursor, OpenAI 공식 문서로 확인함
  - `[3자/미검증]`: 블로그·보도·포럼 글. 공식 문서로 교차 확인하지 못함
- 이름 주의: xAI는 2026년에 SpaceX와 합병했고, 공식 문서는 회사 이름을 **SpaceXSI**로 쓴다. 보도와 일부 문서에는 SpaceXAI로 나온다. API 도메인은 그대로 `api.x.ai`, `docs.x.ai`다. SpaceX는 2026년 8월에 Cursor(Anysphere) 인수를 마쳤다고 보도됐다 `[3자/미검증]`. 그래서 Grok 4.x 모델과 Grok Bot은 Cursor와 함께 만든 제품이다.

---

## 1) 핵심 요약

1. **2026년 10월 기준 "그록 봇"은 거의 확실히 [Grok Bot](https://docs.x.ai/grok-bot/overview)을 가리킨다.** SpaceXSI와 Cursor가 2026-08-11에 낸 제품이다. 클라우드 컴퓨터(브라우저, 파일시스템, 터미널)를 가진 상주형 "AI 팀원"이고, 데스크톱 앱(Windows 포함)과 모바일 앱에서 메시지로 일을 맡긴다. `[공식 문서]`
   - 개발자 API는 없다. 외부에서 일을 맡기는 길은 루틴(일정, Slack, GitHub, 웹훅 트리거), X에서 `@bot` 태그, Notion·Slack 같은 연결 앱뿐이다.
   - 웹훅 URL과 키가 앱에 표시되지 않는 버그가 2026년 9~10월 기준 미해결이다(Windows 포함). `[3자/미검증: Cursor 포럼, 스태프가 인지]`
   - 다른 의미도 정리해 둔다. ① Grok 4.7 모델 자체(xAI API, OpenRouter, Cursor 모델 선택기, Grok Build CLI) ② X의 공개 답변 봇 `@grok` ③ X에서 Grok Bot을 깨우는 `@bot`
2. **이 PC에서 지금 바로 쓸 수 있는 Grok 경로는 없다.** `XAI_API_KEY`와 `OPENROUTER_API_KEY`가 없고, `grok` CLI와 Cursor `agent` CLI가 설치돼 있지 않으며, Grok Bot 앱도 없다. `[로컬 확인]`
   - 예외가 하나 있다. 인증 없이 쓰는 **xAI Docs MCP 서버**(`https://docs.x.ai/api/mcp`)는 지금 응답한다(`tools/list` 확인). `[로컬 확인]`
3. **GPT(Codex CLI)는 지금 바로 세 번째 모델 계열로 쓸 수 있다.** 읽기 전용 샌드박스, JSON 스키마 출력, 이미지 입력, 실시간 웹 검색까지 이 PC에서 헤드리스로 확인했다. `[로컬 확인]`
   - 단, `~/.codex/config.toml`의 기본 모델 `gpt-6-sol`은 ChatGPT 로그인에서 400 오류가 난다. 호출할 때마다 `-m gpt-5.6-sol`을 붙여야 한다(4장 함정 참고).
4. **Claude Code가 지휘하는 구조에서 Grok을 붙이는 추천 순서**는 아래와 같다.
   - **(A) xAI API 키 + 소액 선불 크레딧**: X 검색, 웹 검색, 스크린샷 비평을 스크립트 한 줄로 부른다. 지휘 구조에 가장 깔끔하게 맞는다.
   - **(B) Grok Build CLI(`grok -p`)**: 공식 코딩 에이전트 CLI다. Windows 설치 스크립트가 있고, 구독 로그인이나 API 키로 헤드리스 실행이 된다.
   - **(C) Cursor 안의 Grok 4.7**: 빌더나 검증자 자리에 쓴다. pstack의 Grok 자리는 Cursor 안에서만 진짜 Grok으로 돈다.
   - **(D) Grok Bot**: 로그인이 필요한 웹 리서치나 긴 위임 작업용이다. 결과는 Notion 페이지로 주고받는 방식이 현재 가장 안정적이다.
5. **근거 요약**: 다른 계열 모델로 리뷰하면 놓친 결함을 더 잡는다는 2024~2026년 자료가 쌓이고 있다(Greptile 2026, GitHub Rubber Duck 2026, PoLL 2024). 반대 근거도 강하다.
   - 강한 모델일수록 회사가 달라도 오류가 같이 움직인다(ICML 2025).
   - 열린 창작에서는 모델끼리 결과가 비슷해진다(NeurIPS 2025 "Artificial Hivemind").
   - 토론을 돌려 합의를 만들면 정답이 다수에 묻힌다(2025~2026 MAD 연구).
   - **결론**: 각자 독립적으로 병렬 생성·검토하고, 증거로 판정하라. 다양성은 모델 계열보다 브리프와 레퍼런스를 다르게 줘서 만들고, 코드는 한 명만 쓴다.
6. **X 반응 조사의 한계**: 한국 대학생이 자격증이나 면접 이야기를 X에 얼마나 올리는지 확인할 자료를 찾지 못했다 `[미검증]`. X 검색은 보조 신호로만 쓰고, 표본 편향을 문서에 같이 적어야 한다.

---

## 2) Grok 연동 경로별 레시피

### 경로 한눈에 보기

| 경로 | 인증 | 지금 가능 | 이 작업에서 잘하는 일 | 비용(2026-10 기준) |
| --- | --- | --- | --- | --- |
| A. xAI API (Responses) | `XAI_API_KEY` + 선불 크레딧 | 아니오 | X·웹 실시간 반응 수집, JSON 구조화, 스크린샷 비평, 한국어 카피 비평 | grok-4.7 입력/출력 100만 토큰당 $2/$6, X 검색은 게시물 1,000개당 $5 |
| B. Grok Build CLI | 브라우저 로그인(X Subscription 등) 또는 API 키 | 아니오 (미설치) | 헤드리스 코드·UX 리뷰, 워크트리 빌더, ACP 연동 | 구독 사용량 또는 API 과금 |
| C. Cursor 속 Grok 4.7 | Cursor 계정 또는 `CURSOR_API_KEY` | IDE는 설치됨, 플랜 미확인. CLI는 미설치 | Cursor 하네스에서 빌드·리뷰, pstack의 진짜 Grok 자리 | Cursor 주간 풀에서 차감 |
| D. Grok Bot | Cursor 계정 + Premium 이상 또는 레거시 Pro | 아니오 | 로그인 필요한 웹 작업, 장시간 리서치, 경쟁사 플로 캡처 | 플랜 주간 풀 |
| E. X `@grok` / `@bot` | X 계정(+ Grok 계정 연결) | 아니오 | 사람이 직접 하는 즉석 질의 | 플랜 |
| F. OpenRouter | `OPENROUTER_API_KEY` | 아니오 | 키 하나로 GPT·Grok·Gemini 패널 구성 | grok-4.7 $2/$6 (실시간 API로 확인) |
| G. MCP | Docs MCP는 인증 없음 | Docs MCP만 가능 | xAI 문서를 정확히 참조 | 무료 |
| H. Hermes Agent (설치됨) | SuperGrok/X Premium+ OAuth 또는 API 키 | 아니오 (미설정) | 구독 한도 안에서 X 검색 | 구독 |

### A. xAI API 직접 호출 (가장 추천)

**현황** `[공식 문서]`
- 최신 모델은 `grok-4.7`(2026-09 출시)이다. 컨텍스트 500k, 텍스트와 이미지 입력, 텍스트 출력, 출력 길이 제한이 없고, 지식 기준일은 2026년 5월이다.
- `reasoning.effort`는 `low`/`medium`/`high`(기본)/`xhigh` 중에 고른다. 추론을 끌 수는 없다.
- grok-4.7은 **Responses API**(`POST https://api.x.ai/v1/responses`)용으로 나온다. Chat Completions는 문서에 "Deprecated(Legacy)"로 표시돼 있다.
- OpenAI SDK의 `base_url="https://api.x.ai/v1"`로 바로 호출할 수 있다.
- 미국 리전 엔드포인트(`https://us.api.x.ai/v1`)는 10% 비싸고, 모델은 grok-4.7과 grok-4.6만 있다.
- 서버 측 도구: `web_search`, `x_search`, `code_execution`, `collections_search`, 원격 `mcp`. 예전 Live Search(`search_parameters`)는 제거됐다. 사용하면 410을 받는다는 3자 보고가 있다.

**가격** `[공식 문서: docs.x.ai/developers/pricing]`

| 항목 | 요금 |
| --- | --- |
| grok-4.7 (프롬프트 200k 미만) | 입력 $2, 캐시 입력 $0.50, 출력 $6 (100만 토큰당) |
| grok-4.7 (프롬프트 200k 이상) | 요청 전체에 2배 |
| `web_search` | 1,000회 호출당 $5 |
| `x_search` | **가져온 게시물 1,000개당 $5, 프로필 1,000개당 $10** (호출 수가 아니라 가져온 항목 수 기준) |
| Batch API | 20% 할인 |
| Priority | 2배 |
| Grok 4.7 Fast | Cursor와 Grok Build 전용. 공개 API에는 없다 |

**레이트 리밋**: Tier 0에서 grok-4.7은 RPS 150, TPM 5천만이다. 이 작업 규모에서는 신경 쓸 필요가 없다. `[공식 문서]`

**구조화 출력** `[공식 문서]`
- Responses API에서는 `text.format = {type:"json_schema", name, schema, strict:true}`를 쓴다.
- 지원 모델에서는 도구(web_search, x_search)와 함께 쓸 수 있다.
- `additionalProperties`는 기본값이 false다.
- 쿡북 기준으로 숫자의 `minimum`/`maximum`은 강제되지 않는다. 받은 뒤 값 범위를 잘라내야 한다.

**설정** (사용자가 직접 한다. 키를 채팅에 붙여 넣지 않는다)
```powershell
# 1) https://console.x.ai 에서 가입 → 크레딧 선불 충전 → API Keys에서 키 발급 → 지출 한도 설정
# 2) 사용자 환경변수로 저장한 뒤 Claude Code 세션을 다시 시작
[Environment]::SetEnvironmentVariable("XAI_API_KEY", "<직접 입력>", "User")
```
연결 확인: `curl -s https://api.x.ai/v1/models -H "Authorization: Bearer $XAI_API_KEY"`
- 키가 없는 지금은 `401 unauthenticated:no-credentials`가 나온다 `[로컬 확인]`.

**Claude Code에서 부르는 최소 스크립트** (Node 22, 의존성 없음. 파일 생성은 사용자 승인 뒤에 한다)
```js
// scripts/grok.mjs  사용법: node scripts/grok.mjs <prompt.md> <out.md> [screenshot.png ...]
// 환경변수: XAI_API_KEY(필수), GROK_EFFORT(low|medium|high|xhigh), GROK_TOOLS=search 이면 web_search+x_search 사용
import { readFileSync, writeFileSync } from "node:fs";
const [promptPath, outPath, ...images] = process.argv.slice(2);
const content = [{ type: "input_text", text: readFileSync(promptPath, "utf8") }];
for (const p of images) {
  const mime = p.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  content.push({ type: "input_image", image_url: `data:${mime};base64,${readFileSync(p).toString("base64")}` });
}
const res = await fetch("https://api.x.ai/v1/responses", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "grok-4.7",
    reasoning: { effort: process.env.GROK_EFFORT ?? "high" },
    store: false,
    input: [{ role: "user", content }],
    tools: process.env.GROK_TOOLS === "search" ? [{ type: "web_search" }, { type: "x_search" }] : undefined,
  }),
  signal: AbortSignal.timeout(600_000),
});
if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
const json = await res.json();
const text = json.output.filter(o => o.type === "message").flatMap(o => o.content)
  .filter(c => c.type === "output_text").map(c => c.text).join("\n");
writeFileSync(outPath, text);
```
- 이미지는 jpg/png, 20MiB 이하이고 장수 제한은 없다 `[공식 문서]`.
- 이미지를 보낼 때는 서버 저장(`store`)을 끄라고 문서가 권장한다.

**X·웹 반응 수집 요청 예시** (curl, 구조화 출력 포함)
```bash
curl -s https://api.x.ai/v1/responses --max-time 300 \
  -H "Authorization: Bearer $XAI_API_KEY" -H "Content-Type: application/json" \
  -d @landing/research/raw/grok-xsearch-req.json -o landing/research/raw/grok-xsearch-res.json
```
```json
{
  "model": "grok-4.7",
  "reasoning": { "effort": "medium" },
  "store": false,
  "input": [{ "role": "user", "content": "최근 30일 X와 웹에서 한국 대학생·취준생이 SQLD 같은 자격증 공부, 'AI로 공부했는데 남는 게 없다', 면접 답변 준비에 대해 실제로 한 말을 찾아라. 각 항목에 원문 URL을 붙이고, 검색 결과에 없는 내용은 쓰지 마라. 결과가 없으면 없다고 써라." }],
  "tools": [
    { "type": "x_search", "from_date": "2026-09-26", "to_date": "2026-10-26" },
    { "type": "web_search" }
  ],
  "text": { "format": { "type": "json_schema", "name": "student_voice", "strict": true, "schema": {
    "type": "object", "additionalProperties": false, "required": ["items", "coverage_note"],
    "properties": {
      "items": { "type": "array", "items": { "type": "object", "additionalProperties": false,
        "required": ["quote_summary", "url", "source", "theme", "sentiment"],
        "properties": {
          "quote_summary": { "type": "string" }, "url": { "type": "string" },
          "source": { "type": "string", "enum": ["x", "web"] },
          "theme": { "type": "string", "enum": ["자격증_효용", "면접_막막", "AI공부_이해도", "기록_재방문", "기타"] },
          "sentiment": { "type": "number" } } } },
      "coverage_note": { "type": "string" } } } } }
}
```
- 쿡북 기준으로 이런 조사는 100건에 약 $0.8, 90초가 걸린다. 한 번 검색하면 최대 10개 게시물이 나오므로, 쿡북은 날짜별로 나눠 병렬로 돈다 `[공식 문서: X Sentiment Tracker 쿡북]`.
- 3자 측정으로는 `x_search` 한 번에 약 45초가 걸렸다. 클라이언트 타임아웃은 120초 이상으로 둔다 `[3자/미검증]`.
- 받은 결과는 쿡북처럼 **응답 인용(citations)에 실제로 나온 게시물만 남긴다**. 핸들이나 날짜 필터로 결과가 0건이면 근거 없는 요약이 나올 수 있다는 3자 보고(`degraded` 플래그)가 있다.

**이 작업에서의 쓰임**
- 2장 문제 섹션과 3장 시대 변화 섹션의 "고객 언어"를 보강한다. 다만 PRD 11장 "고객 근거 부족"을 대신하지는 못한다. 인터뷰를 대체하지 않는다.
- 경쟁사(TIO, 자소설닷컴)가 언급되는 반응을 모은다.
- 완성된 랜딩 스크린샷(모바일, 데스크톱)을 이미지 입력으로 보내 "한 컷 루프"가 보이는지 비평받는다.
- 히어로와 서브 카피 후보를 비평받는다. PRD 7장의 금지 표현(성과 보장, 최고, 1위, 유일, 경쟁사 비하)을 체크리스트로 같이 준다.
- Grok 4.7의 한국어 품질을 다룬 공식 벤치마크는 찾지 못했다 `[미검증]`. 한국어 자연스러움은 Claude 판단, 로컬 `humanize-korean` 스킬, 실제 대학생 피드백으로 최종 확인한다.

### B. Grok Build CLI (공식 코딩 에이전트)

**정체** `[공식 문서]`
- SpaceXSI의 터미널 코딩 에이전트다. 2026-05-25 얼리 베타로 시작했다.
- 쓰는 방식은 세 가지다. TUI, 헤드리스(`-p`), ACP(`grok agent stdio`).
- 기본 모델은 Grok Build 계열이고 `grok-4.7`도 쓸 수 있다.
- 호환성
  - 디렉터리마다 `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*.md`, `.cursor/rules/`를 읽는다.
  - MCP 설정은 `~/.claude.json`, `.cursor/mcp.json`, `.mcp.json`까지 합쳐 불러온다.
  - Claude Code 세션 가져오기(`grok import`)를 지원한다.
  - Claude Code 플래그 이름(`--allowedTools`, `--append-system-prompt`, `--dangerously-skip-permissions` 등)을 별칭으로 받는다.

**설치와 인증** (사용자가 실행한다)
```powershell
irm https://x.ai/cli/install.ps1 | iex      # Windows. 설치 스크립트 URL은 HTTP 200 응답 확인 [로컬 확인: HEAD만, 실행 안 함]
grok login                                  # 브라우저 로그인. 원격이면: grok login --device-auth
# 또는 API 과금으로: XAI_API_KEY 환경변수 사용
grok version; grok models; grok inspect     # 설치, 모델, 읽은 규칙·MCP 확인
```
- 구독으로 쓰는 경우: X Subscription Plus($8/월)부터 Build가 포함된다. Free 등급에는 "제한적" 포함이라는 3자 보도가 있다 `[3자/미검증]`.
- 예전 SuperGrok, X Premium+ 구독자도 쓸 수 있다.
- Grok API 사용량은 구독 풀과 별도로 과금된다 `[공식 문서: Cursor Models & Pricing]`.

**Claude Code에서 헤드리스로 리뷰 맡기기**
```bash
grok --no-auto-update -p "$(cat landing/reviews/brief-cursor-dev.md)" \
  -m grok-4.7 --effort high --cwd C:/Users/chewo/Experii \
  --output-format json --max-turns 30 \
  --disallowed-tools "<설치 후 grok --help로 확인한 쓰기·셸 도구 이름>" \
  > landing/reviews/grok-cursor-dev.json
```
- 출력 형식은 `plain`, `json`, `streaming-json` 중에 고른다. 세션은 `~/.grok/sessions`에 저장된다.
- **Windows에서 샌드박스를 믿지 말 것**
  - 공식 샌드박스는 Linux의 Landlock과 macOS의 Seatbelt로만 설명돼 있다. Windows에서 `--sandbox read-only`가 강제되는지는 확인하지 못했다 `[미검증]`.
  - 리뷰어로 쓸 때는 쓰기와 셸 도구를 `--disallowed-tools`나 `--deny` 규칙으로 막는다. 더 안전한 방법은 파일 접근이 없는 A 경로(API)에 내용을 직접 넣는 것이다.
- **리뷰어 전용 설정 권장** (`~/.grok/config.toml`)
  - `[compat.claude] mcps = false`
  - 이유: Claude Code에 붙인 Notion, Linear 같은 MCP가 Grok 세션에 같이 노출되는 것을 막는다.
- 빌더로 쓸 때는 `-w <이름>`으로 별도 git 워크트리를 만든다. 결과는 Claude가 diff로 받아 검토한다.

**이 작업에서의 쓰임**
- "Cursor 개발자 시각" 검증자 자리를 맡긴다. Grok 4.7은 Cursor와 함께 학습한 모델이다.
- 디자인 아레나의 B안 생성자를 맡긴다.
- 인터랙션 코드의 성능과 접근성을 독립적으로 리뷰한다.

### C. Cursor 안의 Grok 4.7 (IDE 모델 선택기, Cursor CLI, pstack)

**현황** `[공식 문서]`
- Grok 4.7은 Cursor의 자체 모델 풀(Grok 4.7, 4.6, 4.5, Composer 2.5)에 들어 있다. 모든 유료 플랜에서 주간 풀로 쓴다.
- Plus 플랜은 effort가 medium으로 고정되고 Fast를 쓸 수 없다.
- Cursor 안에서는 표준 256k, 롱컨텍스트 500k다. 256k를 넘으면 2배로 과금된다.
- 2026년 10월 기준 신규 고객은 "The X Subscription" 플랜(Free, Plus $8, Premium $30, Super $100, Ultra $200)으로 가입한다. 기존 Pro, Pro+, Ultra는 레거시로 그대로 유지된다.
- 이 PC의 Cursor IDE 버전은 3.27.14다. 사용자의 플랜은 확인하지 못했다.

**Cursor CLI 설치와 헤드리스 호출** (사용자가 설치하고 로그인한다)
```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent login        # 또는 CURSOR_API_KEY (cursor.com/dashboard/api)
agent models       # Grok 4.7 슬러그를 실제로 확인한다 (예: grok-4.7. 계정에 따라 다를 수 있음)
```
```bash
# 읽기 전용 리뷰: ask 모드. --force가 없으면 파일 변경은 제안만 하고 적용하지 않는다
agent -p --mode ask --model <grok 슬러그> --output-format json \
  --workspace C:/Users/chewo/Experii "$(cat landing/reviews/brief-cursor-dev.md)" > landing/reviews/cursor-grok.json
# 빌더: 별도 워크트리에서 쓰기를 허용한다
agent -p --force --model <grok 슬러그> -w landing-grok "<빌드 브리프>"
```
- 그 밖의 플래그: `--sandbox enabled|disabled`, `--trust`(헤드리스 전용), `--approve-mcps`, `--plugin-dir`, ACP(`agent acp`).
- TypeScript와 Python SDK, SDK Bridge로 Cursor 에이전트를 스크립트에서 띄울 수도 있다(`CURSOR_API_KEY` 필요).

**pstack과의 관계** `[로컬 확인: pstack 문서]`
- pstack(Lauren Tan, Cursor)의 기본 배치는 이렇다. 코드 위임(feature, bug-fix, swarm)은 `grok-4.7-xhigh-fast`가 맡고, 판단과 글쓰기는 Opus가 맡는다. 아레나와 인터로게이트 패널은 Opus와 Grok 한 명씩이다.
- **Claude Code 어댑터 문서에는 `grok-*` 슬러그를 "inherit-parent"(현재 세션 모델)로 바꾸라고 적혀 있다.** 사용자의 `~/.claude/rules/pstack-models.md`도 모든 자리를 Opus나 inherit-parent로 정해 두었다.
- 그래서 **Claude Code에서 pstack 패널을 돌리면 전부 Claude 계열**이 된다. 서로 다른 계열이 교차 판정하는 효과가 없다.
- 진짜 교차 계열을 얻는 방법은 두 가지다.
  - pstack 스킬을 **Cursor 안에서** 실행한다.
  - Claude Code에서는 Grok과 GPT 자리를 명시적인 CLI 호출(`grok -p`, `codex exec`)로 바꾼다.

### D. Grok Bot (사용자가 말한 "그록 봇")

**정체와 요구 조건** `[공식 문서]`
- 사용자 계정에 붙은 클라우드 컴퓨터 한 대를 모든 Bot이 같이 쓴다. 브라우저 세션, 파일, 로그인도 공유하므로 **Bot을 나눠도 보안 경계가 되지 않는다**.
- 데스크톱 앱: macOS, Windows(x64/Arm64), Linux. 모바일 앱: iOS 18 이상, Android 9 이상.
- Cursor 계정으로 로그인한다. 예전 Privacy Mode(Legacy)에서는 쓸 수 없다.
- 포함 플랜
  - The X Subscription: **Premium($30) 이상**. Plus와 Free에는 없다.
  - 레거시: Cursor Pro, Pro+, Ultra, Teams
  - 계정 연결: SuperGrok, X Premium+
- 3자 보도로는 2026-10-12부터 신규 고객이 $20 Cursor Pro로 Grok Bot을 쓸 수 없게 됐다 `[3자/미검증]`. "신규 고객은 X Subscription으로 시작한다"는 공식 문구와는 일치한다.
- 설치: Cursor 대시보드 `cursor.com/dashboard/bot`에서 Windows 앱을 받는다.

**Claude Code와 잇는 방법** (안정적인 순서)

1. **Notion 중계 (권장)**
   - Claude Code가 Notion MCP(이 세션에 연결돼 있음)로 "Grok 리서치 브리프" 페이지를 만든다.
   - 사용자가 Bot에게 "이 페이지 브리프대로 조사하고 결과를 같은 페이지 하위에 써 줘"라고 맡긴다. 반복 작업이면 일정 루틴으로 만든다.
   - Claude Code가 Notion MCP로 결과를 읽는다.
   - 웹훅 버그를 피할 수 있다. Bot이 쓴 결과는 신뢰할 수 없는 데이터로 다룬다.
2. **Slack 트리거**
   - 특정 채널과 문구에 반응하는 루틴을 만든다. Slack은 Bot을 소유한 Cursor 계정에 연결해야 한다.
   - Claude Code의 Slack MCP는 지금 인증되지 않은 상태다. 사용자가 `/mcp`에서 인증해야 쓸 수 있다.
3. **웹훅 루틴**
   - `POST https://api2.cursor.sh/automations/webhook/<routine-id>`에 `Authorization: Bearer <crsr_ 키>`를 붙여 보낸다. 응답 200은 "실행 시작"이라는 뜻이지 "완료"가 아니다.
   - 루틴 실행 한도: 시간당 전체 300회, 루틴당 200회. 일정 루틴은 최소 5분 간격이다 `[공식 문서: Cursor Help Routines]`.
   - **신규 Bot에서 웹훅 URL과 키가 앱에 표시되지 않는 버그가 미해결이다(2026-09-11 보고, 10월까지 재현).** 지금은 쓸 수 없다고 보고 계획한다 `[3자/미검증: Cursor 포럼]`.
   - pstack `/make-bot-ui` 스킬이 이 웹훅 패턴(키는 서버에만 둠)을 다룬다. 다만 Claude Code 어댑터는 Cursor Automations 단계를 "건너뛰기"로 처리한다.
4. **X에서 `@bot` 태그**
   - X 게시물이나 답글에 `@bot`을 달면 내 메인 Bot이 작업을 받는다.
   - 조건: X 계정이 Grok 계정에 연결돼 있고, 내 Bot이 하나 이상 있어야 한다.
   - 호주, 영국, EU, 노르웨이 등은 제외 지역이다. 한국은 제외 목록에 없다.
   - 게시물에 `@grok`가 같이 있거나 영상, GIF가 있으면 반응하지 않는다.
   - **공개 게시물이므로 출시 전 제품 정보를 쓰면 안 된다.**
5. **로컬 실행 (비권장)**
   - Bot이 승인을 받아 이 Windows PC에서 명령을 실행할 수 있다. 기본값은 "매번 묻기"다.
   - 이렇게 하면 Bot이 지휘자가 되어 Claude Code 지휘 구조와 충돌한다.

**이 작업에서의 쓰임**
- 지금 gstack browse 바이너리를 다른 프로세스가 쓰고 있다. 그 대신 Bot의 클라우드 브라우저로 경쟁사(TIO, 자소설닷컴)와 Aside 랜딩의 실제 사용자 흐름을 단계별로 캡처하고 요약하게 할 수 있다.
- "X for Grok Bot" 플러그인으로 트렌드와 멘션을 확인한다.
- 사용자가 자리를 비운 동안 긴 리서치를 돌린다.
- 주의: 로그인이 필요한 커뮤니티(에브리타임 등)를 Bot에 맡기는 일은 약관과 개인정보 문제가 있어 피한다. 루틴은 실행할 때마다 사용량을 쓴다(3자 보고로 주간 한도를 1~2일에 다 쓴 사례가 있음).

### E. X의 `@grok` (공개 답변 봇)
- 사람이 X에서 직접 묻는 용도다. 자동화 경로가 없고 질문과 답변이 공개된다. 이 작업에서는 쓰지 않는다.

### F. OpenRouter
- 2026-10-26에 공개 모델 API로 직접 확인했다 `[로컬 확인]`. 모두 텍스트, 이미지, 파일 입력과 `structured_outputs`를 지원한다.

| 모델 | 컨텍스트 | 가격 (입력/출력, 100만 토큰당) | 비고 |
| --- | --- | --- | --- |
| `x-ai/grok-4.7` | 500k | $2/$6 | `reasoning_effort` 지원 |
| `x-ai/grok-4.6` | 500k | $2/$6 | |
| `x-ai/grok-4.5` | 500k | $2/$6 | |
| `x-ai/grok-build-0.1` | 256k | $1/$2 | |
| `x-ai/grok-4.3` | 1M | | |
| `x-ai/grok-4.20` | 2M | | |
| `x-ai/grok-4.20-multi-agent` | 2M | | |

- 호출: `POST https://openrouter.ai/api/v1/chat/completions`, `model:"x-ai/grok-4.7"`. OpenAI Chat 형식이라 기존 도구에 붙이기 쉽다.
- X 검색은 web 플러그인이나 `openrouter:web_search` 서버 도구에 `x_search` 객체를 넣어야 켜진다(옵트인). 2026-09-21부터 게시물 단위로 과금된다 `[공식 문서: OpenRouter, 미실행]`.
- 장점: 키 하나로 GPT, Grok, Gemini 판정단을 꾸릴 수 있다. 단점: 키와 크레딧이 따로 필요하고, xAI 고유 기능은 OpenRouter가 옮겨 주는 범위에서만 쓸 수 있다.

### G. MCP
- **xAI Docs MCP (지금 가능)**
  - 주소: `https://docs.x.ai/api/mcp` (Streamable HTTP, 무상태, 인증 없음)
  - 도구: `list_doc_pages`, `get_doc_page`, `search_docs` `[로컬 확인]`
  - Claude Code에 붙이는 명령: `claude mcp add --transport http xai-docs https://docs.x.ai/api/mcp`. 영구 설정이 바뀌므로 사용자 승인이 필요하다.
  - 쓰임: Grok API 레시피를 쓸 때 최신 파라미터를 확인한다.
- **xAI Remote MCP**: Grok이 내 MCP 서버를 부르는 기능이다. 공개 HTTPS MCP 서버가 필요해서 이 작업에는 맞지 않는다.
- **3자 "Grok MCP" 서버** (joemccann/xai-mcp-server, merterbak/Grok-MCP, LKbaba/grok-mcp 등)
  - 지원 모델이 grok-3, grok-4 세대에 머물러 있거나, 폐기된 Live Search를 쓰는 사례가 있다 `[3자/미검증]`.
  - API 키를 MCP 설정 파일에 두게 되므로 공급망 위험도 있다.
  - 비권장한다. 위의 `scripts/grok.mjs` 같은 30줄짜리 래퍼가 더 투명하다.

### H. Hermes Agent (이 PC에 설치됨, 미설정)
- 로컬 문서(`C:\Users\chewo\AppData\Local\hermes\hermes-agent\website\docs`)에 따르면 `hermes auth add xai-oauth`로 SuperGrok이나 X Premium+ 구독을 OAuth로 연결할 수 있다. 그러면 `x_search`를 API 과금이 아닌 구독 한도로 부른다.
- 같은 문서에 일부 SuperGrok 등급이 403을 받는다는 경고가 있다. `~/.hermes`에는 logs만 있어 아직 설정되지 않았다 `[로컬 확인]`.
- 구독은 있는데 API 키는 만들기 싫을 때 쓰는 대안이다.

### (참고) 오픈소스 grok-cli
- `superagent-ai/grok-cli`(별 3.5k, 2026-07 마지막 푸시)는 공식 Grok Build가 나온 뒤로 필요성이 줄었다 `[로컬 확인: gh api]`.

---

## 3) Codex(GPT) 즉시 활용 레시피

**이 PC 상태** `[로컬 확인]`
- `codex-cli 0.144.5`, "Logged in using ChatGPT"
- 모델 카탈로그(`codex debug models`): `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`. effort는 low부터 max까지, sol과 terra는 ultra까지 있다.
- **설정 파일의 기본값 `model = "gpt-6-sol"`은 호출하면 400 오류가 난다.** 오류 내용은 "not supported when using Codex with a ChatGPT account"다. 반드시 `-m gpt-5.6-sol`을 붙인다.
- 사용자 설정을 불러오면 Slack MCP 인증 오류가 같이 찍힌다. `--ignore-user-config`를 쓰면 MCP와 기본 모델 설정을 건너뛴다. 인증은 그대로 `CODEX_HOME`을 쓴다.

**검증한 호출 4종** (모두 exit 0)
1. **텍스트 리뷰 + JSON 스키마 출력** (약 14초, 19,432토큰. 대부분은 스킬과 시스템 오버헤드)
```bash
cat landing/reviews/brief-lauren-lens.md | codex exec --ignore-user-config -m gpt-5.6-sol \
  -c model_reasoning_effort="high" --sandbox read-only --skip-git-repo-check --ephemeral \
  -C C:/Users/chewo/Experii --output-schema landing/reviews/review.schema.json \
  -o landing/reviews/gpt-lauren-lens.json -
```
2. **스크린샷 디자인 비평** (`-i`, 약 17초): `codex exec ... -i landing/shots/hero-mobile.png -o out.md "레이아웃 비평..."`
3. **실시간 웹 검색** (`-c web_search="live"`, 약 26초): 공식 릴리스 노트 URL을 인용해서 답했다. 예전 플래그 `--enable web_search_cached`는 이 버전에서 deprecated로 표시된다.
4. **읽기 전용 강제 확인**: 파일을 만들라고 시켰더니 "읽기 전용 샌드박스라 차단"이라고 답했고 파일은 생기지 않았다.
   - `-o` 출력 파일은 에이전트가 아니라 CLI 본체가 쓰기 때문에 read-only에서도 저장된다.

**그 밖의 플래그** (`codex exec --help`로 확인)
- `--json`: 이벤트 JSONL
- `-C <dir>`, `--add-dir`
- `-p <profile>`
- `codex exec review --uncommitted | --base <branch> | --commit <sha>`: 저장소 diff 리뷰. 이번에는 실행하지 않았다.
- `codex exec resume --last`

**PowerShell에서 부를 때**
```powershell
Get-Content landing\reviews\brief.md -Raw | codex exec --ignore-user-config -m gpt-5.6-sol -s read-only --skip-git-repo-check --ephemeral -C C:\Users\chewo\Experii -o landing\reviews\gpt.md -
```

**Claude Code에서 교차 계열 병렬 리뷰** (Grok 경로가 열린 뒤)
```bash
cd /c/Users/chewo/Experii
codex exec --ignore-user-config -m gpt-5.6-sol -c model_reasoning_effort="high" -s read-only \
  --skip-git-repo-check --ephemeral -C . -o landing/reviews/gpt.md - < landing/reviews/brief.md &
node scripts/grok.mjs landing/reviews/brief.md landing/reviews/grok.md landing/shots/hero-mobile.png &
wait   # 두 결과가 다 나온 뒤에 Claude가 판정한다. 서로의 답은 보여 주지 않는다
```

**이미 설치된 래퍼 스킬 주의**
- `multi-agent-debate` 스킬은 `codex exec --skip-git-repo-check -s read-only`처럼 `-m` 없이 부르는 줄이 있다. gstack `codex` 스킬도 `codex exec -s read-only ... --enable web_search_cached`처럼 `-m` 없이 부른다.
- 그래서 지금 설정 그대로면 실패할 수 있다 `[로컬 확인: 스킬 본문]`. 설정 기본 모델을 고치거나(사용자 결정) 호출에 `-m`을 넣어야 한다.
- 로컬 Ollama의 `llama3.2-vision`(7.8GB)은 무료 오프라인 네 번째 계열이다. 품질이 낮아 스크린샷을 간단히 확인하는 정도로만 쓴다 `[로컬 확인: ollama list]`.

---

## 4) 멀티모델 역할 분담 근거와 제안

### 근거 정리

| 주장 | 근거 | 강도 |
| --- | --- | --- |
| 작성한 모델과 다른 계열이 리뷰하면 고위험 버그를 더 잡는다 | Greptile(2026-07): Claude Code와 Codex가 만든 PR 1,000개에서 각 모델이 상대 계열 코드의 P0/P1 버그를 더 많이 찾음 | 중 (업체 연구, 정답 데이터 추정, 정밀도 미보고) |
| 다른 계열을 "러버덕"으로 두면 에이전트 성능이 오른다 | GitHub Copilot CLI Rubber Duck(2026-04): Claude 주 에이전트에 GPT 리뷰어를 붙였더니 Sonnet과 Opus 사이 격차의 74.7%를 메웠다고 보고 | 중 (업체 발표) |
| 서로 다른 계열 판정단이 단일 대형 판정자보다 편향이 적다 | PoLL(Verga et al., 2024): 자기 계열 출력에 점수를 더 주는 경향이 줄고, 비용은 7분의 1 이하 | 중상 (논문) |
| 판정자는 자기 출력을 선호한다 | Panickssery et al. 2024, Zheng et al. 2023 (PoLL 논문에서 인용) | 상 |
| 그래도 오류는 같이 움직인다. 강한 모델일수록 회사가 달라도 오답이 겹친다 | Kim et al., ICML 2025 "Correlated Errors in LLMs": 둘 다 틀릴 때 같은 오답을 고른 비율이 약 60%(한 데이터셋 기준) | 상 (논문) |
| 열린 창작에서는 모델 간 결과가 수렴한다 | Jiang et al., NeurIPS 2025 "Artificial Hivemind": 서로 다른 모델이 매우 비슷한 아이디어와 표현을 냄 | 상 (논문) |
| 토론해서 합의를 내면 정답이 다수에 묻힌다 | "The Cost of Consensus"(2026, arXiv 2605.00914): 동질 모델 토론에서 동조가 최대 85.5%, 정답이 토론 중 나왔다가 최종 투표에서 사라지는 차이가 최대 32.3점. Free-MAD(2025), Minority Sentinel(2026)도 같은 문제를 다룸 | 중 (소형 모델 위주라 프런티어 모델에 그대로 적용된다고 보기 어려움) |
| 여러 모델을 섞는 것보다 강한 모델 하나를 여러 번 샘플하는 편이 나을 때가 많다 | Self-MoA(Li et al., TMLR 2026): AlpacaEval 2.0에서 MoA보다 6.6% 높음. 섞으면 평균 품질이 떨어지는 것이 원인 | 상 (논문) |
| 멀티에이전트 실패는 대부분 설계, 역할 불일치, 검증 부재에서 온다 | MAST(Cemri et al., NeurIPS 2025): 실패 유형 14개, 3개 범주 | 상 (논문) |
| 병렬 서브에이전트는 넓은 리서치에 강하지만 토큰을 많이 쓴다 | Anthropic 멀티에이전트 리서치 시스템(2025-06): 단일 Opus 대비 내부 평가 +90.2%, 성능 분산의 80%를 토큰 사용량이 설명, 채팅의 약 15배 토큰 | 중상 (업체 엔지니어링 글) |
| 여러 에이전트가 동시에 같은 결과물을 쓰면 서로 모순된다. 작성자는 하나로 둔다 | Cognition "Don't Build Multi-Agents"(2025-06) | 중 (실무 원칙. 이번에 재확인하지 않고 기억에 근거) |

**정리**: 교차 계열은 **검토와 판정**에서 효과가 가장 분명하다. **창작 생성**에서는 계열을 섞는 것만으로 다양성이 보장되지 않는다. 다른 브리프, 다른 레퍼런스, 다른 제약을 줘야 실제로 달라진다. 토론으로 합의를 만들기보다 **독립 생성 → 증거 기반 판정**이 낫다.

### 이 랜딩 작업용 배치 제안 (사용자 요청 구조에 맞춤)

| 단계 | 자리 | 모델과 경로 | 브리프 차별화 |
| --- | --- | --- | --- |
| 리서치 ×3 (병렬, 서로 공유 없음) | R1 경쟁사 흐름 | Claude 서브에이전트 (WebFetch, curl) | TIO, 자소설닷컴 랜딩과 가입 흐름, 메시지 위계 |
| | R2 Aside와 레퍼런스 인터랙션 | GPT (`codex exec`, `web_search="live"`) | Aside의 "내 구독 연결" 설명 방식, Toss·OpenAI·Apple의 스크롤과 인터랙션 패턴 |
| | R3 실시간 고객 언어 | Grok (A 경로 `x_search`+`web_search`, 또는 D 경로 Bot) | X와 웹에서 대학생의 자격증·면접·AI 공부 반응. 출처 URL 필수, 표본 한계 표기 |
| 디자인 ×2 (아레나) | D1 | Claude (Opus) | 예: Toss식 한 줄 스토리를 세로로 스크롤 (Before→After 대비 중심) |
| | D2 | Grok 4.7 (Cursor 또는 Grok Build 워크트리) | 예: Apple식 고정(sticky) 시네마틱 데모. SQLD 대화 → 과제 → 경험 카드 → 1·7·30 리마인드를 한 컷으로 |
| 교차 판정 | Judge | GPT (`--output-schema`, 블라인드 라벨 A/B) | PRD 기준 채점표: USP 전달, 루프 한 컷 이해도, 금지 표현, 모바일 성능, 3분 세팅 메시지 |
| 빌드 | 작성자 1명 | Claude Code 본체 또는 Cursor Grok 4.7 중 하나만 | 승자 안을 기반으로 하고 패자 안의 좋은 점을 이식. 작성자는 한 명 |
| 검증 ×2 (독립) | V1 "Lauren Tan 렌즈" | GPT (작성자와 다른 계열) | pstack 원칙: 동작으로 증명(prove-it-works), 경험 우선(experience-first), 읽는 부담 줄이기(minimize-reader-load), AI 티 제거(unslop) |
| | V2 "Cursor 개발자 렌즈" | Grok 4.7 (Grok Build `--output-format json` 또는 `agent --mode ask`) | 인터랙션 성능(CLS, INP), 접근성, 모션 절제, 코드 구조 |
| 중재 | Arbiter | Claude (Opus) | 각 지적을 실제 브라우저와 코드로 재현해 확인. 확인된 것만 반영 |

**운영 규칙 (합의 붕괴 방지)**
1. **독립 1차**: 리서치, 디자인, 검증 자리는 서로의 출력을 보지 않는다. 토론 라운드는 두지 않는다.
2. **블라인드 판정**: 판정자에게는 모델 이름을 숨기고 A/B 라벨로 보여 준다. 순서를 바꿔 한 번 더 판정해 위치 편향을 확인한다.
3. **증거로 판정**: 다수결이 아니라 재현 여부로 채택한다.
   - "한 명만 지적했지만 재현됨"은 채택한다.
   - "모두 동의했지만 재현 안 됨"은 기각한다.
   - 소수 의견은 "Minority report" 칸에 남긴다.
4. **채점표는 PRD에서 미리 고정한다**: 성과 보장 표현 금지, 단정·비교 표현 금지, 경쟁사 비하 금지, 4단계 루프 시각화, "추가 구독료 없음" 표기(H4가 확인 전이라는 점도 같이 표기).
5. **작성자는 하나**: 병렬 자리는 제안만 낸다. 파일 수정은 빌더 한 명이 한다. CLAUDE.md의 병렬 에이전트 규칙(push, PR, main 병합 금지)을 따른다.
6. **비용 상한**: 리서치용 Grok API는 예: $5 한도. Codex는 ChatGPT 플랜 한도 안에서 쓴다. 호출당 오버헤드가 약 2만 토큰이다.

---

## 5) 사용자 조치 필요 항목

| # | 조치 | 열리는 경로 | 비고 |
| --- | --- | --- | --- |
| 1 | console.x.ai에서 크레딧 선불 충전, API 키 발급, 지출 한도 설정, 사용자 환경변수 `XAI_API_KEY` 등록, Claude Code 재시작 | A (+ B는 API 과금 모드) | 키는 채팅에 붙이지 않는다. 최소 충전 금액은 확인하지 못함 |
| 2 | (선택) Grok Build 설치 `irm https://x.ai/cli/install.ps1 \| iex` 후 `grok login` | B | X Subscription Plus 이상 권장. Free 포함 여부는 미검증 |
| 3 | Cursor 대시보드에서 현재 플랜 확인 (레거시 Pro인지, X Subscription 등급인지) | C, D | Plus는 Grok 4.7 effort가 medium으로 고정되고 Grok Bot이 없다 |
| 4 | (선택) Cursor CLI 설치 `irm 'https://cursor.com/install?win32=true' \| iex` 후 `agent login`, `agent models` | C | `cursor-agent`와 `agent`가 PATH에 없음 |
| 5 | (선택) Grok Bot 사용 시: Premium 이상 또는 레거시 Pro 확인, Privacy Mode(Legacy) 해제, `cursor.com/dashboard/bot`에서 Windows 앱 설치, Notion 연결 | D | 웹훅 버그 때문에 Notion 중계 권장 |
| 6 | (선택) X `@bot`을 쓰려면 grok.com Settings → Account에서 X 계정 연결 | D-4 | 공개 게시물이라는 점 주의 |
| 7 | Codex 기본 모델 수정 여부 결정: `~/.codex/config.toml`의 `gpt-6-sol`을 `gpt-5.6-sol`로 | 3장, 기존 스킬 | 고치지 않으면 매번 `-m`을 붙여야 한다 |
| 8 | (선택) Claude Code에 xAI Docs MCP 추가 승인 | G | 영구 설정 변경 |
| 9 | (선택) Slack MCP 인증(`/mcp`) | D-2 | 지금은 인증 안 됨 |
| 10 | (선택) OpenRouter 키 | F | A가 있으면 필요 없다 |

---

## 6) 함정

- **"그록 봇" 해석 차이**: Grok Bot은 API가 없는 위임형 앱이다. "Claude Code가 Grok을 함수처럼 부른다"를 원하면 A(API) 또는 B(Grok Build)가 맞다.
- **Grok Bot 웹훅 버그**: 신규 Bot은 URL과 키가 표시되지 않는다(2026-09~10 미해결). 200 응답은 시작했다는 뜻이지 끝났다는 뜻이 아니다. 루틴은 실행마다 사용량을 쓰고 레이트 리밋이 있다.
- **Grok Bot 공유 컴퓨터**: 모든 Bot이 로그인과 파일을 공유한다. Bot을 나누는 것은 보안 경계가 아니다.
- **플랜이 자주 바뀐다**: 2026-08 출시 후 4번 넘게 바뀌었다. Grok API는 구독 풀과 별도로 과금된다. 결제 전에 공식 가격 페이지를 다시 확인한다.
- **API 형식**: grok-4.7은 Responses API 기준이다. Chat Completions 전제의 오래된 도구나 MCP 래퍼는 실패하거나 기능이 빠질 수 있다. Live Search(`search_parameters`)는 제거됐다.
- **X 검색 비용과 품질**
  - 호출 수가 아니라 가져온 게시물 수로 과금된다. 날짜를 쪼개 병렬로 돌리면 비용이 곱해진다.
  - 필터 결과가 0건이면 근거 없는 요약이 나올 수 있다. 인용된 게시물만 남긴다.
  - 한국 대학생이 X를 얼마나 쓰는지 확인할 자료가 없다. 에브리타임, 오픈카톡, 인스타그램, 스레드 쪽 목소리가 빠지는 표본 편향이 있다.
- **구조화 출력**: 숫자의 min/max가 강제되지 않는다(쿡북). `additionalProperties` 기본값은 false다.
- **Grok 4.7 Fast**: API에는 없다. Cursor와 Grok Build 전용이다.
- **Grok Build의 범위 누수**: CLAUDE.md, `.claude/rules`, `~/.claude.json`의 MCP를 자동으로 불러온다. Windows에서 샌드박스가 강제되는지 확인되지 않았다. 리뷰어로 쓸 때는 쓰기와 셸 도구를 막거나 API 경로로 내용만 넘긴다.
- **pstack을 Claude Code에서 쓸 때**: Grok 자리가 inherit-parent(Claude)로 바뀐다. 패널이 이름만 다양하고 실제로는 한 계열이다.
- **Codex**
  - 설정 기본 모델 오류(`gpt-6-sol`)가 있다.
  - 사용자 설정의 MCP(Slack) 인증 오류가 찍힌다.
  - 스킬 컨텍스트 예산 경고와 호출당 약 2만 토큰 오버헤드가 있다.
  - `--enable web_search_cached`는 deprecated다. `-c web_search="live"`를 쓴다.
- **상관 오류**: 교차 계열이어도 강한 모델끼리는 같은 오답을 낸다. 최종 근거는 실제 브라우저 확인(CLAUDE.md 규칙)과 PRD 채점표다.
- **창작 수렴**: 디자인 두 자리에 같은 레퍼런스를 주면 결과가 비슷해진다. 레퍼런스와 제약을 의도적으로 다르게 준다.
- **토론 합의**: 토론 라운드를 늘리면 동조와 합의 붕괴 위험이 커진다. 독립 판정과 증거 중재로 대신한다.
- **신뢰할 수 없는 입력**: X 게시물, 경쟁사 페이지, Bot 결과물은 데이터일 뿐 지시가 아니다. 프롬프트 인젝션에 대비한다(xAI 쿡북 "Prompt Injection Defenses" 참고).
- **레퍼런스 사이트 저작권**: Toss, Apple, OpenAI는 인터랙션 원리만 참고한다. 에셋, 카피, 폰트를 복제하지 않는다.
- **랜딩 데모의 GPT 연동**: 브라우저에서 GPT를 실제로 호출하면 키가 노출되고 비용이 생긴다. PRD H4(구독 연동 가능 여부)도 아직 확인되지 않았다. 랜딩 데모는 미리 만든 대화를 재생하는 방식이 안전하다.
- **공개 채널**: `@grok`, `@bot` 게시물은 공개된다. 출시 전 기능과 내부 문서를 노출하지 않는다.

---

## 7) 출처

모두 2026-10-26에 확인했다. "로컬"은 이 PC의 파일이나 명령 결과다.

**SpaceXSI(xAI) 공식**
- https://docs.x.ai/llms.txt
- https://docs.x.ai/developers/quickstart
- https://docs.x.ai/developers/models
- https://docs.x.ai/developers/pricing
- https://docs.x.ai/developers/grok-4-7
- https://docs.x.ai/developers/release-notes
- https://docs.x.ai/developers/model-capabilities/text/reasoning
- https://docs.x.ai/developers/model-capabilities/text/structured-outputs
- https://docs.x.ai/developers/model-capabilities/images/understanding
- https://docs.x.ai/developers/model-capabilities/text/comparison
- https://docs.x.ai/developers/model-capabilities/text/multi-agent
- https://docs.x.ai/developers/tools/overview
- https://docs.x.ai/developers/tools/web-search
- https://docs.x.ai/developers/tools/x-search
- https://docs.x.ai/developers/tools/remote-mcp
- https://docs.x.ai/developers/docs-mcp
- https://docs.x.ai/developers/rate-limits
- https://docs.x.ai/developers/advanced-api-usage/regions
- https://docs.x.ai/build/overview
- https://docs.x.ai/build/cli/headless-scripting
- https://docs.x.ai/build/cli/reference
- https://docs.x.ai/build/settings
- https://docs.x.ai/build/features/sandbox
- https://docs.x.ai/build/features/permissions
- https://docs.x.ai/build/features/mcp-servers
- https://docs.x.ai/build/features/project-rules
- https://docs.x.ai/grok-bot/overview
- https://docs.x.ai/grok-bot/faq
- https://docs.x.ai/grok-bot/tag-on-x
- https://docs.x.ai/grok-bot/skills-routines-and-automations
- https://docs.x.ai/grok-bot/computer-and-apps
- https://docs.x.ai/grok-bot/approvals-security-and-privacy
- https://docs.x.ai/x-subscription/overview
- https://docs.x.ai/x-subscription/pricing
- https://docs.x.ai/x-subscription/usage-limits
- https://docs.x.ai/x-subscription/grok-bot
- https://docs.x.ai/x-subscription/cursor-token-rate
- https://docs.x.ai/cookbook/examples/x-sentiment-tracker
- https://x.ai/news/introducing-grok-bot (2026-08-11)
- https://x.ai/news/grok-bot-more-plans (2026-08-26)
- https://x.ai/news/grok-4-7 (2026-09-21)
- https://x.ai/news/grok-build-cli (2026-05-25)

**Cursor 공식**
- https://cursor.com/llms.txt
- https://cursor.com/docs/cli/installation
- https://cursor.com/docs/cli/headless
- https://cursor.com/docs/cli/reference/parameters
- https://cursor.com/docs/cli/reference/authentication
- https://cursor.com/docs/models/grok-4-7
- https://cursor.com/docs/models-and-pricing
- https://cursor.com/docs/sdk/bridge
- https://cursor.com/help/grok-bot/routines
- https://cursor.com/help/grok-bot/plans
- https://cursor.com/help/grok-bot/supergrok
- https://forum.cursor.com/t/introducing-grok-bot/168053
- https://forum.cursor.com/t/desktop-grok-bot-webhook-routine-shows-no-post-url-crsr-key-windows-0-47-0/171324

**OpenAI / OpenRouter**
- https://developers.openai.com/codex/config-basic (`web_search` 모드)
- https://openrouter.ai/api/v1/models (실시간 조회)
- https://openrouter.ai/docs/guides/features/web-search

**3자 (교차 확인 안 됨)**
- https://flaviocopes.com/grok-bot-vs-cursor-projects/ (2026-09-30)
- https://www.learncursor.dev/learn/cursor-agents/grok-bot-setup (2026-10-25)
- https://cellcog.ai/blog/grok-bot-cursor-pro/ (2026-10-12 갱신)
- https://hookdeck.com/webhooks/platforms/using-hookdeck-with-grok-bot-reliable-webhook-triggers
- https://docs.apiyi.com/en/api-capabilities/grok/web-search (x_search 지연시간, 410 보고)
- https://abcnews.com/Business/wireStory/spacex-buy-ai-coding-tool-cursor-60b-year-132275603
- https://www.techzine.eu/news/devops/142197/spacex-acquires-cursor-for-60-billion/
- https://github.com/joemccann/xai-mcp-server
- https://glama.ai/mcp/servers/@merterbak/Grok-MCP
- https://glama.ai/mcp/servers/LKbaba/Grok-mcp
- https://github.com/superagent-ai/grok-cli

**연구·실무 근거**
- Kim et al., "Correlated Errors in Large Language Models", ICML 2025: https://arxiv.org/abs/2506.07962
- Jiang et al., "Artificial Hivemind", NeurIPS 2025: https://neurips.cc/virtual/2025/poster/121421
- Verga et al., "Replacing Judges with Juries" (PoLL), 2024: https://arxiv.org/abs/2404.18796
- Li et al., "Rethinking Mixture-of-Agents" (Self-MoA), TMLR 2026: https://arxiv.org/abs/2502.00674
- Cemri et al., "Why Do Multi-Agent LLM Systems Fail?" (MAST): https://arxiv.org/abs/2503.13657
- "The Cost of Consensus", 2026: https://arxiv.org/pdf/2605.00914
- Free-MAD, 2025: https://arxiv.org/html/2509.11035v1
- Minority Sentinel, 2026: https://arxiv.org/pdf/2606.29270
- Greptile, "Models are worse at reviewing their own code" (2026-07-21): https://greptile.com/blog/model-inversion
- GitHub Copilot CLI Rubber Duck 보도 (2026-04-07): https://www.helpnetsecurity.com/2026/04/07/github-copilot-rubber-duck-cross-model-review/
- Anthropic, "How we built our multi-agent research system": https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition, "Don't Build Multi-Agents" (기억에 근거, 이번에 재확인 안 함): https://cognition.ai/blog/dont-build-multi-agents

**로컬**
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\README.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\docs\harness\claude-code.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\docs\guide\01-setup.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\docs\guide\04-design.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\docs\guide\09-make-it-yours.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\skills\arena\SKILL.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\skills\interrogate\SKILL.md`
- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\skills\make-bot-ui\SKILL.md`
- `C:\Users\chewo\.claude\rules\pstack-models.md`
- `C:\Users\chewo\AppData\Local\hermes\hermes-agent\website\docs\user-guide\features\x-search.md`
- `C:\Users\chewo\AppData\Local\hermes\hermes-agent\website\docs\guides\xai-grok-oauth.md`
- `C:\Users\chewo\.claude\skills\multi-agent-debate\SKILL.md`
- `C:\Users\chewo\.claude\skills\codex\SKILL.md`
- 명령 결과: `codex --version`, `codex exec --help`, `codex debug models`, `codex features list`, `codex login status`, `cursor --version`, `ollama list`
