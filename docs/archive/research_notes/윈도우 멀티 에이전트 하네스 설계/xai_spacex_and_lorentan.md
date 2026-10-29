# SpaceX/xAI(SpaceXAI) 엔지니어의 멀티 에이전트 작업 방식 + "로렌탄"(Lauren Tan, @poteto) 식별과 워크플로

> 기준일 2026-10-25. 표기 규칙: [1차]는 회사 공식 페이지나 본인 게시물, [2차]는 언론·블로그 요약, [자기보고]는 본인 주장(독립 검증 없음). 2026년 이전 자료나 인수 이전 자료에는 날짜를 붙였다. X(트위터) 게시물 본문과 토크 영상은 직접 열람하지 못했고, 검색 스니펫과 2차 요약을 통해서만 확인했다.

## A1. 2026년 SpaceX–xAI(–Cursor) 관계: "SpaceX 엔지니어"는 누구를 가리키나

### Takeaway
SpaceX는 2026-02-02 xAI를 인수했다(xAI는 SpaceX 완전자회사, 합산 가치 약 1.25조 달러). 이어 2026-06-16 Cursor 운영사 Anysphere를 약 600억 달러 전액 주식으로 인수한다고 발표했고, 거래는 2026-08-14 종결됐다. 그래서 2026년 10월 시점의 "SpaceX 엔지니어의 에이전트 작업 방식"은 사실상 SpaceX의 AI 조직 "SpaceXAI" 이야기다. 여기에는 구 xAI 인력, 구 Cursor 인력, 그리고 Grok 개발로 재배치된 Starlink/Starship 엔지니어 일부가 포함된다.

### Cited Findings
- [1차 확인 보도] SpaceX가 2026-02-02 xAI 인수를 확인했다. 합산 가치는 약 1.25조 달러(로이터 인용: SpaceX 약 1조, xAI 약 2,500억)로 보도됐다 — [Yahoo Finance](https://finance.yahoo.com/news/elon-musks-spacex-merges-xai-153111324.html); [btw.media](https://btw.media/en/spacex-acquires-xai-in-1-25-trillion-merger)
- 네바다주 서류에 따르면 X.AI Holdings Corp.는 거래 과정에서 해산돼 신설 법인에 합병됐다. 익명 소식통은 xAI가 SpaceX의 완전자회사가 된다고 전했다 — [Drive Tesla Canada](https://driveteslacanada.ca/news/spacex-completes-merger-with-xai/)
- 2월 보도 기준으로 합병은 SpaceX가 연내 IPO(1.5조 달러 이상 가치 거론)를 준비하던 중에 이뤄졌다 — [The Nightly](https://thenightly.com.au/business/spacex-acquires-xai-as-elon-musk-looks-to-unify-ambitions-c-21510627); [Yahoo Finance](https://finance.yahoo.com/news/elon-musks-spacex-merges-xai-153111324.html)
- 2026년 4월 SpaceX–Cursor 파트너십 체결. AI 코딩·지식노동 도구를 공동 개발하고, 연내 600억 달러에 인수하거나 대신 100억 달러를 협력비로 내는 옵션을 확보했다(CNBC 인용) — [TechNews](https://technews.tw/?p=1543879); [GovConWire](https://www.govconwire.com/?p=344154)
- 2026-06-16 SpaceX가 자회사 X67을 통해 Anysphere를 약 600억 달러 전액 주식으로 인수한다고 발표했다. 4월에 확보한 옵션을 행사한 것이다 — [AP via NY1](https://ny1.com/nyc/all-boroughs/ap-top-news/2026/06/16/spacex-buys-ai-coding-startup-cursor-for-60-billion-in-race-for-an-edge-over-anthropic-and-openai); [W.Media](https://w.media/?p=40868); [GovConWire](https://www.govconwire.com/?p=344154)
- 인수 명분은 OpenAI·Anthropic에 맞선 xAI의 AI 코딩 경쟁력 강화다. Cursor는 대신 멤피스 Colossus 등 xAI 컴퓨트를 쓸 수 있게 된다 — [Techzine](https://www.techzine.eu/news/devops/142197/spacex-acquires-cursor-for-60-billion/)
- 2026-08-14 Cursor가 인수 종결을 발표하면서 SpaceX 완전자회사가 됐다 — [Drive Tesla Canada](https://driveteslacanada.ca/?p=119834); [WWWhatsnew](https://wwwhatsnew.com/2026/08/17/spacex-compra-cursor-60000-millones-mayor-startup-ma-2026/)
- [2차, 미확인] 2026-08-11 중국 매체 보도. Cursor 브랜드가 수개월 안에 단계적으로 폐기될 수 있지만 결정은 바뀔 수 있고, 기존 도구 이름은 당장 바꿀 계획이 없다고 한다. Cursor 직원이 SpaceX AI 내 기존 팀들로 흩어져 통합된다는 내용도 있다 — [QQ News](https://news.qq.com/rain/a/20260811A04ZP900); [10jqka](https://news.10jqka.com.cn/20260811/c678854293.shtml)
- 머스크(2026년 6월 말 보도, Business Insider 인용)는 시니어 Starlink·Starship 엔지니어 "수십 명"과 Cursor 인력을 Grok 모델 개발에 재배치했고, 올해 매달 처음부터 학습한 새 모델을 내겠다고 밝혔다 — [Let's Data Science](https://letsdatascience.com/news/elon-musk-deploys-spacex-engineers-to-grok-development-adf1c236)
- "SpaceXAI engineer"라는 표현이 언론과 X에서 Lauren Tan의 소속을 가리킬 때 쓰인다 — [AICoder](https://aicoder.com/news/news-20260921-poteto-cursor-compile-2500-prs); [unicode on X](https://x.com/unicodef1wn/status/2102081277683810491)
- Tesla와의 관계에서는 Macrohard(Digital Optimus)가 Tesla의 xAI 투자 계약의 일환인 xAI–Tesla 공동 프로젝트로 소개됐다(2026-03) — [Invezz](https://invezz.com/au/news/2026/03/11/musk-unveils-tesla-xai-project-macrohard-to-emulate-software-companies/)

### Inferences
- 공개된 "SpaceX 엔지니어의 에이전트 작업 방식"은 실질적으로 xAI·Cursor 출신 SpaceXAI 엔지니어의 방식이다. 로켓·Starlink 쪽 엔지니어가 자기 에이전트 워크플로를 직접 서술한 자료는 찾지 못했다.
- Cursor의 멀티 에이전트 연구(2026-01 scaling agents)와 제품(Cursor 3 Agents Window, Bugbot)도 2026-08부터는 SpaceX 산하 자산이다. 다만 그 연구와 제품은 Cursor가 독립 회사이던 시절에 발표됐다.

### Gaps
- "SpaceXAI"가 공식 부서·법인명인지 브랜드 표현인지 1차 출처로 확인하지 못했다. 4월 SpaceX 발표문에 이 명칭이 나왔다는 검색 요약이 있었지만 원문은 확보하지 못했다.
- SpaceX IPO의 10월 현재 상태는 확인하지 않았다.
- Cursor 브랜드 폐기와 조직 분산 보도는 2차 보도뿐이고 공식 확인이 없다.

## A2. xAI/SpaceXAI가 공개한 에이전트 코딩·멀티 에이전트 제품과 구조

### Takeaway
2026년 xAI/SpaceXAI가 내놓은 제품은 세 가지다. (1) 터미널 코딩 에이전트 Grok Build(5월): 서브에이전트, worktree 격리, plan mode 승인, headless `-p`, ACP 지원. (2) Agent Dashboard(6월): 여러 세션을 한 화면에 띄우고 특정 세션의 최신 출력을 보며 바로 답하거나 세션을 통째로 넘겨받는다(take over). (3) Grok Bot(8월, Cursor 기술 기반): 계정별 영속 클라우드 VM 위에서 이름 붙은 봇들이 그룹챗으로 협업하고 Routines로 트리거된다. 모델 차원에서는 Grok 4 Heavy(2025-07, 병렬 test-time compute)와 Grok 4.20(2026-02, 이름 붙은 4개 에이전트)이 있다. 흔히 인용되는 "최대 8개 서브에이전트"와 "Arena Mode"는 2차 출처에만 나오고, 공식 페이지와 문서에서는 확인되지 않았다.

### Cited Findings
#### Grok Build (터미널 코딩 에이전트)
- Bloomberg(2026-05-14): xAI가 첫 코딩 에이전트 Grok Build를 공개했다. 초기 테스트 단계이고 유료 구독자만 쓸 수 있다 — [Bloomberg](https://bloomberg.com/news/articles/2026-05-14/musk-s-xai-unveils-first-coding-agent-in-bid-to-rival-anthropic)
- [1차] x.ai "Introducing Grok Build"(페이지 날짜 2026-05-25): 모든 SuperGrok·X Premium Plus 구독자 대상 early beta. curl 한 줄로 설치하고 터미널에서 실행한다. 모델과 API 키는 `config.toml`에서 설정한다 — [x.ai](https://x.ai/news/grok-build-cli)
- [1차] 같은 페이지 내용. plan mode로 시작하고, 실행 전에 계획 전체를 승인하거나 단계별로 코멘트하거나 다시 쓸 수 있다. 승인 뒤에는 모든 변경이 clean diff로 표시된다. 서브에이전트는 각자 worktree에서 띄울 수 있다. headless 모드(`-p`)로 스크립트·자동화 안에서 에이전트를 돌릴 수 있고, ACP를 지원해 커스텀 봇과 오케스트레이션 앱을 만들 수 있다 — [x.ai](https://x.ai/news/grok-build-cli)
- [1차] 같은 페이지 데모. explore 서브에이전트 6개 중 3개가 병렬로 돈다. UI에 "pin agent", "take over", "change task" 힌트와 "review diff" 단계가 보이지만 본문 설명은 없다 — [x.ai](https://x.ai/news/grok-build-cli)
- [1차] 공식 문서. 내장 서브에이전트는 `general-purpose`(전체 권한), `explore`(읽기·목록·검색만, 셸·편집 불가), `plan`(구현 계획 초안만, 셸·편집 불가) 세 가지다. 각각 자체 컨텍스트를 가진 독립 child session이고, 끝나면 부모에게 요약을 돌려준다. 커스텀 유형은 `.grok/agents/`(프로젝트) 또는 `~/.grok/agents/`(사용자)에 정의하고 `/config-agents`(별칭 `/agents`), `/personas`로 관리한다. persona는 톤·초점·계약만 덮어쓰는 행동 오버레이로, `[subagents.personas]`나 `.grok/personas/*.toml`에 둔다 — [docs.x.ai Subagents](https://docs.x.ai/build/features/subagents)
- [1차, 검색 스니펫] 서브에이전트를 별도 git worktree에서 띄우면 병렬 에이전트끼리 서로의 파일을 덮어쓸 수 없다. `grok worktree list/show/rm/gc` 명령군이 있다 — [docs.x.ai Worktrees](https://docs.x.ai/build/features/worktrees); [docs.x.ai CLI Reference](https://docs.x.ai/build/cli/reference)
- [2차] 동시 서브에이전트는 최대 8개이고 각자 worktree·브랜치에서 돌며 마지막에 오케스트레이터가 조정한다는 주장, Arena Mode가 경쟁 출력을 채점·순위화한 뒤 개발자에게 넘긴다는 주장, 5/14 SuperGrok Heavy 대상 베타, Grok 4.3 beta 모델, 컨텍스트 256K(API)와 2M(CLI)이 서로 어긋나는 기술 — [DevOps.com](https://devops.com/xai-enters-the-coding-agent-race-with-grok-build/); [Pasquale Pillitteri](https://pasqualepillitteri.it/en/news/2584/grok-build-xai-cli-2026); [BuildFastWithAI](https://www.buildfastwithai.com/blogs/grok-build-xai-cli-ai-agents-2026); [DevOps.com (API 0.1)](https://devops.com/xai-opens-grok-build-0-1-to-developers-via-api/). 내가 읽은 x.ai 공식 페이지와 docs.x.ai에는 동시 실행 상한도 "arena"도 나오지 않았다 — [x.ai](https://x.ai/news/grok-build-cli); [docs.x.ai Subagents](https://docs.x.ai/build/features/subagents)
- [2차, 단일 출처] 로컬 우선·에어갭 지원 주장은 한 블로그에만 있다 — [noqta](https://noqta.tn/en/blog/xai-grok-build-coding-agent-launch-2026)

#### Agent Dashboard (Grok Build, 2026-06-15)
- [1차] 여러 Grok Build 세션을 한 화면에서 관리한다. 입력을 기다리는 세션이 맨 위로 정렬되고, `Ctrl+S`로 작업 디렉토리별로 묶을 수 있다. 서브에이전트는 자기를 띄운 세션 밑에 묶여 표시된다 — [x.ai Agent Dashboard](https://x.ai/news/agent-dashboard)
- [1차] 행을 선택하면 대시보드를 떠나지 않고 최신 출력을 엿보고(peek) 그 자리에서 답할 수 있다. 세션을 열면 전체 대화를 넘겨받고, 목록으로 돌아가지 않은 채 다음/이전 세션으로 넘어갈 수 있다. `Shift+Enter`는 새 세션을 디스패치하면서 바로 연다. 셸에서는 `grok dashboard`, 세션 안에서는 `/dashboard`(`Ctrl+\`)로 진입한다 — [x.ai Agent Dashboard](https://x.ai/news/agent-dashboard)
- [1차] 상태는 Working/Idle/Awaiting 세 가지로 표시되고 헤더에 상태별 개수가 나온다. 각 행에는 "Running: cargo test --workspace" 같은 현재 활동과 경과 시간이 붙는다. 승인 요청과 질문의 선택지는 행 안에 바로 표시된다 — [x.ai Agent Dashboard](https://x.ai/news/agent-dashboard)

#### Grok Bot (2026-08-11 early beta)
- [2차] 채팅창이 아니라 클라우드 컴퓨터에서 이름 붙은 에이전트들이 동작한다. 대상은 SuperGrok Heavy, Cursor Ultra, Cursor Teams Premium 구독자이고 데스크톱과 iOS에서 쓸 수 있다. Cursor 기술이 에이전트의 컴퓨터 환경을 구동한다 — [VKTR](https://www.vktr.com/collaboration-productivity/xai-launches-grok-bot-ai-agents-in-beta/); [Composio](https://composio.dev/blog/guide-to-frok-bot)
- [2차] 계정마다 영속 클라우드 VM이 하나씩 있고(브라우저, 파일시스템, 터미널, 외부 커넥터, MCP 도구), 계정 안의 봇들이 로그인과 파일을 공유한다. Routines는 cron처럼 시간이나 이벤트(새 Slack 메시지, 새 Git 커밋)로 에이전트를 깨운다. 여러 봇을 동시에 돌리면 그룹챗에서 서로 조율한다 — [Composio](https://composio.dev/blog/guide-to-frok-bot); [Unite.AI](https://www.unite.ai/?p=451040); [VKTR](https://www.vktr.com/collaboration-productivity/xai-launches-grok-bot-ai-agents-in-beta/)
- [2차] 에이전트마다 맞춤 클라우드 머신을 준다는 튜토리얼 설명 — [Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/09/grok-bot-automation-tutorial/)
- [2차] 2026-10-03 패치노트: SuperGrok Plus까지 확대됐고, 봇이 Cursor Project에 메시지를 보낼 수 있다 — [PatchBot](https://patchbot.io/games/grok/articles/1779-bot-on-grokcom-october-3-2026)
- Linux 지원 여부는 출처마다 다르다 — [Unite.AI](https://www.unite.ai/?p=451040); [Composio](https://composio.dev/blog/guide-to-frok-bot)

#### 모델 차원의 멀티 에이전트
- [1차, 2025-07-09 구자료] Grok 4 Heavy는 병렬 test-time compute로 여러 가설을 동시에 검토한다. 페이지 목업에 Agent 1/2/3이 병렬로 표시된다. 결과를 어떻게 비교·합성하는지는 적혀 있지 않고, 흔히 인용되는 "study group" 표현도 이 페이지에는 없다 — [x.ai Grok 4](https://x.ai/news/grok-4)
- [2차] Grok 4.20(2026-02 베타)은 4개 에이전트가 병렬로 일한다. Grok은 조정자로서 질문을 쪼개 할당하고 이견을 정리해 최종 답을 합성한다. Harper는 리서치·팩트체크, Benjamin은 논리·수학·코드, Lucas는 창의적·반대 의견을 맡는다 — [NextBigFuture](https://www.nextbigfuture.com/2026/02/how-the-xai-grok-4-20-agents-work.html); [BuildFastWithAI](https://www.buildfastwithai.com/blogs/grok-4-20-beta-explained-2026); [eWeek](https://www.eweek.com/fr/news/grok-4-20-multi-agent-ai-debate-architecture/)
- [2차, 상충] "Grok 4.20 Heavy는 16개 에이전트"라는 주장은 Verdent 한 곳에만 있고, Verdent 스스로 xAI가 에이전트를 정의한 공식 기술 사양을 내지 않았다고 밝힌다 — [Verdent](https://www.verdent.ai/ar/guides/grok-4-20-multi-agent-system). 다른 출처는 Heavy도 같은 4개 에이전트로 설명한다 — [Basenor](https://www.basenor.com/blogs/news/grok-4-20-heavy-is-here-what-tesla-owners-need-to-know)

#### Macrohard / Digital Optimus (구상 단계)
- [2차] 2026-03 머스크가 xAI–Tesla 공동 프로젝트를 발표했다. Grok이 디지털 Optimus 에이전트를 지휘하는 "마스터 컨덕터/내비게이터" 역할을 맡고, 원리상 회사 전체의 기능을 에뮬레이트할 수 있다고 했다. 하드웨어는 Tesla AI4 칩과 xAI의 Nvidia 서버다 — [Invezz](https://invezz.com/au/news/2026/03/11/musk-unveils-tesla-xai-project-macrohard-to-emulate-software-companies/)
- [2차] 코딩과 콘텐츠 생성을 맡는 특화 에이전트 수백 개를 목표로 한다 — [CO/AI](https://getcoai.com/?p=80742). 첫 타깃으로는 고객센터(BPO) 업무가 거론되지만 레거시 시스템 때문에 아직 이르다는 평가가 있다 — [CX Foundation](https://cxfoundation.com/news/elon-musk-eyeballs-customer-service-outsourcing). 2026년 데모·출시를 "예상"으로만 다루는 추측성 기사도 있다 — [Tesla Mag](https://www.tesla-mag.com/2026-lannee-ou-macrohard-delon-musk-pourrait-redefinir-le-logiciel/)

#### Cursor (2026-08부터 SpaceX 자회사, 아래 내용은 모두 인수 전에 발표)
- [1차, 2026-01-14] Wilson Lin, "Scaling long-running autonomous coding". 한 프로젝트에 수백 개 에이전트를 동시에 돌렸다. 역할은 세 가지다. Planner는 코드베이스를 계속 탐색하며 태스크를 만들고 영역별 하위 planner를 띄운다. Worker는 태스크만 수행하고 다른 worker와 조율하지 않는다. Judge는 사이클이 끝날 때마다 계속할지 정하며, 다음 반복은 새로 시작한다. 실패한 시도도 적었다. 락 방식에서는 에이전트 20개가 2~3개 수준의 처리량으로 떨어졌고, 위계 없는 평면 조율에서는 에이전트들이 어려운 일을 피했고, 별도 integrator 역할은 오히려 병목이 됐다. 모델은 역할별로 골랐다(GPT-5.2가 장시간 자율 작업과 planner 역할에 낫고, Opus 4.5는 일찍 멈추고 지름길을 택하는 경향). 표류를 막으려면 주기적으로 새로 시작해야 하고, 하네스나 모델보다 프롬프트가 더 중요했다고 한다. 결과물은 브라우저 100만+ LOC(약 1주), Cursor 코드베이스의 Solid→React 마이그레이션 +266K/-193K(3주 이상)다 — [Cursor Blog](https://cursor.com/blog/scaling-agents)
- [1차, 2026-04-02] Cursor 3에서 Agents Window가 주 인터페이스가 됐다. 로컬, worktree, 원격 SSH, 클라우드에 걸쳐 여러 에이전트를 병렬로 돌린다 — [Cursor Changelog 3.0](https://cursor.com/changelog/3-0)
- [2차] 데스크톱·모바일·웹·Slack·GitHub·Linear에서 시작한 에이전트가 모두 한 사이드바에 모인다. 채팅은 탭으로 묶거나 나란히, 또는 그리드로 배치한다. 세션을 로컬과 클라우드 사이에서 옮길 수 있다 — [The Decoder](https://the-decoder.com/new-cursor-3-ditches-the-classic-ide-layout-for-an-agent-first-interface-built-around-parallel-ai-fleets/). 2차 출처에는 메시지 앞에 `&`를 붙이면 로컬 대화가 클라우드 VM으로 넘어간다는 설명과, `/best-of-n`으로 한 작업을 여러 모델에 보낸다는 설명도 있다 — [DataCamp](https://www.datacamp.com/blog/cursor-3); [noqta](https://www.noqta.tn/blog/cursor-3-agents-window-parallel-ai-coding-2026)
- [회사 자체 지표] Bugbot은 월 200만 건 이상의 PR을 분석하고 해결률이 70%를 넘는다고 한다 — [NeverCodeAlone](https://nevercodealone.de/glossare/ki-tools-2026/cursor-bugbot-ki-debugging-vibe-coding)
- [제3자 요약, 미검증] 클라우드 에이전트가 25~52시간 이상 자율 실행하고 Cursor 머지 PR의 30% 이상을 만든다는 수치 — [noqta](https://noqta.tn/en/news/cursor-cloud-agents-autonomous-coding-2026)

### Inferences
- xAI의 공식 UX는 두 층으로 나뉜다. 사람이 다루는 단위는 세션이고, 서브에이전트는 세션 아래에 묶여 요약만 돌려주는 자식이다. 사람이 특정 에이전트와 직접 대화하는 공식 경로는 Agent Dashboard의 peek→reply와 take over다. 사용자가 원하는 "에이전트 하나를 꺼내 직접 협업하기"에 가장 가까운 공개 사례가 이것이다.
- Grok Build의 headless `-p`와 ACP 지원은 외부 오케스트레이터가 Grok Build 세션을 하나의 에이전트로 부릴 수 있다는 뜻이다(문서상 가능성에서 끌어낸 추론).
- Grok Bot은 로컬 터미널이 아니라 "계정별 클라우드 VM + 그룹챗 + 이벤트 트리거" 모델이다. 사람이 각 봇을 채팅 상대처럼 대하는 구조로 보이지만, 그룹챗에서 특정 봇을 지목하는 방식은 확인하지 못했다.
- "8 서브에이전트"와 "Arena Mode"는 공식 확인이 안 되므로 설계 근거로 쓰면 안 된다. pstack에도 같은 이름의 `arena` 스킬이 있어 2차 매체가 섞어 썼을 가능성이 있다(추측).

### Gaps
- Grok Build에 대해 공식 문서로 확인하지 못한 것: 동시 서브에이전트 상한, 서브에이전트에 직접 붙어 대화하거나 별도 터미널로 여는 기능, Windows 지원(설치 안내는 curl뿐).
- Grok Bot의 x.ai 공식 발표문 원문을 확보하지 못해 2차 출처로만 서술했다.
- Grok 4.20의 공식 아키텍처 문서는 없다.

## A3. SpaceX/xAI(및 Cursor) 엔지니어가 공개한 일상 워크플로, 머스크 "알고리즘" 적용 여부

### Takeaway
본인이 자세히 공개한 워크플로는 사실상 두 건이다. Lauren Tan(@poteto, 현 SpaceXAI Grok Bot, B2 참조)의 사례와 Cursor 연구 포스트(Wilson Lin)다. 나머지 증거는 얇다. xAI 엔지니어 Sulaiman Ghori의 팟캐스트(엔지니어 1명이 AI 에이전트 약 20개와 함께 프로젝트를 이끈 사례), Tony Wu의 사내 메일(직원들이 Cursor로 Claude를 쓰다 차단됨), 머스크의 조직 관련 발언 정도다. 머스크의 5단계 "알고리즘"을 에이전트 워크플로에 적용했다는 문서는 찾지 못했다.

### Cited Findings
- [2차, 2026-01] Sulaiman Ghori(Relentless 팟캐스트)의 발언. Macrohard 팀에서 사람의 컴퓨터 사용(화면 보기, 키보드·마우스 조작, 판단)을 복제하는 "human emulator"를 만들고 있다. 동시에 최대 100만 개를 돌리는 것이 목표이고, 북미 Tesla 400만 대가 70~80% 시간 동안 노는 컴퓨트를 쓰는 방안을 검토한다. 에이전트를 직원처럼 다루며, 엔지니어 1명이 AI 에이전트 약 20개와 함께 프로젝트를 이끈 사례가 있다. 다만 지금도 많은 작업은 손이 가고 맞춤형이라고 했다 — [AOL/Business Insider](https://www.aol.com/articles/10-quotes-xai-elon-musk-090001302.html); [NextBigFuture](https://www.nextbigfuture.com/2026/01/inside-xai-and-future-of-millions-of-emulated-humans.html); [Let's Data Science](https://letsdatascience.com/news/xai-engineer-reveals-internal-operations-and-plans-b40aa850)
- 그는 방송 4일 뒤 xAI를 떠났다. xAI, 머스크, Ghori 모두 인터뷰와의 관련성을 언급하지 않았다. 검증되지 않은 단일 인터뷰라는 지적도 있다 — [Unwire.hk](https://unwire.hk/2026/01/21/xai-engineer-ghori-podcast-departure/ai/); [hyper.ai](https://hyper.ai/en/stories/91a1eb00c4f765103b7308c118345503)
- [2차, 2026-01] xAI 공동창업자 Tony Wu의 사내 메일. Cursor를 통한 Claude 사용이 막혔고, Cursor는 이를 Anthropic이 주요 경쟁사 전반에 적용하는 정책이라고 설명했다. Wu는 생산성 타격을 인정하면서도 자체 코딩 제품과 모델을 만들 계기라고 했다 — [The Rundown](https://www.therundown.ai/p/anthropic-pulls-plug-on-xais-claude-access); [Storyboard18](https://www.storyboard18.com/digital/anthropic-blocks-xai-from-using-claude-deepening-rivalry-in-the-ai-race-87447.htm); [UC Strategies](https://ucstrategies.com/news/anthropic-blocks-xai-from-using-claude-models-escalating-the-ai-rivalry/)
- [2차, 2026-03] 머스크가 xAI 코딩 툴이 Claude Code·Codex와 경쟁하지 못한다고 불만을 표한 뒤 공동창업자 Zihang Dai와 Guodong Zhang이 떠났다. 머스크는 xAI가 처음에 제대로 만들어지지 않아 기초부터 다시 짓고 있다고 했다 — [T2 Online](https://t2online.in/tech/tech-news/xai-loses-two-more-co-founders-as-elon-musk-restructures-ai-start-up/2003581)
- [2차, 2026-08] 대만 TechNews 헤드라인: 3월에 재건을 선언한 xAI가 4개월 만에 거의 재건됐다(Cursor 관련 기사) — [TechNews](https://technews.tw/2026/08/07/cursor-xai/)
- [2차, 2026-06] 머스크가 Starlink·Starship 엔지니어 수십 명과 Cursor 인력을 Grok 개발에 재배치했다. 기사에는 이 엔지니어들이 쓰는 AI 도구나 워크플로에 대한 설명이 없다 — [Let's Data Science](https://letsdatascience.com/news/elon-musk-deploys-spacex-engineers-to-grok-development-adf1c236)
- [2026-09-21] SpaceXAI 소속(전 Cursor) Lauren Tan이 "지난달 PR 2,500개" 토크를 공개했다(상세는 B2) — [AICoder](https://aicoder.com/news/news-20260921-poteto-cursor-compile-2500-prs)
- 머스크 "알고리즘"으로 검색해 나온 것은 AI가 프롬프트에서 바로 최적화된 바이너리를 만들 것이라는 예측과 Grok Build 출시 보도뿐이었다. 5단계 알고리즘을 에이전트 워크플로에 적용한 기록은 없었다 — [Yellow](https://yellow.com/news/musk-coding-dies-2026-binary); [iProUP](https://www.iproup.com/empleo/70002-elon-musk-revela-cuando-la-ia-reemplazara-definitivamente-a-los-programadores.amp); [Bloomberg](https://bloomberg.com/news/articles/2026-05-14/musk-s-xai-unveils-first-coding-agent-in-bid-to-rival-anthropic)

### Inferences
- 2026년 1분기까지 xAI 엔지니어의 실제 일상 도구는 Cursor + Claude였다(차단 메일이 그 방증이다). 이후 Grok Build(5월), Cursor 인수(6~8월), Grok Bot(8월)으로 자체 스택으로 옮겨 갔다. 그러니 지금 "SpaceX 엔지니어의 방식"을 대표할 공개 사례는 SpaceXAI로 들어온 Cursor 출신 엔지니어(대표적으로 Lauren Tan)의 방식이다.
- pstack의 `subtract-before-you-add` 원칙은 머스크 알고리즘의 "삭제" 단계와 비슷해 보인다. 하지만 둘의 연관성을 보여주는 문서는 없다(추측).

### Gaps
- SpaceX(로켓·Starlink) 엔지니어가 직접 쓴 멀티 에이전트 워크플로 게시물이나 발표는 찾지 못했다.
- xAI 엔지니어링 블로그 형식의 내부 사용기(Grok Build를 사내에서 쓰는 이야기)는 발견하지 못했다.
- Ghori 팟캐스트 원본은 듣지 못했고 2차 요약에 의존했다.

## B1. "로렌탄"은 누구인가: 후보 순위

### Takeaway
1순위는 거의 확실하게 Lauren Tan(@poteto)이다. 이름이 "로렌 탄"으로 정확히 음차되고, 2026년 9~10월 "한 달 PR 2,500개" 토크로 화제가 됐으며(팔로워 31K→198K, 머스크가 반복해서 리포스트), SpaceX의 Cursor 인수 이후 현재 SpaceXAI에서 Grok Bot을 만드는 엔지니어다. 사용자가 "로렌탄"과 "SpaceX"를 나란히 언급한 맥락과도 맞아떨어진다. 2순위는 Mads Lorentzen(ai-job-search, 직전 대화 맥락), 3순위는 Garry Tan(gstack, "탄"이 일치하고 사용자 환경에 gstack이 설치돼 있음)이다.

### Cited Findings
- Lauren Tan(@poteto): Meta에서 React Compiler를 맡았고, 그 전에는 Netflix에서 테크리드·엔지니어링 매니저였다. 이후 Cursor 엔지니어로 소개됐다 — [YouTube](https://www.youtube.com/watch?v=Zc07HI9Ppxk). React Compiler v1.0 글(2025-10-07)의 공동 저자다 — [react.dev](https://de.react.dev/blog/2025/10/07/react-compiler-1)
- Meta에서 약 6년 일한 뒤 2026년 3월 중순 퇴사했고(2026-04-07 LinkedIn 게시물), 2026년 4월 Cursor에 합류했다(이력서). Cursor와 SpaceXAI가 합쳐진 뒤 직함은 "Grok Bot at SpaceXAI"이고, React Compiler 코어팀도 함께 적혀 있다 — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- AICoder는 그녀를 "SpaceXAI engineer and ex-Cursor"로 소개한다 — [AICoder](https://aicoder.com/news/news-20260921-poteto-cursor-compile-2500-prs). 중국어권 X 게시물은 전 Cursor 핵심 엔지니어이자 현 xAI 소프트웨어 엔지니어로, 그녀의 설정이 Cursor 공식 플러그인 poteto-mode로 공개됐다고 소개한다 — [AYi on X](https://x.com/AYi_AInotes/status/2107850793730621518)
- Matt Van Horn의 X 아티클 제목은 그녀를 Grok Bot의 설계자이자 일론이 계속 리포스트하는 엔지니어로 부른다. 본문 요지는 10주 만에 팔로워가 31K에서 198K로 늘었고 Cursor 재직은 7개월이 안 된다는 것이다 — [Matt Van Horn on X](https://x.com/mvanhorn/status/2111481583668797694); [X Article](https://x.com/i/article/2111481455906103390)
- "SpaceXAI에서 Grok Bot을 만드는 엔지니어 중 한 명"이라는 소개 — [unicode on X](https://x.com/unicodef1wn/status/2102081277683810491)
- Grok Bot의 원래 영감은 그녀가 Cursor 버그 리포트를 자는 동안 자동으로 고치게 만든 사내 Slack 봇 "Benny"였다 — [MTS on X](https://x.com/MTSlive/status/2087698441568973129)
- 예전 React 팀 페이지는 아직 "Engineer at Meta"로 표기돼 있다(갱신되지 않은 페이지) — [react.dev Team](https://18.react.dev/community/team)
- Mads Lorentzen: 지구물리학자. 2025년 말 일자리를 잃고 자기 구직용으로 ai-job-search를 만들었고, 2026-06 AI 엔지니어로 취업했다 — [GitHub](https://github.com/MadsLorentzen/ai-job-search). 2026-10 GitHub Trending에 올랐다 — [AI Toolly](https://aitoolly.com/ai-news/article/2026-10-19-madslorentzen-launches-ai-job-search-a-local-ai-job-application-framework-built-on-claude-code)
- Garry Tan: Claude Code 스킬팩 gstack의 제작자. Conductor로 Claude Code 세션 10~15개를 병렬로 돌린다 — [StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/garry-tan-on-building-with-ai-agents)

### Inferences
- 음차로 보면 Lauren은 "로렌", Tan은 "탄"이므로 "로렌탄"은 Lauren Tan과 정확히 맞는다. Lorentzen은 보통 "로렌첸", Garry Tan은 "개리 탄"으로 적으니 이름 일치도가 낮다.
- 한국어 웹 검색("로렌탄 에이전트 클로드 코드")에서는 이 표기를 쓴 결과가 하나도 없었다. 국내에 자리 잡은 표기가 아니라 사용자가 영문 이름을 직접 음차했을 가능성이 크다.
- 사용자가 "로렌탄"과 "SpaceX"를 나란히 적은 것은 Lauren Tan이 현재 SpaceXAI 소속이라는 사실과 들어맞는다.
- (확인됨) 사용자 PC에 Lauren Tan의 pstack v0.15.32가 설치돼 있다(`C:\Users\chewo\.claude\plugins\cache\cursor-plugins\pstack\0.15.32`, B4 참조). 리서치 도중 세션 스킬 목록에 `pstack:setup-pstack`이 나타난 것도 이 때문이며, 1순위 판단을 강하게 뒷받침한다.
- Mads Lorentzen은 직전 대화에서 다룬 레포의 저자라 혼동했을 수는 있다. 하지만 OpenAI·Anthropic 엔지니어와 나란히 "실무자 작업 방식" 연구 대상으로 꼽기에는 결이 다르다.

### Gaps
- 사용자에게 직접 확인한 것은 아니므로 확정은 아니다.
- Lauren Tan의 Cursor 합류일은 출처마다 다르다(검색 요약상 3월 24일 주 vs 이력서상 4월).

## B2. Lauren Tan(@poteto)의 멀티 에이전트/하네스 워크플로

### Takeaway
핵심 명제는 "신뢰(검증)가 먼저이고 병렬은 그다음"이다. 에이전트가 자기 작업을 검증하지 못하면 결국 사람이 검증 병목이 된다. 그래서 그녀는 앱을 실제로 띄우고 trace를 뜨는 verification skill을 인프라로 먼저 만들고, 그 위에서 병렬화한다. 병렬화 구조(pstack/poteto-mode)에서는 리드 채팅 하나가 playbook, todo, 모든 서브에이전트 생성을 소유한다. 그 밖의 요소는 다음과 같다. 역할별 모델 매핑(코드는 Grok, 가장 어려운 변경·글·판단은 Opus 5.5, 리뷰 패널은 모델 계열을 섞음), arena·swarm·interrogate 패턴, 되돌릴 수 없는 작업에만 거는 승인 게이트, worktree에서 작은 커밋 스택을 쌓아 PR로 올리는 흐름, 그리고 Grok Bot 커넥터와 Routines로 Slack·Sentry 이벤트가 클라우드 에이전트를 깨우는 구조다.

### Cited Findings
#### 토크와 수치
- 토크는 2026-09-21 X에 공개됐다. 원래 Cursor Compile London에서 할 예정이었으나 Grok Bot Galaxy 라이브스트리밍 때문에 불참했고, 대신 X에 무료로 올렸다. 길이는 약 38분이다 — [AICoder](https://aicoder.com/news/news-20260921-poteto-cursor-compile-2500-prs); [Redreamality 토크 분석](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- 게시물 제목은 지난달 프로덕션에 PR 2,500개를 냈다는 내용이고(약 150만 뷰), 토크 본문에서는 약 2,000개를 머지했다고 말한다. 숫자 자체가 목표였던 적은 없다고 했다 — [Selfaligned](https://www.selfaligned.me/newsletter/how-poteto-ships-2500-prs/); [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- 2026-10-02 Matt Pocock과 확장 Q&A를 했다(유튜브 제목은 "월 수천 PR") — [poteto on X](https://x.com/poteto/status/2106893179605876927); [Selfaligned](https://www.selfaligned.me/newsletter/how-poteto-ships-2500-prs/)
- The New Stack 헤드라인: 한 엔지니어가 월 2,000개 PR을 프로덕션에 냈고 핵심은 검증이다 — [The New Stack](https://thenewstack.io/agentic-verification-distributed-systems/)
- 제3자 요약에 따른 핵심 주장: 에이전트가 자기 작업을 검증할 수 없다면 검증 시스템은 여전히 사람이다 — [unicode on X](https://x.com/unicodef1wn/status/2102081277683810491)

#### 역할 분할과 병렬 수
- 토크에는 지금 몇 개를 병렬로 돌리는지 나오지 않는다. 초기에는 대화 1~5개만 감독했다. 신뢰 없이 서브에이전트나 클라우드 에이전트를 100개씩 열면 쓰레기 PR 더미만 나온다고 경고했다 — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- [1차] pstack에서는 리드 채팅이 playbook, todo 리스트, 모든 서브에이전트 생성을 소유한다. 위임은 `poteto-agent` 래퍼로 하며, `generalPurpose`로 바꾸면 표류한다고 경고한다. `comment-sicko`는 코멘트만 보는 읽기 전용 리뷰어다 — [GitHub cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack)
- `arena`: 같은 과제를 N개가 병렬로 시도한다. 읽기 전용 judge(가능하면 다른 모델 계열)가 루브릭으로 채점하고, 리드가 베이스를 고른 뒤 다른 시도의 장점을 이식(graft)하고 검증한다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/); [GitHub](https://github.com/cursor/plugins/tree/main/pstack)
- `swarm`: 일을 독립된 조각으로 나누거나 여러 경로를 경쟁시킨다. 각 worker가 PASS/ISSUES/BLOCKED로 보고하면 하나의 리포트로 모은다. 베이스 선택이나 이식은 하지 않는다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/); [GitHub](https://github.com/cursor/plugins/tree/main/pstack)
- `interrogate`: 같은 diff·의도·루브릭을 서로 다른 모델 계열이 각자 리뷰한다(엄격한 코드 품질 관점 포함). 리드는 결과를 act on/consider/noted/dismissed로 분류하고 코드를 자동으로 고치지 않는다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/); [GitHub](https://github.com/cursor/plugins/tree/main/pstack)
- N은 사용자가 정하고 고정 상한은 없다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack). arena는 기본 2개를 돌리지만 저자 본인 규칙은 4개이고, 패널 역할 하나가 서브에이전트 4개를 띄운다 — [Flavio Copes](https://flaviocopes.com/poteto-mode/)
- 서브에이전트는 이전 세션을 이어받지 않고 매번 새로 시작하며, 원래 브리프와 그 뒤의 모든 지시를 함께 받는다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/)
- [1차] 역할별 모델: 코드 위임(feature, refactor, bugfix, perf, hillclimb)은 Grok, 가장 어려운 변경·글·판단은 Opus 5.5, 기본 리뷰 패널은 Opus 5.5와 Grok이다. `/setup-pstack`이 역할별 모델 매핑을 규칙 파일로 기록한다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack). 기록 위치는 `~/.cursor/rules/pstack-models.mdc`이고 기본값은 Grok 4.7 xhigh-fast / Claude Opus 5.5 xhigh — [Flavio Copes](https://flaviocopes.com/poteto-mode/)

#### 사람이 특정 에이전트를 조종하는 방식
- `/poteto-mode`는 처음 한 번 호출하면 계속 켜져 있다. "continue"라고 하면 같은 playbook을 이어가고, "new task"라고 하면 playbook을 다시 고르며, 모드를 끄는 것도 말로 지시한다. 프롬프트에 끝나는 조건을 적고, 스킬을 손으로 나열하지 말라고 권한다 — [Flavio Copes](https://flaviocopes.com/poteto-mode/)
- [1차] 되돌릴 수 있는 작업은 묻지 않고 진행한다. 되돌릴 수 없는 작업(공유 브랜치 force-push, 배포, 데이터 삭제, 고객 메시지)만 승인을 기다린다. 원칙 스킬 `never-block-on-the-human`이 있고, 기본 태도는 일단 진행해 결과를 보여주고 사람이 나중에 바로잡게 하는 것이다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack); [Flavio Copes](https://flaviocopes.com/poteto-mode/)
- 토크 내용: 초기에는 모든 채팅을 계속 바로잡아야 했다. 이후에는 Grok Bot 커넥터(Slack, Datadog, Sentry, PlanetScale)가 Routines를 통해 클라우드 에이전트를 깨운다(Slack 스레드, Sentry 알림 등). Cursor automations와 TypeScript SDK도 언급됐다 — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- Benny(Cursor 버그 리포트를 자동 수정하던 Slack 봇)가 Grok Bot의 영감이 됐다 — [MTS on X](https://x.com/MTSlive/status/2087698441568973129). pstack에는 지금은 꺼져 있는 "benny" 자동화 팩(Slack 버그 리포트 분류, Cursor 전용)이 들어 있다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack)
- [1차] 장시간 실행용 playbook도 있다. `autonomous-run`은 긴 작업을 멈추지 않고 끝까지 몰고 간다. `orchestrate`는 여러 날, 여러 스택 PR에 걸친 상시 프로젝트를 코디네이터 채팅 하나에 맡긴다. `/poteto-mode`를 Cursor `/loop`와 함께 쓰면 수 시간 동안 돌릴 수 있다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack)

#### 리뷰·검증 루프
- 교정은 층을 쌓는 방식이다. 아키텍처, lint/컴파일러/CI, rules/Bugbot/skills, 스타일 가이드와 사람 리뷰 순이고, verification skill이 다섯 번째 층이다 — [Redreamality 토크 분석](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- 내부 verification skill "Control Glass"는 재현 가능한 CLI와 스킬 디렉토리 안의 "feature map"으로 이뤄지고, Chrome DevTools Protocol로 trace와 heap snapshot을 수집한다(공개 문서 없음) — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- "Dune"은 Grok Bot 코드베이스용 클라이언트 프레임워크다. 주석을 금지하고 Electron main/renderer 간 import 경계를 강제한다. 에이전트는 지름길을 좋아하니 지름길이 곧 올바른 길이 되게 만들라는 원칙과 이어진다 — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)
- [1차] 검증 원칙: `prove-it-works`(프록시, 자기보고, "컴파일됨"이 아니라 실제 산출물로 검증), `explain-the-number`(측정값을 보고하기 전에 무엇이 그 값을 제한하는지 확인), `tdd`, `sequence-verifiable-units` — [GitHub](https://github.com/cursor/plugins/tree/main/pstack)
- `create-verification-skill`은 feature map을 만들고, 생성된 스킬이 넘기기 전에 스스로 테스트한다. `maintain-verification-skill`은 스케줄 자동화로 돌리기를 권한다. 검증은 브라우저(CDP), PTY, HTTP로 앱을 직접 구동해서 한다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/)
- 리드는 서브에이전트의 diff를 직접 리뷰하고, 서브에이전트의 주장을 그대로 옮기지 않고 자기 요약을 쓴다. 버그는 재현부터 하고, 수정 뒤 같은 재현이 통과해야 한다. "판단 불가"는 통과로 치지 않고, 실패 출력과 통과 출력을 함께 보여준다. 모든 주장에 measured/inferred/guessed 라벨을 붙인다 — [Flavio Copes](https://flaviocopes.com/poteto-mode/)
- `show-me-your-work`는 긴 실행 동안의 결정을 TSV 파일에 기록한다 — [Flavio Copes](https://flaviocopes.com/poteto-mode/)

#### 도구와 화면
- Cursor 플러그인으로 배포된다(`/add-plugin pstack`). 위치는 GitHub `cursor/plugins/tree/main/pstack`, 라이선스 MIT, 2026-10-08 기준 v0.15.15(사용자 로컬 설치본은 v0.15.32, B4 참조)이고, 본인 말로는 2026-05에 오픈소스로 공개했다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/); [Cursor Marketplace](https://cursor.com/marketplace/cursor/pstack). README에는 Cursor와 Claude Code용 스킬 세트라고 적혀 있다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack)
- 스킬은 51개다. 진입·설정 4, 작업 수행 7(architect, figure-it-out, arena, swarm, tdd, show-me-your-work, make-bot-ui), 검증·교정 8, 코드 이해 5, 글쓰기 3, 원칙 24개이고, playbook은 23개(bug fix, perf, feature, babysit, 밤샘 자율 실행 등)다 — [Redreamality pstack 가이드](https://redreamality.com/garden/notes/pstack-skills-guide/)
- [1차] main에서 분기한 worktree, 작은 커밋, Conventional Commits 제목을 쓴다. `shipping`은 green 스택을 아래부터 머지하고, `autopilot-stack`은 운영자가 리뷰하고 머지할 선형 스택을 만들고, `autopilot-full`은 PR마다 담당자 하나를 두고 머지까지 간다. `worktree-cleanup`에는 안전 게이트가 있다 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack). PR은 draft가 아니라 리뷰 준비 상태로 연다(내장 PR 도구, `gh`, Cursor Origin CLI) — [Flavio Copes](https://flaviocopes.com/poteto-mode/)
- 별도 플러그인 `cursor-team-kit`의 `control-cli`·`control-ui`로 터미널, TUI, 브라우저, Electron 앱을 조작한다. 대시보드 언급은 없다 — [Flavio Copes](https://flaviocopes.com/poteto-mode/)
- 커뮤니티 포트로는 pstack-claude(Michael Denyer)와 claude·codex·pi용 backnotprop/pstack이 있다 — [Flavio Copes](https://flaviocopes.com/poteto-mode/); [GitHub backnotprop/pstack](https://github.com/backnotprop/pstack). 어느 포트에서는 `poteto-mode`가 `start-work`로 이름이 바뀌었고, `agents/*.md`로 서브에이전트 역할을, `role-models.json`으로 역할별 모델을 정의한다 — [Selfaligned](https://www.selfaligned.me/newsletter/how-poteto-ships-2500-prs/)
- [자기보고] pstack이 일주일에 약 1만 회 쓰였다는 수치와 LinkedIn에 올린 성능 수치(상호작용 2.5배 빠름, 로드 12% 빠름, CI 50% 이상 빠름) — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/)

### Inferences
- 그녀의 구조에서 사용자는 리드 채팅 하나와만 대화하고, 서브에이전트는 매번 새로 띄우는 일회성 작업자다. 서브에이전트와 직접 대화하는 대신, 브리프와 후속 지시 전체를 다시 넘겨 새로 띄운다. 사용자가 원하는 "특정 에이전트 팝아웃"과는 철학이 다르다. 그녀의 방식으로 팝아웃을 풀면 "그 에이전트를 새 리드 채팅으로 승격하고 브리프와 지시 이력을 다시 주입하는 것"에 가깝다.
- 병렬 개수보다 검증 인프라가 먼저라는 주장은 사용자가 겪는 "최종 synthesis만 읽을 수 있다" 문제와 바로 닿아 있다. 그녀의 해법은 각 산출물에 증거와 measured/inferred/guessed 라벨을 강제하고, 리드가 diff를 직접 리뷰하는 것이다.
- 다른 모델 계열끼리 교차 리뷰하는 방식(interrogate, arena judge)은 사용자의 Claude Code + Codex CLI 조합에 그대로 옮겨 쓸 수 있다.
- Dune이 Electron 경계를 강제한다는 점으로 보아 Grok Bot 데스크톱 클라이언트는 Electron 기반일 가능성이 있다(추론).

### Gaps
- 토크 영상과 Pocock Q&A 원본을 보지 못했다(X 콘텐츠 접근 불가). 그녀가 개인적으로 동시에 몇 개를 돌리고 화면(터미널·창·대시보드)을 어떻게 배치하는지는 여전히 모른다. 하네스 차원의 수치는 로컬 1차 출처로 일부 확인됐다(B4: orchestrate의 rolling window 약 10개와 중첩 깊이 3, 패널 기본 2개, 노트북은 worktree 몇 개, 상태 확인은 `orch` CLI·status.md·ledger와 Cursor 대시보드).
- Control Glass와 Dune은 비공개다.
- PR 수치가 2,500, 2,000, "수천"으로 서로 다르고, PR 크기나 사람 리뷰 여부에 대한 분해가 없다.
- Windows: 로컬 pstack에도 Cursor Custom Mode 단축키(Alt+Enter) 말고는 Windows 관련 내용이 없다(B4).
- (해소) `orchestrate` playbook은 로컬 설치본에 실제로 있다(`C:\Users\chewo\.claude\plugins\cache\cursor-plugins\pstack\0.15.32\skills\poteto-mode\playbooks\orchestrate.md`). redreamality 가이드가 찾지 못했을 뿐이다.

## B3. 차순위 후보의 워크플로 (참고)

### Takeaway
Mads Lorentzen의 ai-job-search는 drafter가 쓰고 fresh context의 reviewer가 한 번 비평하고 고치는 구조에, LaTeX 컴파일 검사 루프, 병렬 `/rank` 에이전트, 사람 승인 게이트를 더한 순차 파이프라인이다. Garry Tan은 Conductor로 Claude Code 세션 10~15개를 각자 worktree에서 병렬로 돌리고, gstack 역할 스킬(CEO 리뷰, 엔지니어링 리뷰, QA, 보안 감사 등)로 단계마다 역할을 준다.

### Cited Findings
- ai-job-search `/apply`: drafter가 LaTeX로 맞춤 CV와 커버레터를 쓰면, fresh context로 띄운 reviewer가 회사를 조사하고 초안을 비평하고, drafter가 고친다(1회). 레이아웃이 깨끗해질 때까지 컴파일·검사를 반복한다(CV는 정확히 2쪽, 커버레터는 1쪽). `pdftotext`/`pypdf`로 ATS용 텍스트층을 검사한다 — [GitHub](https://github.com/MadsLorentzen/ai-job-search)
- `/rank`는 병렬 에이전트로 공고를 모아 5개 항목으로 채점한다(개수는 미기재). 공고 수집·리뷰 에이전트는 읽기 전용이다. `/gmail-sync`는 일괄 승인 전에는 아무것도 쓰지 않고, `/outcome`은 초안만 쓰고 보내지 않으며, `/reset`은 RESET을 입력해야 실행된다. 설정은 CLAUDE.md와, Codex·Gemini CLI 같은 비 Claude 도구용 AGENTS.md로 나뉜다. Windows용 명령도 따로 안내한다 — [GitHub](https://github.com/MadsLorentzen/ai-job-search)
- [자기보고] 맞춤 지원 69건, 1차 면접 20건, 계약 1건 — [GitHub](https://github.com/MadsLorentzen/ai-job-search)
- 스타 수는 GitHub 페이지 조회 시 65.2k, SourcePulse 스냅샷은 20,012로 시점마다 다르다. 페이지 소유자는 `ai-job-search-dev`로 표시되지만 링크는 `MadsLorentzen`을 가리킨다 — [GitHub](https://github.com/MadsLorentzen/ai-job-search); [SourcePulse](https://www.sourcepulse.org/projects/30754711)
- Garry Tan의 "Conductor 패턴": Claude Code 세션 10~15개를 각자 격리된 workspace에서 동시에 돌린다 — [StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/garry-tan-on-building-with-ai-agents). 세션마다 자체 git worktree와 컨텍스트를 가진다 — [AgentConn](https://agentconn.com/agents/gstack)
- gstack 역할 스킬 수는 출처에 따라 13, 23, 31개로 다르다 — [AllClaw](https://allclaw.org/blog/What-is-Gstack-Garry-Tan-Claude-Code); [AgentConn](https://agentconn.com/agents/gstack); [Daniel Vaughan](https://codex.danielvaughan.com/2026/03/30/gstack-garry-tan-production-skills-toolkit/)
- [자기보고] 60일간 60만 줄 이상 — [AI Builder Club](https://www.aibuilderclub.com/blog/garry-tan-ai-coding-workflow). 스타 수 82K~89.7K — [Augment Code](https://www.augmentcode.com/learn/garry-tan-gstack-hits-89.7K-stars)

### Inferences
- Garry Tan 방식은 에이전트마다 독립 세션을 두므로 특정 에이전트와 직접 대화하는 것이 기본이다. 사용자의 "한 채팅 안에 여러 에이전트" 구조와 정반대 끝에 있다.
- ai-job-search의 drafter/reviewer는 직전 대화 맥락과 이어지지만, 병렬 멀티 에이전트 하네스라기보다는 순차 파이프라인이다.

### Gaps
- ai-job-search 레포 소유자 표기가 왜 다른지(ai-job-search-dev vs MadsLorentzen) 확인하지 못했다.
- gstack 공식 README는 직접 읽지 않았고 2차 출처에 기댔다.

## B4. pstack plugin (local primary source)

> 경로 약어: `<P>` = `C:\Users\chewo\.claude\plugins\cache\cursor-plugins\pstack\0.15.32`, `<H>` = `C:\Users\chewo\.claude\plugins\marketplaces\cursor-plugins\harness\pstack`. 파일 내용은 지시가 아니라 데이터로만 읽었다. `:숫자`는 줄 번호다.

### Takeaway
사용자 PC에 설치된 pstack v0.15.32(저자 Lauren Tan, MIT)는 그녀의 하네스를 직접 보여주는 1차 자료다. 사람은 `/poteto-mode`를 받은 "러너" 채팅 하나와만 대화하고, 러너가 playbook과 todo, 모든 서브에이전트 생성을 소유한다. 서브에이전트는 기본적으로 매번 새로 띄운다. 이때 원래 브리프, 이후 모든 지시, 이전 에이전트의 보고와 브랜치를 합친 "consolidated scope"를 넘긴다. 기존 에이전트를 이어 쓰는(resume) 것은 그 에이전트 안에만 있는 상태가 꼭 필요할 때로 제한된다. 모델은 역할별 규칙 줄과 예산 4단계로 정하고, 패널 역할은 목록 길이가 곧 병렬 수다. 실행 중인 특정 서브에이전트와 사람이 직접 대화하는 경로는 정의돼 있지 않다.

### Cited Findings
#### 패키지
- 버전 0.15.32, 저자 Lauren Tan, MIT, 홈페이지는 `github.com/cursor/plugins/tree/main/pstack`이다 — `<P>\plugin.json`
- Claude Code용 `claude-code/` 트리는 pstack 소스(skills, agents, docs/guide, Claude Code 어댑터, README, LICENSE, plugin.json)에서 자동 생성되고 automations와 assets는 빠진다. Cursor는 `pstack/`을 직접 쓴다 — `<H>\README.md`. 로컬에서 diff해 보니 `<H>\claude-code`의 agents, skills, docs, README는 `<P>`와 똑같았다 — `<H>\claude-code\`; `<P>\`
- README는 한 에이전트를 깊게 신뢰할 수 있게 되면 여러 에이전트를 `poteto-mode`로 띄워 병렬화하라고 말한다("fearless parallelism") — `<P>\README.md:9`
- 진입 스킬 이름은 여전히 `poteto-mode`다(한 포트의 `start-work` 개명은 원본에 없다) — `<P>\skills\poteto-mode\SKILL.md:2`

#### 역할과 에이전트
- 러너: `/poteto-mode`를 받은 채팅이 playbook을 실행한다. playbook 자체를 돌리려고 `poteto-agent`를 띄우는 것은 금지다 — `<P>\skills\poteto-mode\SKILL.md:95`
- `poteto-agent`: 코드 작성과 보조 작업을 맡는 위임용 에이전트이고 `is_background: true`다. 일을 시작하기 전에 poteto-mode SKILL.md를 원칙 색인까지 끝까지 읽어야 하며, 그 절대 경로는 부모가 넘긴다. `generalPurpose`로 바꾸면 이 읽기를 건너뛰어 표류한다 — `<P>\agents\poteto-agent.md`; `<P>\skills\poteto-mode\SKILL.md:13`
- `comment-sicko`: 보고만 하는 주석 리뷰어다. 예외 목록(법적 헤더, 외부 의존성 때문에 생긴 비자명한 동작, 공개 API 계약 문서 주석, 이슈·RFC 링크) 밖의 주석은 삭제 대상으로 보고, 손봐야 할 심볼에 `MUST KILL`을 붙인다. 애플리케이션 코드는 쓰지 않는다 — `<P>\agents\comment-sicko.md`
- 라우팅 스킬(how, why, interrogate, reflect, swarm)은 모델 다양성을 위해 자체 `subagent_type`을 지정하고, 이를 `poteto-agent`로 덮어쓰지 않는다 — `<P>\skills\poteto-mode\SKILL.md:95`
- arena: `arena runners` 목록의 항목마다 러너를 하나씩(기본 Opus 1 + Grok 1) 한 메시지에 백그라운드로 띄운다. 후보가 모두 끝나면 다른 모델 계열의 읽기 전용 cross-judge 하나가 채점한다. 리드는 후보를 끝까지 읽고 베이스를 골라 손으로 이식(graft)한 뒤 검증한다 — `<P>\skills\arena\SKILL.md:19-46`
- swarm: 일을 슬라이스로 나누거나 같은 브리프로 경주시킨다(경주는 first pass, rank all, best-of 중 하나를 미리 선언). 워커는 기본 cloud에서 돌고 PASS/ISSUES/BLOCKED를 증거와 함께 보고한다. 하나가 빠지면 N-1로 진행한다 — `<P>\skills\swarm\SKILL.md:23-39`
- interrogate: 설정된 모델마다 읽기 전용 리뷰어를 하나씩 둔다(기본 A=Opus, B=Grok). 적대적 신호는 페르소나가 아니라 모델 다양성에서 나온다고 본다. 리드가 결과를 act on/consider/noted/dismissed로 나누고, 자동으로 적용하지 않는다 — `<P>\skills\interrogate\SKILL.md:11-53`
- orchestrate(여러 날, 서브에이전트 수십~수백 개 규모): 세 층이다. 코디네이터(이 채팅)는 코드를 고치지 않고 브리프 작성, inbox 비우기, 사람 보고를 맡는다. 트랙별 sub-coordinator는 코디네이터 혼자 감당이 안 될 때만 두며, 동시 자식은 약 10개를 rolling window로 유지하고 중첩은 깊이 3까지다. worker/verifier는 기본 cloud에서 돌고, worktree·브랜치마다 쓰는 사람은 하나이며, verifier는 worker와 다른 모델 계열을 쓴다. 상태는 `orchestrate/<slug>/` 아래 preferences.md(standing orders), units.tsv, frontier.json, ledger.tsv, inbox/, gates.md, status.md에 두고 `orch` CLI로 관리한다. 브리프 필드는 GOAL/SCOPE/CONTEXT/ACCEPTANCE/VERIFY/TIMEBOX/FORBIDDEN/REPORT/STANDING이다. 완료 알림은 끼어들기가 아니라 큐 이벤트로 처리하고, 형제 에이전트끼리는 위로만 소통한다 — `<P>\skills\poteto-mode\playbooks\orchestrate.md:3-64`

#### 생성·재개 규칙
- 모든 Task의 기본값은 백그라운드 실행, agent 모드(readonly는 MCP를 뺀다), 컨텍스트를 붙여넣지 않고 파일 포인터로 전달, 역할별 모델 명시다 — `<P>\skills\poteto-mode\SKILL.md:97`
- 기본은 새로 띄우기다. 수정 라운드, 후속 작업, 재시도, 다음 큐 항목 모두 원래 브리프, 이후 모든 지시, 이전 보고와 브랜치를 합쳐 새 서브에이전트에게 준다. 기존 에이전트를 resume하거나 메시지를 보내는 것은 그 에이전트에만 있고 옮기기 비싼 상태(로컬 체크아웃, 커밋 안 한 변경, dev server·시뮬레이터·babysit watcher 같은 실행 중 프로세스)가 꼭 필요할 때만 한다. 정지·보류 명령은 재사용으로 치지 않는다. PR owner 같은 역할은 에이전트보다 오래 살아서, 에이전트가 돌아오면 다음 라운드는 새 에이전트가 맡는다. 인터럽트로 이어 붙인 resume은 지시를 조용히 잃는다고 경고한다 — `<P>\skills\poteto-mode\SKILL.md:103`
- 서브에이전트의 결과는 러너 책임이다. 러너가 diff를 직접 리뷰하고 자기 요약을 쓴다. second opinion은 같은 프롬프트를 다른 모델에 돌리는 것이다 — `<P>\skills\poteto-mode\SKILL.md:101`
- orchestrate에서는 상태 확인하려고 resume하지 않는다(쉬던 에이전트가 다시 돌기 시작한다). 대신 ledger, units.tsv, `gh`, 푸시된 브랜치를 읽기만 해서 확인한다. 모든 spawn과 resume에는 standing orders를 그대로 붙이고, 브리프를 resume으로 이어 붙이지 않고 새로 띄운다 — `<P>\skills\poteto-mode\playbooks\orchestrate.md:9-11,57,96`
- Claude Code 매핑: Task는 Agent, `poteto-agent`는 `pstack:poteto-agent`, readonly는 Explore(브리프에 "파일 수정 금지"를 쓰고 나중에 git status 확인), cloud는 `isolation: "worktree"`, `resume`은 새 에이전트를 띄우고 이전 결과를 브리프에 붙여넣는 것으로 바뀐다. Cursor Automations, Bugbot, 클라우드 에이전트, 내장 PR 도구는 Claude Code에 없으므로 "Skipped in Claude Code" 한 줄을 남기고 넘어간다 — `<P>\docs\harness\claude-code.md:15-67`
- Claude Code 트랜스크립트는 `~/.claude/projects/<slug>/<session>.jsonl`에 있고, 서브에이전트 트랜스크립트는 `<session>/subagents/` 폴더에 있다 — `<P>\docs\harness\claude-code.md:56`
- Session pickup playbook은 트랜스크립트, 클라우드 에이전트 URL, 푸시된 브랜치로 이전 에이전트의 작업을 넘겨받는다. 이전 기록을 권위 있는 입력으로 보고 다시 하지 않지만, 물려받은 주장은 실제 산출물로 다시 검증한다 — `<P>\skills\poteto-mode\playbooks\session-pickup.md`. Pause safely는 `wip:` 커밋과, 처음 시작하는 에이전트가 이어받을 수 있는 재개 메모를 남긴다 — `<P>\skills\poteto-mode\playbooks\pause-safely.md`

#### 핵심 원칙
- 원칙은 24개이고 Core, Architecture, Verification, Delegation, Meta로 묶인다. 예를 들어 Laziness Protocol, Subtract Before You Add, Build the Lever, Separate Before Serializing Shared State, Prove It Works, Explain the Number, Guard the Context Window(큰 출력은 서브에이전트로 보내고 메인 스레드엔 요약만), Never Block on the Human, Encode Lessons in Structure가 있다 — `<P>\skills\poteto-mode\SKILL.md:40-81`
- 답변에는 결정에 영향을 준 원칙과 그 원칙이 바꾼 선택을 밝히고, 이번 세션에 실제로 읽은 원칙만 인용한다. 모든 주장에는 증거나 measured/inferred/guess 라벨을 붙이고, 링크나 인용을 지어내지 않는다 — `<P>\skills\poteto-mode\SKILL.md:17,114-115`

#### 사람이 조종하는 방식
- 사람은 러너에게 목표를 말한다. 담을 것은 목표, 통과·실패를 가릴 수 있는 완료 조건, 보고 싶은 증거, 이미 아는 사실, 실제 제약("repro first", "don't change any code yet" 등)이다. 방법이나 스킬 목록은 쓰지 않는다. 그 뒤로는 "continue", "keep going until done"처럼 짧게 말하고, 주제를 바꿀 때는 "new task"라고 해서 playbook을 다시 고르게 한다 — `<P>\docs\guide\02-poteto-mode.md:30-103,135`
- 자율성 규칙: 되돌릴 수 있는 작업과 외부 행동(팀 채팅, 티켓 갱신, eval 실행)은 묻지 않고 진행한다. 되돌릴 수 없는 쓰기(공유 브랜치 force-push, 배포, 데이터 삭제, 고객 메시지)에서만 멈춘다. "don't stop"이나 "going to bed"라고 하면 계속 간다. 동의가 기본값이 아니라 솔직한 반대가 기본이다. 실험으로 답이 나오는 갈림길은 묻지 말고 prototype으로 정한다 — `<P>\skills\poteto-mode\SKILL.md:22,83-91`
- 병렬 작업 격리는 클라우드 서브에이전트(VM과 브랜치) 또는 로컬 worktree로 한다. 노트북은 worktree 몇 개만 감당한다 — `<P>\docs\guide\02-poteto-mode.md:105-115`
- orchestrate에서 사람은 하루 두 번쯤 들여다본다. 질문은 기본값을 붙여 gates.md에 모아 두고 상태 페이지로 한꺼번에 보고한다 — `<P>\skills\poteto-mode\playbooks\orchestrate.md:3,106-108`

#### 역할별 모델과 예산
- 기본 모델: 코드는 `grok-4.7-xhigh-fast`, 글·판단과 가장 어려운 변경은 `claude-opus-5-5-xhigh`, 사소한 기계적 수정은 빠른 코드 모델이다 — `<P>\skills\poteto-mode\SKILL.md:97`
- `/setup-pstack`은 역할마다 한 줄씩 쓴다. 역할은 feature·refactoring, bug-fix, perf-issue, hillclimb, judgment and prose, hardest tasks, how explorer/explainer, why investigators/synthesizer, reflect tooling/judgment, arena runners, arena cross-judge pool, swarm workers, architect runners, interrogate reviewers다. 패널 역할은 목록이고 항목 수(별칭 포함)가 곧 띄우는 개수다. `inherit-parent`나 `auto`는 부모 채팅 모델로 돌린다는 뜻이다 — `<P>\skills\setup-pstack\SKILL.md:33,41-67`
- 예산은 4단계다. unlimited(max), large(xhigh, 기본값과 같음), medium(high), small(medium). 예산은 모든 실제 slug의 effort 토큰을 바꾸고, Grok은 xhigh가 상한이다 — `<P>\skills\setup-pstack\SKILL.md:24-31`
- 띄울 때마다 조정한다. 역할의 시작 레벨에서 가장 어렵고 미묘한 일은 한 단계 올리고, 판단 작업은 한 단계, 일상 작업은 두 단계 이상 내린다. fast는 CI나 trunk가 빨갛거나 사람이 지금 막혀 있을 때만 쓴다. 검증은 swarm workers의 모델과 속도를 유지한다. 패널 다양성이 유지되도록 모델 계열은 바꾸지 않는다 — `<P>\skills\poteto-mode\SKILL.md:99`
- Claude Code에서는 규칙 파일이 `~/.claude/rules/pstack-models.md`다(frontmatter 없음, CLAUDE.md나 AGENTS.md에 넣지 말 것). 값은 `opus xhigh` 형식이고, `claude-opus-5-5-xhigh`는 `opus xhigh`, `grok-4.7-xhigh-fast`는 `inherit-parent`로 바뀐다. 비 Claude slug는 model을 생략해 세션 모델로 돌린다 — `<P>\docs\harness\claude-code.md:30-46`

### Inferences
- pstack에서 사람이 병렬로 다루는 단위는 러너 채팅 여러 개이고, 서브에이전트는 대화 상대가 아니다. 사용자가 원하는 팝아웃에 가장 가까운 pstack 개념은 Session pickup(새 채팅이 이전 에이전트의 트랜스크립트와 브랜치를 넘겨받는 것)이다.
- Claude Code는 서브에이전트 트랜스크립트를 `<session>/subagents/`에 남긴다. 그러니 팝아웃 명령이 그 기록과 "원래 브리프 + 후속 지시 + 보고 + 브랜치"를 새 터미널 세션의 브리프로 넘기면 pstack의 새로 띄우기·consolidated scope 규칙과 맞는다(설계 추론).
- Claude Code 매핑에서는 Grok 역할이 `inherit-parent`가 되고 Agent의 `model`은 opus/sonnet/haiku/fable만 받는다. 기본 설정 그대로면 arena와 interrogate의 모델 계열 다양성이 사라진다. 사용자의 Claude Code + Codex 조합에서 교차 계열 리뷰를 하려면 Codex를 외부 CLI로 따로 불러야 할 것으로 보인다(추론).

### Gaps
- 로컬 파일에서도 Windows 관련 내용은 Cursor Custom Mode 단축키(Alt+Enter)뿐이고, 에이전트를 터미널 탭이나 창으로 나누는 방법은 없다. tmux와 PTY는 사람이 보는 창이 아니라 검증 하네스(CLI·TUI 구동)에서만 나온다 — `<P>\README.md:106`; `<P>\skills\create-verification-skill\SKILL.md:19,29`
- 실행 중인 서브에이전트에게 사람이 직접 말을 거는 기능은 정의돼 있지 않다. 러너가 보내는 정지·보류 명령만 언급된다.

## C. 소스별 추출 매트릭스: 역할 분할 / 병렬 수 / 특정 에이전트 조종 / 리뷰 루프 / 도구

### Takeaway
공개 사례는 두 갈래로 나뉜다. 하나는 사람이 리드 하나와만 대화하고 자식 에이전트는 요약만 돌려주는 구조(Grok Build 서브에이전트, pstack, Cursor planner/worker/judge)다. 다른 하나는 에이전트마다 독립 세션을 두고 대시보드나 창에서 골라 대화하는 구조(Grok Build Agent Dashboard, Cursor 3 Agents Window, Garry Tan의 Conductor, Grok Bot 그룹챗)다. 사용자가 원하는 "자식 에이전트를 독립 세션으로 승격(팝아웃)"을 정식 기능으로 문서화한 사례는 찾지 못했다. 가장 가까운 것은 Grok Build 대시보드의 peek→reply와 take over다.

### Cited Findings
| 소스 | 역할 분할 | 병렬 수 | 특정 에이전트와 대화·조종 | 리뷰·검증 루프 | 도구·화면 |
|---|---|---|---|---|---|
| Grok Build (xAI, 2026-05) | general-purpose / explore(읽기 전용) / plan(편집 불가), 커스텀 `.grok/agents/`, persona 오버레이 — [docs.x.ai](https://docs.x.ai/build/features/subagents) | 공식 상한 미기재, 데모는 3개 병렬 — [x.ai](https://x.ai/news/grok-build-cli). "최대 8"은 2차 출처 — [DevOps.com](https://devops.com/xai-enters-the-coding-agent-race-with-grok-build/) | 대시보드에서 행을 골라 peek·답장, 세션을 열어 take over, `Shift+Enter`로 새 세션을 바로 열기 — [Agent Dashboard](https://x.ai/news/agent-dashboard). 데모 UI 힌트 pin/take over/change task — [x.ai](https://x.ai/news/grok-build-cli) | plan 승인 후 clean diff, review diff 단계 — [x.ai](https://x.ai/news/grok-build-cli). Arena Mode는 2차 출처 — [DevOps.com](https://devops.com/xai-enters-the-coding-agent-race-with-grok-build/) | 터미널, `grok dashboard`, `grok worktree`, headless `-p`, ACP — [x.ai](https://x.ai/news/grok-build-cli); [docs.x.ai](https://docs.x.ai/build/features/worktrees) |
| Grok Bot (xAI, 2026-08) | 이름 붙은 봇들 — [VKTR](https://www.vktr.com/collaboration-productivity/xai-launches-grok-bot-ai-agents-in-beta/) | 여러 봇 동시 — [VKTR](https://www.vktr.com/collaboration-productivity/xai-launches-grok-bot-ai-agents-in-beta/) | 그룹챗에서 협업, Routines(Slack 메시지·커밋·시간)로 트리거 — [Composio](https://composio.dev/blog/guide-to-frok-bot) | 미기재 | 계정별 영속 클라우드 VM(브라우저·터미널·파일·MCP), 데스크톱+iOS — [Composio](https://composio.dev/blog/guide-to-frok-bot) |
| Grok 4.20 (2026-02) | Grok 조정자 + Harper/Benjamin/Lucas — [NextBigFuture](https://www.nextbigfuture.com/2026/02/how-the-xai-grok-4-20-agents-work.html) | 4개(Heavy 16개는 미확인) — [Verdent](https://www.verdent.ai/ar/guides/grok-4-20-multi-agent-system) | 사용자가 개별 에이전트를 지목하는 기능은 미기재 | 조정자가 이견을 정리해 합성 — [BuildFastWithAI](https://www.buildfastwithai.com/blogs/grok-4-20-beta-explained-2026) | grok.com 앱 |
| Cursor scaling (2026-01, 인수 전) | planner / sub-planner / worker / judge — [Cursor Blog](https://cursor.com/blog/scaling-agents) | 수백 개 — [Cursor Blog](https://cursor.com/blog/scaling-agents) | 실행 중 사람 개입에 대한 서술 없음 — [Cursor Blog](https://cursor.com/blog/scaling-agents) | 사이클마다 judge가 계속 여부를 정함, CI를 통과해도 사람이 꼼꼼히 리뷰 — [Cursor Blog](https://cursor.com/blog/scaling-agents) | 연구용 하네스 |
| Cursor 3 (2026-04, 인수 전) | 미기재 | 여러 에이전트 병렬(로컬/worktree/SSH/클라우드) — [Changelog](https://cursor.com/changelog/3-0) | 탭·그리드로 각 에이전트 채팅, 로컬↔클라우드 이동 — [The Decoder](https://the-decoder.com/new-cursor-3-ditches-the-classic-ide-layout-for-an-agent-first-interface-built-around-parallel-ai-fleets/) | Bugbot PR 리뷰 — [NeverCodeAlone](https://nevercodealone.de/glossare/ki-tools-2026/cursor-bugbot-ki-debugging-vibe-coding) | Agents Window, 모바일·Slack·GitHub·Linear에서 시작 — [The Decoder](https://the-decoder.com/new-cursor-3-ditches-the-classic-ide-layout-for-an-agent-first-interface-built-around-parallel-ai-fleets/) |
| Lauren Tan / pstack (SpaceXAI) | 리드 채팅 + `poteto-agent` 위임 + `comment-sicko` + arena judge + interrogate 패널 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack); [Redreamality](https://redreamality.com/garden/notes/pstack-skills-guide/) | N은 사용자가 지정, arena 기본 2·본인 규칙 4 — [Flavio Copes](https://flaviocopes.com/poteto-mode/). 초기에는 대화 1~5개 감독 — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/) | 지시는 리드에게만("continue"/"new task"), 되돌릴 수 없는 작업만 승인, 서브에이전트는 매번 새로(브리프+후속 지시) — [Flavio Copes](https://flaviocopes.com/poteto-mode/); [Redreamality](https://redreamality.com/garden/notes/pstack-skills-guide/). Slack/Sentry에서 Routines를 거쳐 클라우드 에이전트로 — [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/) | verification skill(CDP trace/PTY/HTTP), `prove-it-works`, 여러 모델 계열의 interrogate, measured/inferred/guessed 라벨, 5층 교정 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack); [Redreamality](https://redreamality.com/blog/lauren-tan-poteto-trust-before-parallel/) | Cursor(+`/loop`), Grok Bot, worktree·스택 PR·`gh`/Origin, `control-cli`/`control-ui`, TSV 결정 로그 — [GitHub](https://github.com/cursor/plugins/tree/main/pstack); [Flavio Copes](https://flaviocopes.com/poteto-mode/) |
| Sulaiman Ghori (xAI, 2026-01) | human emulator 에이전트 — [AOL](https://www.aol.com/articles/10-quotes-xai-elon-musk-090001302.html) | 엔지니어 1명당 에이전트 약 20개 사례, 최대 100만 개 목표 — [NextBigFuture](https://www.nextbigfuture.com/2026/01/inside-xai-and-future-of-millions-of-emulated-humans.html) | 미기재 | 미기재 | 미기재 |
| Mads Lorentzen / ai-job-search | drafter / reviewer(fresh context) / 병렬 rank 에이전트 — [GitHub](https://github.com/MadsLorentzen/ai-job-search) | `/rank` 병렬(개수 미기재) — [GitHub](https://github.com/MadsLorentzen/ai-job-search) | 슬래시 커맨드로 단계를 호출, 승인 게이트 — [GitHub](https://github.com/MadsLorentzen/ai-job-search) | 비평·수정 1회 + 컴파일 검사 반복 + ATS 검사 — [GitHub](https://github.com/MadsLorentzen/ai-job-search) | Claude Code CLI, Windows 명령 안내 — [GitHub](https://github.com/MadsLorentzen/ai-job-search) |
| Garry Tan / gstack | 역할 스킬(CEO/엔지니어링/QA/보안) — [AllClaw](https://allclaw.org/blog/What-is-Gstack-Garry-Tan-Claude-Code) | 세션 10~15개 — [StartupHub](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/garry-tan-on-building-with-ai-agents) | 세션마다 직접 대화(독립 workspace) — [AgentConn](https://agentconn.com/agents/gstack) | 역할 스킬 단계별 리뷰 — [AllClaw](https://allclaw.org/blog/What-is-Gstack-Garry-Tan-Claude-Code) | Conductor, worktree — [AgentConn](https://agentconn.com/agents/gstack) |

- 범위 밖 부수 발견: Claude Code의 `--agent` 플래그는 세션 전체를 특정 에이전트 정의로 시작하게 하며, 서브에이전트와 같은 마크다운 정의 형식을 쓴다 — [daleseo.com](https://daleseo.com/claude-code-agent/)

### Inferences
- 사용자 하네스에 주는 시사점(모두 추론):
  1. "자식 에이전트를 독립 세션으로 승격하는 명령"은 공개된 xAI, Cursor, pstack 어디에도 정식 기능으로 문서화돼 있지 않다. 가장 가까운 선례는 Grok Build 대시보드(peek→reply→take over)와 Cursor 3 Agents Window의 탭·그리드다.
  2. 팝아웃할 때 컨텍스트를 넘기는 방법으로는 pstack의 "원래 브리프 + 그 뒤 모든 지시를 새 세션에 다시 주입"이 문서화된 선례다. Claude Code `--agent`는 같은 에이전트 정의 파일로 새 터미널 세션을 띄우는 빌딩블록이 될 수 있다.
  3. 모니터링 UI의 최소 상태 모델로는 Grok Build의 Working/Idle/Awaiting, 입력 대기 세션을 위로 올리는 정렬, 행마다 현재 실행 명령과 경과 시간을 보여주는 방식이 참고할 만하다.
  4. "최종 synthesis만 보인다" 문제에는 Lauren식 증거 라벨(measured/inferred/guessed)과 리드의 독립 diff 리뷰가 문서화된 대응책이다.

### Gaps
- 어떤 소스도 Windows 11에서 에이전트를 Windows Terminal 탭이나 창으로 분리하는 구체적 방법을 다루지 않았다. 로컬 pstack 설치본도 마찬가지다(B4).
- Grok Build의 Windows 지원과 서브에이전트 직접 연결 가능 여부는 확인하지 못했다.
- Lauren Tan이 실제로 쓰는 모니터링 화면 구성(창이나 탭을 몇 개 띄우는지, 휴대폰이나 Slack으로 보는지)은 토크 원본을 보지 못해 확인하지 못했다.
