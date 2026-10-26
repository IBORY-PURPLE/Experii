# 상용(기업 지원) 멀티 에이전트 관리 제품 조사 (2026-10 기준)

> 범위: 여러 AI 에이전트를 병렬로 돌리고 개별 에이전트와 상호작용하게 해 주는 기업 지원 제품. Anthropic(Claude Code/Claude 데스크톱)·OpenAI(Codex) 1st-party 제품은 대조용으로만 언급한다. 기업이 만든 OSS(Emdash, Superset, Coder Mux, cmux)는 `community_oss_tools.md`에서 자세히 다루므로 여기서는 상용 관점에서 한 줄씩만 적는다.
> 조사일: 2026-10-25~26. 2026년 이전 자료는 "(2026 이전, outdated 가능)", 공식 문서가 아닌 리뷰·애그리게이터는 "(제3자)"로 표기했다. 인용문은 짧게 줄이고 대부분 의역했다.

## 1. 현재 제품 현황과 구조: 로컬·클라우드·하이브리드, worktree·컨테이너·VM

### Takeaway
2026년에 거의 모든 주요 벤더가 "에이전트 관리 창(mission control)"을 내놓았다. 구조는 세 갈래다. (a) 로컬 git worktree 격리 데스크톱(Conductor, Zed, JetBrains Air, Devin Desktop, VS Code background agent), (b) 클라우드 VM·샌드박스 중심(Cursor Projects, Amp orbs, Warp Oz, Factory Droid Computers), (c) 컨테이너 격리(Sculptor, Air의 Docker 옵션). 로컬과 클라우드 사이에서 세션을 옮기는 하이브리드 구조가 사실상 표준이 됐다.

### Cited Findings

#### Cursor (Anysphere)
- Cursor 2.0(2025-10)에서 git worktree 또는 원격 머신을 이용한 다중 에이전트 병렬 실행이 들어왔다 (2026 이전, outdated 가능) — [Wikipedia: Cursor (company)](https://en.wikipedia.org/wiki/Cursor_(company))
- Cursor 3(2026-04-02)은 새로 만든 Agents Window를 도입했다. 로컬·클라우드 에이전트가 모두 사이드바에 뜨고, 세션을 cloud→local, local→cloud로 옮길 수 있다. 인터페이스는 multi-workspace이고 기존 IDE로 언제든 돌아갈 수 있다. 여는 방법은 Command Palette → Agents Window다 — [Cursor blog: Cursor 3](https://cursor.com/blog/cursor-3)
- 제3자 설명에 따르면 Agents Window는 로컬, 클라우드, git worktree, remote SSH 환경에서 에이전트를 돌리고, `/worktree` 명령으로 채팅을 별도 checkout으로 옮긴다 (제3자) — [AgentPatterns.ai](https://www.agentpatterns.ai/tools/cursor/agents-window/), [Digital Applied](https://www.digitalapplied.com/blog/cursor-3-agents-window-complete-guide)
- Cursor Projects(2026-09-10, beta): 사용자는 coordinator 에이전트와 대화하며 프로젝트를 감독한다. coordinator는 직접 코드를 쓰지 않고 다른 에이전트를 지휘한다. 프로젝트는 자체 클라우드 컴퓨터에서 돌아가 노트북을 닫아도 멈추지 않는다. 로컬 테스트가 필요하면 coordinator가 로컬 에이전트를 띄운다. 프로젝트 파일은 에이전트가 쓰는 모든 클라우드·로컬 머신에 동기화된다 — [Cursor blog: Projects](https://cursor.com/blog/projects)
- Changelog는 Projects가 "thousands of subagents"에 작업을 위임할 수 있다고 표현한다. 2026-10-06에는 iOS 앱에서 로컬 에이전트를 보고 답장하는 remote control이 추가됐다(클라우드 에이전트 불필요) — [Cursor changelog](https://cursor.com/changelog)

#### Google Antigravity
- 2025-11-18 Gemini 3와 함께 Windows/macOS/Linux용 무료 public preview로 출시됐다 (2026 이전) — [Wikipedia: Google Antigravity](https://en.wikipedia.org/wiki/Google_Antigravity)
- 2026-05-19 I/O에서 standalone 데스크톱 앱인 Antigravity 2.0이 나왔다. 여러 에이전트의 병렬 오케스트레이션, dynamic subagents, scheduled tasks를 지원하고 Antigravity CLI(Gemini CLI 사용자에게 이전 권장)와 SDK가 함께 발표됐다 — [Google Developers blog (I/O 2026)](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/)
- Google 문서는 2.0을 Agent Manager의 후속으로, IDE와 독립적으로 동작하는 앱으로 설명한다. 기존 에디터는 "Antigravity IDE"로 재출시됐다 — [Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity) (Google docs 인용)
- Antigravity CLI는 데스크톱 앱과 인증·컨텍스트·skills·설정을 공유한다 — [Google Cloud blog (I/O '26)](https://cloud.google.com/blog/topics/developers-practitioners/io26-news-for-agent-developers-on-google-cloud)
- 지원 모델(2026-10): Gemini 3.1 Pro/Flash 계열, Claude Opus·Sonnet 4.6/5.5, GPT-OSS-120B. 모델은 여럿이지만 외부 CLI 에이전트를 들여오는 구조는 아니다 — [Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity)

#### GitHub Copilot / VS Code (Microsoft)
- Agent HQ는 2025-10-28 Universe에서 발표됐다(2026 이전). 2026-02-04에 Claude와 Codex가 Copilot Pro+/Enterprise용 코딩 에이전트로 public preview에 들어갔고, github.com·GitHub Mobile·VS Code agent sessions view에서 시작할 수 있다 — [GitHub Changelog 2026-02-04](https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/), [GitHub Blog: Pick your agent](https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/)
- VS Code의 에이전트는 3계층이다. Local(대화형, 격리 없음), Background(Copilot CLI로 로컬에서 무인 실행, worktree 격리), Cloud(원격 실행, PR·이슈로 팀에 노출). Claude는 Anthropic의 공식 Claude Agent harness를 쓴다 — [VS Code blog 2026-02-05](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development)
- VS Code 문서(2026-10-21 표기)는 session을 "워크스페이스 + 코드 변경 + 하나 이상의 chat" 단위로 정의한다. 별도 **Agents window**에서 여러 워크스페이스의 세션을 시작·모니터하고, 같은 파일을 건드리면 안 되는 작업은 worktree 격리 세션으로 돌린다 — [VS Code docs: chat sessions](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)
- Copilot CLI의 `/fleet`은 하나의 작업을 여러 subagent에 병렬로 맡긴 뒤 결과를 하나로 합친다 — [GitHub Copilot CLI](https://github.com/features/copilot/cli). 2026-04 초에 나왔고 각 subagent는 독립 컨텍스트를 가지되 파일시스템은 공유한다 (제3자) — [htek.dev](https://htek.dev/articles/copilot-cli-weekly-2026-04-03), [lilting.ch](https://lilting.ch/en/articles/github-copilot-cli-fleet-parallel-agents)

#### Warp
- Warp 2.0은 "Agentic Development Environment"로 포지셔닝됐다 (2025 발표, outdated 가능) — [Warp blog](https://www.warp.dev/blog/reimagining-coding-agentic-development-environment)
- 로컬: 여러 Agent Mode 대화를 서로 다른 window·tab·pane에서 동시에 돌릴 수 있다 — [Warp docs: Interacting with agents](https://docs.warp.dev/agents/local-agents/interacting-with-agents/)
- Oz(2026-02-10)는 클라우드 에이전트 오케스트레이션 플랫폼이다 — [Warp newsroom](https://www.warp.dev/newsroom/2026/2/10/warp-launches-oz-the-orchestration-platform-for-cloud-coding-agents). 2026-05-19부터 Oz는 Warp Agent 외에 Claude Code와 Codex도 cloud agent harness로 돌리며, 베타 동안 모든 사용자에게 무료다 — [Warp blog: multi-harness](https://www.warp.dev/blog/multi-harness-cloud-agent-orchestration)
- 오케스트레이션은 부모가 자식을 spawn하는 구조이고 깊이는 정확히 1단계다. local→local, local→cloud, cloud→cloud 조합을 지원한다 — [Warp docs: Multi-agent orchestration](https://docs.warp.dev/platform/orchestration/)
- 클라이언트는 2026-04에 AGPL-3.0으로 오픈소스화됐다 (제3자) — [javisreview](https://javisreview.com/review/warp-review-2026/)

#### Conductor (Melty Labs, YC)
- Claude Code, Codex, Cursor, OpenCode를 병렬로 돌린다. 작업마다 workspace·branch·파일·터미널·diff·리뷰 경로가 따로 있고, 끝나면 diff 리뷰 → PR → merge → archive로 마무리한다 — [Conductor docs](https://www.conductor.build/docs/)
- 각 workspace는 자체 git worktree이자 branch다 — [Conductor guide: worktrees](https://www.conductor.build/docs/guides/git-worktrees/run-claude-code-with-git-worktrees)

#### Sculptor (Imbue)
- 에이전트마다 자체 컨테이너에서 실행된다. Pairing Mode는 클릭 한 번으로 에이전트 작업을 로컬 repo로 가져오고 양방향으로 동기화한다. merge conflict를 감지하면 에이전트에게 되돌려 해결시킬 수 있다. Codex 지원은 2025-12-03에 추가됐고 페이지는 2026-04-30에 갱신됐다 — [Imbue: Sculptor](https://imbue.com/sculptor/)
- Imbue는 worktree가 로컬 환경을 공유하고 에이전트마다 의존성을 다시 설치해야 한다며 컨테이너의 우위를 주장한다 — [Imbue blog](https://imbue.com/blog/sculptor-announce). Docker 기반이며 포트도 분리된다 (제3자) — [byteiota](https://byteiota.com/sculptor-by-imbue-run-parallel-ai-coding-agents-without-port-conflicts/)

#### Zed (Zed Industries)
- 외부 에이전트는 ACP로 붙는다. Zed는 Agent Panel과 Threads Sidebar에서 thread만 호스팅하고, 런타임·인증·모델·도구·설정은 외부 에이전트(Claude Agent, Codex, Gemini CLI 등)가 갖는다. 설치는 ACP Registry로 한다 — [Zed docs: External Agents](https://zed.dev/docs/ai/external-agents)
- Threads Sidebar에서 여러 thread를 병렬로 돌린다. 각 thread는 자기 에이전트·컨텍스트·이력을 갖고, 같은 파일을 건드릴 수 있으면 linked git worktree에서 시작한다 — [Zed docs: Parallel agents](https://zed.dev/docs/ai/parallel-agents)

#### JetBrains (Air, Junie)
- Air는 2026-03 public preview로 macOS에서 먼저 나왔고, 중단된 Fleet을 기반으로 만들어졌다 — [JetBrains Air blog](https://blog.jetbrains.com/air/2026/03/air-launches-as-public-preview-a-new-wave-of-dev-tooling-built-on-26-years-of-experience/), [The Register](https://www.theregister.com/software/2026/03/10/jetbrains-air-agentic-ide-built-on-abandoned-fleet/5224231), [ADTmag](https://adtmag.com/articles/2026/03/19/jetbrains-launches-air-preview-for-developers-managing-multiple-ai-agents.aspx)
- 데스크톱 task는 로컬 workspace, git worktree, Docker 중에서 고르고, 원격 클라우드 컨테이너도 있다. 문서는 worktree가 호스트 보안 샌드박스가 아니라고 강조한다 — [rywalker: Air](https://rywalker.com/research/air-jetbrains). 프로젝트마다 전용 클라우드 환경(VM 크기, 인터넷 접근, secrets 제어)을 준다 — [jetbrains.com/air](https://www.jetbrains.com/air/)
- 2026-10에 Air가 JetBrains IDE 2026.3 EAP에 들어갔다 — [JetBrains AI blog](https://blog.jetbrains.com/ai/2026/10/air-in-ides-eap/)

#### Factory (Droids)
- 제품 면은 Droid CLI, Factory App(데스크톱), Web & Mobile(cloud session sync, Droid Computers) 세 가지이고, Missions와 subagents가 있다. docs.factory.ai는 docs.factory.com으로 308 리디렉트된다(2026-10-25 직접 관찰) — [Factory docs](https://docs.factory.com/)
- Missions는 `/missions`로 기능·마일스톤 계획을 합의한 뒤 Mission Control이 여러 에이전트의 실행을 관리하는 구조다 — [Factory docs: Missions](https://docs.factory.com/docs/missions/overview)

#### Amp
- thread마다 orb(클라우드 머신)가 만들어져 프롬프트를 보내고 노트북을 닫아도 일이 계속된다. CLI는 로컬 머신, 에디터 터미널, 스크립트에서 돈다 — [Amp docs](https://ampcode.com/docs). runner로 자기 머신에서 thread를 돌리고 git worktree를 만든다 (제3자) — [aiagentslist: Amp](https://www.aiagentslist.io/agents/amp-code)
- Puck(2026-07-20)은 다른 에이전트를 띄우고 조율하는 "home base" 어시스턴트다 — [Amp news: Meet Puck](https://ampcode.com/news/meet-puck)

#### Devin Desktop (구 Windsurf, Cognition)
- Windsurf는 2026-06-02(v3.0.12)에 Devin Desktop으로 이름을 바꿨고, 2026-09-08(v3.9.19)에 Cascade를 제거해 Devin Local만 남았다. 2026-04-15(v2.0.44)에 로컬·클라우드 세션을 상태별로 보여 주는 칸반형 Agent Command Center와 Spaces가 들어왔다. worktree 세션에는 Merge 버튼이 있고, 2026-10-23부터 Windows의 WSL distro를 원격 agent host로 쓸 수 있다. windsurf.com/changelog는 이 문서로 리디렉트된다 — [Devin Desktop changelog](https://docs.devin.ai/desktop/changelog)
- Cognition은 로컬 에이전트로 계획하고 클라우드 에이전트에 구현·테스트·QA·배포를 위임하는 흐름을 제시한다 — [Cognition blog: Devin in Windsurf](https://cognition.com/blog/devin-in-windsurf)

#### Kiro (AWS)
- Custom subagents(2026-02-05): 여러 subagent가 병렬로 돌고 각자 컨텍스트 윈도우를 갖는다 — [Kiro docs: subagents](https://kiro.dev/docs/custom-agents/subagents/), [DEV (AWS Builders)](https://dev.to/aws-builders/aws-parallel-execution-of-tasks-using-kiros-custom-subagents-kiro-n77)
- Kiro Crew(2026-08-04 발표)는 오픈소스(Apache 2.0)다. 로컬이나 자체 인프라에서 돌고, ACP로 Kiro CLI 에이전트들을 조율하며, OS 수준 샌드박스를 쓴다. 내부 이름은 MeshClaw였고 사내 개발자 39,000명 이상이 썼다고 한다 — [InfoQ](https://www.infoq.com/news/2026/08/kiro-crew-coding-agents/), [SiliconANGLE](https://siliconangle.com/2026/08/04/aws-launches-kiro-crew-autonomous-agentic-orchestrator-24-7-code-development/)

#### 2026 신규 진입자
- **Augment Code Intent**(2026-02-10 공개, 06-18 갱신): workspace마다 격리된 git worktree를 쓰고 Claude Code·Codex·OpenCode를 BYO로 붙일 수 있다 — [Augment blog: Intent](https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration), [Intent 제품 페이지](https://www.augmentcode.com/product/intent)
- **YC·기업 OSS(상세는 `community_oss_tools.md`)**: Emdash(YC W26, Apache-2.0)는 task마다 worktree를 만들고 Claude Code·Codex·Cursor·OpenCode·Amp·Devin·Droid·Copilot 등 설치된 CLI를 자동으로 감지한다 — [Emdash GitHub](https://github.com/generalaction/emdash). Coder Mux(Coder사, AGPL)는 자체 agent loop를 쓰는 Preview 단계 제품이다 — [Coder registry](https://registry.coder.com/modules/coder/mux), [daily.dev](https://daily.dev/posts/coder-mux-a-desktop-app-for-isolated-parallel-agentic-development-xwzfjgmu6). Superset은 macOS 다운로드만 제공한다 — [GitHub: superset-sh](https://github.com/superset-sh), [Show HN](https://news.ycombinator.com/item?id=46368739)
- **대조용(제외 대상)**: Claude Code 데스크톱 앱 개편판에는 모든 세션을 한 화면에서 관리하는 "Mission Control" 사이드바가 있고 Windows에서도 돈다 — [VentureBeat](https://venturebeat.com/orchestration/we-tested-anthropics-redesigned-claude-code-desktop-app-and-routines-heres-what-enterprises-should-know). Codex 앱은 `openai_practices.md`를 참고한다.

### Inferences
- "에이전트 = 독립 세션(worktree 1개)"이라는 모델이 지배적이다. 사용자가 원하는 "한 채팅 세션 안의 역할 팀"은 Cursor Projects(coordinator), Factory Missions(orchestrator), Amp Puck(메타 에이전트), Warp 오케스트레이션(parent/child), Intent(Coordinator/Implementor/Verifier)가 가장 가깝지만, 이 중 다수는 클라우드 우선이거나 자사 에이전트 전용이다.
- 클라우드 실행이 기본인 제품(Cursor Projects, Amp orbs, Warp Oz, Factory Droid Computers)은 "로컬 Windows 터미널로 꺼내기"와 방향이 반대다. 로컬 우선 Windows 하네스라면 이 축에서 차별화할 수 있다.

### Gaps
- Cursor Agents Window의 공식 문서(창 분리, 그리드·스플릿 지원)는 직접 확인하지 못했다. 블로그는 사이드바만 언급한다.
- Amp의 법인 구조(Sourcegraph와 분리됐는지)는 검증하지 못했다. winget ID가 `Sourcegraph.Amp`인 것만 확인했다 — [wingetly](https://wingetly.io/apps/sourcegraph/amp)
- Conductor Cloud(클라우드 샌드박스)의 존재와 범위는 제3자 리스팅에만 있어 확인하지 못했다.

## 2. 특정 에이전트 하나를 지목·조종하는 UX, 그리고 pop-out·split·attach (컨텍스트 유지 여부)

### Takeaway
대부분의 제품은 에이전트를 사이드바나 칸반의 독립 세션으로 두고 클릭해서 전환한다. 세션을 별도 탭·분할·창으로 여는 기능은 VS Code(Open as Editor/Open to the Side, split group, 별도 Agents window), Devin Desktop(최대 8개 side-by-side, fork를 새 탭으로, command center 별도 창), Warp(대화를 pane·tab으로)가 가장 앞서 있다. 하지만 오케스트레이터 아래 subagent를 꺼내 독립 대화로 이어 가는 기능은 거의 없다. Warp의 child pill과 VS Code의 `/fork`(이력 상속), Resume in Terminal(Copilot harness 한정)이 가장 가까운 사례다.

### Cited Findings

#### VS Code / GitHub Copilot
- Agents window의 peer chat은 Sessions 목록에서 우클릭해 **Open as Editor**(에디터 탭) 또는 **Open to the Side**(다른 에디터 그룹)로 연다. 탭을 split group으로 배치해 여러 대화를 나란히 모니터할 수 있다(예: "Sessions: Split Chat Group Right") — [VS Code docs: chat sessions](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)
- Copilot harness 세션은 우클릭 → **Resume in Terminal**로 터미널에서 이어 간다. 이때 대화 이력이 넘어가는지는 문서에 없다 — 같은 문서
- `/fork`(또는 checkpoint의 Fork Conversation)는 원 세션의 대화 이력을 상속한다. **side chat**은 원 대화를 숨긴 채 컨텍스트로 상속해 메인 chat을 더럽히지 않는다(Agents window, Copilot·Claude harness 한정). 반면 새 **peer chat**은 빈 상태로 시작한다. 단일 chat·단일 폴더인 Agent Host 세션은 대화 이력을 유지한 채 다른 폴더나 새 worktree로 옮길 수 있다 — 같은 문서
- Codex 세션(OpenAI Codex 확장)은 editor-only이고 side chat을 쓸 수 없다. 외부 Codex 세션은 한 번에 한 앱만 쓸 수 있다 — 같은 문서
- subagent는 컨텍스트가 격리되고 최종 결과만 메인으로 돌아온다. 사용자는 각 subagent의 실행 task, agent type, prompt, result를 볼 수 있다 — [VS Code blog 2026-02-05](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development)
- Windows에서는 작업표시줄의 VS Code 아이콘을 우클릭해 **Agents Window**를 연다. 아이콘 배지(Preview)는 결과를 안 읽었거나 입력을 기다리거나 CI가 실패한 세션 수를 보여 준다 — [VS Code docs](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)

#### Warp
- 대화는 세션에 묶인다. Conversations 메뉴(Windows는 Ctrl+Shift+Y)에서 과거 대화를 골라 후속 질문을 보내고, Past 목록의 대화를 클릭하면 새 pane에서 열린다. 응답 중에도 후속 프롬프트를 queue에 넣을 수 있다. 대화를 다른 window로 옮기는 기능은 문서에 없다 — [Warp docs: Interacting with agents](https://docs.warp.dev/agents/local-agents/interacting-with-agents/)
- 오케스트레이션 화면에는 부모와 자식이 pill로 나열되고, pill을 클릭하면 pane이 그 자리에서 해당 child의 대화로 바뀐다. 완료된 child도 부모가 새 메시지를 보내면 깨어나 후속 지시를 처리한다 — [Warp docs: orchestration](https://docs.warp.dev/platform/orchestration/)
- 2026-09 changelog에는 부모 대화를 닫았다 다시 열고 pill에서 child를 열 때 생기던 크래시와, background subagent 세션이 Warp Agent CLI 입력 포커스를 빼앗던 문제의 수정이 있다 — [Warp changelog 2026](https://docs.warp.dev/changelog/2026/)
- 앱 안의 Agent Management Panel과 Oz 웹의 Runs 페이지에서 로컬·클라우드 실행과 parent/child 관계를 추적한다 — [Warp docs: Managing cloud agents](https://docs.warp.dev/platform/managing-cloud-agents/)

#### Devin Desktop
- 2026-10-23(v3.11.212): 사이드바의 세션을 열린 세션 위로 끌어 놓으면 최대 8개를 나란히 볼 수 있다. Spaces로 묶인 세션은 사이드바에서 부모 세션 아래에 표시된다 — [Devin Desktop changelog](https://docs.devin.ai/desktop/changelog)
- 2026-08-10(v3.7.16): "Duplicate session"과 "send as fork"는 fork를 새 탭에 연다. 2026-08-21(v3.8.20): Agent Command Center를 에디터와 별도 window로 분리하는 설정이 생겼고, 실행 중인 subagent를 턴 전체를 취소하지 않고 개별 중지할 수 있게 됐다 — 같은 changelog

#### Cursor
- 로컬·클라우드 에이전트가 모두 사이드바에 나타나고 세션을 cloud↔local로 옮길 수 있지만, 컨텍스트가 넘어가는지는 블로그에 명시되지 않았다 — [Cursor blog: Cursor 3](https://cursor.com/blog/cursor-3)
- Cursor 3의 실체는 Cursor 2의 worktree 위에 얹은 UI 레이어(Agents Window 사이드바, drag-drop 탭)라는 비판이 있다 (제3자) — [liranbaba.dev](https://liranbaba.dev/blog/cursor-3-parallel-agents/)
- Projects는 coordinator와 대화하며 감독하는 구조다. 개별 subagent와 직접 대화할 수 있는지는 공식 글에 없다 — [Cursor blog: Projects](https://cursor.com/blog/projects). subagent는 이전 대화 이력에 접근하지 못하므로 부모가 프롬프트에 필요한 정보를 넣고, 공유 컨텍스트는 동기화 파일로 넘긴다 (제3자 분석) — [memorylake](https://www.memorylake.ai/en/blogs/cursor-projects-shared-context-files), [eesel](https://www.eesel.ai/blog/cursor-projects-review)

#### Google Antigravity
- (1.x Agent Manager 기준) Inbox에 모든 대화가 나오고, 각 대화는 Idle/Running/Blocked 상태로 표시된다(Blocked는 사용자 입력이 필요하다는 뜻). 작업 중인 에이전트의 Artifact에 코멘트를 달아 방향을 고친다 (제3자 가이드, 일부는 2026 이전) — [arjankc](https://arjankc.com.np/blog/google-antigravity-agent-manager-explained/), [Google Cloud Community (Medium)](https://medium.com/google-cloud/tutorial-getting-started-with-google-antigravity-b5cc74c103c2), [atamel.dev](https://atamel.dev/posts/2026/01-19_parallel_agents_antigravity/)
- 공식 문서는 여러 대화를 병렬로 시작할 수 있다는 정도만 말하고, 개별 에이전트 조종 UX는 자세히 다루지 않는다 — [Antigravity docs: Agent](https://antigravity.google/docs/agent/). 2.0 공식 발표문도 앱을 에이전트 상호작용의 중심 허브라고만 설명한다 — [Google Developers blog](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/)

#### Zed
- thread를 클릭하면 Agent Panel이 그 대화로 바뀐다. ctrl-tab으로 전환하고, 각 thread에 상태 표시가 있다. thread를 별도 tab·pane·window로 여는 방법은 문서에 없다 — [Zed docs: Parallel agents](https://zed.dev/docs/ai/parallel-agents)

#### JetBrains Air
- 여러 프로젝트를 열어 두고 프로젝트마다 세션을 갖는다. 안 읽은 업데이트, 변경 파일, 나갈 커밋을 추적한다 — [jetbrains.com/air](https://www.jetbrains.com/air/)
- 권한 모드는 Plan/Ask/Edit/Full Access다. 리뷰에서 승인한 라인 코멘트를 구현 task로 되돌려 보낼 수 있다 — [rywalker: Air](https://rywalker.com/research/air-jetbrains)

#### Factory / Amp / Kiro / Sculptor / Copilot CLI
- Factory Missions: 오케스트레이터는 에이전트라서 대화할 수 있다. worker droid와 직접 대화할 수 있는지는 문서에 없다 — [Factory docs: Missions](https://docs.factory.com/docs/missions/overview)
- Amp: TUI에서 후속 지시를 보내고, 앱은 thread가 다음 메시지를 기다리면 알린다 — [Amp docs](https://ampcode.com/docs). Puck이 띄운 thread를 사용자가 직접 열어 대화할 수 있는지는 공식 글에 없다 — [Amp news: Meet Puck](https://ampcode.com/news/meet-puck)
- Kiro: 사용자가 이름을 대고 특정 subagent를 요청할 수 있다. task graph(DAG)는 실행 전에 고정되고 실행 중에는 바꿀 수 없다. workflows를 켜면 위임이 백그라운드에서 돌아 부모 대화를 계속할 수 있고, CLI에서는 Ctrl+G로 오래 걸리는 subagent를 모니터링한다 — [Kiro docs: subagents](https://kiro.dev/docs/custom-agents/subagents/). Kiro Crew의 Activity view는 에이전트별 계획, 툴 호출, 승인 게이트, 결과를 실시간으로 보여 준다 — [InfoQ](https://www.infoq.com/news/2026/08/kiro-crew-coding-agents/)
- Sculptor: 저장된 세션에 계획·채팅·툴 호출·코드 변경이 남아 다시 열어 이어 갈 수 있다. 세션 이력의 임의 지점에서 새 에이전트를 갈라내는 fork는 아직 "What's next"에 있다 — [Imbue: Sculptor](https://imbue.com/sculptor/)
- Copilot CLI `/fleet`: subagent끼리 직접 통신할 수 없고 오케스트레이터만 조율한다 (제3자) — [lilting.ch](https://lilting.ch/en/articles/github-copilot-cli-fleet-parallel-agents)

### Inferences
- 사용자가 원하는 흐름("5개 역할을 띄운 뒤 하나를 골라 독립 창으로 꺼내고 협업을 이어 가기")에 기능상 가장 가까운 조합은 VS Code의 `/fork`(이력 상속) + Open to the Side + 세션 간 메시지 도구(3절)다. 하지만 이는 VS Code 안의 탭·분할일 뿐 독립 터미널 창은 아니다. Resume in Terminal은 Copilot harness에서만 되고 Claude·Codex 세션에는 없다.
- Warp의 pill은 child 대화를 "그 자리에서 전환"한다. 별도 창으로 분리하는 기능은 문서에 없다. Warp의 2026-09 수정 이력(pill에서 child를 열 때 크래시, background subagent의 포커스 탈취)은 child 대화를 여는 기능이 아직 다듬어지는 중이라는 신호로 읽힌다.
- subagent의 컨텍스트 격리(Cursor, Kiro, VS Code, Copilot `/fleet`)는 업계의 기본 설계다. 따라서 "꺼낸 뒤에도 컨텍스트가 그대로"는 subagent의 transcript를 독립 세션으로 승격하는 별도 메커니즘이 있어야 가능하다. 상용 제품 중 이것을 명시적으로 제공하는 곳은 찾지 못했다.

### Gaps
- VS Code Resume in Terminal의 이력 이전 여부, Antigravity 2.0 앱의 에이전트별 창·분할 지원, Cursor Agents Window의 창 분리 여부, Warp에서 child pane으로 직접 메시지를 보낼 수 있는지는 공식 문서로 확인하지 못했다.

## 3. 에이전트 간 협업(공유 태스크 보드, 메시징, 역할)과 지속적인 역할 정체성

### Takeaway
주소 지정이 가능한 정체성과 메시징을 갖춘 상용 제품은 세 곳이다. Warp는 agent ID 기반 inbox를, VS Code는 세션 간 메시지 도구(전송할 때마다 사용자 확인)를, Amp는 메타 에이전트 Puck을 제공한다. 역할 정의 기능은 VS Code custom agents, Kiro custom agents, Devin `agents/<name>.md`, Intent의 Coordinator/Implementor/Verifier 등 흔하다. 하지만 대부분 실행할 때마다 새로 뜨는 템플릿이지, 계속 이름으로 부를 수 있는 인스턴스가 아니다. 공유 보드는 사람이 보는 칸반·스펙(Devin Command Center, Intent living spec, Factory Mission Control) 형태가 대부분이다.

### Cited Findings
- **VS Code**: Copilot·Claude harness 세션(실험적 Codex 통합 포함)의 에이전트는 내장 session-management 도구로 다른 세션 목록을 보고, 다른 세션의 최근 컨텍스트를 읽고, 세션이나 chat을 만들고, 다른 세션에 메시지를 보낼 수 있다. 메시지 전송에는 항상 사용자 확인이 필요하고, 자기 chat에는 보낼 수 없으며, 연속 전송에는 상한이 있다 — [VS Code docs: chat sessions](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)
- **VS Code**: custom agent는 도구·지시·모델을 따로 가진다(예: 웹 검색이 되는 읽기 전용 리서치 에이전트, 구현 에이전트, 보안 에이전트). handoff로 이어 plan → implement → review 흐름을 만든다 — [VS Code blog 2026-02-05](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development)
- **Warp**: 모든 에이전트는 agent ID로 주소가 붙는 inbox를 갖고, 부모와 자식은 짧은 구조화 메시지를 주고받는다. 문서는 Swarm 패턴의 peer 협업도 언급한다. 수신자가 Warp Agent든 Claude Code든 Codex든 mailbox는 같아서 harness를 넘나드는 메시징이 된다. 자식은 자기 자식을 spawn하지 않는다 — [Warp docs: orchestration](https://docs.warp.dev/platform/orchestration/). 2026-07에 원격 child 실행용 `agent_identity_uid` 지원이 추가됐다 — [Warp changelog 2026](https://docs.warp.dev/changelog/2026/)
- **Amp Puck**: 에이전트를 시작하고, 모니터하고, 메시지를 보내고, 프로젝트를 만든다. 요청을 여러 에이전트에 나누고 보고를 모은다(Amp는 실험 기능이라고 표현) — [Amp docs: Puck](https://ampcode.com/docs/puck), [Amp news: Meet Puck](https://ampcode.com/news/meet-puck). 공동 창업자 Beyang은 X에서 Puck을 다른 에이전트를 관리하는 에이전트라고 소개했다 — [X: @beyang](https://x.com/beyang/status/2079218174403416088)
- **Cursor Projects**: coordinator가 몇 달 동안 컨텍스트를 유지하며 subagent에 위임한다. 에이전트들은 리서치, 산출물, 코드베이스 지식, 작업 선호를 공유 파일에 쌓아 뒤의 에이전트가 재사용한다 — [Cursor blog: Projects](https://cursor.com/blog/projects)
- **Augment Intent**: Coordinator가 스펙 형태의 계획을 내고 사용자가 승인하면, Implementor가 wave 단위로 실행하고 Verifier가 스펙과 대조해 검증한다. 사용자가 직접 specialist agent를 정의할 수 있고, 모든 에이전트가 living spec을 읽고 갱신한다 — [Augment blog: Intent](https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration)
- **Factory Missions**: 오케스트레이터와 worker 구조이고, Mission Control이 계획 대비 진척을 추적한다 — [Factory docs: Missions](https://docs.factory.com/docs/missions/overview)
- **Kiro**: 메인 에이전트가 `description`을 보고 custom subagent를 고른다. DAG로 병렬·의존 관계를 처리하고 review loop는 `max_iterations`로 제한한다. 대화 이력은 격리되지만 steering 파일, MCP, spec 상태, 권한, hook은 공유한다 — [Kiro docs: subagents](https://kiro.dev/docs/custom-agents/subagents/). Kiro Crew는 세션을 넘는 공유 메모리와 재사용 skill을 갖지만, 별도의 역할 개념은 기사에 나오지 않는다 — [InfoQ](https://www.infoq.com/news/2026/08/kiro-crew-coding-agents/)
- **Devin Desktop**: custom subagent를 `agents/<name>.md` 파일로 정의한다(2026-07-29). Spaces는 세션·PR·파일·컨텍스트를 task 단위로 묶는다(2026-04-15). Agent Command Center는 상태별 칸반이다 — [Devin Desktop changelog](https://docs.devin.ai/desktop/changelog)
- **Antigravity 2.0**: dynamic subagents와 사용자 정의 subagent workflow를 지원한다 — [Google Developers blog](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/), [Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity). 문서 내비게이션에 "Subagents & Teamwork" 항목이 있지만 내용은 확인하지 못했다 — [Antigravity docs](https://antigravity.google/docs/agent/)
- **Copilot CLI `/fleet`**: 오케스트레이터가 목표를 작업 단위로 쪼개 독립 작업을 먼저 병렬로 돌리고, 의존 작업은 다음 wave에서 처리한다 (제3자) — [htek.dev](https://htek.dev/articles/copilot-cli-weekly-2026-04-03), [lilting.ch](https://lilting.ch/en/articles/github-copilot-cli-fleet-parallel-agents)
- **Zed / Conductor / JetBrains Air**: Zed thread는 서로 독립이고 조율 기능이 없다 — [Zed docs](https://zed.dev/docs/ai/parallel-agents). Conductor는 격리된 workspace를 병렬로 돌릴 뿐 조율 기능이 언급되지 않는다 — [Conductor docs](https://www.conductor.build/docs/). Air는 구현이 끝나면 새 에이전트 세션에서 리뷰 task를 돌리는 정도다(다른 에이전트·모델도 가능) — [rywalker: Air](https://rywalker.com/research/air-jetbrains)

### Inferences
- 사용자의 "PM + 리서처 여러 명 + 종합" 구조는 계층형(coordinator → workers)이다. Warp의 1단계 parent/child, Cursor coordinator, Factory 오케스트레이터, Intent Coordinator가 같은 형태다. 하지만 꺼낸 worker가 팀 소속을 유지한 채 사용자와 직접 협업하는 시나리오는 Warp(완료된 child를 다시 깨우기)와 VS Code(세션 간 메시지)만 부분적으로 지원한다.
- VS Code가 메시지 전송마다 사용자 확인을 요구하는 것은 안전과 마찰 사이의 절충이다. 하네스를 설계할 때 메시징 권한 모델(자동/확인/금지)을 역할별로 고를 수 있게 하면 차별화 지점이 된다.

### Gaps
- Intent specialist가 6종(Investigate, Implement, Verify, Critique, Debug, Code Review)이라는 주장은 제3자 자료에만 있어 확인하지 못했다.
- Devin Spaces에서 에이전트끼리 실제로 컨텍스트를 공유하는지, 아니면 사람용 묶음인지는 changelog만으로는 분명하지 않다.

## 4. Windows 지원 현황

### Takeaway
Windows가 더는 빈 시장은 아니다. VS Code/Copilot, Warp, Devin Desktop, Zed, JetBrains Air(2026-06~), Factory App, Antigravity 2.0, Kiro CLI·Crew, Emdash가 Windows를 지원한다. 반면 멀티 에이전트 전용 UX를 앞서 실험한 제품(Conductor, Sculptor, Intent, Superset, cmux, Amp 데스크톱)은 여전히 macOS 우선이다.

### Cited Findings
- **VS Code**: Windows 작업표시줄 아이콘 메뉴에서 Agents Window를 연다고 문서가 직접 설명한다 — [VS Code docs](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)
- **Warp**: 문서가 Windows 단축키(Ctrl+Shift+Y 등)를 따로 적고 있다 — [Warp docs](https://docs.warp.dev/agents/local-agents/interacting-with-agents/). 2026-07에 Windows ConPTY 루트 프로세스 정리 버그를 고쳤다 — [Warp changelog 2026](https://docs.warp.dev/changelog/2026/). Windows용 네이티브 옵션 중 가장 완성도가 높다는 평가가 있다 (제3자) — [Petronella](https://petronellatech.com/blog/tmux-vs-cmux-vs-herdr-2026-terminal-multiplexer-comparison/)
- **Devin Desktop**: 2026-10-23에 Windows의 WSL distro를 원격 agent host로 쓰게 됐고, 2026-10-24에는 설치 직후 새 터미널에서 `devin` 명령을 쓸 수 있게 됐다 — [Devin Desktop changelog](https://docs.devin.ai/desktop/changelog)
- **Zed**: 2025-10에 네이티브 Windows 버전이 나왔다 (2026 이전) — [AlternativeTo](https://alternativeto.net/news/2025/10/zed-editor-launches-native-windows-version-with-wsl-integration-extensions-and-ai-features)
- **JetBrains Air**: 2026-06 블로그 제목이 "JetBrains Air lands on Windows"다(본문은 403으로 확인 못 함) — [JetBrains blog](https://blog.jetbrains.com/air/2026/06/jetbrains-air-lands-on-windows/). 현재 데스크톱 quickstart가 Windows를 지원한다 — [rywalker: Air](https://rywalker.com/research/air-jetbrains). 반면 macOS 전용이라고 쓴 리뷰도 있는데, 6월 이전에 쓰였을 가능성이 높다 — [MakerStack](https://makerstack.co/reviews/jetbrains-air-review/)
- **Factory**: 데스크톱 앱 설치 파일이 Windows x64·ARM64용으로 나와 있고 CLI도 Windows에 설치된다 — [Factory docs](https://docs.factory.com/)
- **Antigravity 2.0**: Windows 10+, macOS Monterey+, Linux를 지원하고 x86-64와 ARM64 빌드가 있다 — [Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity)
- **Kiro**: Kiro Crew는 macOS·Linux·Windows를 지원한다 — [InfoQ](https://www.infoq.com/news/2026/08/kiro-crew-coding-agents/). Kiro CLI도 Windows를 지원한다 (제3자) — [innFactory](https://innfactory.ai/en/ai-harness/kiro/)
- **Emdash**: Windows x64용 MSI 설치본과 portable EXE를 제공한다 — [Emdash GitHub](https://github.com/generalaction/emdash)
- **Windows 미지원·불확실**
  - Conductor: 문서가 Mac만 언급한다 — [Conductor docs](https://www.conductor.build/docs/). 2026-08-25 기준 Windows 빌드가 없다 (제3자) — [Pane 비교 페이지](https://runpane.com/compare/conductor), [Nimbalyst](https://nimbalyst.com/blog/best-claude-code-gui-tools-2026/). 2025년 리뷰에 Windows 대기자 명단 언급이 있다 (outdated 가능) — [The New Stack](https://thenewstack.io/a-hands-on-review-of-conductor-an-ai-parallel-runner-app/)
  - Sculptor: Mac(Apple Silicon)과 Linux만 지원하고 Windows는 "on the way"다 — [Imbue](https://imbue.com/sculptor/)
  - Augment Intent: macOS만 지원하고 Windows는 대기자 명단("coming soon")이다 — [Augment blog](https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration)
  - Amp: 앱은 macOS, iOS, iPadOS, Android(실험)와 웹만 있다 — [Amp docs](https://ampcode.com/docs). CLI는 winget 패키지가 있지만 — [wingetly](https://wingetly.io/apps/sourcegraph/amp), 2026-09 가이드는 Windows에서 WSL이 필요하다고 적어 서로 엇갈린다 (제3자) — [aiidelist: Amp Guide](https://aiidelist.com/blog/traeide-amp.md)
  - cmux: Mac 앱은 macOS 전용이다(FAQ). Windows에서 도는 별도 TUI가 있다는 주장은 출처가 하나뿐이다 — [vibecoding.app](https://vibecoding.app/blog/cmux-review), [Petronella](https://petronellatech.com/blog/tmux-vs-cmux-vs-herdr-2026-terminal-multiplexer-comparison/)
  - Coder Mux: 미리 빌드된 바이너리는 macOS·Linux용뿐이다 — [daily.dev](https://daily.dev/posts/coder-mux-a-desktop-app-for-isolated-parallel-agentic-development-xwzfjgmu6)

### Inferences
- Windows를 지원하는 제품들도 앱 안에서 탭과 분할을 그린다. Windows Terminal의 탭·창으로 에이전트를 꺼내는 것을 기능으로 내세우는 상용 제품은 찾지 못했다. Windows Terminal 쪽 기술 세부는 `windows_platform.md`를 참고한다.
- Devin Desktop의 WSL host 지원(2026-10)처럼, Windows 지원은 실제로는 "WSL을 거치는 것"을 포함하는 경우가 많다. 네이티브 PowerShell·ConPTY 경로를 1급으로 다루는 것은 여전히 차별화 여지다.

### Gaps
- Cursor 3 Agents Window의 Windows 동작은 공식 문서로 다시 확인하지 못했다. Cursor IDE 자체는 Windows를 지원하는 것으로 알려져 있고, HN 댓글에는 개발자들이 주로 macOS·Windows에서 테스트한다는 추정이 있다 — [HN](https://news.ycombinator.com/item?id=47618084)
- Copilot CLI의 Windows 네이티브 지원 세부와 Kiro IDE의 2026년 Windows 상태는 이번 세션에서 직접 확인하지 못했다.

## 5. 가격 모델

### Takeaway
업계 가격은 $20/$200 두 단계 구독에 크레딧·토큰 미터링을 얹는 구조로 수렴했다(Copilot은 2026-06에 AI Credits로 전환, Cursor는 2026-08부터 Auto도 미터링(제3자), Warp·Kiro·Factory는 크레딧, Antigravity는 quota). 병렬 에이전트는 토큰을 배수로 쓴다. 기존 구독(Claude Max, ChatGPT Plus/Pro)이나 BYOK를 재활용할 수 있는지가 핵심 차별점이다.

### Cited Findings
- **Cursor**: Hobby 무료, Pro $20, Pro+ $60, Ultra $200, Teams $40/user. 2026-08부터 Auto도 미터링된다는 보도가 있다 (제3자) — [CloudZero](https://www.cloudzero.com/blog/cursor-ai-pricing/), [Vantage](https://www.vantage.sh/blog/cursor-pricing-explained). 5개 subagent를 병렬로 돌리면 토큰을 약 5배 쓴다고 Cursor 문서에 있다고 한다 (제3자) — [eesel](https://www.eesel.ai/blog/cursor-projects-review)
- **GitHub Copilot**: 2026-06-01 premium request에서 토큰 기반 AI Credits로 바뀌었다. Pro $10과 Pro+ $39 가격은 그대로이고 Pro+에는 약 $70 상당의 크레딧이 있다 (제3자) — [CloudZero](https://www.cloudzero.com/blog/github-copilot-cost/), [UsageBox](https://usagebox.com/articles/github-copilot-usage-based-billing-2026). 2026-02 preview 때는 Claude·Codex 세션 하나에 premium request 하나가 들었다 — [GitHub Changelog](https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/). VS Code의 Claude·Codex 에이전트는 GitHub Copilot 구독으로 돌아간다 — [VS Code blog](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development)
- **Antigravity**: 별도 구독이 없다. 무료는 주간 quota이고, AI Pro/Ultra는 5시간마다 갱신되는 quota에 크레딧 구매가 가능하다. 2.0과 함께 Pro의 5배 사용량을 주는 $100 Ultra 플랜이 생겼고 최상위 Ultra는 $250에서 $200으로 내려갔다 — [Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity), [Google Developers blog](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/)
- **Warp**: 터미널은 무료다. Build $20(1,500 크레딧), Max $200(18,000), Business $50/user이고 모든 플랜에서 BYOK가 된다 (제3자) — [javisreview](https://javisreview.com/review/warp-review-2026/), [vibecoding.gallery](https://vibecoding.gallery/en/tools/warp-terminal/). Oz multi-harness는 베타 동안 무료다 — [Warp blog](https://www.warp.dev/blog/multi-harness-cloud-agent-orchestration)
- **Zed**: 외부 에이전트에는 과금하지 않는다(과금은 에이전트 제공사 몫) — [Zed docs](https://zed.dev/docs/ai/external-agents). Personal 무료, Pro $10(2026-05에 $20에서 인하), Business $30/seat (제3자) — [StackPick](https://stackpick.net/tools/zed-ai/), [Tech Insider](https://tech-insider.org/ca/zed-editor-setup-2026/)
- **JetBrains Air**: early-access 기간에는 무료로 설치한다. 원격 task는 JetBrains AI 크레딧을 쓰고(1 크레딧 = 제공사 측 LLM 비용 $1), 로컬 task는 BYOK가 되지만 개인 제공사 계정은 로컬에서만 쓸 수 있다 — [rywalker: Air](https://rywalker.com/research/air-jetbrains), [jetbrains.com/air](https://www.jetbrains.com/air/)
- **Factory**: Pro $20, Plus $100, Max $200, Team $60+$40/seat. 5시간·7일·30일 rolling 한도가 있고 Missions는 Extra Usage를 켜야 돈다 (제3자) — [CostKite (2026-10)](https://costkite.com/tools/factory-droids), [Continuum](https://continuumcode.ai/guides/factory-ai-review/)
- **Amp**: ChatGPT Plus/Pro 구독을 연결해 OpenAI 모델을 쓸 수 있다 — [Amp docs](https://ampcode.com/docs). 플랜 정보는 제3자끼리 엇갈린다(예: $20/$200 두 단계, 무료 신규 가입 마감 등) — [aiagentslist](https://www.aiagentslist.io/agents/amp-code), [aiidelist](https://aiidelist.com/ide/amp-code)
- **Devin Desktop**: Free, Pro $20, Max $200, Teams(월 최소 $80, full seat $40). self-serve 플랜에서는 ACU가 없어졌고 초과분은 API 요율로 청구된다 (제3자, 2026-09~10) — [Lindy](https://www.lindy.ai/blog/devin-pricing), [AxonBuild](https://axonbuild.com/blog/devin-desktop-review/)
- **Kiro**: Free(50 크레딧), Pro $20(1,000), Pro+ $40(2,000), Pro Max $100(5,000), Power $200(10,000). 추가 크레딧은 $0.04이고 workflows도 같은 크레딧 모델을 쓴다. Kiro Crew는 구독으로 쓸 수 있는 도구로 나열된다 — [Kiro pricing](https://kiro.dev/pricing/)
- **Augment Intent**: public beta이고 Auggie CLI와 같은 요율로 크레딧을 쓴다 — [Augment blog](https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration)

### Inferences
- 사용자가 이미 Claude Code와 Codex 구독을 갖고 있다면, 그 CLI를 그대로 띄우는 하네스는 추가 미터링 계층이 없다. 6절의 가격 불만(Copilot, Antigravity, Warp, Cursor)을 피해 갈 수 있는 구조다. Conductor와 Emdash가 이 모델을 쓰고, Zed와 Air(로컬)는 BYO를 허용한다.

### Gaps
- Conductor의 공식 가격(제3자가 언급한 "클라우드·팀 기능 월 $50+")과 Sculptor 가격(제3자가 말하는 "베타 동안 무료")은 공식 페이지로 확인하지 못했다.
- Amp가 "Claude Pro/Max로 Claude Code 모드를 돌린다"(2026-10-10~)는 주장은 제3자 출처 하나뿐이라 검증하지 못했다.

## 6. 주요 사용자 불만 (근거 링크)

### Takeaway
반복되는 불만은 다섯 가지다. (1) 사용량 미터링과 비용 폭증(Copilot AI Credits, Antigravity quota, Warp 크레딧, Factory Missions, Kiro Crew), (2) 벤더 종속과 갑작스러운 정책 변경(Devin의 Cascade 제거, Antigravity의 OpenClaw 차단·사전 공지 없는 quota 축소), (3) macOS 전용(Conductor, Sculptor, Intent), (4) 자기 구독이나 CLI를 그대로 못 쓰는 문제(JetBrains Air의 Anthropic 구독), (5) 초기 품질(Air 버그, Cursor Linux 크래시)이다. Reddit 원문은 검색에 거의 잡히지 않아 대부분의 근거는 HN, 공식 포럼, 업계 매체, Product Hunt에서 왔다.

### Cited Findings
- **GitHub Copilot (AI Credits, 2026-06~)**
  - 전환 직후 크레딧이 몇 시간 만에 동났다는 보고가 이어졌다. 한 회사는 월 $29에서 $750으로 오를 것으로 추산했고, "lol" 같은 짧은 메시지에도 약 29 크레딧이 든다는 사례가 있었다 — [gHacks (2026-06-02)](https://www.ghacks.net/2026/06/02/github-copilot-usage-based-billing-takes-effect-drawing-developer-backlash-over-rapid-credit-depletion/), [Visual Studio Magazine (2026-06-04)](https://visualstudiomagazine.com/articles/2026/06/04/copilot-billing-shock-hits-developers.aspx)
  - 8월에도 "가벼운 하루에 월 크레딧의 3분의 2를 썼다"는 글과 구독 취소·이전 언급이 계속됐다 — [Visual Studio Magazine (2026-08-07)](https://visualstudiomagazine.com/articles/2026/08/07/copilot-credit-complaints-keep-coming-too-expensive-to-use.aspx?admgarea=ALM)
- **Google Antigravity**
  - 2.0에서 요청 한 번에 quota가 다 날아가거나 며칠씩 잠긴다는 불만이 공식 포럼에 올라왔다. 간단한 UI 두 개를 만드는 데 주간 quota를 다 썼다는 글도 있다 — [포럼: quota system 불만](https://discuss.ai.google.dev/t/complaint-regarding-the-current-antigravity-quota-system/146600), [포럼: 주간 quota 소진](https://discuss.ai.google.dev/t/antigravity-2-0-used-an-entire-weeks-quota-on-two-simple-uis/169828), [포럼: Antigravity 2.0](https://discuss.ai.google.dev/t/google-antigravity-2-0/147514), [XDA](https://www.xda-developers.com/tried-googles-antigravity-limitation-made-close-it-good/)
  - 2025-12~2026-03 사이 사전 공지 없이 quota를 여러 번 줄였다 (제3자) — [Emergent review](https://emergent.sh/learn/google-antigravity-review)
  - 2026-02에 서드파티 에이전트 OpenClaw를 연결한 사용자를 차단했다. 보안 사고로는 악성 repo를 통한 백도어(2025-11), Turbo 모드가 드라이브 전체를 지운 사례(2025-12), file-search 도구의 prompt injection 취약점(2026-02-28 수정)이 있었다. 비공개 VS Code fork("PORK")라는 비판도 있다 — [Wikipedia](https://en.wikipedia.org/wiki/Google_Antigravity)
- **Cursor**
  - Cursor 3는 IDE에서 멀어진다는 반발을 샀다(엔지니어 Lee Robinson은 IDE 뷰를 계속 유지한다고 답했다). Linux Wayland에서 시작 시 크래시가 났다는 보고도 있다 — [HN: Cursor 3](https://news.ycombinator.com/item?id=47618084), [InfoQ](https://www.infoq.com/news/2026/04/cursor-3-agent-first-interface/)
  - 새로운 것이 아니라 기존 worktree 위의 UI 레이어라는 비판 — [liranbaba.dev](https://liranbaba.dev/blog/cursor-3-parallel-agents/). 커뮤니티 평가가 갈렸다 — [DEV](https://dev.to/onepizzateam/cursor-3-shipped-parallel-agents-and-the-community-cant-agree-on-whether-thats-good-1p3n)
- **Warp**
  - 강제 로그인(이후 해제), 높은 가격, AI를 밀어붙이는 방향, 크레딧이 빨리 닳는 문제가 지적된다. Trustpilot 평점은 1.7/5(리뷰 22개)다 — [Product Hunt reviews](https://www.producthunt.com/products/warp/reviews), [javisreview](https://javisreview.com/review/warp-review-2026/)
  - 크레딧이 약 10일 만에 바닥났다는 사용자 후기 — [Medium (cryptax)](https://cryptax.medium.com/what-i-like-dont-like-about-warp-terminal-f5acd0e47990)
- **Devin Desktop**
  - Cascade는 발표 4주 만에 deprecation이 예고됐고 결국 제거됐다. 자동 생성된 memories를 읽던 화면이 함께 사라졌다 — [MemoryLake](https://www.memorylake.ai/en/blogs/devin-desktop-removed-cascade), [Danilchenko review](https://www.danilchenko.dev/posts/devin-desktop-review/)
  - 엔터프라이즈 보안 hook이 Devin Local에는 적용되지 않는 공백이 있다 — [GitHub issue (cisco-ai-defense)](https://github.com/cisco-ai-defense/defenseclaw/issues/915)
- **JetBrains Air**
  - "버그투성이", "작은 팀이 만든 Conductor보다 훨씬 못하다", Anthropic 구독을 쓸 수 없다는 HN 댓글이 있다 — [HN: Air](https://news.ycombinator.com/item?id=49799287), [HN 댓글](https://news.ycombinator.com/item?id=49799747)
  - IDE 플러그인 쪽에서는 JetBrains AI 인터페이스가 겹치고, Codex 모델이 안 불러와지고, 제공사 설정이 헷갈린다는 보고가 있다(개별 사례) — [rywalker: Air](https://rywalker.com/research/air-jetbrains). 에디터 성숙도가 Cursor나 VS Code보다 떨어진다는 리뷰도 있다 — [MakerStack](https://makerstack.co/reviews/jetbrains-air-review/)
- **Conductor**
  - worktree를 강제하는 방식이 의외이고 gitignored 파일을 worktree로 복사하기 어렵다는 지적 — [X: Pallav Agarwal](https://x.com/pallavmac/status/2021294403759833216)
  - MCP 서버와 규칙이 Codex에도 적용되는지 불분명하다는 HN 댓글(같은 스레드에 "내 워크플로의 95%를 가져갔다"는 호평도 있다) — [HN](https://news.ycombinator.com/item?id=46029331)
  - 2025년에 GitHub 권한을 과도하게 요구한다는 논란이 있었다 (2026 이전, outdated 가능) — [BigGo](https://biggo.com/news/202507210115_Conductor_App_GitHub_Permissions_Controversy)
  - Mac 전용이라는 점을 경쟁사가 공략하고 있다 — [Pane 비교 페이지](https://runpane.com/compare/conductor)
- **Factory**: Missions는 큰 정액 플랜을 선불 변동 지출로 바꿔 버린다는 리뷰가 있다 (제3자) — [Continuum](https://continuumcode.ai/guides/factory-ai-review/)
- **Kiro Crew**: Kiro CLI보다 토큰을 훨씬 빨리 쓴다는 보고가 있다 — [InfoQ](https://www.infoq.com/news/2026/08/kiro-crew-coding-agents/)
- **Zed (문서상 한계)**: Zed Agent의 profile과 skills는 외부 에이전트에 적용되지 않는다. 인증·과금·데이터 처리는 사용자와 에이전트 제공사 사이의 일이다 — [Zed docs: External Agents](https://zed.dev/docs/ai/external-agents)

### Inferences
- 사용자가 겪는 고통("최종 종합만 보이고 개별 역할 에이전트에게 후속 지시를 못 한다")과 같은 맥락의 불만은 이번 조사에서 직접 문서화된 사례를 찾지 못했다. 다만 Copilot `/fleet`(subagent끼리 직접 통신 불가), Kiro(task graph 실행 중 수정 불가), Cursor Projects(subagent에 이전 이력 없음)의 설계가 같은 한계를 구조적으로 안고 있다.
- "어떤 에이전트가 내 주의를 필요로 하는가" 문제에는 VS Code 아이콘 배지, Antigravity의 Blocked 상태, Devin의 상태별 칸반, Amp 앱 알림, Zed의 thread 상태 표시가 각각 나름의 답을 냈다. 하네스가 넘어야 할 기준선이다.

### Gaps
- Reddit(r/cursor, r/ClaudeAI, r/windsurf 등)의 2026년 원문 스레드는 검색에 거의 잡히지 않아 직접 인용하지 못했다.
- "Cursor 3 초기 테스터가 이틀 만에 $2,000 청구를 받았다"는 주장은 원 출처를 확인하지 못해 제외했다.
- Zed의 Claude Code 연동에서 과거 메시지 편집이나 thread 재개가 안 된다는 예전 한계가 지금도 남아 있는지 확인하지 못했다.

## 7. 원하는 경험에 가장 가까운 제품과 남은 공백 (Windows-first "한 명령으로 에이전트 pop-out" 하네스 관점)

### Takeaway
가장 가까운 것은 VS Code Agents window, Warp 오케스트레이션, Devin Desktop 세 곳이다. VS Code는 Windows 네이티브에 Claude 공식 harness, 세션을 탭·사이드·split으로 열기, `/fork` 이력 상속, 세션 간 메시지를 갖췄다. Warp는 agent ID inbox, child pill, Claude Code·Codex child를 갖췄다. Devin Desktop은 8분할, fork를 새 탭으로, command center 별도 창을 갖췄다. 하지만 어느 제품도 "Claude Code 또는 Codex CLI의 한 채팅 세션에서 프롬프트로 정의한 역할 에이전트를, 한 명령으로 독립 터미널 탭이나 창으로 꺼내고, 컨텍스트와 팀 소속(메시징·보드)을 유지하는" 흐름을 제공하지 않는다.

### Cited Findings
- VS Code: peer chat을 Open as Editor/Open to the Side, split group으로 열고, `/fork`가 이력을 상속하며, 에이전트가 다른 세션에 메시지를 보낸다(사용자 확인). Resume in Terminal은 Copilot harness에서만 된다 — [VS Code docs](https://code.visualstudio.com/docs/copilot/chat/chat-sessions)
- Warp: agent ID inbox, pill로 child 대화로 전환, 완료된 child를 다시 깨우는 후속 지시, Claude Code·Codex child, 깊이 1단계 — [Warp docs: orchestration](https://docs.warp.dev/platform/orchestration/)
- Devin Desktop: 최대 8개 side-by-side, fork를 새 탭으로, command center 별도 창, subagent 개별 중지 — [Devin Desktop changelog](https://docs.devin.ai/desktop/changelog)
- Augment Intent는 역할 구조(Coordinator/Implementor/Verifier)와 BYO Claude Code·Codex를 갖췄지만 macOS 전용이다 — [Augment blog](https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration)

### Inferences

**비교 매트릭스** (1~6절의 출처를 종합한 추론. "미확인"은 공식 문서로 확인하지 못했다는 뜻)

| 제품 | Windows | BYO Claude Code/Codex | 에이전트를 별도 탭·분할·창으로 | 꺼낸 뒤 컨텍스트 유지 | 에이전트 간 메시징·보드 | 지속적 역할 정체성 |
|---|---|---|---|---|---|---|
| VS Code / Copilot | 예(네이티브) | 부분(Claude Agent harness를 Copilot 과금으로, Codex는 2등급) | 예(Editor/Side/split, Agents window) | 부분(`/fork` 상속, side chat 상속, Resume in Terminal은 Copilot만) | 예(세션 간 메시지, 사용자 확인) | 부분(custom agent는 템플릿) |
| Warp | 예 | 부분(Oz 클라우드 harness, 로컬은 일반 터미널) | 부분(pane·tab, child는 제자리 전환) | 부분(완료된 child 재호출) | 예(agent ID inbox, 깊이 1) | 부분(`agent_identity_uid`) |
| Devin Desktop | 예(+WSL host) | 부분(ACP, Codex 언급 없음) | 예(8분할, fork 새 탭, command center 별도 창) | fork는 복제 방식 | 칸반(사람용) | 부분(`agents/<name>.md`) |
| Cursor (Agents Window/Projects) | 미확인(IDE는 지원으로 알려짐) | 아니오(자체 모델) | 탭(제3자) | cloud↔local 이동(컨텍스트 미명시) | coordinator → subagent(파일 공유) | 부분(coordinator 지속) |
| Antigravity 2.0 | 예 | 아니오(모델만 선택, OpenClaw 차단) | 미확인 | 미확인 | dynamic subagents | 미확인 |
| JetBrains Air | 예(2026-06~) | 예(ACP: Claude Agent, Codex, Junie, Gemini CLI) | 미확인 | 해당 없음 | 리뷰 task 정도 | 아니오 |
| Zed | 예 | 예(ACP) | 아니오(패널 안 전환) | 해당 없음 | 아니오 | 아니오 |
| Factory | 예 | 아니오(Droid) | 미확인 | 해당 없음 | 오케스트레이터(대화 가능) | 부분 |
| Amp | 부분(데스크톱 없음, CLI는 엇갈림) | 아니오(자체 에이전트, ChatGPT 구독 연결) | 미확인 | 해당 없음 | Puck 메시징 | 부분(Puck) |
| Kiro / Kiro Crew | 예 | 아니오(Kiro CLI) | 아니오(실행 중 subagent 수정 불가) | 해당 없음 | DAG, steering·spec 공유 | 부분(custom agents) |
| Conductor | 아니오(macOS) | 예 | workspace 단위 | 해당 없음 | 아니오 | 아니오 |
| Sculptor | 아니오(Mac/Linux) | 부분(Claude Code, Codex) | 미확인 | Pairing Mode(코드 동기화) | 아니오 | 아니오 |
| Augment Intent | 아니오(대기자 명단) | 예 | 미확인 | 해당 없음 | living spec, Verifier | 예(역할 구조) |

**제품별로 남기는 공백 (질문 8)**
- **Cursor**: 자체 모델·클라우드 우선이라 Claude Code·Codex CLI 팀에는 쓸 수 없다. Projects의 subagent는 이력 없이 뜨고 파일로만 컨텍스트를 받으므로 "꺼내서 이어 대화하기"가 없다.
- **Antigravity**: Gemini 생태계 종속이고, 서드파티 에이전트를 차단한 전력과 quota 불안정이 있다. 개별 에이전트 pop-out은 확인되지 않는다.
- **GitHub Copilot / VS Code**: 현재 가장 근접하다. 다만 Copilot 구독과 AI Credits 과금이 전제다. Codex는 2등급(editor-only, side chat 없음, 동시 쓰기 1개)이고, Resume in Terminal은 Copilot harness 한정이다. Windows Terminal 탭·창으로 꺼내기와 프롬프트로 정의한 역할 팀이라는 개념이 없다.
- **Warp**: inbox 모델은 참조할 가치가 크다. 그러나 child는 pane이 제자리에서 바뀌는 방식이고 깊이는 1단계다. Claude Code·Codex harness 지원은 클라우드(Oz) 중심이고, 크레딧 과금과 Warp Agent 우선 정책이 따라온다.
- **Conductor / Sculptor / Intent**: Windows가 없다. Conductor와 Sculptor에는 팀 개념도 없다.
- **Zed / JetBrains Air**: ACP로 BYO 에이전트를 붙일 수 있지만 thread는 서로 독립이고 조율 기능이 없다. Air는 Anthropic 구독 사용이 불분명하다는 불만이 있다.
- **Devin Desktop**: 분할과 fork UX는 좋다. 하지만 Devin Local 중심이고(Cascade 제거 전력) Codex 지원은 명시되지 않았다. fork는 복제일 뿐 팀 소속을 유지하는 pop-out이 아니다.
- **Factory / Kiro / Amp**: 자사 에이전트 전용이다. 오케스트레이터나 메타 에이전트(Missions, Puck)는 있지만 worker를 사용자가 직접 붙잡고 협업하는 흐름은 문서화되지 않았다. Kiro는 실행 중 subagent를 수정할 수 없다고 명시한다.

**Windows-first 하네스 설계에 주는 시사점 (추론)**
1. **pop-out은 승격(promotion)이다.** 역할 에이전트의 transcript와 상태를 독립 CLI 세션(Claude Code·Codex의 resume 계열)으로 넘기고, Windows Terminal의 새 탭·분할·창에 띄운다. 상용 제품은 모두 자기 앱 안에서 탭과 분할을 그리므로, OS 터미널로 꺼내는 것 자체가 빈자리다. 구체적인 `wt` 명령은 `windows_platform.md`를 참고한다.
2. **팀 소속은 mailbox와 보드로 유지한다.** Warp의 agent ID inbox(완료된 에이전트를 다시 깨우기)와 VS Code의 세션 간 메시지(전송 확인 정책)가 참조 설계다. 꺼낸 뒤에도 PM과 종합 에이전트가 그 역할에게 메시지를 보내고 결과를 받을 수 있어야 한다.
3. **역할 정체성을 지속시킨다.** "researcher-2" 같은 이름 기반 주소가 pop-out과 pop-in을 거쳐도 그대로여야 한다. 지금 시장의 역할 기능은 대부분 템플릿 수준이라 차별화가 쉽다.
4. **Claude Code와 Codex를 같은 등급으로 지원한다.** VS Code조차 Codex를 2등급으로 다룬다. 두 CLI를 한 팀에 섞고 사용자의 기존 구독을 그대로 쓰면, 가격 불만(Copilot, Antigravity, Warp, Cursor)과 종속 불만(Antigravity, Devin)을 동시에 피할 수 있다.
5. **주의 신호(attention)를 띄운다.** 입력 대기, 완료, 오류 상태를 역할 단위로 보여 줘야 한다(VS Code 아이콘 배지, Antigravity Blocked 상태, Devin 칸반 수준 이상).
6. **macOS 전용 경쟁자들의 Windows 공백을 노린다.** Conductor, Sculptor, Intent, Superset, cmux가 비어 있는 자리이고, Windows에서 "에이전트 인식 터미널"을 내세우는 상용 제품은 Warp 정도다.

### Gaps
- VS Code에서 Claude 세션이 사용자의 기존 Claude 구독(Max 등)을 쓸 수 있는지, 아니면 Copilot 과금만 되는지 명확한 공식 문구를 찾지 못했다. VS Code 블로그는 Copilot 구독으로 돈다고만 적었다.
- Warp에서 로컬 child를 Claude Code·Codex CLI로 돌릴 때의 세부(로컬 harness 지원 범위)와, child pane에서 사용자가 직접 지시할 수 있는지는 문서로 확정하지 못했다.
- Antigravity 2.0과 Cursor Agents Window의 창 분리·분할 UX는 공식 문서 접근이 제한돼 공백으로 남겼다.
