# OpenAI의 병렬 멀티 에이전트 실무와 Codex 제품 설계 (조사 기준일 2026-10-25)

출처 태그: [공식문서] = learn.chatgpt.com 문서·changelog(구 developers.openai.com/codex), [OpenAI글] = openai.com 게시물, [GH] = github.com/openai/codex 이슈·PR, [커뮤니티] = community.openai.com, [인터뷰] = 인터뷰·SNS 일화, [3rd] = 제3자 블로그·언론. "⚠2026 이전" = 2025년 자료라 지금과 다를 수 있음. 참고: openai.com 본문은 직접 요청하면 403이 나서 r.jina.ai 리더로 읽었음. 2026-10-25에 직접 확인해 보니 developers.openai.com/codex/* 문서는 모두 learn.chatgpt.com/docs/* 로 308 영구 리다이렉트됨.

## 1. Harness engineering: OpenAI가 공개한 구체적 실천과 2026년 후속 자료

### Takeaway
2026-02-11 Ryan Lopopolo 글의 요지는 사람은 코드를 쓰지 않고 환경, 의도, 피드백 루프를 설계한다는 것이다. 실천 항목은 다섯 가지다. (1) 약 100줄짜리 AGENTS.md를 지도(목차)로 쓴다. (2) docs/를 기록 시스템(system of record)으로 삼는다. (3) 워크트리마다 앱 인스턴스와 관측 스택을 띄워 에이전트 가독성(legibility)을 확보한다. (4) 커스텀 린터와 구조 테스트로 아키텍처를 기계적으로 강제한다. (5) 에이전트끼리 서로 리뷰하는 루프(Ralph Wiggum Loop)와 백그라운드 "가비지 컬렉션" 작업을 돌린다. 같은 흐름의 후속 자료로는 Brockman 전사 지침(2/6), Agents SDK 하네스(4/15), Symphony(4/27), Windows 샌드박스 글(5/13), DevDay Agents API(9/29)가 있다. 같은 저자가 쓴 "2편" 같은 직접 후속 글은 찾지 못했다.

### Cited Findings
#### 원문: "Harness engineering: leveraging Codex in an agent-first world"
- 2026-02-11 게재, 저자는 OpenAI 기술 스태프 Ryan Lopopolo. 검색 결과 기준이며, 리더로 읽은 본문에는 저자와 날짜가 보이지 않았다 — [InfoQ](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex); [AI wiki(slug: 2026-02-11-lopopolo)](https://businessdatasolutions.github.io/ai-wiki/sources/2026-02-11-lopopolo-codex-harness-engineering)
- 규모: 2025년 8월 말 첫 커밋 이후 약 5개월 동안 사람이 직접 쓴 코드 없이 내부 베타 제품을 출시했다. 앱 로직, 테스트, CI, 문서, 관측, 내부 도구 모두 Codex가 작성. 손으로 짤 때의 약 1/10 시간으로 추정. 약 100만 줄, 머지된 PR 약 1,500개, 엔지니어 3명에서 7명으로 증가, 엔지니어 1인당 하루 평균 약 3.5 PR. 사용자는 수백 명의 사내 사용자와 외부 알파 테스터 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 동시에 몇 개 에이전트를 돌렸는지는 밝히지 않는다. 대신 변경 하나마다 격리된 앱 인스턴스를 하나씩 띄운다는 점과, 한 번의 실행이 최대 약 6시간 이어진 사례를 언급한다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 출발점: 빈 저장소에서 Codex CLI(GPT-5)가 템플릿 몇 개를 바탕으로 스캐폴드, CI 설정, 첫 AGENTS.md까지 만들었다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 실패했을 때의 원칙: 같은 시도를 더 세게 반복하지 않는다. 어떤 능력이 빠졌는지, 그것을 에이전트가 읽고 지킬 수 있게 하려면 무엇을 바꿔야 하는지를 묻는다. 초기 진척이 느렸던 원인은 도구, 추상화, 구조가 부족한 "과소 명세된 환경"이었다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- AGENTS.md는 지도로 쓴다. 하나의 거대한 AGENTS.md는 네 가지 이유로 실패했다: 컨텍스트를 잠식하고, 모든 게 중요하면 아무것도 중요하지 않게 되고, 금방 낡고, 기계적으로 검증하기 어렵다. 지금은 약 100줄짜리 목차형 파일을 컨텍스트에 주입하고, 거기서 더 깊은 문서로 포인터를 건다. 원문 표현: "give Codex a map, not a 1,000-page instruction manual" — [OpenAI글](https://openai.com/index/harness-engineering/)
- 저장소 문서가 기록 시스템이다. docs/ 아래에 다음을 둔다:
  - 설계 문서: 색인화되어 있고 검증 상태와 agent-first 핵심 신념을 담는다.
  - 아키텍처 문서: 도메인과 패키지 레이어의 지도.
  - 품질 문서: 도메인·레이어별 등급을 매기고 갭을 추적한다.
  - 실행 계획: 진행 상황과 결정 로그를 담아 체크인한다. 작은 변경에는 가벼운 임시 계획을 쓴다.
  - 기술 부채도 함께 버전 관리한다.

  에이전트는 작은 진입점에서 시작해 필요한 문서로 안내받는다(progressive disclosure). 린터와 CI가 문서의 신선도, 교차 링크, 구조를 검사하고, 주기적으로 도는 doc-gardening 에이전트가 낡은 문서를 찾아 수정 PR을 연다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 저장소 밖에 있는 지식(채팅, 문서, 사람 머릿속)은 에이전트에게 보이지 않으므로 저장소 안으로 옮긴다. 저장소 안에서 완전히 이해할 수 있는 의존성과 "지루한" 기술을 선호한다. 불투명한 라이브러리 대신 에이전트에게 다시 구현하게 한 경우도 있다(예: 테스트 커버리지 100%에 OpenTelemetry와 연동된 map-with-concurrency 헬퍼) — [OpenAI글](https://openai.com/index/harness-engineering/)
- 에이전트 가독성:
  - git worktree마다 앱을 부팅해, 변경 하나당 인스턴스 하나를 Codex가 직접 실행·조작한다.
  - Chrome DevTools Protocol을 에이전트 런타임에 연결했다(DOM 스냅샷, 스크린샷, 내비게이션 스킬).
  - 워크트리마다 임시 로그·메트릭·트레이스 스택을 띄우고(LogQL/PromQL로 질의), 작업이 끝나면 내린다.
  - "서비스 시작 800ms 미만" 같은 성능 목표를 에이전트가 직접 맞춘다.

  — [OpenAI글](https://openai.com/index/harness-engineering/)
- 자율 루프: 프롬프트 하나로 버그 재현, 영상 녹화, 수정, 검증, PR 생성, 리뷰 피드백과 빌드 실패 대응, 머지까지 진행한다. 사람에게는 판단이 필요할 때만 올린다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 에이전트 간 리뷰: Codex가 자기 변경을 로컬에서 리뷰하고, 로컬과 클라우드의 전문 에이전트 리뷰를 요청한 뒤, 모든 에이전트 리뷰어가 만족할 때까지 반복한다. 이를 "Ralph Wiggum Loop"라 부른다. gh, 로컬 스크립트, 저장소에 넣어 둔 스킬을 Codex가 직접 쓰기 때문에 사람이 컨텍스트를 복사해 붙일 필요가 없다. 사람의 PR 리뷰는 선택 사항이고, 에이전트가 자기 PR을 squash-merge하는 경우가 많다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 아키텍처의 기계적 강제:
  - 도메인마다 레이어가 Types → Config → Repo → Service → Runtime → UI로 고정되어 있고, 의존 방향을 엄격히 검증한다.
  - 인증, 커넥터, 텔레메트리, 피처 플래그는 단일 Providers 인터페이스로만 들어온다.
  - 커스텀 린터와 구조 테스트를 쓰고, 린트 에러 메시지에 에이전트가 읽을 해결 지침을 넣는다.
  - 구조화 로깅, 스키마·타입 명명 규칙, 파일 크기 제한 같은 "취향 불변식"도 린트로 강제한다.
  - 데이터는 경계에서 파싱한다(Zod를 쓰지만 필수는 아님).
  - 경계는 중앙에서 강제하고 그 안에서는 자율을 허용한다.
  - 리뷰 코멘트와 버그를 문서나 도구로 승격하고, 문서로 부족하면 규칙을 코드로 승격한다.

  — [OpenAI글](https://openai.com/index/harness-engineering/)
- 머지 철학: 머지를 막는 게이트를 최소화하고 PR 수명을 짧게 유지한다. 플래키 테스트는 재실행한다. 에이전트 처리량이 사람 주의력보다 훨씬 크면 수정은 싸고 기다림은 비싸다는 판단이다. 처리량이 낮은 환경에서는 무책임한 방식일 수 있다고 명시한다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 엔트로피와 가비지 컬렉션: 에이전트는 나쁜 패턴도 그대로 복제한다. 처음에는 매주 금요일(주의 약 20%)을 "AI slop" 정리에 썼지만 확장되지 않았다. 지금은 "golden principles"를 기계적 규칙으로 저장소에 넣어 두고, 주기적으로 도는 Codex 작업이 규칙에서 벗어난 부분을 찾고, 품질 등급을 갱신하고, 리팩터링 PR을 연다. 대부분 1분 안에 리뷰가 끝나 자동 머지된다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 사람의 역할(스티어링): 작업 우선순위를 정하고, 사용자 피드백을 수용 기준으로 바꾸고, 결과를 검증한다. 사람의 QA 용량이 병목이 되자 앱을 에이전트가 읽을 수 있게 만드는 데 집중했다. 사람의 취향은 한 번 포착해서 계속 강제한다 — [OpenAI글](https://openai.com/index/harness-engineering/)
- 한계: 몇 년 단위로 아키텍처 일관성이 어떻게 유지될지는 모른다. 이 정도의 자율성은 해당 저장소에 쏟은 투자 덕분이고, 비슷한 투자 없이 다른 곳에 일반화된다고 가정하면 안 된다고 명시한다 — [OpenAI글](https://openai.com/index/harness-engineering/)

#### 관련·후속 OpenAI 자료 (2026)
- Greg Brockman, 2026-02-06 X 게시물. 3월 31일까지의 목표:
  - 모든 기술 작업에서 사람이 가장 먼저 쓰는 도구가 편집기나 터미널이 아니라 에이전트가 되게 한다.
  - 기본 에이전트 사용 방식은 명시적으로 안전성 평가를 받고, 그러면서도 대부분의 워크플로에 추가 권한이 필요 없을 만큼 생산적이어야 한다.

  팀별 권고:
  - "agents captain"을 지정하고, 사내 채널에서 경험을 공유하고, 전사 Codex 해커톤을 연다.
  - 프로젝트마다 AGENTS.md를 두고 에이전트가 틀릴 때마다 갱신한다. 반복 작업은 skills로 만들어 공유 디렉터리에 커밋한다.
  - 내부 도구를 목록화해 CLI나 MCP로 에이전트가 쓸 수 있게 한다.
  - 테스트가 빠르고 인터페이스가 깔끔한 agent-first 코드베이스로 만든다.
  - "say no to slop": 머지되는 코드는 사람이 책임지고, 사람이 쓴 코드와 같은 기준으로 리뷰한다.
  - 관측성을 갖추고, 에이전트 궤적(trajectory)을 커밋과 함께 추적하고, 에이전트가 쓰는 도구를 중앙에서 관리한다.

  병렬 에이전트 운영에 대한 언급은 없다 — [Thread Reader(원 게시물 unroll)](https://threadreaderapp.com/thread/2019566641491963946.html)
- Symphony(2026-04-27): 같은 "사람이 쓴 코드 0" 내부 생산성 도구 팀이 다음 병목인 사람의 주의력을 풀려고 만든 오케스트레이터. 자세한 내용은 2절 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- Agents SDK "next evolution"(2026-04-15). 파일과 도구를 오가며 일하는 model-native harness, Codex와 비슷한 파일시스템 도구, MCP·skills·AGENTS.md·shell·apply patch 표준 통합, 네이티브 샌드박스 실행(Blaxel, Cloudflare, Daytona, E2B, Modal, Runloop, Vercel), 스냅샷과 재수화를 추가했다. subagents와 code mode는 개발 중이다. 날짜는 보도와 검색 결과 기준 — [OpenAI글](https://openai.com/index/the-next-evolution-of-the-agents-sdk/); [DevOps.com](https://devops.com/openai-upgrades-its-agents-sdk-with-sandboxing-and-a-new-model-harness/)
- Windows 샌드박스 엔지니어링 글: 날짜 2026-05-13, 저자 David Wiesen(둘 다 검색 요약 기준). 자세한 내용은 3절 — [OpenAI글](https://openai.com/index/building-codex-windows-sandbox/)
- DevDay 2026(2026-09-29): Agents API 공개 베타(호스티드 실행, 메모리, 도구, 멀티 에이전트 지원, computer use). Codex CLI에 양방향 음성과 /agents 뷰 추가 — [커뮤니티 DevDay 공지 정리](https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006); [CNBC](https://www.cnbc.com/2026/09/29/openai-devday-2026-live-updates.html). 공식 recap 페이지(https://openai.com/index/devday-2026-recap/)는 조회 때 500 오류가 나서 직접 확인하지 못했다.

### Inferences
- 하네스 원칙 밑에는 "사람의 주의력이 가장 희소한 자원"이라는 전제가 있다. 그래서 OpenAI는 사람이 개입하는 지점을 실행 중 미세 조정에서 환경, 규칙, 수용 기준 설계로 옮겼다. 사용자가 원하는 "역할 에이전트에게 직접 후속 지시"는 이 방향과 충돌하지는 않는다. 다만 OpenAI 스스로 그 개입을 최소화하는 쪽을 택했다는 점은 차별화 포인트가 될 수 있다.
- AGENTS.md는 짧은 지도로, 상세 지식은 docs/로 나누는 구조는 사용자의 PM·리서치·종합 역할 프롬프트에도 그대로 옮길 수 있다. 공통 지도 하나와 역할별 상세 문서 포인터로 나누는 방식이 컨텍스트 효율에 유리할 가능성이 크다.
- 공식 글에 동시 에이전트 수가 없다. 하네스 팀은 동시 세션 수보다 작업 하나당 자율성(사람 개입 없이 끝까지 가는 비율)을 핵심 지표로 본 것으로 보인다.

### Gaps
- Lopopolo의 2026년 하반기 후속 글은 찾지 못했다. Build Hours 발표 요약(startuphub.ai)은 모델명이 다른 자료와 맞지 않아 쓰지 않았다.
- 원문은 동시 에이전트 수와 사람이 개별 실행에 개입한 구체적 UI·명령을 다루지 않는다.

## 2. Symphony: 이슈 트래커 티켓을 격리된 자율 Codex 실행으로 바꾸는 오케스트레이터

### Takeaway
Symphony(2026-04-27 공개 글, SPEC.md와 Elixir 참조 구현)는 Linear 보드를 control plane으로 쓴다. 블로킹되지 않은 티켓마다 격리된 워크스페이스와 Codex(app-server) 실행을 하나씩 붙이고, 사람은 티켓 상태와 proof of work(영상 워크스루가 담긴 리뷰 패킷)로만 소통한다. OpenAI는 이 방식 때문에 실행 중 에이전트를 슬쩍 바로잡는 능력을 잃었다고 인정했다. 사양에도 라이브 세션에 사람이 입력을 넣는 메커니즘이 없다. 이 설계가 나온 배경은 엔지니어 대부분이 인터랙티브 세션 3~5개를 넘으면 컨텍스트 스위칭을 감당하지 못한다는 관찰이었다.

### Cited Findings
- 2026-04-27 OpenAI Engineering 게재, 저자 Alex Kotliarskyi·Victor Zhu·Zach Brock. Linear 보드를 코딩 에이전트의 control plane으로 바꾸는 오픈소스 오케스트레이터다. 열린 작업마다 에이전트가 하나씩 붙어 계속 돌고, 사람은 결과를 리뷰한다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- 만든 이유: 엔지니어가 Codex 세션을 여러 개 열어 작업을 배정하고, 결과를 리뷰하고, 방향을 잡아 주다 보니 대부분 3~5개 세션에서 컨텍스트 스위칭이 고통스러워졌다. 그 이상이 되면 어느 세션이 무엇을 하는지 놓치고, 터미널 사이를 오가며 멈춘 작업을 디버깅하게 된다. 글은 이를 주니어 엔지니어 팀을 마이크로매니징하는 상황에 비유한다. 그래서 세션과 PR을 감독하는 대신 이슈·티켓이라는 산출물 단위로 관리하는 방식으로 바꿨다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- 설계:
  - 고정 주기로 트래커를 폴링하고, 티켓 상태를 상태 기계로 쓴다.
  - 블로킹되지 않은 작업만 시작해서 의존성 그래프를 가능한 한 병렬로 돌린다. 예: React 업그레이드는 Vite 마이그레이션이 끝나기를 기다렸다.
  - 이슈마다 전용 워크스페이스를 둔다.
  - Codex는 app-server 모드(헤드리스 JSON-RPC)로 구동한다.
  - dynamic tool call로 `linear_graphql` 도구를 노출해서 서브에이전트가 Linear 토큰을 직접 갖지 않게 했다.
  - 저장소가 소유하는 WORKFLOW.md에 에이전트 프롬프트와 런타임 설정(훅, 트래커 설정)을 둔다. 파일이 바뀌면 다시 읽는다.

  — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- 사양 우선 개발: 핵심은 SPEC.md이고 참조 구현은 Elixir다. 사양의 모호한 곳을 찾으려고 Codex에게 TypeScript, Go, Rust, Java, Python으로도 구현하게 했다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- 사양 세부(Draft v1, 언어 중립):
  - 구성요소: Workflow Loader, Config Layer, Issue Tracker Adapter, Orchestrator, Workspace Manager, Agent Runner, 선택적 Status Surface, Logging.
  - 동시성: 기본 최대 10개 에이전트 동시 실행(상태별 상한은 선택), 워커 세션당 최대 20턴.
  - 워크스페이스: 이슈 키로 이름 붙인 디렉터리를 루트 아래에 두고, 경로가 루트를 벗어나지 못하게 강제한다. 성공 후에도 지우지 않고 재사용한다.
  - 상태: active/terminal 상태 외에 "Human Review" 같은 워크플로 정의 핸드오프 상태에서 실행을 끝낼 수 있다.
  - 재시도: 정상 종료 후 약 1초 뒤 continuation 재시도. 실패하면 10초부터 지수 백오프(상한 기본 5분). 5분 동안 활동이 없으면 stall로 보고 종료 후 재시도.
  - 실행: 기본 실행 명령은 워크스페이스에서 stdio로 띄우는 `codex app-server`. continuation 턴은 같은 thread를 재사용한다.

  — [SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md)
- 관측: 구조화된 key=value 로그는 필수. 선택적 HTTP 서버(기본 loopback 바인딩)가 `/` 대시보드와 JSON API(`GET /api/v1/state`, `GET /api/v1/<issue_identifier>`, `POST /api/v1/refresh`)를 제공한다 — [SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md)
- 사람이 개별 실행과 상호작용하는 방식:
  - 작업 투입: 엔지니어뿐 아니라 PM과 디자이너도 티켓을 쓴다. 한 엔지니어는 휴대폰 Linear 앱만으로 큰 변경 세 건을 만들었다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
  - 리뷰: 기능 요청에는 실제 제품에서 찍은 영상 워크스루를 포함한 "review packet"이 돌아온다(proof of work) — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
  - 머지: 티켓이 Review에서 Merging으로 넘어간다. CI 감시, 리베이스, 충돌 해결, 플래키 체크 재시도를 Symphony가 처리하므로 Merging 티켓은 지켜보지 않아도 착지한다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
  - 실행 중 스티어링: 티켓 단위로 배정하다 보니 실행 도중 방향을 슬쩍 바로잡는 능력을 잃었다고 인정한다. 결과를 손으로 고치는 대신 가드레일과 스킬을 추가했다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
  - 사양에는 사람이 라이브 세션에 입력을 보내는 메커니즘이 없다. 실행이 사용자 입력을 무한정 기다리며 멈추면 안 된다고 규정하고, 그런 요청이 생기면 실패로 처리할지, 운영자에게 띄울지, 자동으로 해결할지는 구현이 고른다. 운영자가 영향을 줄 수 있는 경로는 WORKFLOW.md 수정(이후 실행에 적용)과 트래커 상태 변경뿐이다. 사람 코멘트를 직접 처리하는 로직도 없다. 폴링 때 이슈가 terminal 상태로 바뀌어 있으면 실행을 멈추고 워크스페이스를 정리한다 — [SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md)
  - 넘겨받기: 모호하거나 판단이 많이 필요한 문제는 여전히 엔지니어가 인터랙티브 Codex 세션에서 직접 다룬다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- 성과와 반응: 일부 OpenAI 팀에서 첫 3주 동안 landed PR이 500% 늘었다(이탈리아어판은 "6배"로 표기, 같은 뜻). 4월 23일 기준 GitHub 스타 15K 이상 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/); [Help Net Security](https://www.helpnetsecurity.com/2026/04/28/openai-symphony-codex-orchestration-linear/)
- 한계와 비목표:
  - 에이전트를 경직된 상태 기계의 노드로 다루니 제약이 너무 컸다. 그래서 목표와 도구(gh CLI, CI 로그 스킬)를 주는 방향으로 바꿨다.
  - 모든 작업에 맞는 방식은 아니다.
  - 사양의 비목표: 리치 웹 UI, 멀티테넌트 control plane, 대시보드·터미널 UI 규정, 범용 워크플로 엔진, 티켓·PR·코멘트 편집 로직, 의무 샌드박스.
  - 현재 지원하는 트래커는 Linear뿐이다.
  - OpenAI는 독립 제품으로 유지보수할 계획이 없고, 참조 구현으로 둔다.

  — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/); [SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md)

### Inferences
- Symphony는 세션을 감독하는 모델을 버리고, 티켓 상태 기계와 proof of work로 사람의 개입을 비동기로 바꿨다. 그 대가로 개별 실행과 실시간으로 대화하는 능력을 포기했다. 사용자가 원하는 "특정 에이전트를 꺼내서 계속 대화하기"는 정확히 Symphony가 포기한 영역이다. 동시에 OpenAI가 3~5 세션 한계를 인정한 바로 그 영역이기도 하다.
- 인터랙티브 세션 3~5개가 사람의 한계라는 OpenAI 내부 관찰대로라면, 역할 에이전트 5개를 동시에 돌리는 사용자의 구성은 이미 사람이 직접 다룰 수 있는 상한에 닿아 있다. 그래서 상태 요약, 주의가 필요한 에이전트 큐, 한 번에 하나만 꺼내 집중하는 팝아웃 같은 주의력 관리 기능이 핵심 차별점이 될 수 있다.
- 선택적 HTTP 대시보드와 이슈별 JSON API는 실행 하나하나를 개별 뷰로 들여다보는 최소 인터페이스의 참조 설계로 쓸 수 있다.

### Gaps
- 저장소를 처음 공개한 날짜(글이 나오기 전에 이미 스타 15K)와 5~10월의 업데이트·유지 상태는 확인하지 못했다.
- Elixir 참조 구현에 Linear 코멘트로 실행 중 에이전트에게 지시하는 기능이 있는지는 확인하지 못했다(사양에는 없음).

## 3. Codex 제품군(앱·CLI·클라우드·IDE·Agents SDK)의 멀티 에이전트 설계, 개별 에이전트 스티어링, Windows 지원

### Takeaway
2026년 동안 OpenAI 제품은 세 방향으로 바뀌었다.
- 데스크톱 앱: 2/2 macOS, 3/4 Windows에 나왔고 7월 초 ChatGPT 데스크톱 앱에 통합됐다. 프로젝트별 병렬 채팅, 워크트리, Local과 Worktree 사이 Hand off가 중심이다.
- 앱·CLI·IDE: subagents가 기본으로 켜져 있다. 생성, 라우팅, 대기, 종료는 부모가 조율한다.
- CLI(8~10월): 공유 데몬 위에서 도는 `codex agents` 대시보드와, 다른 터미널에서 기존 세션에 메시지를 넣는 `codex queue`가 생겼다.

그러나 MultiAgentV2에서 하위 에이전트 스레드는 사실상 읽기 전용이다. 개별 subagent 스티어링은 부모를 거치는 중계만 공식 지원한다. "역할 에이전트 하나를 꺼내 독립 창에서 직접 대화하기"는 2026-10 현재 1st-party 기능으로 없다(요청 이슈가 열려 있음). Windows는 네이티브 모드(PowerShell + 자체 샌드박스)와 WSL2 모드를 모두 지원한다.

### Cited Findings
#### 3-1. 2026 타임라인
- 2026-02-02(다수 보도): Codex 앱(macOS) 출시. OpenAI는 에이전트 지휘 센터로 소개했다. 주요 기능은 프로젝트별 스레드, 내장 worktree, diff 코멘트, 에디터로 열기, skills, automations(리뷰 큐). 리더로 읽은 OpenAI 페이지 메타데이터에는 2026-01-30으로 찍혀 있어 날짜가 맞지 않는다 — [OpenAI글](https://openai.com/index/introducing-the-codex-app/); [VentureBeat](https://venturebeat.com/orchestration/openai-launches-a-codex-desktop-app-for-macos-to-run-multiple-ai-coding)
- 2026-03-04: Windows판 출시(출시 글에 붙은 업데이트 노트) — [OpenAI글](https://openai.com/index/introducing-the-codex-app/); [SD Times](https://sdtimes.com/sdt_dev/openai-releases-codex-for-windows/)
- 2026-03~04, CLI subagents(제3자 설명): 3월 기준으로 `[features] multi_agent` 플래그(또는 /experimental)로 켰고, 커스텀 역할은 `~/.codex/agents/`, `.codex/agents/`의 TOML로 정의했다. max_threads 기본 6, max_depth 기본 1. GA 시점은 자료마다 다르다(3월 GA라는 글과 아직 실험적이라는 글이 공존) — [3rd 3/26](https://codex.danielvaughan.com/2026/03/26/codex-cli-subagents-toml-parallelism/); [3rd 4/9](https://codex.danielvaughan.com/2026/04/09/codex-vs-claude-code-multi-agent/)
- MultiAgentV2(경로 기반 주소 지정, 구조화 메시징): 3월 말~6월 사이 별도 피처 플래그로 등장했다는 제3자 보도가 있지만 버전과 날짜가 서로 다르다(v0.117 opt-in, v0.128, v0.137) — [3rd 3/30](https://codex.danielvaughan.com/2026/03/30/codex-cli-multi-agent-v2-path-addressing-structured-messaging); [3rd 6/8](https://codex.danielvaughan.com/2026/06/08/parallel-subagent-race-codex-cli-multi-agent-v2-claude-dynamic-workflows-architecture-comparison/)
- 2026-04-15 Agents SDK 하네스와 샌드박스, 2026-04-27 Symphony, 2026-05-13 Windows 샌드박스 글(출처는 1·2절)
- 2026년 7월 초(대략 7/8~9): Codex 앱이 새 ChatGPT 데스크톱 앱으로 통합됐다.
  - Mac과 Windows에서 동시에 적용됐다. 기존 Codex 앱은 업데이트하면 새 ChatGPT 데스크톱 앱이 되고, 기존 ChatGPT 데스크톱 앱은 "ChatGPT Classic"으로 이름이 바뀐다.
  - 한 앱 안에 Chat, Work, Codex가 함께 있다. ChatGPT Work(GPT-5.6)도 이때 출시됐다.
  - Codex 쪽 신기능: diff 안에서 인라인 편집, 사이드 패널 PR 리뷰, 더 빠른 computer use, 한 프로젝트에 여러 저장소.
  - OpenAI 페이지에는 날짜가 없고, 이미지 파일명에 "260708"이 들어 있다.

  — [OpenAI글](https://openai.com/index/chatgpt-for-your-most-ambitious-work/); [Neowin](https://www.neowin.net/news/openai-launches-chatgpt-work-and-unveils-unified-desktop-app-with-codex-built-in/); [3rd CLI 이전 가이드 7/17](https://codex.danielvaughan.com/2026/07/17/codex-chatgpt-unified-desktop-app-cli-migration-codex-app-detection-workarounds/)
- 2026-08-11: ChatGPT/Codex 데스크톱 앱 Linux판 출시(The New Stack 페이지 목록의 헤드라인으로만 확인) — [The New Stack](https://thenewstack.io/openai-codex-work-atlas/)
- 2026-08-20: CLI 0.149.0에 `codex agents`(대시보드)와 `codex queue` 추가. 버전 정보는 제3자 근거이고, 명령이 존재한다는 사실은 공식 문서로 확인 — [3rd 튜토리얼](https://proflead.dev/posts/openai-codex-agents-dashboard-codex-queue/); [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli)
- 2026-09-29 DevDay:
  - CLI: 양방향 음성과 /agents 뷰 추가, 프롬프트 편집·세션 재개·워크트리 워크플로 변경.
  - Codex Cloud: 노트북이 닫혀 있어도 실행.
  - Agents API: 공개 베타, 멀티 에이전트 지원.

  — [커뮤니티 공지](https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006)
- 2026-10-15 CLI 0.163.0, 2026-10-23 CLI 0.164.0: 3-5 참조 — [공식 changelog](https://learn.chatgpt.com/docs/changelog)
- 문서 이전: 2026-10-25 현재 developers.openai.com/codex/* 가 learn.chatgpt.com/docs/* 로 308 영구 리다이렉트된다(직접 관찰). 예: [subagents 문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)

#### 3-2. 데스크톱 앱 (Codex 앱에서 ChatGPT 데스크톱 앱의 Codex로)
- 스레드는 프로젝트별로 정리되어 작업을 오가도 컨텍스트가 유지된다. 스레드 안에서 변경을 리뷰하고, diff에 코멘트를 달고, 에디터로 열어 직접 고칠 수 있다. 로컬에 체크아웃할 수도 있고, 로컬 git 상태를 건드리지 않은 채 에이전트가 계속 일하게 둘 수도 있다. CLI와 IDE의 세션 기록과 설정을 이어받는다 — [OpenAI글](https://openai.com/index/introducing-the-codex-app/)
- 워크트리 채팅:
  - 생성: composer 아래에서 **Worktree**를 고르고, 필요하면 로컬 환경 설정 스크립트를 고른 뒤 베이스 브랜치를 정한다. 기본은 detached HEAD이고, 워크트리는 `$CODEX_HOME/worktrees`에 생긴다.
  - Hand off: 채팅 헤더의 **Hand off**를 누르면 채팅과 코드를 Local과 Worktree 사이에서 옮긴다(Git 작업은 Codex가 한다).
  - 다른 도구로 열기: 헤더의 **Open**으로 IDE를 해당 워크트리에서 열거나 통합 터미널을 쓴다.
  - 정리: 기본으로 최근 15개 워크트리만 남긴다. 핀 고정·진행 중·영구 워크트리는 자동 삭제에서 빠지고, 삭제 전에 스냅샷을 남긴다.
  - 기타: `.worktreeinclude`로 .env 같은 무시 파일을 복사한다. 영구 워크트리는 별도 프로젝트가 된다. 예약 작업은 전용 백그라운드 워크트리에서 돈다.

  — [공식문서](https://learn.chatgpt.com/docs/environments/git-worktrees.md)
- 채팅 전환과 레이아웃(Windows 단축키):
  - 채팅 이동: 이전/다음 채팅 Ctrl+Shift+Tab / Ctrl+Tab, 채팅 1~9 Ctrl+1~9, 최근 채팅 Ctrl+Alt+1~6, 주의가 필요한 다음 채팅 Ctrl+Alt+A(Codex 전용).
  - 보조 화면: side chat Ctrl+Alt+S, 분할 보기 전환 Ctrl+Alt+B, 레이아웃 순환 Ctrl+Shift+B, 터미널 토글 Ctrl+`, 하단 패널 Ctrl+J, 리뷰 탭 Ctrl+Shift+G.
  - 딥링크: `codex://threads/<thread-id>`, 채팅 딥링크 복사 Ctrl+Alt+L.
  - 채팅을 새 창으로 팝아웃하는 명령은 이 문서에 없다.

  — [공식문서](https://learn.chatgpt.com/docs/reference/commands.md)
- 앱의 subagents: 메인 스레드에 표시되는 활동에서 subagent 스레드를 열 수 있고, Subagents 패널에 에이전트와 상태가 나열된다. 실행 중인 subagent를 스티어링하거나 멈추거나 완료된 스레드를 닫으려면 Codex에게 요청한다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- Codex Micro(Work Louder와 협업한 한정판 키보드형 기기):
  - Agent Key 6개가 각각 채팅 하나를 따라가며 상태를 불빛으로 보여준다: 흰색 idle, 파랑 thinking, 초록 완료·안 읽음, 호박색 입력 필요, 빨강 오류.
  - 한 번 누르면 그 채팅으로 전환하고, 두 번 누르면 창을 앞으로 가져온다. Approve, Decline, Fork, Mic 키가 있다.
  - 키 할당 방식: 최근 채팅, 핀 고정 채팅, 우선순위(입력 대기·안 읽음·활성), 사용자 지정.
  - macOS 입력 모니터링 권한을 언급하며, Windows 지원 여부는 적혀 있지 않다.

  — [공식문서](https://learn.chatgpt.com/docs/features/codex-micro.md)
- 모니터링과 스티어링(통합 발표): 진행 상황을 보고, 질문에 답하고, 방향을 바꾸고, 중요한 작업을 승인할 수 있다. 언제 체크인하고 언제 승인을 받을지 설정할 수 있고, 연결된 도구의 중요한 작업은 Auto-review가 먼저 검사한다 — [OpenAI글](https://openai.com/index/chatgpt-for-your-most-ambitious-work/)
- Automations: 일정에 따라 백그라운드로 실행되고 결과는 리뷰 큐로 간다. OpenAI 내부에서는 일일 이슈 분류, CI 실패 요약, 일일 릴리스 브리프, 버그 점검에 쓴다 — [OpenAI글](https://openai.com/index/introducing-the-codex-app/)

#### 3-3. Windows 지원
- 앱: 2026-03-04부터 Windows를 지원하며, 지금 문서 제목은 "ChatGPT desktop app for Windows"다.
  - 설치: Microsoft Store 또는 `winget install --id 9PLM9XGG6VKS -s msstore`.
  - 에이전트 모드: 기본은 PowerShell로 명령을 실행하는 Windows 네이티브 에이전트와 Windows 샌드박스다. 설정에서 WSL2로 바꿀 수 있다(재시작 필요).
  - 통합 터미널: PowerShell, Command Prompt, Git Bash, WSL 중에서 에이전트와 별도로 고른다.
  - 지원 기능: worktrees, 예약 작업, Git, 내장 브라우저, 파일 미리보기, 플러그인, skills, 병렬 채팅, 리뷰 패널.

  — [공식문서](https://learn.chatgpt.com/docs/windows/windows-app.md)
- 앱 제약:
  - 리뷰 패널 등 Git 기능에는 네이티브 Windows Git이 필요하다.
  - `\\wsl$` 경로의 프로젝트는 Git이 감지되지 않을 수 있다(Windows 드라이브에 두기를 권장).
  - 관리자 권한이 필요한 명령은 앱을 관리자로 실행해야 한다.
  - PowerShell 실행 정책이 npm.ps1 같은 스크립트를 막을 수 있다.
  - WSL 안의 CLI는 기본적으로 Windows 앱과 `~/.codex` 설정·인증·세션을 공유하지 않는다(CODEX_HOME으로 해결).
  - WSL1은 0.114까지만 지원했고, 0.115부터 bubblewrap 샌드박스로 바뀌며 빠졌다.
  - full access 모드는 프로젝트 디렉터리에 묶이지 않아 데이터 손실 위험이 있다고 경고한다.

  — [공식문서](https://learn.chatgpt.com/docs/windows/windows-app.md)
- Windows 샌드박스 설계:
  - 배경: 처음에는 Windows에 샌드박스가 없어서 거의 모든 명령(읽기 포함)을 승인하거나 Full Access를 쓰는 수밖에 없었다.
  - 기각한 대안: AppContainer(열린 개발 워크플로에 맞지 않음), Windows Sandbox(별도 설정과 호스트 브리징이 필요하고 Home 에디션에서 쓸 수 없음), MIC 라벨링(신뢰 모델이 너무 넓게 바뀜).
  - 첫 시도: 관리자 권한 없이 돌아가는 프로토타입(합성 SID, ACL, 쓰기 제한 토큰). 네트워크 제한은 프록시 변수에 기대서 우회할 수 있었다.
  - 현재 설계: 설정할 때 관리자 권한이 필요하다. 로컬 사용자 `CodexSandboxOffline`과 `CodexSandboxOnline`을 만들고, 오프라인 사용자의 아웃바운드 트래픽을 방화벽으로 막는다. 자격 증명은 DPAPI로 암호화한다. codex.exe, 설정 바이너리, command-runner, 자식 프로세스의 4계층 구조다.

  — [OpenAI글](https://openai.com/index/building-codex-windows-sandbox/). TechRadar는 OpenAI가 이를 최초의 Windows 네이티브 에이전트 샌드박스라고 소개했다고 보도했다 — [TechRadar](https://www.techradar.com/pro/openai-releases-a-windows-version-of-codex-coding-app)
- Windows용 CLI: PowerShell 설치 스크립트를 제공한다 — [공식문서](https://learn.chatgpt.com/docs/codex/cli.md). 10월 릴리스의 Windows 항목 — [changelog](https://learn.chatgpt.com/docs/changelog):
  - 0.163.0: Ctrl+V와 Shift+Insert로 텍스트 붙여넣기, WinGet 패키지에서 데몬 설치.
  - 0.164.0: HTTPS/WebSocket 프록시 인증, Windows MXC 샌드박스를 mxc-sdk로 이전, requirements.toml 레지스트리 오버라이드.
- CLI `/app`: 지금 CLI 세션을 macOS 또는 Windows의 ChatGPT 데스크톱 앱에서 이어간다 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli)

#### 3-4. Subagents: 2026-10 현재 공식 동작
- 생성과 조율: 현재 릴리스는 앱, CLI, IDE 확장에서 subagent 워크플로를 기본으로 켠다(`agents.enabled` 기본 true). 사용자가 직접 요청하거나 AGENTS.md나 스킬 지시가 위임을 요구할 때 생성된다. 생성, 후속 지시 라우팅, 대기, 스레드 종료는 Codex가 맡는다. 여러 에이전트가 돌 때는 결과가 다 모일 때까지 기다렸다가 하나의 통합 응답을 낸다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- ChatGPT Work(웹): 대부분의 지능 수준에서는 위임을 명시적으로 요청해야 하고, Ultra 수준에서는 병렬이 실제로 도움이 될 때 스스로 위임한다. 웹은 Active/Done 목록을 읽기 전용으로만 보여주고, subagent 하나를 멈추거나 스티어링하는 컨트롤이 없다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- 설정:
  - 내장 에이전트는 `default`, `worker`, `explorer`.
  - 커스텀 TOML의 필수 필드는 `name`, `description`, `developer_instructions`.
  - 모델·추론 노력은 spawn 때 준 값, `[agents]` 기본값, 부모 값 순서로 정해진다.
  - 관련 키: `agents.max_concurrent_threads_per_session`(옛 이름 `agents.max_threads`), `agents.default_subagent_model`, `agents.interrupt_message`.

  — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- 보기와 전환:
  - CLI: `/subagents`로 활성 에이전트 스레드 사이를 오가며 진행 중인 스레드를 살펴본다. 비활성 스레드에서 온 승인 요청에는 출처 라벨이 붙고, `o`를 누르면 그 스레드가 열린다.
  - 앱: Subagents 패널.
  - IDE: composer 위에 활성 subagents가 표시되고, 펼치면 상태 확인, 전체 중지, 하나 열기가 된다.

  — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- 개별 subagent 스티어링:
  - 공식 문서: 앱, CLI, IDE에서 실행 중인 subagent를 스티어링하거나 멈추거나 완료된 스레드를 닫으려면 Codex(부모)에게 요청하라고 안내한다. 직접 메시징 인터페이스는 문서에 없다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
  - CLI 레퍼런스: `/subagents`가 subagent 스레드를 살펴보거나 그 작업을 이어갈 수 있게 해준다고 설명한다 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli)
  - 실제 동작(문서와 상충): V2 하위 스레드는 TUI에서 직접 입력이 막혀 있고, app-server의 `turn/start`와 `turn/steer`도 V2 하위 스레드를 거부한다. 2026-10-15에 커뮤니티가 main 브랜치에서 이 가드가 아직 남아 있음을 확인했다 — [GH #33885](https://github.com/openai/codex/issues/33885)
- 권한: subagents는 부모 세션의 샌드박스와 승인 설정을 물려받는다. 커스텀 에이전트 파일로 `sandbox_mode`, `approval_policy`, `model_provider`, `mcp_servers`를 바꿀 수 없다. 비대화형 CLI 실행에서 새 승인이 필요한 동작은 실패하고 에러가 부모로 돌아간다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- 에이전트 간 통신: 공식 subagents 문서는 subagent끼리 직접 메시지를 주고받는지 말하지 않는다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md). 다만 0.164.0 changelog에 에이전트 간 메시지(inter-agent messages)용 라이프사이클 훅과, 에이전트 메시지가 유휴 상태의 루트 세션을 깨우는 기능(피처 플래그 뒤)이 있어서 에이전트 간 메시지라는 개념 자체는 존재한다 — [changelog](https://learn.chatgpt.com/docs/changelog)
- 비용과 권장: 단일 에이전트보다 토큰을 더 쓴다. 탐색, 테스트, 분류, 요약 같은 읽기 중심 병렬부터 시작하라고 권한다. 쓰기 중심 병렬은 충돌과 조정 비용이 생긴다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)

#### 3-5. Codex CLI: 스티어링, 큐, 세션, 대시보드
- 스티어링과 큐 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli); [changelog](https://learn.chatgpt.com/docs/changelog):
  - 작업 중에 Enter를 누르면 현재 턴에 새 지시가 들어간다. Tab을 누르면 프롬프트, 슬래시 명령, 셸 명령이 다음 턴용으로 큐에 쌓인다.
  - 빈 composer에서 Esc를 두 번 누르면 이전 메시지를 고치고 그 지점에서 fork한다.
  - 0.163.0(10/15): 응답 중에 보낸 후속 메시지가 즉시 턴을 스티어링한다. 인터럽트하면 Code Mode 셀과 그 안의 도구 호출도 멈춘다.
  - 0.164.0(10/23): 대기 중인 주입 메시지가 에이전트의 wait와 sleep을 끊을 수 있다. 하위 에이전트가 살아 있는 동안 루트 턴이 일시 중단될 수 있다. 큐에 쌓인 프롬프트는 권한 선택이 끝날 때까지 기다린다.
- 세션 관리 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli); [changelog](https://learn.chatgpt.com/docs/changelog):
  - 재개: `codex resume [SESSION]`(`--last`는 현재 디렉터리 기준, `--all`로 전체), `/resume`, `codex exec resume`.
  - fork: `codex fork [SESSION]` 또는 `--last`, `/fork`(새 ID로 복제하고 원본은 그대로), `codex exec fork`.
  - 새 채팅: `/new [name]`, `/side`(별칭 `/btw`, 별도 transcript를 가진 임시 side chat).
  - 워크트리: `/worktree`, `codex exec --worktree`, `codex fork <SESSION_ID> --worktree`.
  - 0.163.0: resume할 때 권한과 네트워크 승인을 복원한다.
  - 0.164.0: full agent fork가 기본으로 부모 history를 보존한다. 로드되지 않은 subagent 스레드를 TUI에서 고르면 다시 불러온다.
- 백그라운드 터미널: `/ps`(명령과 최근 출력 최대 3줄), `/stop`(별칭 `/clean`). `unified_exec`을 쓸 때만 나타난다 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli)
- 대시보드와 원격 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli):
  - `/agents`와 `codex agents`: 연결된 서버의 채팅을 훑어보고 에이전트를 바꾸는 command center. `--remote <URL>`, `--cd <DIR>`을 받고, `--no-daemon`과는 함께 쓸 수 없다.
  - `codex queue --thread <SESSION> --message "..."`: 기존 세션에 텍스트 메시지를 큐잉한다(`--remote` 지원).
  - 서버·데몬: `codex remote-control`(관리형 백그라운드 서버), `/daemon`, `codex --remote ws://|wss://|unix://`, `codex app-server --listen`.
- 대시보드 세부(제3자, 0.149.0 기준) — [3rd](https://proflead.dev/posts/openai-codex-agents-dashboard-codex-queue/):
  - 화면: "Need input / Working / Ready" 개수, 작업 디렉터리별 그룹, 상세 패널(상태, 프로젝트, 브랜치, 최근 활동), 새 작업 입력란.
  - Enter: 선택한 작업의 전체 transcript를 연다. 거기서 진행을 보고, 질문에 답하고, 승인하고, 지시를 추가할 수 있다. `/agents`로 대시보드에 돌아온다.
  - Ctrl+X: 선택한 작업을 멈춘다.
  - `codex queue`: 작업을 열지 않고도 메시지를 보낸다. 유휴 작업은 깨어나고, 바쁜 작업은 다음 안전 지점에서 처리한다.
  - Codex Cloud 작업은 이 대시보드에서 다루지 않는다.
- subagent 사이 전환 단축키 Option+Left/Right: 치트시트의 주장이며 검증하지 못했다 — [3rd](https://computingforgeeks.com/codex-cli-cheat-sheet/)
- 스레드를 새 터미널에서 여는 명령은 문서에 없다 — [공식문서](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli)

#### 3-6. Codex cloud와 best-of-N
- 작업마다 자체 워크스페이스를 쓰고, 컴퓨터가 잠들어도 계속 돈다. 같은 게시 환경에서 여러 작업을 병렬로 돌릴 수 있다. 웹, 모바일, 데스크톱에서 리뷰하고 이어갈 수 있고, 리뷰 후 후속 변경을 요청할 수 있다(실행 중 스티어링은 설명 없음). 환경 설정은 Codex가 의존성을 설치하고 테스트한 뒤 사람이 Publish한다 — [공식문서](https://learn.chatgpt.com/docs/cloud.md). 문서 색인에 "Internet access controls for Codex Cloud (Legacy)" 항목이 있다 — [llms.txt](https://learn.chatgpt.com/llms.txt)
- best-of-N: `codex cloud exec --attempts N`(1~4, 기본 1). CLI 소스 커밋 미러와 제3자 블로그가 근거이고, 지금 공식 cloud 문서에는 언급이 없다. 가장 좋은 결과를 고르는 방식은 확인하지 못했다 — [3rd](https://codex.danielvaughan.com/2026/04/01/codex-cloud-exec-best-of-n-attempts/); [커밋 미러](https://forge.lthn.ai/core/core-agent-ide/commit/8662162f4515c8fdfbba8dccd2e53543993152f4)

#### 3-7. IDE 확장
- background-agent 패널이 있으면 composer 위에 활성 subagents가 보인다. 펼치면 상태를 보고, 전부 멈추거나, 하나를 열 수 있다 — [공식문서](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)

#### 3-8. Agents SDK와 Agents API
- Agents SDK(4/15): Python과 TypeScript용 subagents와 code mode는 개발 중이다. subagent 실행을 격리된 환경으로 보낼 수 있고, 샌드박스 하나 또는 여러 개에서 병렬로 돌릴 수 있다. human-in-the-loop 관련 언급은 없다 — [OpenAI글](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)
- Agents API(DevDay, 공개 베타): 호스티드 실행, 메모리, 도구, 멀티 에이전트 지원, computer use — [커뮤니티 공지](https://community.openai.com/t/devday-2026-announcements-and-developer-resources/1402006). 검색 요약에서는 Codex의 멀티 에이전트 기능을 Agents API로 가져왔다고 정리됐다 — [InfoQ](https://www.infoq.com/news/2026/10/openai-devday-2026/) (원문은 직접 확인 못 함)

### Inferences
- OpenAI 1st-party 설계는 두 축으로 보인다. 하나는 부모(오케스트레이터) 중심 구조다: 자식은 관찰할 수 있지만 직접 입력은 막는다(V2). 다른 하나는 세션 단위 command center다: `codex agents`, 데스크톱의 탭·분할·"주의가 필요한 다음 채팅", Codex Micro 상태등. 즉 OpenAI는 하위 에이전트와의 직접 대화보다, 서로 독립된 세션 여러 개를 한 화면에서 분류하고 오가는 쪽에 투자하고 있다.
- 사용자가 원하는 기능은 "팀의 일원으로 남은 채 특정 역할 에이전트를 별도 탭이나 창으로 꺼내 직접 협업"이다. 여기에 가장 가까운 1st-party 기능은 다섯 가지다:
  1. CLI `/subagents`: V2에서는 읽기 전용이라는 보고가 있다.
  2. `codex agents`에서 Enter로 세션 transcript 열기, 그리고 `codex queue --thread`로 다른 터미널에서 메시지 넣기.
  3. 데스크톱 딥링크 `codex://threads/<id>`.
  4. `/fork`: 0.164.0부터 full fork가 부모 history를 보존한다. 하지만 새 스레드가 되므로 팀에서 떨어져 나간다.
  5. `/app`: CLI 세션을 데스크톱으로 옮긴다.

  이 가운데 subagent를 독립 터미널 탭으로 꺼내면서 부모와 양방향으로 동기화해 주는 것은 없다.
- Windows Terminal의 `wt new-tab`으로 새 탭을 열고 `codex resume <id>`나 `codex --remote`로 같은 데몬에 붙이는 조합은 기술적으로 가능해 보인다. 하지만 같은 라이브 스레드에 TUI 두 개가 동시에 붙을 수 있는지는 문서에 없으므로 검증이 필요하다(wt CLI 자체는 이번 조사 범위 밖이다).
- 사용자 환경은 Windows 11 Home이다. OpenAI는 Home 에디션에서 쓸 수 없는 Windows Sandbox를 기각하고 자체 승격형 샌드박스를 만들었으므로, Codex 네이티브 샌드박스는 Home에서도 쓸 수 있는 설계다. 다만 처음 설정할 때 관리자 권한이 필요하다.
- 데스크톱의 Ctrl+Alt+A(주의가 필요한 다음 채팅), Codex Micro의 호박색(입력 필요), 대시보드의 Need input / Working / Ready는 OpenAI가 여러 표면에서 공통으로 쓰는 주의력 라우팅 UX 어휘다. 사용자 제품의 에이전트 목록 UI에 그대로 참고할 수 있다.
- subagent 생성 조건이 3월에는 명시적 요청뿐이었다(제3자 설명). 지금은 AGENTS.md나 스킬 지시로도 생성된다(공식문서). 위임이 프롬프트 수준 설정으로 내려왔다는 뜻이고, 사용자가 쓰는 프롬프트 정의 멀티 에이전트 방식과 같은 방향이다.

### Gaps
- 데스크톱 앱에서 채팅이나 에이전트를 별도 OS 창으로 팝아웃하는 기능이 있는지: 명령 문서에 없어 확인하지 못했다.
- MultiAgentV2가 언제 모든 표면의 기본값이 됐는지 공식 릴리스 노트로 확인하지 못했다. 제3자 자료끼리 상충하고(v1 `multi_agent` 기본 활성 시점도 v0.98과 v0.124로 갈림), 커뮤니티는 7~8월에 Desktop에서 V2 전환을 체감했다.
- `codex agents`의 출시 버전(0.149.0)은 제3자 근거다. 공식 changelog의 8월분은 페이지 구조상 볼 수 없었다(10월 항목만 보였다).
- 터미널 두 개 이상이 같은 라이브 세션에 동시에 붙을 수 있는지, 그때 입력 충돌을 어떻게 처리하는지는 문서에 없다.
- Codex Micro의 Windows 지원 여부와 출시일은 확인하지 못했다.
- best-of-N의 앱·웹 UI 현황(2025년 웹 UI에 있던 다중 버전 생성이 지금도 있는지)은 확인하지 못했다.

## 4. OpenAI 엔지니어와 관련 실무자의 실제 병렬 에이전트 워크플로

### Takeaway
공개 자료로 보이는 OpenAI 쪽 실무는 두 갈래다.
- 인터랙티브 병렬: 대표 사례는 Steinberger다. 에이전트 4~10개를 여러 창이나 3x3 그리드에 나란히 띄우고, 대부분 같은 폴더에서 원자적 커밋으로 충돌을 피한다. 오래 걸리면 Esc로 멈추고 상태를 묻는다. subagent보다 별도 터미널 창을 선호하고, 음성으로 지시한다. OpenAI 내부 관찰로는 3~5 세션이 사람의 한계였다.
- 비동기 대량 위임: Symphony 티켓 오케스트레이션, Steinberger 팀이 클라우드에서 돌리는 Codex 인스턴스 약 100개, 하네스 팀의 에이전트 간 리뷰와 백그라운드 정리 작업이 여기에 속한다.

두 갈래 모두 "사람의 주의력이 병목"이라는 데 동의한다. Steinberger는 전 과정을 자동화하는 오케스트레이터에 회의적이고, Symphony 팀은 실행 중 스티어링을 잃었다고 인정했다.

### Cited Findings
#### Peter Steinberger (OpenClaw 창시자, 2026년 2월 OpenAI 합류)
- 2026-02-15 블로그 "OpenClaw, OpenAI and the future" — [steipete.me](https://steipete.me/posts/2026/openclaw). GitHub 프로필에는 OpenAI에서 에이전트를 만들고 있으며 OpenClaw는 독립적인 오픈 프로젝트로 관리한다고 적혀 있다 — [GitHub](https://github.com/steipete)
- ⚠2026 이전(2025-10) "Just Talk To It" — [steipete.me](https://steipete.me/posts/just-talk-to-it); [Simon Willison 요약](https://simonwillison.net/2025/Oct/14/agentic-engineering/):
  - 구성: 에이전트 3~8개를 3x3 터미널 그리드로 병렬 실행한다. 그리드에 쓴 터미널 앱 이름은 밝히지 않았고, Ghostty는 Claude Code 화면 깜빡임 이야기에서만 나온다.
  - 폴더: 대부분 같은 폴더에서 돌린다. 워크트리와 PR 방식을 써 봤지만 같은 폴더가 가장 빠르다며 돌아왔고, 실험만 별도 폴더에서 한다. tmux는 그리드용이 아니라 dev 서버 같은 백그라운드 프로세스용이다.
  - 충돌 회피: 에이전트가 자기가 고친 파일만 스테이징하는 원자적 커밋을 하게 한다(여러 번 다듬은 agents 파일과 커스텀 /commit 사용). 변경을 작게 쪼개 영향 범위(blast radius)를 관리한다.
  - 개입: 오래 걸리면 Esc를 누르고 상태를 물은 뒤 다시 지시하거나, 중단하거나, 계속 두는 쪽을 고른다. Esc 뒤 Enter로 스티어링하고, 관련 작업과 "continue" 메시지를 큐에 쌓아 둔다.
  - 안 쓰는 것: subagents 대신 리서치용 별도 터미널 창(컨텍스트를 직접 통제하려고). MCP는 대부분 CLI로 대체. plan mode와 spec-driven 방식은 필요 없다고 봄. Conductor, Terragon 같은 오케스트레이션 래퍼는 얻는 게 적다고 봄.
  - Codex를 주력으로 쓴 이유: 행동 전에 파일을 더 많이 읽고, 컨텍스트를 효율적으로 쓰고, 메시지 큐잉이 안정적이라서.
- 2026 Lex Fridman 인터뷰(에피소드 날짜는 페이지에서 확인 못 함) — [Lex Fridman 전사](https://lexfridman.com/peter-steinberger-transcript/):
  - 컨디션과 작업 난도에 따라 대략 4~10개 에이전트를 동시에 돌리고, 여러 창을 나란히 두는 데 익숙하다.
  - "워키토키 버튼"으로 음성 지시를 너무 많이 해서 목이 쉰 적이 있다.
  - IDE는 주로 diff 뷰어로 쓴다. 오래 걸리면 Esc로 멈추고 다시 생각한다.
  - revert하지 않고 에이전트에게 고치라고 한다. main에 바로 커밋하고, main은 언제나 출하 가능해야 한다고 본다.
  - Gas Town처럼 전 과정을 자동화하려는 오케스트레이터에는 회의적이다. 폭포수 모델에 비유하고, 프로젝트에 대한 이해는 만들면서 바뀐다고 말한다.
- 2026-05(2차 보도, 그의 X 게시물 인용) — [The Decoder](https://the-decoder.com/for-1-3-million-a-month-openclaw-founder-peter-steinberger-runs-100-ai-agents-that-code-review-prs-and-find-bugs/); [Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/openclaw-creator-burns-through-1-3-million-in-openai-api-tokens-in-a-single-month):
  - 약 3명 팀이 클라우드에서 Codex 인스턴스 약 100개로 OpenClaw를 운영한다.
  - 에이전트가 하는 일: PR 리뷰, 커밋 보안 스캔, 중복 이슈 정리와 수정 작성, 벤치마크 회귀를 Discord로 보고, 회의를 듣고 논의된 기능의 PR 생성.
  - 30일 API 비용 약 130만 달러(6,030억 토큰, 요청 760만 건, 주 모델 GPT-5.5, 비용은 OpenAI 부담). Fast Mode만 꺼도 70%를 줄일 수 있다고 했다.
  - 오케스트레이션과 사람의 개입 방식은 보도에 나오지 않는다.

#### OpenAI 내부 팀
- 하네스 팀: 1절 참조(에이전트 간 리뷰, 백그라운드 정리, 사람은 우선순위·수용 기준·검증 담당) — [OpenAI글](https://openai.com/index/harness-engineering/)
- Symphony 팀: 엔지니어 대부분은 3~5 세션이 한계라서 티켓 단위 위임으로 바꿨다. 판단이 많이 필요한 작업은 인터랙티브 세션에서 한다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)
- 앱 출시 시점: OpenAI는 automations로 일일 이슈 분류, CI 실패 요약, 릴리스 브리프, 버그 점검을 한다. 지난 한 달 동안 Codex를 쓴 개발자는 100만 명 이상이고, 전체 사용량은 12월 중순 GPT-5.2-Codex 출시 이후 두 배가 됐다 — [OpenAI글](https://openai.com/index/introducing-the-codex-app/)
- Brockman 2/6 지침: 1절 참조 — [Thread Reader](https://threadreaderapp.com/thread/2019566641491963946.html)

#### Alexander Embiricos (Codex 제품 리드)
- 앱 출시 브리핑: 개발자들이 모델과 페어 코딩하던 방식에서 기능 전체를 맡기는 방식으로 옮겨 갔고, 에이전트들이 독립적으로 돌아서 일일이 관리할 필요가 없다는 취지로 말했다. 에이전트마다 git worktree가 따로 붙는다. 검색 요약 기반이며 원문은 읽지 않았다 — [VentureBeat](https://venturebeat.com/orchestration/openai-launches-a-codex-desktop-app-for-macos-to-run-multiple-ai-coding)
- Lenny's Podcast: 지금 주된 병목은 모델 능력이 아니라 사람의 타이핑과 리뷰 속도라고 말했다 — [2차 요약](https://fractionalcto.com.ar/lenny/episode/alexander-embiricos)
- 2026-01 How I AI: 워크트리로 같은 저장소에서 두 변경을 병렬로 진행했다 — [ChatPRD 요약](https://www.chatprd.ai/how-i-ai/advanced-codex-workflows-with-openai-alex-embiricos)

### Inferences
- Steinberger가 subagent 대신 별도 창을 고른 것은 사용자의 "팝아웃" 아이디어를 실무자가 손으로 구현한 셈이다. 직접 통제할 수 있는 창 단위 세션을 전문가가 선호한다는 뜻이다. 다만 그 방식에서는 공유 컨텍스트와 종합 에이전트, 즉 "팀"이 사라진다. 사용자 제품은 창 단위 직접 통제와 팀 컨텍스트 유지를 결합하는 지점에 있다.
- Symphony 팀의 3~5 세션과 Steinberger의 4~10 세션(컨디션에 따라 다름)은 같은 결론을 가리킨다: 사람이 동시에 실시간으로 대화할 수 있는 에이전트 수는 한 자릿수다.
- 100개 규모의 대량 병렬은 모두 비대화형 백그라운드 작업이다. 사람은 PR이나 Discord 보고 같은 결과물 단위로만 개입한다.

### Gaps
- Thibault Sottiaux, Romain Huet 등 Codex 팀원의 2026년 공개 워크플로(동시 에이전트 수, 터미널 구성)는 찾지 못했다.
- Steinberger가 OpenAI에 합류한 뒤의 터미널 구성(Ghostty, tmux 등)에 대한 1차 자료는 확인하지 못했다. "3x3 그리드"는 2025-10 자료다.
- 2026년판 "How OpenAI uses Codex" 자료는 찾지 못했다.

## 5. 병렬 에이전트, Windows, 개별 스티어링, subagent 가시성 관련 페인 포인트 (GitHub 이슈 등)

### Takeaway
가장 큰 페인 포인트는 MultiAgentV2 이후 하위 에이전트 스레드가 읽기 전용이 됐다는 점이다. 사용자는 subagent 하나에 직접 교정이나 후속 지시를 줄 수 없고 부모를 거쳐 전달해야 한다(#33885, #34377, 커뮤니티 스레드). OpenAI는 9월에 요청을 전달하겠다고만 답했고 일정은 내놓지 않았다. 10월 중순까지 이 가드는 그대로다. 사용자가 겪는 문제와 정확히 같은 문제이며, #34377의 요구사항 목록은 사용자 제품의 요구사항 명세로 거의 그대로 쓸 수 있다.

### Cited Findings
- #33885 (2026-07-17 개설, Open, 라벨 enhancement·subagent) — [GH](https://github.com/openai/codex/issues/33885):
  - 증상: V2 하위 스레드를 TUI에서 볼 수는 있지만 직접 입력이 막혀 있다. app-server의 `turn/start`와 `turn/steer`도 V2 하위 스레드를 거부한다. PR #27173이 app-server 거부를, PR #33841이 TUI 읽기 전용을 넣었다.
  - OpenAI 측 조치: 원래 제목은 "Regression…"이었는데 2026-07-21 etraut-openai가 enhancement로 다시 분류하고 제목을 바꿨다. 이유는 설명하지 않았다.
  - 요구: 사용자가 명시적으로 고른 자식은 입력을 받는다. 유휴·완료 자식은 turn/start, 활성 자식은 turn ID를 검증한 turn/steer를 받는다. TUI가 자식과 부모를 표시한다. 기본 입력 대상은 부모로 둔다. 직접 교정은 자식 rollout에 읽을 수 있는 형태로 저장한다.
  - 부모를 거치는 전달의 비용: 턴을 낭비하고, 감사 기록에서 읽을 수 없는 암호화 릴레이가 생긴다(#28058).
  - 커뮤니티 의견: 부모 명령과 사용자 입력이 동시에 들어오는 문제에 세대(epoch) 검사를 쓰자는 제안(8/18), Claude Code Agent Teams처럼 자식을 직접 대화 상대로 다루자는 제안(9/24), 10/15에 main에서 가드가 여전히 있다는 확인.
- #34377 (2026-07-20, Open, 라벨 app·enhancement·subagent) — [GH](https://github.com/openai/codex/issues/34377):
  - 제목: 부모를 방해하지 않고 subagent 스레드와 직접 대화하게 해 달라. 현재 inspector는 주로 읽기 전용 활동 뷰라고 지적한다.
  - 요구:
    - subagent 뷰에 composer를 두고, 메시지는 그 subagent에만 간다(부모 인터럽트나 형제에게 브로드캐스트 없음).
    - "Send to: Parent / Subagent: name" 형태로 대상을 표시한다.
    - Queue와 Interrupt를 subagent 단위로 고른다.
    - 답변은 subagent 스레드에 남기고, 부모에게는 원하면 요약만 보낸다.
    - 스레드를 바꿔도 초안, 큐, 실행 상태가 보존된다.
  - 이전 앱 버전에 있던 상호작용을 되돌려 달라는 주장이다.
  - 유스케이스: subagent 하나가 수식을 잘못 읽거나 엉뚱한 구현을 검증할 때, 부모를 거쳐 전달하면 지연이 생기고 부모 컨텍스트가 소모된다.
  - OpenAI 응답은 없다. 9/5에 커뮤니티 사용자가 subagent를 레거시 전체 작업 뷰로 다시 여는 제3자 npm 우회책을 링크했다.
- 커뮤니티 스레드(2026-08-18) — [OpenAI 커뮤니티](https://community.openai.com/t/codex-regression-v2-subagents-cannot-receive-user-follow-ups/1391127):
  - 증상: multi_agent_v2로 바뀐 뒤 subagent에 직접 후속 메시지를 보낼 수 없다(v1에서는 됐다고 함). 주로 Codex Desktop 이야기다.
  - 우회책: `multi_agent_v2 = false` 설정 등은 절반 정도만 먹히고, 이미 생성된 subagent가 V2로 바뀌기도 한다. `npx codex-v1-subagents`(9/5 공개, Windows용, 실행 중인 프로세스만 런타임에 패치).
  - OpenAI_Support(9/8): 부모를 거치지 않고 subagent를 직접 스티어링하게 해 달라는 요청을 전달하겠다, 공유할 일정은 없다.
- 기타 이슈(제목과 검색 요약 수준으로만 확인):
  - #31178: 부모 스레드 후속 메시지가 큐에 쌓이고, 인터럽트된 subagent 결과가 드러나지 않아 subagent 워크플로가 직렬처럼 느껴진다 — [GH](https://github.com/openai/codex/issues/31178)
  - #47762: wait_agent를 호출하기 전에 스티어링하면 subagent 결과가 돌아오지 않는다 — [GH](https://github.com/openai/codex/issues/47762)
  - #21027: subagent 사이 공유 워크스페이스·메시지 버스 요청 — [GH](https://github.com/openai/codex/issues/21027)
  - #32909: `/subagents`가 인터랙티브 스레드 선택기를 띄우지 않는다 — [GH](https://github.com/openai/codex/issues/32909)
  - #41935: 데스크톱에서 작업마다 subagent 능력이 달라지는데 고르는 컨트롤이나 UI 구분이 없다. 공식 문서는 데스크톱 subagent 목록을 읽기 전용, 스티어링은 부모 경유로만 설명한다 — [GH](https://github.com/openai/codex/issues/41935)
  - Discussion #9724: subagent를 열어서 직접 상호작용하고 싶다는 요청 — [GH](https://github.com/openai/codex/discussions/9724)
  - #34377이 참조하는 관련 이슈: #12047(멀티 에이전트 TUI 개편과 @mention 메시징), #33330(사용자가 subagent 오케스트레이션을 직접 제어하던 방식 복원) — [GH](https://github.com/openai/codex/issues/34377)
- 2026-03 시점 제3자 정리 — [3rd](https://codex.danielvaughan.com/2026/03/29/subagent-gotchas-known-issues/):
  - #15250: 커스텀 TOML 에이전트를 이름으로 호출할 수 없다.
  - #15177: 자식 스레드에 엉뚱한 모델이 표시된다.
  - 스레드 6개 상한을 피하려고 max_threads=4를 권장했다.
- V2 모델·비용 관련: V2에서 subagent의 역할, 모델, 추론 설정을 되살려 달라는 요청(검색 결과로만 확인) — [OpenAI 커뮤니티](https://community.openai.com/t/restoring-subagent-roles-model-and-reasoning-in-multi-agent-v2/1386513). 오케스트레이터가 자기 복제본을 여럿 만드는 모델 라우팅 비용 문제 — [3rd 7/24](https://codex.danielvaughan.com/2026/07/24/codex-cli-sub-agent-model-routing-multi-agent-v2-hidden-schema-cost-control-configuration/)
- Windows 관련(공식 문서의 문제 해결 항목, 자세한 내용은 3-3): Git 필수, `\\wsl$` 경로의 Git 미감지, 관리자 권한, PowerShell 실행 정책, WSL CLI와 앱의 설정·세션 비공유, WSL1 미지원 — [공식문서](https://learn.chatgpt.com/docs/windows/windows-app.md). Windows 샌드박스 설정에는 관리자 권한이 필요하다 — [OpenAI글](https://openai.com/index/building-codex-windows-sandbox/). 10월 패치(붙여넣기, WinGet 데몬 설치, 프록시 인증) — [changelog](https://learn.chatgpt.com/docs/changelog)
- Symphony 쪽 페인: 티켓 단위로 맡기면 실행 중 교정이 안 되고, 가끔 완전히 빗나간다 — [OpenAI글](https://openai.com/index/open-source-codex-orchestration-symphony/)

### Inferences
- V1(직접 상호작용 가능)에서 V2(자식 읽기 전용)로 바꾼 이유를 OpenAI는 공식적으로 설명하지 않았다. 다만 이슈 논의(부모 명령과 사용자 입력의 동시성, 낡은 부모 명령, 감사 기록, 스레드 상태 일관성)를 보면 "자식을 지휘하는 건 부모뿐"이라는 불변식을 지키려는 선택으로 보인다. 사용자 제품이 직접 대화를 허용하려면 다음을 설계해야 한다. 체크리스트는 #33885와 #34377의 요구사항 그대로다:
  - 메시지 대상 표시.
  - 에이전트별 queue/interrupt 선택.
  - 부모 명령과 사용자 입력이 충돌할 때의 epoch(세대) 검사.
  - 직접 나눈 대화를 부모(종합 에이전트)에게 요약해 전달하는 경로.
  - 감사 가능한 기록.
- 커뮤니티가 런타임 패치(npm)까지 만들어 쓴다는 것은 수요가 강하다는 신호다. 특히 Windows Desktop 사용자 쪽이다.
- Windows 전용 멀티 에이전트 버그 보고는 찾지 못했다. Windows 고유 문제는 주로 셸, 샌드박스, WSL 경계에서 생긴다.

### Gaps
- #31178, #47762, #21027, #32909, #41935는 원문을 열지 않고 제목과 검색 요약만 확인했다. 개설일과 현재 상태는 모른다.
- 이슈 반응 수(👍) 같은 수요 지표는 페이지에서 보이지 않았다.
- Windows Terminal 탭·창 통합(예: 새 터미널에서 스레드 열기)을 요청하는 이슈는 찾지 못했다.
