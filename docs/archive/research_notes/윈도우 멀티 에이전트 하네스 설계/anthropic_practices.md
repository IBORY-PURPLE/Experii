# Anthropic 엔지니어의 병렬 에이전트 실무 + Claude Code 멀티에이전트 기능·한계 (2026-10-26 기준)

> 조사 기준일: 2026-10-25~26. Claude Code 최신 버전 **2.1.310** (npm 2026-10-23 게시, stable 채널은 2.1.308) — [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code).
> 날짜 표기는 changelog 버전을 npm 게시 시각과 대조해 붙였다. 2026년 이전 자료에는 "(2025, possibly outdated)"를 달았다.
> 원문 직접 인용은 최소화하고 의역했다. 플래그·설정 키·UI 문자열은 식별자라서 원형 그대로 두었다.

## Q1. Anthropic 엔지니어(특히 Claude Code 팀)는 실제로 여러 에이전트를 어떻게 병렬로 돌리는가 (2026 업데이트 포함)

### Takeaway
Boris Cherny의 공개 워크플로는 2026년 동안 이렇게 바뀌었다.
- 1월: 번호 붙인 터미널 탭 5개 + 웹 세션 5~10개 + OS 알림.
- 1월 말: git worktree 3~5개가 팀 최고 팁이 됨.
- 4월: auto mode, recap, focus mode. 맡겨 두고 다음 Claude로 주의를 돌리는 방식.
- 5월: agent view(`claude agents`), 데스크톱 앱 다중 세션, Routines. 비동기로 일을 맡기고 결과(PR)로 리뷰.

**직접 개입하고 싶은 일은 별도의 top-level 세션(탭/worktree/agent-view 행/데스크톱 세션)으로 돌리고, subagent는 "결과만 필요한 일"에 쓰는 것**이 공개 발언에서 일관되게 보이는 패턴이다. 실행 중인 subagent나 팀원을 별도 탭으로 꺼내 대화한다는 공개 사례는 찾지 못했다.

### Cited Findings
- (2026-01-02 스레드) Boris: 터미널에서 Claude 5개를 병렬로 돌린다. 탭에 1~5 번호를 붙이고, Claude가 입력을 기다리면 시스템 알림으로 안다 — [Boris 스레드(Thread Reader)](https://threadreaderapp.com/thread/2007179832300581177.html), 원 포스트 [x.com/bcherny/status/2007179833990885678](https://x.com/bcherny/status/2007179833990885678)
- (같은 스레드) 로컬과 별도로 claude.ai/code에서 5~10개를 병렬로 돌린다. 로컬 세션을 `&`로 웹에 넘기고 `--teleport`로 오간다. 매일 아침 iOS 앱에서 몇 세션을 시작한다 — [Thread Reader](https://threadreaderapp.com/thread/2007179832300581177.html)
- (같은 스레드) 모든 작업에 Opus 4.5 + thinking을 쓴다. 대부분 Plan mode로 시작한다. code-simplifier 같은 subagent를 상용한다. 최고의 팁은 "Claude에게 자기 작업을 검증할 피드백 루프를 주는 것"이며 품질이 2~3배 오른다고 말함 — [Thread Reader](https://threadreaderapp.com/thread/2007179832300581177.html)
- (2026-03-04 Pragmatic Engineer) 터미널 탭 5개에서 각각 별도 checkout으로 5개 인스턴스를 돌린다. 하루 PR 20~30개. 일의 본질은 deep work보다 context switching 능력이라고 말함 — [Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/building-claude-code-with-boris-cherny)
- (2026-01-31 팀 팁 스레드)
  - git worktree 3~5개를 동시에 띄우고 각각 Claude 세션을 돌리는 것이 팀 최고의 생산성 팁.
  - `za`/`zb`/`zc` 셸 alias로 한 번에 전환한다. 로그·BigQuery 전용 "analysis" worktree를 둔다.
  - 터미널 탭에 색과 이름을 붙이고 때로 tmux를 쓴다. 작업/worktree당 탭 1개. `/statusline`으로 context 사용량과 브랜치를 표시.
  - 한 Claude가 plan을 쓰고 두 번째 Claude가 staff engineer 관점에서 리뷰한다. 일이 틀어지면 즉시 plan mode로 돌아가 re-plan.
  - 연산을 더 쓰고 싶으면 요청에 "use subagents"를 붙인다.
  - 출처: [Thread Reader(1/31 스레드)](https://threadreaderapp.com/thread/2017742741636321619.html)
- (2026-02-20) Boris가 `claude --worktree`, 데스크톱 worktree 체크박스, subagent worktree 지원, custom agent `isolation: worktree`를 연달아 소개 — 애그리게이터 [howborisusesclaudecode.com](https://howborisusesclaudecode.com/) → [x.com/bcherny/status/2025007394967957720](https://x.com/bcherny/status/2025007394967957720) (2차 애그리게이터 경유)
- (2026-04-16 스레드)
  - auto mode 덕분에 지켜볼 필요가 없어져 Claude를 더 많이 병렬로 돌릴 수 있다. 한 Claude가 돌아가기 시작하면 다음 Claude로 주의를 옮긴다.
  - recap은 에이전트가 한 일과 다음 할 일의 짧은 요약으로, 오래 돌던 세션에 돌아올 때 유용하다.
  - focus mode(`/focus`)는 중간 작업을 숨기고 최종 결과만 보여준다. `/go` 스킬은 e2e 자체 테스트 → `/simplify` → PR 생성까지 한다.
  - 출처: [Thread Reader(4/16 스레드)](https://threadreaderapp.com/thread/2044847848035156457.html)
- (2026-05-06 Code w/ Claude) Boris가 데스크톱 앱에서 여러 세션을 동시에 돌리며 어느 세션이 입력을 기다리는지 전환하며 시연했다. 앞으로 많은 코드가 비동기로 작성될 것이라고 했다. 본인 코드의 상당 부분을 Routines("higher-order prompts")로 만들어 아침에 머지 준비된 PR을 받는다고 말함 — [Simon Willison 라이브 블로그](https://simonwillison.net/2026/May/6/code-w-claude-2026/)
- (같은 행사) Cat Wu: CLI·IDE·데스크톱은 같은 에이전트의 표면(surface)이며, IDE와 데스크톱은 Claude Agent SDK 위에 만들어졌다. Code Review는 Anthropic 모든 팀이 쓴다 — [Simon Willison](https://simonwillison.net/2026/May/6/code-w-claude-2026/)
- (2026-05-11) Boris가 Agent View 발표(동시 세션 단일 목록) — [howborisusesclaudecode.com](https://howborisusesclaudecode.com/) → [x.com/bcherny/status/2053982327123132846](https://x.com/bcherny/status/2053982327123132846). CHANGELOG 2.1.139(npm 2026-05-11)의 "agent view (Research Preview)" 추가와 일치 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- (2026-05-12) Cat Wu가 루트 코드 디렉터리에서 `claude agents`를 실행해 모든 에이전트를 한곳에서 관리하라고 권했다고 2차 블로그가 전함. 원 포스트는 확인 못 함 — [Vibe Coder blog](https://blog.vibecoder.me/multi-claude-parallel-agents-anthropic-workflow)
- (2026-05-28) Boris: dynamic workflows로 수백 개 병렬 subagent — [howborisusesclaudecode.com](https://howborisusesclaudecode.com/) → [x.com/bcherny/status/2060048877944778995](https://x.com/bcherny/status/2060048877944778995). CHANGELOG 2.1.154(2026-05-28) "dynamic workflows" 도입과 일치 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- (2026-06-02) Thariq Shihipar·Sid Bidasaria 공저 블로그 "A harness for every task". Thariq는 workflows가 비기술 업무에 더 유용할 때도 있다고 씀. 실행 중인 개별 에이전트를 사람이 조종하는 방법은 다루지 않음 — [claude.dev blog](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/) (claude.com/blog URL이 claude.dev로 308 리다이렉트됨)
- (2026-06-08~09) Boris: auto mode가 나온 뒤로 plan mode는 더 이상 안 쓴다고 함(1월 조언을 수정). nested subagent는 처음엔 depth=5 상한 — [howborisusesclaudecode.com](https://howborisusesclaudecode.com/) → [x.com/bcherny/status/2064034799711588805](https://x.com/bcherny/status/2064034799711588805), [x.com/bcherny/status/2064327225504403752](https://x.com/bcherny/status/2064327225504403752)
  - 충돌: 현재 docs의 기본값은 3단계(`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`). CHANGELOG상 2.1.217에서 nesting 기본 해제 → 2.1.219(2026-07-24)에서 depth 3 기본 — [sub-agents docs](https://code.claude.com/docs/en/sub-agents), [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- (2026-03-13) Thariq: Remote Control로 모바일에서 세션 spawn — [howborisusesclaudecode.com](https://howborisusesclaudecode.com/) → [x.com/trq212/status/2032632596572811575](https://x.com/trq212/status/2032632596572811575)
- (2026-02-05) Nicholas Carlini(Safeguards팀)의 C 컴파일러 실험: 병렬 Claude 16개. 실행 중 사람의 능동적 개입은 없었고, 사람의 역할은 harness·테스트·CI 설계에 한정됨 — [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- (2026-03-24) Prithvi Rajasekaran(Labs): evaluator 판정을 자기 판단과 비교해 프롬프트를 여러 차례 직접 보정함 — [Anthropic Engineering](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- (2025-07-24, possibly outdated) "How Anthropic teams use Claude Code":
  - Product Design 팀: Claude가 기능 코드를 쓰고 테스트를 돌리며 계속 반복하는 자율 루프.
  - Security Engineering 팀: TDD를 주기적으로 체크인하며 진행.
  - 병렬 인스턴스·worktree 언급은 없음.
  - 출처: [claude.com blog](https://claude.com/blog/how-anthropic-teams-use-claude-code)
- Boris는 GitHub에서 Windows Terminal split-pane 요청 #24384에 2026-08-17 `area:agents` 라벨을 단 것 외에 공개 답변이 없다 — [GitHub #24384](https://github.com/anthropics/claude-code/issues/24384)

### Inferences
- Anthropic 내부의 "개별 에이전트와 직접 대화"는 사실상 **세션 단위**다. 터미널 탭, worktree, `claude agents` 행, 데스크톱 사이드바 세션, Projects thread가 그 단위다. subagent는 context 위생과 연산량 증폭용으로, 결과만 받는 용도로 쓰인다. 사용자가 원하는 "subagent를 꺼내 계속 협업"은 Anthropic 엔지니어의 공개 워크플로에 등장하지 않는다.
- 2026년의 흐름은 화면을 타일링하는 방식에서 **주의 라우팅**으로 옮겨 갔다. 핵심 요소는 다음과 같다.
  - needs-input 분류: agent view 상태 그룹, 데스크톱 알림, Projects의 "Waiting on you"
  - recap과 focus mode
  - PR 단위 리뷰
- Anthropic 엔지니어 발언은 macOS·iTerm2·tmux 중심이다. Windows 실무 사례는 공개 발언에서 찾지 못했다.

### Gaps
- Adam Wolff의 2026 병렬 에이전트 워크플로 공개 발언은 찾지 못함.
- Cat Wu의 `claude agents` 발언(5/12)은 2차 블로그로만 확인. 원 포스트 미확인.
- 2026년 6월 Fortune Brainstorm Tech에서 Boris가 "수백 개" 에이전트를 관리한다고 했다는 설은 2차 요약에만 있다. Fortune 페이지는 그가 연사(Head of Claude Code)였다는 사실만 확인해 줌 — [Fortune preview](https://fortune.com/2026/05/22/brainstorm-tech-2026-will-be-brilliant/?rand=8593). 개수는 미검증으로 둘 것.
- X 원문은 Thread Reader와 애그리게이터를 거쳐 확인. 7~10월 Boris 신규 포스트는 애그리게이터 수집 범위(6/9까지) 밖이라 확인 못 함.

## Q2. Anthropic이 공개한 멀티에이전트 하네스 설계 원칙

### Takeaway
공개 원칙을 하나로 정리하면 다음과 같다. orchestrator–worker 구조. worker마다 **clean context**. 결과는 **파일(외부 저장소)로 넘기고 참조만 전달**. 일하는 에이전트와 **판정하는 회의적 verifier를 분리**. progress·feature 파일과 git으로 세션 간 기억 유지. "가장 단순한 것부터 시작하고, 병렬화와 전문화는 조정 비용을 감당할 만큼 효과가 있을 때만" 쓴다.

멀티에이전트가 잘 맞는 일과 안 맞는 일:
- **잘 맞음**: 연구·리뷰·감사처럼 폭이 넓고 병렬화되는 일.
- **안 맞음**: 같은 context를 공유해야 하거나 의존성이 많은 일. 대부분의 코딩이 여기에 속한다.

하네스 구성요소는 "모델이 혼자 못 하는 것"에 대한 가정이므로 모델이 좋아질 때마다 걷어내야 한다. 사용자의 pain과 직결되는 대목도 있다. 2025 연구 시스템 글이 "lead가 subagent를 동기적으로 기다리는 구조가 조종(steering)의 병목"이라고 이미 지적했다.

### Cited Findings
- **How we built our multi-agent research system** (2025-06-13, possibly outdated)
  - 구조: lead agent가 계획하고 subagent들이 병렬 검색한 뒤 CitationAgent가 출처를 붙인다.
  - 성능: Opus 4 lead + Sonnet 4 subagent 조합이 내부 연구 eval에서 단일 Opus 4보다 90.2% 높았다. BrowseComp 성능 분산의 80%를 토큰 사용량이 설명한다(3요인으로 95%). 에이전트는 채팅 대비 약 4배, 멀티에이전트는 약 15배 토큰을 쓴다.
  - 안 맞는 경우: 모든 에이전트가 같은 context를 필요로 하거나 의존성이 많은 도메인. 대부분의 코딩 작업.
  - 위임 원칙: 목표·출력 형식·도구·경계를 명시해 위임한다. 복잡도에 맞춰 노력을 조절한다(단순 사실 1개, 복잡한 연구는 10개 이상).
  - 기억: lead는 plan을 memory에 저장한다(200k 초과분은 잘리므로).
  - 핸드오프: subagent 산출물은 외부 저장소에 쓰고 가벼운 참조만 넘긴다("game of telephone" 회피).
  - 병목: lead가 subagent 배치를 동기적으로 기다려 조종과 조율을 막는다. 비동기는 결과 조율·상태 일관성·오류 전파 문제를 낳는다.
  - 운영: 체크포인트 재개, tracing, rainbow deploy.
  - 출처: [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- **Effective harnesses for long-running agents** (2025-11-26, possibly outdated)
  - 구조: initializer agent + coding agent. harness는 같고 첫 프롬프트만 다르다.
  - 산출물: `claude-progress.txt`, `init.sh`, JSON feature list(200개 이상, `passes:false`로 시작), git 커밋.
  - 작업 방식: 세션당 기능 하나, 깨끗한 상태로 종료. 새 context는 pwd, git log, progress, feature list를 읽고 init.sh와 e2e 테스트로 시작한다. 브라우저 자동화 테스트로 성능이 크게 좋아졌다.
  - 미해결 질문: 단일 범용 에이전트와 전문 멀티에이전트(테스트·QA·정리 담당) 중 어느 쪽이 나은가.
  - 출처: [Anthropic Engineering](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **Building a C compiler with a team of parallel Claudes** (2026-02-05, Carlini)
  - 규모: 에이전트 16개, 약 2,000세션, 약 $20k, Rust 약 10만 줄. Linux 6.9를 x86/ARM/RISC-V로 빌드.
  - 실행: 에이전트마다 Docker 컨테이너에서 bare repo를 clone하고 push.
  - 조율: orchestrator도 에이전트 간 메시징도 없다. `current_tasks/` lock 파일로 작업을 claim하고 git 동기화로 충돌을 해소한다.
  - 기억: README와 progress 파일을 자주 갱신.
  - 검증: 테스트가 사실상 verifier라서 거의 완벽해야 한다. 거대한 단일 작업(커널)은 GCC를 oracle로 써서 쪼갰다.
  - context 오염 방지: 로그는 파일로 남기고 ERROR는 grep 가능한 한 줄로.
  - 역할 전문화: 중복 제거, 성능, 비평가, 문서.
  - 위험: 테스트 통과가 곧 완료라고 착각하기 쉽다.
  - 출처: [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- **Harness design for long-running application development** (2026-03-24)
  - 구조: planner → generator → evaluator.
  - 핸드오프: generator와 evaluator가 스프린트마다 "sprint contract"(만들 것과 검증 방법)를 합의한다. 에이전트 간 소통은 파일로 한다.
  - 검증: evaluator는 Playwright MCP로 실제 앱을 조작한다. 기본 상태의 Claude는 QA를 잘 못하므로, 자기비판보다 별도로 튜닝한 회의적 evaluator가 다루기 쉽다.
  - context 관리: Sonnet 4.5는 "context anxiety"가 강해 reset이 필요했다. Opus 4.5부터 사라져 compaction이 있는 연속 세션으로 전환했다.
  - 비용 비교: 단독 실행은 20분·$9에 핵심 기능이 고장 났고, harness는 6시간·$200에 동작하는 앱을 만들었다.
  - Opus 4.6에서 스프린트를 제거하고 evaluator를 마지막에 한 번만 돌렸다.
  - 원칙: 모든 구성요소는 모델 한계에 대한 가정이므로 새 모델마다 다시 점검한다. 가장 단순하게 시작한다.
  - 출처: [Anthropic Engineering](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **A harness for every task: dynamic workflows** (2026-06-02, Thariq·Sid)
  - 6개 패턴:
    - classify-and-act
    - fan-out-and-synthesize: synthesize 단계는 모든 fan-out을 기다리는 barrier
    - adversarial verification
    - generate-and-filter
    - tournament
    - loop until done
  - 원칙:
    - 단계마다 clean context.
    - 별도 verifier로 self-preferential bias를 상쇄.
    - 절대 점수보다 쌍대 비교.
    - 신뢰할 수 없는 공개 콘텐츠를 읽는 에이전트는 고권한 작업에서 격리.
    - 전통적인 코딩 작업 대부분은 리뷰어 패널이 필요 없다.
    - 병렬화와 전문화는 조정 비용을 감당할 만큼 효과가 있어야 한다.
  - 출처: [claude.dev blog](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/)
- **workflows docs**
  - 누가 계획을 쥐는가로 나뉜다. subagent는 Claude가 매 턴, agent team은 lead가 매 턴, workflow는 스크립트가 결정한다. workflow의 중간 결과는 Claude context가 아니라 스크립트 변수에 있다.
  - 실행 중 사용자 입력 불가. 기본 동시 16개, run당 1,000개 상한. 같은 세션 안에서 재개 가능.
  - 출처: [workflows docs](https://code.claude.com/docs/en/workflows)
- **agent teams docs의 베스트 프랙티스**
  - 팀원 3~5명으로 시작. 팀원당 작업 5~6개.
  - 같은 파일 편집 금지. 처음엔 코드 작성이 없는 연구·리뷰부터.
  - lead의 대화 이력은 상속되지 않으므로 spawn prompt에 context를 넣는다.
  - 오래 방치하지 말고 모니터링하며 조종한다. 경쟁 가설 토론 패턴을 쓴다.
  - 출처: [agent teams docs](https://code.claude.com/docs/en/agent-teams)
- **"Run agents in parallel" docs**: 누가 조율하는가 / 워커끼리 대화가 필요한가 / 같은 파일을 만지는가, 세 질문으로 방식을 고른다. agent team은 팀원을 worktree로 격리하지 않으므로 파일 소유를 분할해야 한다 — [agents docs](https://code.claude.com/docs/en/agents)
- **Code w/ Claude 2026**: Managed Agents에 "multi-agent orchestration"(public beta)이 추가됐다. Dianne Na Penn은 상위 팀들이 자동 eval과 단순한 scaffolding에 집중한다고 말함 — [Simon Willison](https://simonwillison.net/2026/May/6/code-w-claude-2026/)

### Inferences
- 사용자의 PM → 리서치 ×N → synthesis 구조는 Anthropic이 가장 잘 맞는다고 꼽는 유형(연구 fan-out + synthesize)이다. 그런데 "synthesize는 barrier이고 orchestrator는 요약만 본다"는 구조적 성질이 바로 사용자의 pain("최종 synthesis만 보인다")을 만든다.
- Anthropic식 해법은 세 가지다.
  - 중간 산출물을 파일로 남겨 사람과 다른 에이전트가 읽게 한다.
  - verifier를 분리한다.
  - 워커에게 직접 메시지를 보낸다(teams, SendMessage).
- 2025년에 지적된 "동기 orchestration은 조종의 병목"이라는 문제에 대한 2026년의 제품 대응은 다음과 같다. 이 흐름이 "개별 에이전트 개입"을 제품화하는 방향이다.
  - 인터랙티브 세션의 background subagent 기본화(2.1.232)
  - agent view
  - cross-session messaging

### Gaps
- 사람이 실행 중인 특정 worker를 직접 조종하는 UX를 다룬 Anthropic 엔지니어링 글은 찾지 못함. 위 글들은 모두 자율 실행을 전제로 한다.
- Managed Agents 관련 엔지니어링 글은 범위 밖(다른 리서처 담당)이라 검토하지 않음.

## Q3. Claude Code 멀티에이전트 기능의 현재 동작과 한계 (v2.1.310 기준) — 코디네이터 요청 항목 검증 포함

### Takeaway
공식 docs는 병렬 방식을 다섯 가지로 정리한다. subagents, agent view(`claude agents`, research preview), agent teams(experimental, 기본 비활성), Projects(클라우드, public beta), dynamic workflows. 보조 도구로 worktree, cross-session messaging, `/batch`, `/fork`가 있다.

개별 에이전트와 직접 대화하는 기능은 모든 방식에 있다. 다만 거의 항상 **같은 화면 안에서** 이루어진다.
- subagent·teammate: agent panel → Enter → transcript에 입력
- background 세션: peek(Space)이나 attach
- Projects: thread별 입력창

별도 pane은 agent team의 tmux/iTerm2 모드뿐이고, Windows Terminal·VS Code 터미널·Ghostty는 미지원이다.

**코디네이터 요청 항목 검증 결과**: Agent View, `claude attach`, `-n/--name`, `teammateMode` 모두 공식 docs와 CHANGELOG로 확인했다. `teammateMode`에 `windows-terminal` 값은 **없다**(#24384에서 요청 중).

### Cited Findings
**버전 타임라인** — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), 날짜는 [npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)

| 버전 (날짜) | 변경 |
|---|---|
| 2.1.32 (2026-02-05) | agent teams research preview (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) |
| 2.1.33 (02-06) | `TeammateIdle`·`TaskCompleted` hook |
| 2.1.47 (02-18) | teammate 탐색을 Shift+Down(순환)만으로 단순화 |
| 2.1.50 (02-20) | `claude agents`가 "설정된 agent 목록" 명령으로 처음 등장. 2.1.139에서 agent view로 의미 변경 |
| 2.1.139 (05-11) | agent view research preview |
| 2.1.154 (05-28) | dynamic workflows |
| 2.1.178 (06-15) | `TeamCreate`/`TeamDelete` 제거. 세션당 암묵적 팀 1개, Agent tool의 `name`으로 팀원 spawn |
| 2.1.186 (06-22) | `teammateMode: "iterm2"` |
| 2.1.198 (07-01) | background 세션 `Notification` hook(`agent_needs_input`/`agent_completed`) |
| 2.1.212 (07-16) | `/fork`가 새 background 세션으로 복사. 기존 in-session fork는 `/subtask`로 이동 |
| 2.1.219 (07-24) | nested subagent 기본 depth 3 |
| 2.1.224 (08-07) | cross-session `SendMessage`/`ListAgents` (macOS·Linux) |
| 2.1.232 (08-13) | fork 기본 활성. 인터랙티브 세션에서 teammate가 아닌 spawn은 기본 background |
| 2.1.239 (08-21) | Windows에서 cross-session messaging 사용 가능. `ListAgents`가 teammate도 나열 |
| 2.1.286 (09-30) | 보고 있는 agent에 즉시 읽히게 하는 Ctrl+Enter |
| 2.1.290 (10-05) | `claude attach`/`logs`에 이름 일부 사용 가능 |
| 2.1.302 (10-16) | 데스크톱·VS Code는 메인 대화의 subagent를 항상 background로 실행 |
| 2.1.309 (10-22) | split-pane teammate가 리더의 `--tools`/deny 규칙 상속 |

**Subagents** — [sub-agents docs](https://code.claude.com/docs/en/sub-agents)
- 기본: 자체 context에서 일하고 요약만 반환한다.
  - built-in: Explore(read-only), Plan, general-purpose, claude, statusline-setup, claude-code-guide.
  - custom: `.claude/agents/`, `~/.claude/agents/`. frontmatter 필드는 `tools`, `model`, `permissionMode`, `background`, `isolation: worktree`, `memory`, `effort`, `autoCompactWindow` 등.
- foreground·background:
  - Ctrl+B로 실행 중인 작업을 background로 보낸다.
  - background subagent의 권한 요청은 메인 세션에 해당 subagent 이름과 함께 뜬다.
  - 동시 실행 기본 상한은 20(`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`).
  - nesting 기본 3단계(`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`이면 끔).
- 재개:
  - 호출할 때마다 새 인스턴스다. 이어가려면 Claude가 `SendMessage`(to = agent ID 또는 이름)로 재개하고, 전체 이력이 유지된다. `SendMessage`에는 agent teams가 필요 없다.
  - Explore·Plan은 one-shot이라 재개할 수 없다.
  - **사용자는 subagent 행이 panel에 남아 있는 동안 그 transcript에 직접 입력해 재개할 수 있다.**
  - transcript 위치는 `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`. `cleanupPeriodDays`(기본 30일)가 지나면 삭제된다.
  - 재시작 후 이름으로 메시지를 보낼 수 있는 것은 마지막 compaction 이후 붙은 이름뿐이다(v2.1.299+). 그 외에는 `agent-{id}.meta.json`에서 ID를 찾는다.
- panel 조작:
  - ↑/↓ 선택, Enter = transcript 열고 후속 메시지, `x` = 중지·해제, Esc = 복귀.
  - transcript 화면에서 일반 텍스트와 skill은 그 agent로 가고, built-in 명령은 메인으로 간다. `/compact`·`/clear`·`/rewind`는 확인을 받고, `/model`·`/fast`는 막힌다.
  - Ctrl+Enter(v2.1.286+)를 쓰면 보고 있는 agent가 대기 중인 작업이 끝나기 전에 메시지를 읽는다.
- fork: `/subtask <task>`는 전체 대화를 상속한 fork를 같은 세션 안에서 background로 돌리고 panel에 표시한다. agent view가 켜져 있으면 `/fork`는 세션 전체를 새 background 세션으로 복사한다.
- `--agent <name>`: 세션 전체를 해당 agent로 실행한다(시스템 프롬프트·도구·모델 교체).
- `/tasks`: 현재 세션의 background 항목(완료된 subagent 포함)을 확인·attach·중지 — [agents docs](https://code.claude.com/docs/en/agents)
- 관련 CHANGELOG — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md):
  - 2.1.251: background subagent·fork transcript를 보는 동안 입력창 placeholder가 `Message @name…`으로 바뀜.
  - 2.1.232: 완료된 subagent는 panel에서 즉시 숨기고 `/tasks` 힌트를 표시.
  - 2.1.257: transcript 화면에서 사용자가 재개한 subagent를 메인 agent에게 알림.
  - 2.1.300: 사용자가 입력했던 subagent가 `/tasks`에서 사라지던 문제 수정. mod API `$.ui.view({ agentId })` 추가(agent transcript를 메인 뷰에 표시).

**Agent teams** — [agent teams docs](https://code.claude.com/docs/en/agent-teams)
- 활성화와 부작용:
  - `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`로 켠다.
  - 켜면 Claude가 이름을 붙인 subagent도 teammate로 뜬다(사용자 확인 없음).
  - `-p`·Agent SDK에서는 teammate가 생기지 않는다.
- 구성:
  - lead 1명 + teammates(각각 별도 Claude Code 인스턴스) + 공유 task list(`~/.claude/tasks/{team}/`) + mailbox(`~/.claude/teams/{team}/inboxes/{agent}.json`).
  - 팀 이름은 `session-<세션ID 8자>`, 세션당 팀 1개.
  - 팀원은 CLAUDE.md·MCP·skill과 spawn prompt만 받고, lead 대화 이력은 받지 않는다.
  - 팀원이 idle이 되면 최종 답을 담아 lead에 통보한다.
- **직접 대화**:
  - in-process: agent panel에서 ↑/↓로 선택, Enter로 transcript 열고 입력. Esc는 선택 해제(보는 중이면 그 팀원의 턴 중단). `x`는 중지, Ctrl+T는 task list.
  - split-pane: 팀원 pane을 클릭해 바로 입력.
  - 과거의 Shift+Up/Down 조작은 현재 docs와 다르다(2.1.47에서 Shift+Down만 남았고, 지금은 일반 화살표).
- **표시 모드 `teammateMode`**:
  - 값: `in-process`(기본) / `auto` / `tmux` / `iterm2`. 세션 단위로는 `--teammate-mode` 플래그(experimental, `--help`에는 없지만 [CLI reference](https://code.claude.com/docs/en/cli-reference)에 있음).
  - `auto`는 tmux 세션 안이거나 iTerm2 + `it2` CLI 환경이면 split pane, 아니면 in-process.
  - `iterm2`는 `it2` CLI가 필요하다.
- **공식 한계**:
  - in-process teammate는 `/resume`·`/rewind`로 복원되지 않는다.
  - task 상태가 늦게 반영될 수 있다. shutdown이 느리다.
  - 세션당 팀 1개. 중첩 팀 불가.
  - in-process teammate는 background subagent를 쓸 수 없다.
  - lead를 바꿀 수 없다. 팀원별 권한 모드는 spawn 후에만 바꿀 수 있다.
  - **split pane은 tmux/iTerm2 필요. VS Code 통합 터미널, Windows Terminal, Ghostty는 미지원.**
- 같은 세션 안에서는 멈춘 in-process 팀원에게 메시지를 보내면 저장된 대화를 복원해 깨운다.
- 팀원의 권한 요청은 lead 세션에서 승인한다. 에이전트 간 메시지는 사용자 권한이 아니다(승인을 대신할 수 없음).
- hook: `TeammateIdle`, `TaskCreated`, `TaskCompleted`(exit 2 = 피드백·차단).
- 비용: 토큰은 팀원 수에 선형으로 늘어난다. in-process 팀원 캐시 TTL은 기본 5분(`subagentPromptCacheTtl`).
- 같은 docs: `.claude/agents` 정의를 teammate로 재사용할 수 있다(요청 #24316, +35, completed).

**Agent View / background 세션 (`claude agents`, `claude attach`, `--bg`)** — [agent view docs](https://code.claude.com/docs/en/agent-view)
- 성격: research preview. 로컬 background 세션을 한 화면에서 dispatch·모니터링한다.
- 여는 법: `claude agents`, 또는 일반 세션의 빈 프롬프트에서 ←. `--cwd`로 범위를 좁힌다. `defaultToAgentsView`로 기본 화면 지정.
- dispatch:
  - 입력한 프롬프트마다 새 세션이 생긴다(기존 세션에 후속 메시지가 아님).
  - `claude --bg "..."`, `/bg`·`/background`, `/fork`, `claude --bg --exec 'pytest -x'`.
- 상태: Working / Needs input / Idle / Completed / Failed / Stopped. Pinned / Ready for review 그룹이 있다.
- 개입:
  - Space(peek): 화면을 떠나지 않고 답장한다. 단, 권한 대화상자는 attach해야 답할 수 있다.
  - Enter/→(attach): 그 세션이 **현재 터미널을 점유**하고 recap을 게시한다. ← 또는 `/exit`로 detach(세션은 계속 돈다).
  - `Alt+1..9`: 현재 디렉터리의 세션 1~9에 바로 attach.
- shell 명령: `claude attach <id|name>`(현재 터미널에 attach, 이름 일부는 v2.1.290+), `claude logs`, `claude stop`, `claude respawn`, `claude rm`, `claude agents --json`, `claude daemon status`.
- 격리와 수명:
  - background 세션은 편집을 시작할 때 `.claude/worktrees/`의 자체 worktree로 옮겨진다(`worktree.bgIsolation: "none"`으로 끔).
  - supervisor는 attach되지 않은 idle 프로세스를 약 1시간 뒤 멈춘다(Ctrl+T 고정으로 유지).
- 알림: `preferredNotifChannel`과 `Notification` hook(`agent_needs_input`/`agent_completed`). 탭 제목에 대기 개수 표시.
- 문서상 제약:
  - subagent·teammate는 별도 행으로 나오지 않는다.
  - 다른 터미널의 인터랙티브 세션은 background로 보내기 전엔 보이지 않는다.
  - 다른 프로세스에서 이미 열린 대화는 열기 거부(v2.1.248부터 행에 `Open in a terminal` 표시).
  - **새 탭·창·pane으로 여는 기능은 문서에 없다.**
  - 쿼터는 세션 수만큼 소모된다. 로컬 전용. 세션을 지우면 Claude가 만든 worktree도 지워진다.
- `claude --resume <id> --bg`(v2.1.257+): 기존 세션을 같은 ID로 background에서 이어 간다 — [agent view docs 버전 이력](https://code.claude.com/docs/en/agent-view)
- 같은 세션에 여러 창이 attach되는 경우를 전제로 한 수정이 있다. 2.1.176에서 한 창에서 back을 누르면 같은 세션에 attach된 다른 창까지 detach되던 문제를 고쳤다 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Windows 관련:
  - attach 직후 약 0.5초 안의 ←는 `Ambiguous ←, press again to detach`로 처리(v2.1.218). win32-input-mode 탭 키 입력 수정(v2.1.248).
  - Windows에서 stale `daemon.lock` 자동 교체(v2.1.257). supervisor가 남아 있으면 `taskkill`로 정리.
  - 출처: [agent view docs](https://code.claude.com/docs/en/agent-view)
- Windows 관련 CHANGELOG — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md):
  - 2.1.132~2.1.160: Windows Terminal 스크롤, CJK 렌더링, 반복되는 PowerShell 프로세스 spawn, IME 위치 등 수정.
  - 2.1.196: background shell을 죽이지 않고 handoff.
  - 2.1.212: GPO가 PowerShell 5.1을 막으면 daemon이 PowerShell 7을 우선 사용.

**이름 있는 세션 (`-n`/`--name`, `/rename`)** — [CLI reference](https://code.claude.com/docs/en/cli-reference)
- `--name`/`-n`은 `/resume`과 터미널 제목에 보이는 표시 이름을 정한다. `claude --resume <name>`으로 재개한다. `/rename`으로 세션 중에 바꾼다.
- cross-session messaging은 `/rename`·`--name`으로 붙인 이름으로 대상을 찾는다. 이름이 없으면 자동 생성 — [cross-session docs](https://code.claude.com/docs/en/cross-session-messaging). 예: `my-app-3f`(v2.1.196) — [agent view docs](https://code.claude.com/docs/en/agent-view)

**Cross-session messaging (`SendMessage`/`ListAgents`)** — [cross-session docs](https://code.claude.com/docs/en/cross-session-messaging)
- 지원 버전: macOS·Linux·WSL2는 v2.1.224+, **native Windows는 v2.1.234+** (docs 기준). 조건만 맞으면 기본으로 켜져 있다.
  - **충돌**: CHANGELOG는 Windows 지원을 2.1.239에서 발표 — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- 사용법:
  - Claude가 `ListAgents`로 찾고 `SendMessage`로 보낸다.
  - 사용자는 `@세션이름` 멘션으로 대상을 지정한다(v2.1.232+).
  - `/list-agents`(=`/peers`)는 subagent, 팀원, 같은 머신의 다른 세션(background 포함), Remote Control 연결 시 클라우드·타 머신 세션까지 보여 준다.
- 전달:
  - 수신 측은 도구 호출 사이에 읽고, idle이면 새 턴을 시작한다.
  - 같은 머신은 세션별 Unix socket(Windows는 named pipe)으로 보내며 Anthropic 서버를 거치지 않는다. 타 머신은 Remote Control로 간다.
  - **WSL2 세션과 native Windows 세션은 같은 PC라도 서로 닿지 않는다.**
- 안전 규칙:
  - 받은 메시지는 사용자 동의가 아니다. 승인·설정 변경·명령 실행을 할 수 없다.
  - `crossSessionInbound`로 accept/hold/refuse를 고른다. plain text만, 약 100만 자 상한.
- 기타:
  - 한 번만 통지받는 `notify_when_idle`(v2.1.236).
  - hook과 Bash에 `CLAUDE_CODE_MESSAGING_SOCKET`·`CLAUDE_CODE_MESSAGING_TOKEN`이 노출된다. native Windows에서는 연결 첫 줄에 auth line이 필수.

**데스크톱 앱 Code 탭** — [desktop docs](https://code.claude.com/docs/en/desktop)
- 세션 다루기:
  - 사이드바에서 병렬 세션을 만든다(Windows는 Ctrl+N). Ctrl+Tab으로 순환.
  - **Alt+클릭(Windows) 또는 Open in > Split view = 나란히 보기.**
  - **Ctrl+클릭 또는 Open in > New window = 독립 창.**
  - Ctrl+Alt+W로 split에서 뺀다.
- pane:
  - pane은 드래그와 크기 조절이 되고, diff·terminal 같은 pane은 별도 창으로 꺼냈다 다시 붙일 수 있다(Desktop v1.2581.0+).
  - tasks pane(⋮ > Background tasks)에 subagent, background shell, workflow가 보인다. 항목을 클릭하면 **subagent pane에서 출력 보기 또는 중지**만 가능하다. 메시지를 보내거나 재개할 수 있는지는 문서에 없다.
- 기타 기능:
  - 세션마다 Worktree 토글.
  - 보고 있지 않은 세션이 끝나면 OS 알림.
  - side chat(Ctrl+; 또는 `/btw`)은 디스크에 저장되지 않는다.
- Claude의 데스크톱 cross-session 도구:
  - 다른 Code 탭 세션을 나열·읽기·메시지·이름 변경·보관할 수 있다.
  - 데스크톱이 직접 돌린 로컬·SSH·WSL 세션만 보인다. CLI·VS Code·클라우드 세션은 안 보인다. 기본 최근 20개.
- Windows 주의: 데스크톱은 PowerShell profile을 읽지 않으므로 PATH는 시스템 환경변수로 설정해야 한다.
- 2026-09 회귀:
  - 데스크톱이 번들 CLI를 `--disallowedTools SendMessage`로 띄워 subagent 메시지·재개가 불가능했다.
  - #92183(+18), #92016(+11), 2026-09-15 해결. 사용자 확인 기준 Desktop 2.110.0 / CLI 2.1.271부터 정상.
  - 데스크톱 자체 `mcp__ccd_session_mgmt__send_message`는 다른 데스크톱 세션만 대상으로 하고 subagent는 대상이 아니라고 이슈에 적혀 있다.
  - 출처: [GitHub #92183](https://github.com/anthropics/claude-code/issues/92183), [GitHub #92016](https://github.com/anthropics/claude-code/issues/92016)

**Projects (클라우드 조율)** — [claude-projects docs](https://code.claude.com/docs/en/claude-projects)
- 대상: Pro·Max public beta, 점진 배포. Team·Enterprise는 아직 미제공.
- 구조:
  - 조율용 대화 하나가 작업마다 thread를 띄운다. thread는 보통 클라우드 세션이고, 요청하면 Remote Control로 내 PC에서 돈다(v2.1.280+).
  - Overview pane이 thread를 상태별로 묶는다: Ready for review / Waiting on you / Working / Landing / Idle / Resolved.
  - coordinator는 thread의 보고만 보고 모든 단계를 보지는 않는다.
- **thread를 열면**:
  - transcript를 읽는다.
  - **thread 자체 입력창에 쓴 메시지는 그 thread로 바로 간다.** project 대화에 쓴 후속 메시지는 Claude가 매칭할 때만 전달된다.
  - 권한 요청에 답하고, Stop·Esc로 중단한다.
- 제약: 로컬에서 직접 시작한 세션은 project에 넣을 수 없다.

**Remote Control / 웹 / teleport**
- Remote Control은 claude.ai/code와 모바일 앱을 로컬 세션에 연결한다. 대화와 subagent·workflow 진행 상황이 기기 간에 동기화된다.
- `claude remote-control` 서버 모드는 여러 세션을 동시에 운용한다(`--capacity` 기본 32, `--spawn same-dir|worktree|session`). 서버 모드가 아니면 인터랙티브 프로세스당 원격 세션 1개.
- 출처: [remote-control docs](https://code.claude.com/docs/en/remote-control)
- `--teleport`는 클라우드 세션을 로컬 터미널에서 재개한다. `--remote-control`/`--rc` — [CLI reference](https://code.claude.com/docs/en/cli-reference)

**Worktree + tmux**
- `--tmux`는 worktree용 tmux 세션을 만든다. `--worktree`가 필요하고, iTerm2가 있으면 native pane을 쓴다(`--tmux=classic`). Windows native 수단이 아니다 — [CLI reference](https://code.claude.com/docs/en/cli-reference)
- `claude --worktree <name>`은 `.claude/worktrees/<name>`과 `worktree-<name>` 브랜치를 만든다. subagent에는 `isolation: worktree`를 쓴다 — [worktrees docs](https://code.claude.com/docs/en/worktrees)

**Dynamic workflows** — [workflows docs](https://code.claude.com/docs/en/workflows)
- `/workflows` 뷰에서 phase → agent로 들어가 프롬프트, 최근 도구 호출, 결과를 본다. agent 중지(`x`)·재시작(`r`), run 일시정지(`p`)가 된다.
- **실행 중 사용자 입력은 받지 않는다.**

**Hooks·알림** — [hooks docs](https://code.claude.com/docs/en/hooks)
- 관련 이벤트: `Notification`, `Stop`, `StopFailure`, `SubagentStart`, `SubagentStop`, `TeammateIdle`, `TaskCreated`, `TaskCompleted`, `SessionStart`(matcher에 `fork` 포함), `WorktreeCreate`/`WorktreeRemove`.
- `Notification` matcher: `permission_prompt`, `idle_prompt`, `agent_needs_input`, `agent_completed`, `elicitation_*`, `quota_auto_resume_*`, `plugin_notification` 등.
- Windows: Git Bash가 없으면 hook `shell` 기본값이 `powershell`.
- 관련 CHANGELOG — [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md):
  - 2.0.42: `SubagentStop`에 `agent_id`·`agent_transcript_path` 추가.
  - 2.1.47: Stop·SubagentStop 입력에 `last_assistant_message` 추가.
  - 2.1.233: Desktop·VS Code에서 권한 요청 시 Notification hook이 뜨도록 수정.
  - 2.1.288: background agent가 실행 중일 땐 `idle_prompt`를 보내지 않음.

**Windows 설치·셸** — [setup docs](https://code.claude.com/docs/en/setup)
- native Windows는 PowerShell·CMD로 설치하고 관리자 권한이 필요 없다.
- Git for Windows는 선택 사항이다. 있으면 Bash tool에 Git Bash를 쓰고, 없으면 PowerShell tool을 쓴다.
- native Windows에는 sandboxing이 없고, WSL2에는 있다.

### Inferences
- "팀에 소속된 채로 별도 탭에서 협업"에 가장 가까운 공식 조합은 이렇다: **이름 붙인 top-level 세션**(`claude -n research-1`), 또는 `/fork`·`--bg`로 만든 background 세션 + 다른 Windows Terminal 탭에서 `claude attach research-1` + 세션 간 `@이름` 메시지(cross-session messaging). 단, 이건 **세션** 단위다. subagent·in-process teammate에는 적용되지 않고, `/fork`는 원본이 아니라 **복사본**이다.
- 제품 개발자 관점에서 공식 확장 지점이 있다. mod API의 `$.ui.view({ agentId })`(2.1.300), `$.agent.list()`의 idle·waiting 상태(2.1.289), `Notification`·`SubagentStop`·`TeammateIdle` hook, messaging socket이 그것이다. 기술 세부는 다른 리서처의 영역이다.
- 데스크톱 앱은 세션의 split view와 새 창을 공식 지원한다. Windows에서 "세션을 창으로 꺼내기"는 이미 된다. 빠진 것은 subagent·teammate를 대화 가능한 독립 세션으로 승격하는 기능이다.

### Gaps
- 데스크톱 subagent pane을 별도 창으로 pop-out하거나 그 안에서 메시지를 보낼 수 있는지는 docs에 명시가 없다(diff·terminal만 예시로 나옴).
- agent view docs에 지원 플랫폼 목록이 없다. Windows에서 supervisor가 멈췄을 때의 세션 생존 규칙은 명시되지 않았다(macOS·Linux만 기술).
- `TeammateIdle`·`SubagentStop` 입력 스키마 전체는 hooks 문서가 잘려서 확인하지 못했다.
- 실제 Windows 11 기기에서 직접 재현하지 않았다. 문서와 이슈 기반.

## Q4. 특정 subagent/teammate를 자기 터미널 탭·창으로 꺼내 계속 대화할 수 있는가? subagent 컨텍스트를 일반 세션으로 재개할 수 있는가? Windows에서는?

### Takeaway
2026-10 기준 **문서화된 "한 명령으로 특정 subagent나 in-process teammate를 새 탭·창으로 꺼내 맥락을 유지한 채 팀원으로 계속 협업"하는 기능은 없다.**

가능한 것과 불가능한 것:
- **가능**: 같은 터미널에서 agent panel → Enter → transcript에 입력해 대화를 이어 가기. subagent도 teammate도 된다.
- **teammate 전용 pane**: tmux/iTerm2에서만. Windows Terminal은 공식 미지원이다. native Windows에서는 커뮤니티 psmux 우회나 WSL2 + tmux뿐이다.
- **불가능**: subagent를 일반 세션으로 승격. 요청 #80798은 not planned(stale)로 닫혔다. transcript JSONL은 디스크에 남지만 "세션으로 재개"하는 공식 경로는 없다.
- **세션 단위 우회**: `/fork` → 새 background 세션 → 다른 탭에서 `claude attach <id>`가 최근접 공식 경로다. 이걸 자동으로 새 탭에 여는 요청 #24123(+34)은 열려 있다.

### Cited Findings
- subagent: panel에 행이 남아 있는 동안 transcript에 입력해 직접 재개할 수 있다. 그 밖의 재개는 Claude의 `SendMessage`로 한다. Explore·Plan은 재개할 수 없다 — [sub-agents docs](https://code.claude.com/docs/en/sub-agents)
- teammate:
  - in-process는 lead 터미널의 agent panel에서만 보고 대화한다.
  - split pane은 tmux/iTerm2가 필요하고 VS Code 통합 터미널·Windows Terminal·Ghostty는 미지원이다.
  - in-process teammate는 `/resume`으로 복원되지 않는다.
  - 출처: [agent teams docs](https://code.claude.com/docs/en/agent-teams)
- background 세션: attach는 현재 터미널을 점유하는 방식이고, 새 탭·창으로 여는 기능은 문서에 없다. subagent·teammate는 agent view 행으로 나오지 않는다 — [agent view docs](https://code.claude.com/docs/en/agent-view)
- **#24123** "/fork should support opening in a new terminal tab" — [GitHub #24123](https://github.com/anthropics/claude-code/issues/24123)
  - open, 👍34, 2026-02-08 생성.
  - 9/3 댓글: 2.1.212 이후 `/fork`는 background 세션을 만들고 `claude attach <id>`를 출력한다. 남은 수작업은 "새 탭 열고 cd 하고 id 입력"이다. 사용자 플러그인 `/fork-session`이 이걸 자동화한다.
  - 9/21 댓글: 새 탭보다 "현재 세션 옆 pane"을 원한다.
- **#24384** Windows Terminal을 teammateMode split-pane 백엔드로 — [GitHub #24384](https://github.com/anthropics/claude-code/issues/24384)
  - open, 👍39(반응 합계 50), 댓글 13, 라벨 `platform:windows`/`area:agents`.
  - 제안: `WT_SESSION` 감지 + `wt -w 0 split-pane`. 한계: wt에는 `list-panes`·`send-keys`·pane ID에 해당하는 기능이 없다.
  - Anthropic 답변 없음. Boris가 8/17 라벨만 추가.
  - psmux 메인테이너: Windows에서 `--teammate-mode tmux`가 psmux로 동작한다(4/8). 단, worktree 지원은 아직 필요.
- native Windows 관련 실패 보고 — [GitHub 이슈 검색(API)](https://api.github.com/search/issues?q=repo:anthropics/claude-code+teammate+in:title+windows):
  - #26244: Windows에서 isTTY 게이트가 `teammateMode: "tmux"`를 무시 — closed not planned.
  - #34150: psmux 지원 요청 — closed not planned.
  - #42848: psmux가 unix 스타일 경로로 실행 — closed not planned.
  - #83366: tmux probe는 통과했는데 pane 생성 실패로 팀원이 조용히 시작되지 않음 — 2026-10-08 closed not planned.
  - #104688: psmux pane 안의 `claude attach`가 `send-keys` 입력을 받지 않음 — open, 2026-10-23.
- 재개 관련 요청 — [GitHub #80798](https://github.com/anthropics/claude-code/issues/80798), [GitHub #90520](https://github.com/anthropics/claude-code/issues/90520):
  - #80798 "subagent를 세션으로 승격하고 다시 강등": 쌓인 context가 버려지는 문제와 오케스트레이션 중 개입 필요를 근거로 함. 2026-09-22 stale로 closed not planned.
  - #90520 "완료·만료된 subagent transcript 재개·열람": open. 일정 시간이 지나면 `No transcript found for agent ID`로 `SendMessage`가 실패한다는 보고.
- Windows 플랫폼 사실:
  - native Windows는 Git Bash(선택) 또는 PowerShell tool을 쓰고 sandbox가 없다 — [setup docs](https://code.claude.com/docs/en/setup)
  - native Windows cross-session messaging은 named pipe + 토큰 auth다. WSL2 세션과 native 세션은 서로 메시지를 주고받지 못한다 — [cross-session docs](https://code.claude.com/docs/en/cross-session-messaging)
  - 데스크톱 앱은 Alt+클릭으로 split view, Ctrl+클릭으로 새 창 — [desktop docs](https://code.claude.com/docs/en/desktop)

### Inferences
- 사용자 환경(Windows 11 native, CLI + 데스크톱 Code 탭)에서 지금 쓸 수 있는 공식 경로:
  1. 한 세션 안의 subagent·in-process teammate는 agent panel에서 대상을 골라 직접 입력한다. 같은 화면이다.
  2. 역할 에이전트를 처음부터 **이름 붙인 top-level 세션**으로 띄운다. Windows Terminal 탭마다 `claude -n pm`, `claude -n research-1` … 식이다. 이후 `@이름` 메시지로 협업하고, `claude agents`로 감시하고, 필요할 때 `claude attach`한다.
  3. 데스크톱 세션을 split view와 새 창으로 띄우고 데스크톱 cross-session 도구로 조율한다.
  4. WSL2 + tmux로 split-pane 팀원을 쓴다. 이 경우 native Windows 세션과는 메시지를 주고받을 수 없다.
- 어느 것도 "이미 spawn된 subagent X를 맥락째 새 탭으로 승격하고 팀 소속을 유지"하지는 못한다. 그래서 사용자의 목표 기능은 **공식 기능의 공백**이다.
  - 필요한 구성요소: (a) wt.exe 기반 탭·pane 백엔드, (b) subagent·teammate를 attach 가능한 세션으로 승격, (c) 사용자가 worker에 직접 개입했다는 사실을 orchestrator에 알리는 장치(#72591이 지적).
- `/fork` + `claude attach` 조합은 맥락을 복사해 독립 세션을 만드는 것이라 팀원과 동일 인격이 아니다. 하지만 "pop-out 후 결과를 메시지로 돌려보내는" UX의 현실적 근사치로 쓸 수 있다.

### Gaps
- native Windows에서 같은 background 세션에 두 Windows Terminal 탭이 동시에 attach될 때의 동작은 실측하지 않았다. 2.1.176 수정이 다중 창 attach를 전제로 하는 것만 확인.
- Anthropic이 Windows Terminal 백엔드나 subagent 승격을 계획 중이라는 공식 신호는 찾지 못함.

## Q5. anthropics/claude-code GitHub 이슈가 말하는 한계 (번호·상태·반응 수, 2026-10-25 GitHub API 기준)

### Takeaway
수요가 가장 큰 축은 "tmux/iTerm2 이외 터미널의 split-pane 백엔드"다. zellij·Ghostty·Windows Terminal·WezTerm 요청과 범용 백엔드 프로토콜 제안을 합치면 👍 수백 개 규모다. 이 요청들은 모두 **open**이고 Anthropic의 공개 답변이 없다.

반면 "subagent에 직접 개입(step-into, push/pop, 승격, inspector)" 계열은 개별 반응이 적다. 대부분 stale 봇이 not planned로 닫았고 최근 것(9~10월)만 열려 있다.

Windows는 split-pane 미지원 외에도 팀원 응답 정체, 렌더링 깜빡임, psmux 경로 문제 등 버그 보고가 이어진다.

### Cited Findings
**split-pane 백엔드 계열** — [GitHub 검색 API("split pane" in:title)](https://api.github.com/search/issues?q=repo:anthropics/claude-code+%22split+pane%22+in:title)

| 이슈 | 내용 | 상태 | 반응 |
|---|---|---|---|
| #24122 | zellij 지원 | open | 👍95 |
| #24189 | Ghostty 백엔드 | open | 👍71 |
| #31901 | native Zellij | open | 👍71 |
| #24384 | Windows Terminal | open | 👍39 / 합계 50 |
| #23574 | WezTerm | open | 👍37 |
| #26572 | CustomPaneBackend 프로토콜. tmux CLI 의존을 끊자는 제안, KILD 제작자 | open | 👍28 |
| #23615 | 현재 pane을 쪼개지 말고 새 tmux window에 spawn. 4개 이상 동시 spawn 시 `send-keys` 손상 보고 | open | 👍23 |
| #25396 | tmux pane 대신 window(탭)에 spawn | #23615의 dup으로 닫힘 | — |
| #23950 | split 방향 설정 | stale | 👍4 |
| #31297 | Windows Terminal split pane | 작성자가 #24384의 dup으로 닫음 | — |

**Windows 버그** — [GitHub 검색 API(teammate/agent teams + windows)](https://api.github.com/search/issues?q=repo:anthropics/claude-code+%22agent+teams%22+in:title+windows)

| 이슈 | 내용 | 상태 |
|---|---|---|
| #57261 | Windows에서 팀원 응답이 lead 창에 포커스가 갈 때까지 멈춤 | #38932의 dup |
| #38932 | 수동 키 입력 전까지 lead가 팀원 응답을 처리하지 않음 (👍7) | stale로 닫힘 |
| #51167 | Windows에서 터미널 입력 없이는 부모가 팀원 완료를 기다리며 멈춤 | completed |
| #76423 | Windows agent teams 화면 깜빡임 (접근성) | not planned |
| #29127 | Windows Agent Teams에서 `.claude.json` 경쟁 손상 | completed |
| #83366 | tmux probe 통과 후 pane 생성 실패 | not planned |
| #104688 | psmux pane 안의 attach 입력 문제 | open |
| #80123 | agent view가 Windows(ConPTY)에서 리사이즈 후 옛 폭을 사용 (👍13) | open |
| #60440 | agent view가 Windows Terminal(cmd.exe)에서 깜빡임 (👍13) | completed |

**subagent 직접 개입·재개 계열**

| 이슈 | 내용 | 상태 | 출처 |
|---|---|---|---|
| #18924 | 인터랙티브 step-into 모드 | 2026-02 stale | [#18924](https://github.com/anthropics/claude-code/issues/18924) |
| #17978 | 인터랙티브 sub-session | stale | [#17978](https://github.com/anthropics/claude-code/issues/17978) |
| #45895 | push/pop 스택 | #17978 dup | [#45895](https://github.com/anthropics/claude-code/issues/45895) |
| #80798 | 승격/강등 | stale (반응 합계 2) | [#80798](https://github.com/anthropics/claude-code/issues/80798) |
| #90520 | 완료된 subagent 재개·열람 | open | [#90520](https://github.com/anthropics/claude-code/issues/90520) |
| #92950 | 영속 subagent inspector: 아무 subagent transcript 재오픈, 직접 메시지, 메타데이터 편집 | open, 2026-09-08 | [#92950](https://github.com/anthropics/claude-code/issues/92950) |
| #104382 | 인터랙티브 `/list-agents`: 화살표 탐색 + 직접 메시지 | open, 2026-10-22 | [#104382](https://github.com/anthropics/claude-code/issues/104382) |
| #72591 | 사용자가 dispatch된 subagent에 직접 메시지를 넣어도 orchestrator가 모름 | stale로 닫힘 | [#72591](https://github.com/anthropics/claude-code/issues/72591) |
| #55488 | DM을 받은 subagent가 자신을 team-lead로 밝히고 부모 대화 이력을 노출 | stale | [#55488](https://github.com/anthropics/claude-code/issues/55488) |
| #40694 | 기존 세션을 teammate로 승격 | stale | [#40694](https://github.com/anthropics/claude-code/issues/40694) |
| #7317 | 재개 가능한 subagent 세션 (2025, possibly outdated) | 2026-01 stale (👍6). 이후 Claude의 subagent 재개(2.0.28)와 `SendMessage` 재개로 일부 해소 | [#7317](https://github.com/anthropics/claude-code/issues/7317) |

**데스크톱·기타**

| 이슈 | 내용 | 상태 | 반응 | 출처 |
|---|---|---|---|---|
| #92183 | 데스크톱이 `SendMessage`를 막아 subagent 재개 불가 | completed | 👍18 | [#92183](https://github.com/anthropics/claude-code/issues/92183) |
| #92016 | 같은 회귀(일부 사용자가 Codex로 전환했다는 댓글) | completed | 👍11 | [#92016](https://github.com/anthropics/claude-code/issues/92016) |
| #35240 | `SendMessage`가 Agent Teams 플래그에 묶여 있던 문서·동작 불일치 | completed. 현재 docs는 teams 불필요라고 명시 | 👍27 | [검색 API](https://api.github.com/search/issues?q=repo:anthropics/claude-code+%22agent+teams%22+in:title+visibility+OR+transcript) |
| #48688 | 데스크톱 split pane·번호 탭 단축키 | 2026-06 stale. 현재 desktop docs에는 split view가 있음 | 👍5 | [#48688](https://github.com/anthropics/claude-code/issues/48688) |
| #100707 | 데스크톱에서 custom subagent를 @-mention으로 호출 | open | 👍2 | [검색 API](https://api.github.com/search/issues?q=repo:anthropics/claude-code+subagent+in:title+tab) |
| #98846 | 데스크톱 background subagent가 조용히 멈춤 | open | — | 같은 검색 |
| #23669 | 팀원별 작업 디렉터리·CLAUDE.md·MCP | open | 👍32 | [검색 API](https://api.github.com/search/issues?q=repo:anthropics/claude-code+teammate+in:title+%22talk%22+OR+%22message%22) |
| #66402 | `/model`·`/effort`가 전역 설정을 바꿔 agents/fleet view가 깨짐 | open | 👍14 | [검색 API](https://api.github.com/search/issues?q=repo:anthropics/claude-code+%22agent+view%22+in:title) |
| #91870 | Mods 확장성 | open | 👍131 | [검색 API](https://api.github.com/search/issues?q=repo:anthropics/claude-code+%22agent+teams%22+windows) |

### Inferences
- 공식 팀은 split-pane 백엔드 다변화보다 **단일 control plane**(agent view, 데스크톱 사이드바와 split view, Projects Overview) 쪽으로 투자한 것으로 보인다. 근거는 split-pane 요청이 8개월 넘게 열려 있는 동안 agent view에 수십 차례 릴리스가 있었고, 데스크톱 split view가 도입됐다는 점이다.
- 따라서 "Windows Terminal 탭·pane으로 특정 에이전트 꺼내기"는 Anthropic이 당장 메우지 않을 가능성이 있는 공백이다. 수요 신호는 Windows 단독 👍39, 백엔드 계열 합계 수백에 #24123 👍34가 더해진다. 커뮤니티 우회(psmux, `/fork-session` 플러그인)는 버그와 not-planned 종결이 반복돼 불안정하다.
- #72591과 #55488은 **직접 개입했을 때의 정합성 문제**를 드러낸다. orchestrator가 사용자 개입을 모르는 문제, DM 시 신원과 이력이 섞이는 문제다. 제품에서 반드시 설계해야 할 지점이다.

### Gaps
- GitHub의 issue 페이지 HTML은 비로그인 상태에서 반응 수를 보여 주지 않아 REST API(search·issues 엔드포인트) 값을 썼다. 시점(2026-10-25)에 따라 변한다.
- 검색 키워드 밖의 중복 이슈(예: #23572 tmux/iTerm2 조용한 in-process 폴백, #24798, #79870)는 세부를 확인하지 않음.
