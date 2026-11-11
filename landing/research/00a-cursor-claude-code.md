# 00a. Cursor × Claude Code 연동 리서치 (랜딩페이지 제작용)

| 항목 | 내용 |
|---|---|
| 작성일 | 2026-10-26 |
| 기준 문서 | `docs/archive/landing-prd-v0.1.md`(10장 랜딩페이지 요구사항), `landing/TSD.md`(16장 구현 순서) |
| 목적 | 취업 준비 대학생에게 Experii의 USP("공부가 경험으로 남는다", "쌓아 둔 걸 다시 꺼내 준다")를 전달하는 인터랙티브 랜딩페이지를 만들 때, Cursor와 Claude Code(그리고 GPT·Grok)를 어떻게 나눠 써야 결과물이 가장 좋아지는지 운영 레시피로 정리한다 |
| 표기 | **[로컬]** 이 PC에서 직접 실행·확인함 / **[공식]** Cursor·Anthropic·xAI 공식 문서나 변경 이력 / **[2차]** 포럼·블로그 등 / **[미확인]** 확인하지 못함 / **[제안]** 이 문서의 제안 |

---

## 1. 핵심 요약

1. **이 PC의 현재 상태.** Claude Code 2.1.309, Codex CLI 0.144.5(ChatGPT 로그인), Cursor 데스크톱 3.27.14가 있다. Cursor 데스크톱에는 로그인돼 있고, 오늘 이 레포에서 에이전트를 쓴 기록도 있다. Grok Bot 데스크톱 앱도 오늘 설치됐다 [로컬]. **Cursor의 헤드리스 CLI(`agent`, 별칭 `cursor-agent`)는 없다.** `cursor agent --help`를 실행하면 편집기 도움말만 나오고 에이전트는 뜨지 않는다 [로컬]. 따라서 "Claude Code가 Cursor를 헤드리스 워커로 부른다"는 패턴은 사용자가 CLI를 설치하고 로그인하기 전까지 쓸 수 없다.
2. **지금 바로 쓸 수 있는 조합은 셋이다.**
   - Claude Code: 오케스트레이터 겸 빌더. 브리프를 쓰고 `claude --bg -w`로 worktree 세션을 띄운다.
   - Codex(GPT): 다른 모델 계열의 리뷰어. 두 번째 디자인 시안 작성도 맡긴다.
   - Cursor 데스크톱: 사람이 직접 다듬는 자리. Agents Window, 내장 브라우저, Design Mode, `/review-bugbot`, `/best-of-n`을 쓴다.
3. **Cursor CLI를 설치한 뒤.** `agent -p`(print 모드)로 Grok 4.7이나 Composer 2.5 같은 Cursor 모델을 Claude Code에서 부를 수 있다. 이렇게 하면 Claude·GPT·Grok 세 계열이 다 갖춰진다. 사용법은 다음과 같다 [공식].
   - `--force`가 없으면 변경을 제안만 하고 파일은 고치지 않는다.
   - 결과는 `--output-format json` 또는 `stream-json`으로 받는다.
   - 헤드리스로 돌릴 때는 `--trust`가 필요하다.
4. **규칙 파일은 AGENTS.md 하나로 모은다.** 도구마다 읽는 파일이 다르다 [공식].
   - Cursor 편집기: `AGENTS.md`(루트와 하위 폴더)와 `.cursor/rules/*.mdc`
   - Cursor CLI: 루트의 `AGENTS.md`와 `CLAUDE.md` 둘 다
   - Claude Code: `CLAUDE.md`가 있으면 기본적으로 `AGENTS.md`를 읽지 않는다

   그래서 내용은 `AGENTS.md` 한 곳에만 두고, `CLAUDE.md`는 `@AGENTS.md` import로 연결하는 게 맞다. 지금 레포는 두 파일 내용이 이미 어긋나 있고, 둘 다 존재하지 않는 `PRD.md`를 가리킨다 [로컬].
5. **스킬·서브에이전트·훅은 `.claude/` 아래에 두면 양쪽이 같이 읽는다.** Cursor는 호환 경로로 다음을 읽는다 [공식].
   - `.claude/skills/`
   - `.claude/agents/`
   - `.claude/settings.json`의 훅(Cursor 설정에서 따로 켜야 한다)
6. **pstack의 모델 다양성이 Claude Code에서는 사라진다.** pstack은 "모델 다양성 + 실제 산출물 검증"이 핵심이다. 그런데 Claude Code에서는 Grok 슬롯이 `inherit-parent`로 바뀐다. 그 결과 `/interrogate`, `/arena` 패널이 모두 Claude가 된다 [로컬: `~/.claude/rules/pstack-models.md`, pstack `docs/harness/claude-code.md`]. 다른 계열 자리는 직접 채워야 한다.
   - 지금: Codex
   - CLI 설치 후: Cursor CLI(Grok)

   둘 다 Bash로 불러서 리뷰어로 넣는다.
7. **Lauren Tan의 운영 방식 요약.**
   - 빨리 가려면 먼저 깊게 간다.
   - 목표와 함께 통과/실패로 판정할 수 있는 완료 조건을 준다.
   - 실제 산출물로 증명한다.
   - 첫 디자인을 그대로 받지 않는다. 시안 2~3개를 한 스위처 뒤에 놓고 비교한다.
   - 리뷰는 계획이 아니라 diff에 대해, 다른 모델들에게 맡긴다.
   - 에이전트 하나에 worktree 하나를 준다.
   - 만든 에이전트가 자기 결과를 판정하지 않는다.
   - 루프는 믿을 수 있게 된 뒤에만 무인으로 돌린다.
8. **Bugbot에는 제약이 있다.**
   - PR 기반으로 돈다.
   - `.cursor/rules`가 아니라 `.cursor/BUGBOT.md`를 읽는다 [공식].
   - 브리프 규칙상 에이전트는 PR을 만들지 않는다. 그래서 PR 없이 쓰려면 Cursor 안에서 `/review-bugbot` 로컬 리뷰를 쓴다(3.7 이상, 이 PC는 3.27.14).
9. **Grok Bot은 코딩 워커가 아니다.** SpaceXAI와 Cursor가 2026-08-11 베타로 낸 범용 에이전트로, Bot마다 전용 클라우드 컴퓨터를 쓴다 [공식 x.ai].
   - 잘 맞는 역할: 맥락을 모으고 일을 라우팅하는 "outer loop"
   - 깨우는 방법: 웹훅 루틴. 다만 sender key를 채팅에 붙이면 안 된다 [공식 cursor help, pstack `make-bot-ui`]
   - 이 랜딩페이지에서의 쓰임: 배포된 미리보기를 실제 대학생처럼 걸어 보는 외부 점검자 정도가 적당하다 [제안]

### 1.1 Cursor 3.x 기능 지도 (2026-10 기준)

| 기능 | 무엇 | 이 PC 상태 | 근거 |
|---|---|---|---|
| Agents Window | 로컬·worktree·클라우드·원격 SSH 에이전트를 한 창에서 병렬 운영한다. 3.0(2026-04-02)에서 도입됐다 | 데스크톱 3.27.14 설치·로그인됨 | [공식] changelog 3.0, [로컬] |
| Design Mode | 브라우저 화면의 UI 요소를 골라 주석을 달고 에이전트에 넘긴다. 3.0에서 Agents Window에 들어왔고, 3.7부터 canvas 안에서도 쓴다 | 사용 가능. 단축키는 mac 기준(⌘+Shift+D)만 문서에 있다. Windows 키는 [미확인] | [공식] changelog 3.0·3.7 |
| 내장 브라우저 도구 | navigate, click, type, screenshot, console, network | 이 프로젝트에 `cursor-ide-browser` MCP가 붙어 있다. 도구는 `browser_cdp`, `browser_take_screenshot`, `browser_snapshot` 등이다 | [공식] docs/agent/browser, [로컬] `~/.cursor/projects/c-Users-chewo-Experii/mcps/` |
| `/worktree`, `/best-of-n` | 격리 worktree를 만든다. best-of-n은 같은 작업을 여러 모델로 돌리고, 모델마다 worktree를 따로 준다 | 데스크톱에서 사용 가능. 모델별로 따로 과금된다 | [공식] changelog 3.0 |
| Cursor CLI (`agent`) | 터미널 에이전트. `-p` print 모드, `-w` worktree, `&` 클라우드 넘김 | **미설치** | [공식] docs/cli/*, [로컬] |
| Cloud Agents | Cursor VM에서 돌며 영상·스크린샷 산출물을 남긴다. `/in-cloud`, `&`, cursor.com/agents로 쓴다 | 대시보드에서 GitHub 연결이 필요하다. 요금제는 [미확인] | [공식] docs/cloud-agent |
| Bugbot | PR 리뷰 봇. `bugbot run` 또는 `cursor review` 댓글로 부르고, `.cursor/BUGBOT.md`를 읽는다 | 레포 연결 [미확인]. 로컬 `/review-bugbot` 스킬은 있다 | [공식] docs/bugbot, [로컬] `~/.cursor/skills-cursor/review-bugbot` |
| Skills / Plugins | SKILL.md를 쓰는 skill과 plugin marketplace가 있다. skill은 Custom Mode로 계속 켜 둘 수 있다(Alt+Enter) | Cursor 쪽에는 gmail·drive·linear·notion·slack 플러그인만 있다. **pstack은 Cursor에 미설치**이고 Claude Code에만 있다 | [공식] docs/skills·plugins, [로컬] `~/.cursor/plugins/cache` |
| Subagents | `.cursor/agents/`, `.claude/agents/`, `.codex/agents/`에 둔다. 모델은 `inherit` 또는 지정 | 사용 가능 | [공식] docs/subagents |
| Hooks | `.cursor/hooks.json`을 쓴다. Claude Code 훅(`.claude/settings*.json`)도 읽는다(설정에서 켜야 함) | 레포 `.claude/settings.json`에는 플러그인 설정만 있고 훅은 없다 | [공식] docs/hooks, third-party-hooks |
| MCP | `.cursor/mcp.json`, `~/.cursor/mcp.json`. stdio, SSE, Streamable HTTP를 지원하고, MCP Apps는 UI를 반환할 수 있다 | `cursor --add-mcp '<json>'` 사용 가능 | [공식] docs/mcp, [로컬] `cursor --help` |
| Cursor SDK | `@cursor/sdk`(Node 22.13 이상), `cursor-sdk`(Python). 로컬·클라우드 런타임이 있다 | Node 22.18.0이 있다. `CURSOR_API_KEY`는 없다 | [공식] docs/sdk/typescript, [로컬] |
| Canvas | 에이전트가 만드는 공유 가능한 React 산출물 | 이 프로젝트에 `canvases/` 폴더가 있다 | [공식] changelog 2026-10-16, [로컬] |
| Projects | 코디네이터 에이전트가 클라우드·로컬 에이전트에 일을 나눠 준다(2026-09-10, 베타) | [미확인] | [공식] changelog |
| 모델 | Cursor 모델: Grok 4.7/4.6/4.5, Composer 2.5(유료 요금제의 주간 풀). 외부 모델: Claude(Opus 5.5 등), GPT-5.x, Gemini 등(Premium 이상, API 정가를 선불 크레딧에서 차감) | 사용자 요금제 [미확인] | [공식] docs/models |
| `cursor desktop ls/send` | 실행 중인 데스크톱 스레드에 메시지를 보내는 서브커맨드. `cli.js` 안에만 정의돼 있다 | **이 PC에서 동작 안 함.** 출력이 없고 `~/.cursor/desktop-bridge`도 없다. 공식 문서도 없다. 쓰지 않는다 | [로컬] |

---

## 2. 지금 이 PC에서 바로 가능한 레시피

로그인·키·설치가 필요 없는 것만 모았다. 경로는 이 PC 기준이다.

### R1. 브리프 하나 = 백그라운드 Claude 세션 하나 = worktree 하나

`.agents/README.md`, `scripts/agents/spawn.ps1`, `.agents/briefs/_TEMPLATE.md`가 이미 있다 [로컬]. TSD 16.2에서 파일이 겹치지 않는 세 갈래로 나눠 둔 것도 그대로 쓴다.

```powershell
# 브리프 작성: 템플릿을 복사해 완료 조건(통과/실패 판정 가능)을 채운다
Copy-Item C:\Users\chewo\Experii\.agents\briefs\_TEMPLATE.md C:\Users\chewo\Experii\.agents\briefs\landing-loop.md

# 띄우기 (스크립트가 claude --bg -w <slug> -n <slug> --permission-mode auto "/pstack:poteto-mode ..." 를 실행)
C:\Users\chewo\Experii\scripts\agents\spawn.ps1 -Brief C:\Users\chewo\Experii\.agents\briefs\landing-loop.md, C:\Users\chewo\Experii\.agents\briefs\landing-signup.md

# 지켜보기·개입·정리
claude agents
claude logs landing-loop
claude attach landing-loop
claude stop landing-loop      # 같은 worktree를 Cursor에서 손볼 때는 먼저 멈춘다
claude rm <id>
```

- worktree 위치는 `C:\Users\chewo\Experii\.claude\worktrees\<slug>`이다. 폴더는 있고 지금은 비어 있다 [로컬].
- 처음에는 2~3개만 병렬로 돌린다. 사람이 검토할 수 있는 양이 상한이다(`.agents/README.md`).

### R2. Codex(GPT)를 다른 계열 리뷰어·시안 작성자로

Codex는 ChatGPT 로그인 상태다. `codex exec`에는 `-s read-only|workspace-write|danger-full-access`, `-C <dir>`, `-i <image>`, `--json`, `-o <file>` 옵션이 있고, `codex exec review`에는 `--base`, `--uncommitted`, `--commit` 옵션이 있다 [로컬 `codex exec --help`].

Codex는 루트 `AGENTS.md`를 읽는데, 그 파일이 없는 `PRD.md`를 가리킨다. 그래서 프롬프트에 PRD 경로를 직접 적는다.

```bash
# 1) 브랜치 diff 리뷰 (읽기 전용)
cd /c/Users/chewo/Experii/.claude/worktrees/landing-loop && \
codex exec review --base main "기준 문서는 docs/archive/landing-prd-v0.1.md 와 landing/TSD.md 다. PRD 7장 금지 표현, 360px 모바일, 키보드 접근성, JS 꺼짐 상태의 루프 4단계 표시를 중심으로 실제 버그와 회귀만 보고해라. 칭찬과 사소한 취향은 빼라."

# 2) 특정 worktree를 읽기 전용으로 보고 결과를 파일로 남기기
codex exec -s read-only -C "C:/Users/chewo/Experii/.claude/worktrees/landing-loop" \
  -o "C:/Users/chewo/AppData/Local/Temp/claude/codex-review-loop.md" \
  "components/loop/** 를 읽고 LoopStepper가 SQLD 대화 → 현장 과제 → 면접 답변 한 줄 → 1·7·30일 리마인드를 한 컷으로 전달하는지 평가하라. 파일을 고치지 마라."

# 3) 스크린샷으로 디자인 비평 (Claude가 찍은 360/1280 스크린샷을 넘긴다)
codex exec -s read-only -i shot-360.png -i shot-1280.png \
  "취업 준비 대학생이 5초 안에 '공부가 면접 경험으로 남는다'를 이해하는지, 위계·여백·대비를 기준으로 비평하라."

# 4) 두 번째 디자인 시안을 GPT가 직접 만들게 할 때 (자기 worktree 안에서만 쓰기 허용)
codex exec -s workspace-write -C "C:/Users/chewo/Experii/.claude/worktrees/landing-design-b" \
  "브리프 .agents/briefs/landing-design-b.md 를 읽고 그 완료 조건을 만족하라."
```

- 쓰기를 허용하는 Codex는 반드시 자기 전용 worktree에서만 돌린다. worktree는 `git worktree add`나 `claude -w`로 미리 만든다.
- `--dangerously-bypass-approvals-and-sandbox`는 쓰지 않는다.

### R3. pstack 리뷰 패널에 GPT 자리 끼워 넣기

`~/.claude/rules/pstack-models.md`의 `interrogate reviewers: opus xhigh, inherit-parent`는 Claude Code에서 두 자리 모두 Claude가 된다 [로컬]. Claude Code의 Agent `model`은 `opus/sonnet/haiku/fable`만 받는다 [로컬 harness 문서]. 그래서 설정 파일로는 GPT를 넣을 수 없고, 아래처럼 직접 채운다.

```text
/pstack:interrogate landing-loop 브랜치를 회의적으로 리뷰해. 실제 버그나 회귀가 아니면 지적하지 마.
추가 리뷰어 C: 서브에이전트 하나를 띄워 Bash로
  cd C:/Users/chewo/Experii/.claude/worktrees/landing-loop && codex exec review --base main "<같은 의도·루브릭>"
를 실행하고 출력 전문을 그대로 돌려받아 A·B와 같이 합쳐라. 두 계열이 독립적으로 낸 지적을 가장 높게 쳐라.
```

- `/pstack:arena`(디자인 시안 경쟁)에서 cross-judge 자리도 같은 방식으로 Codex에 맡긴다. 이렇게 해야 심판의 모델 계열이 시안 작성자와 달라진다.
- 같은 목적의 로컬 스킬이 이미 있다. `multi-agent-debate`(Codex·Ollama를 headless로 부름)와 gstack `codex` 스킬이다.

### R4. 공유 규칙 파일 구성 (파일 변경 제안, 이 문서는 아무것도 고치지 않았다)

| 파일 | 내용 | 누가 읽나 |
|---|---|---|
| `landing/AGENTS.md` (신규) | 랜딩 범위 규칙의 단일 원본. 기준 PRD 경로(`docs/archive/landing-prd-v0.1.md`), TSD 경로, PRD 7장 금지 표현, 파일 소유 표(TSD 16.2), 검증 명령(`npm run build`, Vitest, Playwright 360/1280, axe), "GPT·Claude 연동 문구는 '준비 중'" | Cursor 편집기(하위 폴더 AGENTS.md 지원) [공식], Codex |
| `landing/CLAUDE.md` (신규) | 한 줄: `@AGENTS.md` | Claude Code. 루트에 `CLAUDE.md`가 있으면 Claude는 `AGENTS.md`를 직접 읽지 않으므로 import가 필요하다 [공식] |
| 루트 `CLAUDE.md` | 공통 내용은 `@AGENTS.md`로 가져오고, Claude 전용 내용("병렬 에이전트 작업" 절)만 남긴다 | Claude Code |
| 루트 `AGENTS.md` | "PRD.md를 먼저 읽어라"를 실제 경로로 고친다. 현재 루트에는 `PRD_MVP_V1.md`만 있고 `PRD.md`는 없다 | Cursor, Codex, Cursor CLI |
| `.cursor/BUGBOT.md` (선택) | Bugbot용 리뷰 기준. 금지 표현, 개인정보(TSD 13장), 성능 예산(TSD 12장) | Bugbot만. `.cursor/rules`는 Bugbot에 적용되지 않는다 [공식] |

Cursor CLI는 루트 `AGENTS.md`와 `CLAUDE.md`를 둘 다 규칙으로 읽는다 [공식 docs/cli/using]. 두 파일이 같은 내용을 반복하면 CLI 컨텍스트에 두 번 들어간다. import 구조로 바꾸면 이 중복도 사라진다.

### R5. 두 도구가 같이 읽는 스킬·서브에이전트 위치

| 종류 | 둘 다 읽는 위치 | 근거 |
|---|---|---|
| Skill | `.claude/skills/<name>/SKILL.md`. Cursor는 `.claude/skills/`를 호환 경로로 읽는다 | [공식] docs/skills |
| Subagent | `.claude/agents/<name>.md`. Cursor는 `.claude/agents/`를 읽지만, 이름이 겹치면 `.cursor/`가 우선한다 | [공식] docs/subagents |
| 검증 스킬 | `/pstack:create-verification-skill`로 `verify-landing`을 만든다. Claude Code에서는 `.claude/skills/verify-landing/`에 생기므로 Cursor도 쓸 수 있다 | [로컬] pstack guide 06, harness 문서 |

frontmatter는 도구마다 다르다. Cursor 서브에이전트는 `readonly`, `is_background`를 쓰고, Claude Code는 다른 필드를 쓴다. 한쪽 전용 필드를 다른 쪽이 무시하는지는 [미확인]이므로, 두 도구 모두에서 한 번씩 불러 보고 확인한다.

### R6. Cursor 데스크톱을 사람이 다듬는 자리로 쓰기

Cursor 데스크톱은 이미 로그인돼 있고 실행 중이다 [로컬 `tasklist`]. 아래는 Claude Code나 사람이 셸에서 실행할 수 있다.

```powershell
cursor -n "C:\Users\chewo\Experii\.claude\worktrees\landing-loop"                 # 해당 worktree를 새 창으로
cursor -d "<scratch>\variant-a\index.html" "<scratch>\variant-b\index.html"        # 두 시안 diff
cursor -g "C:\Users\chewo\Experii\landing\components\loop\LoopStepper.tsx:42"      # 지정 줄로 이동
```

Cursor 창에서 사람이 직접 하는 것:

1. Ctrl+Shift+P → **Agents Window**
2. 내장 브라우저로 `http://localhost:3000`을 연다
3. Design Mode로 히어로 문구나 LoopStepper 카드 같은 요소를 집어 "이 카드의 간격을 줄이고 1·7·30일 배지를 더 분명히" 식으로 요소 단위로 지시한다
4. `/review-bugbot`으로 base 대비 브랜치 변경을 로컬 리뷰한다. PR이 필요 없다(3.7 이상) [공식]
5. 필요하면 `/best-of-n`으로 같은 작은 작업(예: 히어로 카피 배치)을 여러 모델에 돌려 비교한다. 모델마다 worktree가 생기고 따로 과금된다 [공식]

원칙은 **한 worktree에는 한 명만 쓴다**는 것이다. Cursor 에이전트가 `landing-loop`를 고치는 동안에는 `claude stop landing-loop`로 Claude 세션을 멈춘다.

### R7. cursor-team-kit 스킬을 Claude Code에서 읽어서 쓰기

Claude Code의 cursor-plugins 마켓플레이스에는 `pstack`과 `origin-apps`만 등록돼 있다. 하지만 같은 클론 안에 `cursor-team-kit` 원본이 있다 [로컬]. pstack 어댑터 규칙과 같은 방식으로 SKILL.md를 Read해서 따르면 된다.

- `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\cursor-team-kit\skills\control-ui\SKILL.md`: 로컬 브라우저/CDP 하네스로 UI를 몰고 스크린샷, 접근성 스냅샷, 시각 diff를 남긴다
- `...\verify-this\SKILL.md`: 주장을 baseline/treatment 증거로 VERIFIED, NOT VERIFIED, INCONCLUSIVE 중 하나로 판정한다
- `...\run-smoke-tests\SKILL.md`: Playwright 스모크 테스트를 돌리고 결과를 분류한다
- `...\deslop\SKILL.md`: pstack Opening a PR 플레이북이 부르는 diff 청소 스킬. pstack에는 들어 있지 않다

### R8. 실제 브라우저 확인

- CLAUDE.md 규칙상 UI 변경은 실제 브라우저에서 확인해야 한다. 지금은 gstack browse 바이너리를 다른 프로세스가 쓰고 있다.
- Claude Code에서는 Claude Browser 패널(`preview_start`)이나 TSD 15장의 Playwright(`@axe-core/playwright` 포함)로 360×780과 1280×800 스크린샷을 남긴다.
- 그 스크린샷을 R2-3의 Codex 비평과 R3의 리뷰 패널에 같이 넘긴다.

### R9. Cursor 설정을 Claude Code로 가져올 수 있는지 점검 (읽기 전용)

```bash
cd /c/Users/chewo/Experii && claude import cursor --dry-run
```

이 PC에서 실행해 봤다 [로컬]. 아무것도 쓰지 않았고 다음을 보고했다.

- 자동으로 옮길 수 있는 항목: 56개(전부 사용자 레벨 스킬)
- 자동으로 옮길 수 없는 항목: 31개

랜딩 작업에는 필요 없다. 이미 있는 pstack이나 문서 스킬과 이름이 겹치는 것이 많으니 한꺼번에 가져오지 않는다.

---

## 3. 사용자 조치가 필요한 레시피 (로그인·설치·키)

### U1. Cursor CLI 설치와 로그인 (사용자가 직접)

```powershell
irm 'https://cursor.com/install?win32=true' | iex     # 공식 Windows 설치 명령 [공식 docs/cli/installation]
agent --version
agent login                                           # 브라우저 로그인. 사용자가 직접 한다
agent status                                          # 또는: agent whoami --format json
agent models                                          # 이 계정에서 쓸 수 있는 모델 ID 확인 (Grok·Composer·Claude·GPT 슬러그)
```

- 키 방식도 있다. `CURSOR_API_KEY` 환경 변수나 `--api-key`를 쓰고, 키는 Cursor 대시보드에서 만든다 [공식].
- 키는 채팅이나 프롬프트에 붙이지 않는다. 사용자가 자기 셸 환경 변수로만 넣는다.
- 2026년 초에는 네이티브 Windows CLI가 없어 WSL이 필요했다. 지금은 PowerShell 설치 명령이 공식 문서에 있다. 다만 가끔 멈춘다는 포럼 보고가 있다 [2차].

### U2. Claude Code에서 Cursor CLI를 워커·리뷰어로 부르기 (U1 이후)

```bash
# 읽기 전용 리뷰어: --force 없음 + ask 모드. 결과는 json의 .result
timeout 900 agent -p --trust --mode ask \
  --workspace "C:/Users/chewo/Experii/.claude/worktrees/landing-loop" \
  --model <agent models에서 확인한 grok 슬러그> --output-format json \
  "기준: docs/archive/landing-prd-v0.1.md, landing/TSD.md. 이 브랜치의 실제 버그와 회귀만 보고하라." \
  > /c/Users/chewo/AppData/Local/Temp/claude/cursor-review-loop.json

# 빌더: Cursor가 자기 worktree를 만들어 작업. 변경을 실제로 쓰려면 --force
timeout 3600 agent -p --force --trust -w landing-design-b --worktree-base main \
  --model <슬러그> --output-format stream-json --stream-partial-output \
  "브리프 .agents/briefs/landing-design-b.md 를 읽고 완료 조건을 만족하라. push·PR 금지."
```

플래그별 동작 [공식 docs/cli/reference/parameters]:

- `-w/--worktree [name]`: `~/.cursor/worktrees/<reponame>/<name>`에 새 worktree를 만든다
- `--worktree-base`: worktree의 기준 브랜치를 정한다
- `--trust`: 헤드리스에서 워크스페이스를 신뢰한다
- `--mode ask`: 읽기 전용으로 동작한다
- `--sandbox enabled`: 명령 실행을 샌드박스에 가둔다
- `--approve-mcps`: MCP를 자동 승인한다. 쓰지 않기를 권한다

결과 형식 [공식 docs/cli/reference/output-format]:

- `json`: 성공하면 객체 하나를 낸다. 필드는 `type`, `subtype`, `is_error`, `result`, `session_id`, `duration_ms`다.
- `stream-json`: 이벤트를 줄 단위 JSON으로 낸다. 이벤트는 `system/init`, `assistant`, `tool_call started/completed`, `result`이다.
- 실패하면 0이 아닌 종료 코드로 끝나고 stderr에 쓴다. `stream-json`은 `result` 이벤트 없이 끊길 수 있다. 그래서 종료 코드와 `result` 유무를 둘 다 확인한다.

모델 슬러그 [미확인]:

- pstack은 Cursor 슬러그로 `grok-4.7-xhigh-fast`와 `claude-opus-5-5-xhigh`를 쓴다 [로컬 pstack].
- Cursor 서브에이전트 문서는 `composer-2.5[fast=false]` 같은 괄호 파라미터를 보여 준다 [공식].
- CLI가 정확히 어떤 형식을 받는지는 `agent models` 출력으로 확인한다.

반복해서 쓰려면 `scripts/agents/cursor-run.ps1` 같은 얇은 래퍼를 하나 만들어 두는 게 좋다(build-the-lever 원칙) [제안]. 래퍼가 할 일:

- 인자: 워크스페이스, 프롬프트, 모델, `-Write` 스위치
- 타임아웃
- 종료 코드 검사
- `.result` 추출

### U3. Cursor에 pstack 설치와 모델 설정 (Cursor 안에서 사용자가)

```text
/add-plugin pstack
/setup-pstack        → 예산 선택, 역할별 모델 선택. ~/.cursor/rules/pstack-models.mdc 에 기록
/poteto-mode ...     → Alt+Enter로 고르면 Custom Mode로 계속 켜 둘 수 있다
```

- pstack 기본값은 이렇게 나뉜다 [로컬 pstack README].
  - 코드 위임: Grok
  - 판단·문장·가장 어려운 변경: Opus 5.5
  - 리뷰 패널: Opus 5.5와 Grok
- Cursor에서 Claude와 GPT는 외부 모델이다. Premium 이상 요금제에서 API 정가로 선불 크레딧을 쓴다. Plus 요금제는 Cursor 모델만 쓰고 Cloud Agents도 없다 [공식 docs/models]. 사용자 요금제는 [미확인]이다.
- 함께 설치하면 좋은 것: `/add-plugin cursor-team-kit`(deslop, control-ui 등).

### U4. Cloud Agents (선택)

- 준비: 관리자가 Cursor 대시보드에서 GitHub를 연결하고, `IBORY-PURPLE/Experii` 저장소에 읽기·쓰기 권한을 준다 [공식]. 이 PC의 `gh`는 `IBORY-PURPLE` 계정으로 로그인돼 있고 `repo` 권한이 있다 [로컬]. 다만 Cursor 쪽 연결은 따로 해야 한다.
- 시작하는 방법: CLI에서 메시지 앞에 `&`를 붙인다. 데스크톱에서는 `/in-cloud`를 쓰고, 웹에서는 cursor.com/agents를 쓴다 [공식].
- 랜딩 작업에서 좋은 점: VM이 브라우저와 데스크톱을 직접 몰고 스크린샷과 영상을 산출물로 남긴다. 노트북을 꺼도 작업이 계속된다.
- 주의: 레포가 Cursor VM으로 복제된다. Supabase secret key 같은 비밀은 환경 Secrets로만 넣는다.

### U5. Bugbot (PR 단계)

- 준비: 대시보드에서 레포를 연결한다. GitHub는 연결하면 바로 켜진다 [공식].
- 실행: 사람이 `gh pr create`로 PR을 열고 댓글에 `bugbot run`을 단다. 브리프 규칙상 에이전트는 PR을 만들지 않는다.
- 기준 문서: `.cursor/BUGBOT.md`를 쓴다(R4 표).
- Autofix: Cloud Agent 요금으로 과금되므로 처음에는 Off를 권한다.

### U6. Cursor SDK (선택, 반복 자동화가 필요할 때)

```bash
# 레포 밖 도구 폴더에서
npm install @cursor/sdk          # Node 22.13 이상 필요. 이 PC는 22.18.0
export CURSOR_API_KEY=...        # 사용자가 직접 넣는다
```

- `Agent.prompt(prompt, { apiKey, model: { id: "composer-2.5" }, local: { cwd } })`로 한 번 돌리고 끝낸다.
- `Agent.create(...)` 다음에 `agent.send()`를 부르고 `run.stream()`으로 결과를 스트리밍할 수 있다.
- `cloud: { repos: [...] }`를 넘기면 클라우드에서 돈다 [공식 docs/sdk/typescript, 로컬 `~/.cursor/skills-cursor/sdk`].
- 함정: `local`이나 `cloud`를 빠뜨리면 조용히 로컬로 돈다.
- 함정: 인라인 MCP는 resume할 때 유지되지 않는다.
- 랜딩 한 번 만드는 데는 CLI면 충분하다. 같은 리뷰를 매 PR마다 돌릴 때만 고려한다.

### U7. Claude Code 훅을 Cursor에서도 돌리기 (선택)

- Cursor 설정에서 third-party hooks를 켠다. 그러면 `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/settings.json`의 훅을 Cursor도 실행한다 [공식].
- 우선순위는 `.cursor/hooks.json`이 더 높다.
- Claude 형식 Stop 훅이 안 불린다는 버그 보고가 있다 [2차]. 켠 뒤 실제로 불리는지 한 번 확인한다.

### U8. Grok Bot (선택, outer loop 용)

- 앱 상태: `C:\Users\chewo\AppData\Local\Programs\Grok Bot`에 설치돼 있다(2026-10-26) [로컬]. 로그인 여부는 [미확인]이다.
- 포함 요금제: SuperGrok 계열, Cursor Pro·Pro+·Ultra·Teams [공식 x.ai]. Bot 사용량은 Cursor·Grok 요금제 사용량과 별개다.
- 깨우는 방법: 웹훅 루틴. 트리거는 스케줄, Slack 메시지, 웹훅(200을 돌려주면 run이 시작됨), Test run 네 가지다. 200은 "받았다"는 뜻이지 "끝났다"는 뜻이 아니다 [공식 cursor help]. 2026-10에는 Windows 데스크톱 앱에서 웹훅 URL과 키가 패널에 안 보인다는 보고가 있다 [2차].
- 연결 절차: pstack `/make-bot-ui` 절차를 따른다. sender key는 채팅이 아니라 로컬 서버 설정에만 둔다. Tailscale은 PATH에 있다 [로컬].
- 랜딩에서의 쓰임 [제안]: Vercel 미리보기 URL이 나온 뒤 사용자가 Grok Bot 앱에서 "SQLD 공부 중인 대학생으로서 모바일 화면으로 이 페이지를 끝까지 보고 사전 신청까지 가는 동안 막힌 곳을 보고해" 같은 외부 점검을 맡긴다. Claude Code가 Grok Bot을 직접 조종하는 경로는 웹훅뿐이고 키를 다뤄야 하므로 이번 작업의 필수 경로는 아니다.

---

## 4. 랜딩페이지 작업에 적용할 역할 분담 제안

원칙은 네 가지다.

- **오케스트레이터는 직접 짓지 않는다.**
- **만든 쪽과 판정하는 쪽은 모델 계열이 달라야 한다.**
- **worktree 하나에는 쓰는 주체가 하나다.**
- **완료는 실제 산출물로 증명한다.**

| 단계 | 담당 (지금 가능한 기본안) | Cursor CLI 설치 후 | 산출물 | 완료 조건 |
|---|---|---|---|---|
| 0. 리서치 3개: 경쟁사, Aside 랜딩, user flow | Claude Code 서브에이전트 3개 | 같음 | `landing/research/*.md` | 출처와 [미확인] 표기가 있다 |
| 1. 무드보드: Toss, Aside, OpenAI, Apple 레퍼런스 정리 | Claude Code 서브에이전트 1개(pstack Prototype 2단계) | 같음 | 레퍼런스별 "가져올 인터랙션 원리" 목록 | 사이트 문구를 베끼지 않고 원리만 남긴다 |
| 2. 디자인 시안 2개 | 시안 A: Claude bg 세션(`landing-design-a`). 시안 B: Codex `-s workspace-write`(`landing-design-b`) | 시안 B를 Cursor `agent -p --force -w landing-design-b`(Grok 또는 Composer)로 | scratch 폴더의 vanilla HTML/CSS/JS 시안 2개를 **한 스위처** 뒤에 둔다. 360·1280 스크린샷 포함 | 같은 브리프와 같은 레퍼런스를 쓴다. 루프 한 컷(SQLD 대화 → 현장 과제 → 면접 답변 한 줄 저장 → 1·7·30일 리마인드)과 Experii 앱 화면의 학습 대화 장면이 들어간다 |
| 3. 시안 판정 | 오케스트레이터(시안을 만들지 않은 세션)가 루브릭으로 채점한다. 교차 심판은 Codex | 교차 심판을 Grok으로 하나 더 | 기준별 점수, 기반 시안, 접목할 요소 | 루브릭 예: 5초 안에 USP 이해, 루프 이해도, 모바일 가독성, 금지 표현 0, 성능 예산 |
| 4. 구현 L1~L4 (TSD 16.1) | L1 골격은 Claude 세션 하나. 그다음 `landing-loop`, `landing-signup`, `landing-measure`를 Claude bg 세션 3개로 병렬(TSD 16.2) | 셋 중 하나를 Cursor CLI 빌더로 돌려 비교할 수 있다 | 브랜치별 작은 커밋, `.audit/<slug>.tsv` | TSD 16.1 각 단계 완료 조건(build 성공, content-guard 통과, 키보드 E2E 등) |
| 5. 사람이 다듬기 | 사용자 + Cursor 데스크톱(Design Mode, 내장 브라우저, `/best-of-n`) | 같음 | 요소 단위 수정 | 그 worktree의 Claude 세션은 멈춘 상태여야 한다 |
| 6. 검증 A: Lauren Tan 시각 | 새 Claude 세션. `/pstack:interrogate` + R3의 GPT 자리, prove-it-works, `verify-this`·`control-ui` | 리뷰어에 Grok 추가 | Act on, Consider, Dismissed 목록과 증거(스크린샷, Playwright, axe, Lighthouse) | 증거 없는 "통과"는 인정하지 않는다. 확인 못 한 항목은 "inconclusive"로 적는다 |
| 7. 검증 B: Cursor 개발자 시각 | 사용자가 Cursor에서 `/review-bugbot`. Claude 쪽에서는 `codex exec review --base main` | `agent -p --mode ask --model <grok>`로 헤드리스 리뷰 | 버그·회귀 목록 | 두 계열이 따로 낸 지적을 먼저 고친다 |
| 8. 병합·공개 | 사람(`gh pr create`, Vercel 미리보기, 필요하면 `bugbot run`) | Cloud Agent로 미리보기 영상 검증 | PR, 미리보기 URL | TSD 14.4 체크리스트, 15.2 실기기 확인 |

### 4.1 단계별 메모

- **디자인 단계에서 pstack 원칙 적용.** exhaust-the-design-space와 Prototype 플레이북을 그대로 쓴다.
  - 시안은 버릴 도구로 만든다. 그래서 Next.js가 아니라 vanilla HTML로 빨리 만든다.
  - 고른 방향만 Feature 플레이북에서 TSD 스택으로 다시 짓는다.
  - 리뷰어를 계획서에 쓰지 않는다. 계획서를 리뷰하면 있지도 않을 위험을 지어내기 때문이다.
- **Experii 화면 안의 GPT 학습 장면은 스크립트 목업으로 만든다.** 랜딩에서 실제 API를 호출하지 않는다.
  - PRD H4(구독 연동 가능 여부)가 아직 `[확인필요]`다.
  - TSD도 해당 기능을 "준비 중"으로 쓰게 돼 있다.
  - 실제로 호출하려면 서버에 키가 필요해 PRD·TSD 범위를 벗어난다.
- **브리프에 반드시 들어갈 다섯 가지**(pstack guide 02). Lauren Tan이 말하는 브리프 요소(담당, 재현 단계, 수용 기준, 넘길 증거)와 같은 계열이다 [2차].
  - 목표
  - 통과/실패 완료 조건
  - 보여 줄 증거
  - 이미 아는 사실
  - 진짜 제약(예: "push·PR 금지", "`content/` 밖 문구 금지")
- **루프는 나중에.** `/loop`나 무인 실행은 검증 스킬(`verify-landing`)이 한 번 끝까지 통과한 뒤에만 쓴다. 기간("2시간 동안")은 완료 조건이 아니다.

---

## 5. 함정

1. **`cursor agent`가 동작한다고 가정하면 안 된다.** 이 PC에서는 `cursor agent --help`가 편집기 도움말만 낸다. `agent`와 `cursor-agent`는 PATH에 없다 [로컬]. CLI가 필요한 레시피는 U1 이후에만 쓴다.
2. **`cursor desktop ls/send`는 쓰지 않는다.** 바이너리에는 정의돼 있지만 이 빌드에서는 동작하지 않고 문서도 없다 [로컬].
3. **print 모드 권한을 잘못 이해하기 쉽다.**
   - `--force` 없이 `-p`로 돌리면 파일을 고치지 않는다. 결과가 비어 보여도 정상이다 [공식].
   - `-p`에 `--force`를 붙이면 승인 없이 쓰기와 셸을 모두 한다. 반드시 전용 worktree에서만 돌린다.
   - 헤드리스로 돌릴 때 `--trust`를 빼면 신뢰 확인에서 멈출 수 있다.
4. **`-p`가 끝나지 않는 경우가 있다.** 이런 보고가 2026년 초에 있었다 [2차]. 항상 `timeout`으로 감싼다. 종료 코드를 확인하고, `stream-json`이면 `result` 이벤트가 있는지도 확인한다.
5. **규칙 파일이 서로 어긋나 있다** [로컬].
   - `AGENTS.md`와 `CLAUDE.md`가 이미 다르다. `AGENTS.md`에는 "병렬 에이전트 작업" 절이 없다.
   - 둘 다 존재하지 않는 `PRD.md`를 가리킨다.
   - Cursor CLI는 두 파일을 다 읽어 내용이 중복된다.
   - 2차 출처의 실험에 따르면 Cursor 편집기는 `CLAUDE.md`를 무시한다.
   - Claude Code는 `CLAUDE.md`가 있으면 하위 폴더 `AGENTS.md`도 기본값으로는 읽지 않는다 [공식]. `landing/AGENTS.md`만 만들면 Claude는 못 본다.
6. **Bugbot은 `.cursor/rules`를 읽지 않는다.** `.cursor/BUGBOT.md`가 따로 필요하고 PR이 있어야 돈다 [공식]. 에이전트 PR 금지 규칙과 충돌하므로 PR은 사람이 연다.
7. **pstack의 "다중 모델" 리뷰가 Claude Code에서는 단일 계열이 된다** [로컬]. GPT나 Grok 자리를 직접 넣지 않으면 서로 비슷한 사각지대만 확인하게 된다.
8. **pstack의 Cursor 전용 단계는 Claude Code에서 건너뛴다.** Automations, Bugbot 시작·대기, cloud agent 자체가 필요한 단계가 여기에 해당한다 [로컬 harness 문서]. 리포트에 "Skipped in Claude Code" 줄이 보이면 그 단계는 실제로 돌지 않은 것이다.
9. **한 worktree에 두 도구가 동시에 쓰면 안 된다.** Claude bg 세션과 Cursor 에이전트가 같은 worktree를 고치면 누가 무엇을 바꿨는지 알 수 없다. 사람이 Cursor로 다듬기 전에 `claude stop`을 먼저 한다.
10. **worktree 위치가 셋으로 갈린다.**
    - Claude: `.claude/worktrees/<name>`
    - Cursor CLI: `~/.cursor/worktrees/Experii/<name>`
    - Codex: 따로 만들지 않고 받은 `-C` 경로를 쓴다

    정리할 때 세 곳을 다 본다. `git worktree list`로 확인한다.
11. **비밀값.**
    - `CURSOR_API_KEY`, Grok Bot sender key, Supabase secret key는 채팅·프롬프트·브리프·커밋에 넣지 않는다.
    - Cloud Agent stdio MCP의 `env`는 VM으로 그대로 들어간다 [공식 SDK skill].
12. **비용.**
    - Cursor에서 Claude·GPT는 외부 모델이라 API 정가로 선불 크레딧을 쓴다.
    - `/best-of-n`과 Bugbot Autofix는 모델이나 Cloud Agent 단위로 과금된다 [공식].
    - 요금제를 먼저 확인한다 [미확인].
13. **Design Mode 단축키.** 문서에는 mac 단축키(⌘+Shift+D, ⌘+L, ⌥+click)만 있다. Windows 키는 Cursor 안에서 확인한다 [미확인].
14. **실제 브라우저 확인.** gstack browse 바이너리는 다른 프로세스가 쓰고 있으니 건드리지 않는다. Claude Browser 패널이나 Playwright를 쓴다.
15. **레퍼런스 사이트 문구를 그대로 쓰지 않는다.** Toss, Aside, OpenAI, Apple의 카피를 복사하지 말고 인터랙션 원리만 가져온다. PRD 7장 금지 표현("합격 보장", "1위", "유일" 등)과 경쟁사 비하 문구는 `content-guard` 테스트로 막는다(TSD 15.1).
16. **확인되지 않은 주장.** Lauren Tan의 "한 달 1,000 PR", "Grok Bot 20개 이상" 같은 수치는 본인 주장이거나 확인되지 않은 것이다 [2차]. 운영 모델의 원리만 가져오고 수치는 인용하지 않는다.

---

## 6. 출처

### 공식 문서·변경 이력 (2026)

- Cursor changelog 3.0 (2026-04-02, Agents Window, Design Mode, `/worktree`, `/best-of-n`): https://cursor.com/changelog/3-0
- Cursor changelog 3.7 (canvas 안 Design Mode): https://cursor.com/changelog/canvas-improvements
- Cursor changelog 목록 (2026-09-10 Projects, 2026-10-06 로컬 에이전트 원격 제어, 2026-10-16 Cloud Agent Canvases): https://cursor.com/changelog
- CLI 설치: https://cursor.com/docs/cli/installation
- CLI 헤드리스: https://cursor.com/docs/cli/headless
- CLI 파라미터: https://cursor.com/docs/cli/reference/parameters
- CLI 인증: https://cursor.com/docs/cli/reference/authentication
- CLI 출력 형식: https://cursor.com/docs/cli/reference/output-format
- CLI 개요(`&` 클라우드 넘김, 모드): https://cursor.com/docs/cli/overview
- CLI 사용(AGENTS.md·CLAUDE.md 로딩): https://cursor.com/docs/cli/using
- Rules / AGENTS.md: https://cursor.com/docs/rules
- Skills: https://cursor.com/docs/skills
- Plugins: https://cursor.com/docs/plugins
- Subagents: https://cursor.com/docs/subagents
- Hooks: https://cursor.com/docs/hooks
- Third-party hooks: https://cursor.com/docs/reference/third-party-hooks
- Models: https://cursor.com/docs/models
- Bugbot: https://cursor.com/docs/bugbot
- Cloud Agents: https://cursor.com/docs/cloud-agent
- Browser: https://cursor.com/docs/agent/browser
- MCP: https://cursor.com/docs/mcp
- TypeScript SDK: https://cursor.com/docs/sdk/typescript
- Grok Bot Routines: https://cursor.com/help/grok-bot/routines
- xAI, Grok Bot 요금제 확대: https://x.ai/news/grok-bot-more-plans
- Claude Code 메모리(CLAUDE.md, AGENTS.md, `@` import): https://code.claude.com/docs/en/memory
- pstack 원본 저장소: https://github.com/cursor/plugins/tree/main/pstack

### 2차 출처 (참고용, 확인 필요)

- 네이티브 Windows CLI 포럼 스레드: https://forum.cursor.com/t/native-windows-build-of-cursor-cli-without-wsl-requirement/150073
- `-p` 멈춤 보고: https://forum.cursor.com/t/cursor-agent-p-print-headless-mode-hangs-indefinitely-and-never-returns/150246
- Cursor가 CLAUDE.md를 무시한다는 실험: https://techsy.io/en/blog/cursor-rules-vs-claude-md
- Claude 형식 훅이 Cursor에서 안 불리는 버그: https://forum.cursor.com/t/claude-hooks-dont-work/153614
- Grok Bot 웹훅 URL·키 누락 보고: https://forum.cursor.com/t/desktop-grok-bot-webhook-routine-shows-no-post-url-crsr-key-windows-0-47-0/171324
- Lauren Tan 운영 모델 정리(2026-09-05): https://aiidelist.com/blog/lauren-tan-grok-bot-pstack-workflow
- Maven 워크숍(Lauren Tan, 2026-08-12): https://maven.com/p/e23d9c
- Grok Bot과 Cursor 요금제, SpaceX의 Anysphere 인수(규제 승인 대기): https://www.digitalapplied.com/blog/grok-bot-cursor-tier-gating-spacex-anysphere-deal-2026

### 로컬 자료 (이 PC)

- pstack 0.15.32 (Lauren Tan)
  - `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\pstack\README.md`
  - `...\pstack\docs\harness\claude-code.md`
  - `...\pstack\docs\guide\01~10`
  - `...\pstack\skills\interrogate\SKILL.md`, `arena`, `make-bot-ui`
  - `...\pstack\skills\poteto-mode\playbooks\prototype.md`, `visual-parity.md`
- cursor-team-kit: `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\cursor-team-kit\skills\*`
- Cursor 설정
  - 내장 스킬: `C:\Users\chewo\.cursor\skills-cursor\*`(`sdk`, `review-bugbot`, `canvas`, `loop` 등)
  - CLI 설정: `C:\Users\chewo\.cursor\cli-config.json`(approvalMode allowlist, sandbox disabled)
  - 이 레포의 내장 MCP: `C:\Users\chewo\.cursor\projects\c-Users-chewo-Experii\mcps\`
- 레포
  - `C:\Users\chewo\Experii\AGENTS.md`, `CLAUDE.md`
  - `C:\Users\chewo\Experii\.agents\README.md`
  - `C:\Users\chewo\Experii\scripts\agents\spawn.ps1`
  - `C:\Users\chewo\Experii\landing\TSD.md`
- 실행한 명령(모두 읽기 전용)
  - 버전·도움말: `cursor --version`, `cursor --help`, `cursor agent --help`, `cursor desktop --help`, `cursor desktop ls`, `codex --version`, `codex exec --help`, `codex exec review --help`, `claude --version`, `claude --help`, `claude import --help`, `node --version`
  - 상태: `gh auth status`, `git remote -v`, `git worktree list`, `tasklist`
  - 기타: `claude import cursor --dry-run`
