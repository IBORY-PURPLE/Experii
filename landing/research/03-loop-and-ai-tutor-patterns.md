# 03. 학습 루프 · 리마인드 · AI 튜터 대화를 랜딩에서 보여 주는 방법

- **작성**: 리서치 에이전트 3/3, 2026-10-26
- **기준 문서**: `docs/archive/landing-prd-v0.1.md` (6장 핵심 루프, 7장 금지 표현, 10장 섹션 4 "작동 방식"), `landing/TSD.md` (6.2 `LoopStepper`, 11장 접근성, 12장 성능 예산)
- **보여 줄 한 컷**: SQLD 공부 대화 → 실제 현장 과제 풀기 → 푼 경험을 면접 답변 한 줄로 저장 → 1·7·30일 리마인드로 체화
- **조사 방법**: WebFetch, curl로 받은 원본 HTML·CSS 읽기, 같은 세션에서 찍은 참고 스크린샷(`scratchpad/refshots`)을 직접 확인. openai.com과 chatgpt.com은 headless 캡처가 Cloudflare 인증 화면에 막혔다. 그래서 curl HTML과 내장 브라우저 관찰 메모(`openai-notes.md`, `openai-d00~02.jpg`)로 대신했다.

---

## 0. 결론 먼저

1. **대화가 카드로 바뀌는 장면은 "1. 대화 / 2. 결과" 2단 탭이 가장 정확하다.** claude.com 제품 소개 페이지가 쓰는 방식이다. 대화 패널과 결과물 패널을 탭으로 나누고, 결과 패널에 "이 대화로 시작하기" 링크를 단다. Experii는 여기에 단계를 하나 더해 `대화 → 과제 → 카드` 3단으로 쓰면 된다.
2. **루프는 원형 다이어그램 대신 "왼쪽 단계 목록 + 오른쪽 폰 화면에서 해당 요소가 앞으로 튀어나오는" 방식으로 그린다.** 토스 자산 섹션의 방식이다. 마지막 단계(30일 알림)를 누르면 ③의 경험 카드가 다시 열리게 해서, 화면 전환만으로 루프가 닫히는 걸 보여 준다.
3. **시간 경과는 "시간 라벨이 붙은 카드 스택"으로 보여 준다.** claude.com은 하루 일과 카드를 드래그나 화살표 키로 넘기고, 카드마다 "8:00 AM" 같은 시간 라벨을 단다. Experii는 잠금화면 알림 3장을 `공부 1일 뒤 · 배운 점`, `7일 뒤 · 활용 방안`, `30일 뒤 · 면접 예상 질문` 스택으로 만든다.
4. **방문자 참여는 "추천 질문 칩 클릭 → 미리 써 둔 대화 재생"까지만 한다.** openai.com 홈의 칩, Claude 교육 페이지의 질문 카드와 같은 방식이다. 자유 입력이나 실제 GPT 호출은 하지 않는다. TSD 1.2가 GPT·Claude 연동 실연을 범위에서 뺐기 때문이다(H4 `[확인필요]`).
5. **모든 움직임은 CSS transition과 IntersectionObserver로 충분하다.** 레퍼런스 중 가장 손이 많이 간 Readwise도 라이브러리 없이 CSS keyframes, `offset-path`, IntersectionObserver만 쓴다. TSD 12장(애니메이션 라이브러리 금지, 첫 로드 JS 150KB 이하)과 맞는다.
6. **가장 흔한 함정은 "JS가 늦거나 꺼졌을 때 빈 화면"이다.** Aside 히어로는 캡처 시점에 대화창이 비어 있었다. bragdoc은 서버가 그린 HTML에 `opacity:0`이 인라인으로 박혀 있다. 첫 프레임을 완성된 상태로 그리고, 애니메이션은 완성 상태에서 거꾸로 출발시킨다.

---

## 1. 이 문서가 지키는 전제

| 출처 | 내용 | 이 문서에 미치는 영향 |
|---|---|---|
| PRD 6장 | 루프 4단계: 학습 대화 → 현장 과제 → 경험 카드 저장 → 1·7·30일 리마인드 | 장치 제안은 이 4단계 안에서만 한다 |
| PRD 5장 F5 | 알림 내용은 배운 점, 활용 방안, 면접 예상 질문과 예시 답변 | 알림 3장의 내용은 이 세 가지로 고정한다 |
| PRD 7장 | "면접 준비 끝", "합격 보장", "최고·1위·유일" 금지 | 알림·카드 예시 문구에도 똑같이 적용한다 |
| TSD 6.2 | 탭 4개 + 패널 1개, 사용자가 눌러야만 넘어감(WCAG 2.2.2), JS가 없으면 4단계를 세로로 모두 표시, 모든 목업에 "예시 화면" 배지 | 자동 재생 장치는 레퍼런스로만 보고 그대로 가져오지 않는다 |
| TSD 11·12장 | CSS로 그린 폰 프레임, 래스터 이미지 없음, 애니메이션 라이브러리 없음, LCP는 히어로 제목, INP 200ms 이하 | 영상·Lottie·Rive는 제외. CSS와 작은 JS만 쓴다 |

**짚어 둘 충돌**: 사용자 요청에는 "Experii 화면에서 GPT를 연동해 학습을 돕는 화면"이 있다. TSD 1.2는 "GPT·Claude 연동 실연"을 H4 미확인을 이유로 범위에서 뺐다. 이 문서는 **실제 API 호출 없이 미리 써 둔 대화를 재생하는 데모**를 기본안으로 쓴다. 실제 호출을 붙일지는 디자인·개발 단계에서 따로 정해야 한다(5.4 참고).

---

## 2. 사이트별 관찰

### 2.1 Readwise (readwise.io): 다시 꺼내 주는 제품의 정석

스크린샷 `readwise-d00~d07`, `m00~m01`과 원본 HTML·CSS(`new-landing.css`)를 확인했다.

- **히어로**: 하이라이트 카드(책 표지, 인용문, 아이콘 줄)가 사선 경로를 따라 흘러가 제품 화면 쪽으로 빨려 든다. CSS `offset-path`와 `offset-distance`를 쓰는 `landing-hero-card-travel` keyframes다. 회전·기울임 값이 구간마다 바뀐다. 모바일은 경로가 짧은 별도 keyframes(`landing-hero-card-mobile`)를 쓴다.
- **제품 보여 주기**: 데스크톱은 "Library" 창과 폰을 겹쳐 놓는다. 폰에는 "Daily Review" 카드, 오늘의 리뷰 진행도("0 of 2 Reviews done for today"), 연속 기록 숫자가 있다. 모바일(`m00`)에서는 데스크톱 창을 빼고 **폰 하나만** 남긴다. 매일의 리뷰 의식이 곧 히어로 이미지가 된다.
- **3단계 타일**: Import Highlights → Review → Remember. 아이콘 + 제목 + 두 줄짜리 선형 나열이다. 모바일(`m01`)에서는 세로로 길게 늘어질 뿐 새로 알려 주는 게 거의 없다. Experii가 피해야 할 "4아이콘 다이어그램"의 실제 예다.
- **Remember 섹션**: spaced repetition을 설명문 한 줄과 리뷰 카드 한 장으로 끝낸다. 카드 아래에는 실제 앱의 응답 버튼(Discard·Master·Frequency·Keep)이 그대로 있다. 망각 곡선 같은 그래프는 쓰지 않는다.
- **AI 대화 장면**: 입력창에 "Read my [Readwise] highlights…"가 한 글자씩 쳐지고, 문장 중간에 브랜드 pill이 끼어든다(`d07`). 동작 조건은 원본 스크립트에서 확인했다.
  - IntersectionObserver `threshold: 1`, `rootMargin: '0px 0px -15% 0px'`. 입력창 전체가 화면에 여유 있게 들어왔을 때 한 번만 시작한다.
  - 30ms마다 한 글자씩 쓴다. `prefers-reduced-motion: reduce`이면 처음부터 전체 문장을 보여 준다.
  - 타이핑되는 `<p>`는 `aria-hidden="true"`이고, 같은 내용을 옆 이미지의 alt가 설명한다.
- **채팅 응답 장면**: Claude 대화 목업 안에 "Loaded tools, used Readwise integration" 같은 도구 사용 상태줄을 넣어, 답이 내 기록에서 나왔다는 걸 보여 준다(`d06`).
- **모바일 카드 캐러셀**: 1100px 이하에서 "Do more" 카드 3장이 가로 스냅 캐러셀이 된다. 각 카드는 스냅되어 60% 이상 보일 때마다 다시 애니메이션된다(IntersectionObserver `root`가 캐러셀). 아래 점 표시가 스크롤 위치를 따라간다.
- **통계 카드**: 막대가 `--i * 70ms` 간격으로 차례로 자란다(`landing-bar-grow`).
- **움직임 정책**: 모든 등장 애니메이션이 `@media (prefers-reduced-motion: no-preference)` 안에 있다. CSS 주석에 "Reader 랜딩 패턴을 옮겨 둔 것, 디자이너가 남기거나 지우라"는 취지의 설명이 있다.
- **마지막 CTA**: 히어로의 하이라이트 카드가 투명도 0.34로 배경에 다시 깔린다. 시작과 끝을 같은 소재로 묶는 구성이다.

### 2.2 spaced repetition 계열: Anki, RemNote, Nicky Case

- **Anki (apps.ankiweb.net)**: 랜딩은 텍스트 위주로 아주 단순하다. 핵심 설명은 "기억 정도를 고르면 잊어버리기 직전에 다음 복습을 잡아 준다"는 한 문장뿐이다. 시각 장치는 참고할 게 없다. 현재 데스크톱 버전 26.09.3을 확인했다.
- **RemNote (remnote.com)**: 히어로에 실제 PDF 드롭존("Drop your PDFs here")이 있다. 입력 하나가 출력 넷(플래시카드·퀴즈·요약·숙달도)으로 갈라지는 구조다. "Exam Scheduler"는 시험 날짜를 넣으면 날마다 공부할 걸 알려 준다고 설명한다. 시간 축을 문장으로만 처리한다.
- **Quizlet (quizlet.com)**: 섹션 이름을 기능명이 아니라 시점으로 붙인다. START STRONG(입력) → STAY ON TRACK(작은 습관, 다시 돌아오게) → FINISH STRONG(시험 날). 루프를 "언제"의 순서로 읽게 하는 방식이다.
- **Nicky Case, "How To Remember Anything Forever-ish" (ncase.me/remember, 2018-10)**: 오래된 자료지만 spaced repetition을 가장 잘 체험시키는 인터랙티브 해설이다. 읽는 사람이 망각 곡선의 감쇠 속도를 슬라이더로 바꾸고, 복습 시점 마커를 드래그해 곡선이 다시 올라가는 걸 본다. Leitner 상자에서 카드가 단계를 오르내리고, 일·주·월 단위로 시뮬레이션을 넘겨 본다. 랜딩 한 섹션에 넣기에는 무겁다. 그래도 "드래그한 만큼 시간이 흐른다"는 아이디어는 쓸 만하다.

### 2.3 Duolingo: 알림·연속 기록 루프

- duolingo.com 홈은 클라이언트 렌더링이라 curl·WebFetch로 내용을 읽지 못했다. 스크린샷도 없다. 아래는 공식 블로그와 2026년 기사 기준이다.
- **위젯 (공식 블로그, 2023-08-29)**: 홈 화면 위젯은 "연속 기록이 위험한지"라는 정보 하나만 보여 줄 때 가장 효과가 좋았다고 한다. 하루 중 시간대와 레슨 완료 여부에 따라 Duo 캐릭터의 표정이 바뀐다. 자정에 가까워질수록 다급해진다. 잠금화면 위젯도 있다. 시간을 숫자 대신 **같은 물체의 상태 변화**로 보여 주는 예다.
- **마일스톤 (공식 블로그, 2022-01-21)**: 7일·30일·100일 같은 기념일에 캐릭터가 변신하는 애니메이션과 공유 카드를 만들었다. 불꽃 은유가 모든 문화권에서 통하지 않아 피닉스로 바꿨다고 한다.
- **2026년 반응 (Android Authority, 2026-06-02)**: 연속 기록이 동기 부여가 아니라 압박이 됐다는 비판이 나온다. 필자는 지금 구조를 "hostage situation with push notifications"라고 부르고, 휴가 모드를 요구한다. Experii의 톤 키워드 "귀찮지 않은"과 정반대인 사례로 기억해 둘 만하다.

### 2.4 bragdoc (bragdoc.ai): 기록이 경력 문서가 되는 과정

- **히어로 문장 자체가 파이프라인이다.** Commits(파랑) → Achievements(보라) → Workstreams(남색) → Documents(초록). 명사마다 고유색을 주고, 아래 섹션의 깔때기 그림에도 같은 색을 다시 쓴다. 깔때기 옆 문장은 "수천 개 커밋 → 수백 개 성과 → … → 문서"로 줄어드는 숫자와 함께 한 줄씩 오른쪽에서 밀려 들어온다. 줄마다 왼쪽 여백을 -10%, -20%로 늘려 계단 모양을 만든다.
- **시간 흐름**: "Recent Achievements" 목업에 "2 days ago", "3 days ago", "1 week ago"와 "127 commits analyzed · Last 30 days"가 붙어 있다. 정적인 목록인데도 기록이 쌓여 온 기간이 읽힌다.
- **함정**: 깔때기 문장들이 서버 HTML에 `style="opacity:0;transform:translateX(20px)"`로 들어 있다. JS가 늦게 돌거나 실패하면 이 핵심 설명이 보이지 않는다.
- **진입 장벽**: CLI 설치(`npm install -g`)와 계정 생성 2단계를 랜딩에 그대로 보여 준다. PRD 8장이 말한 대로 "귀찮지 않은"을 설명할 때 대비 사례로 쓸 수 있다. 다만 PRD 7장에 따라 경쟁사를 깎아내리는 문구로는 쓰지 않는다.

### 2.5 ChatGPT Study Mode, openai.com, chatgpt.com

- **소개 글 (openai.com/index/chatgpt-study-mode, 2025-07-29)**: "Ways to use study mode" 영역에 학생 이름과 과목(게임 이론, 회계, 베이즈 정리, 이산수학) 탭이 있다. 탭마다 실제 대화 전문이 텍스트로 들어 있다(`role="tablist"`). 첫 사용자 메시지가 길고 구체적이고, 답변은 단계별 계획으로 시작한다. 대화를 영상이 아니라 **읽을 수 있는 텍스트**로 보여 준다.
- **기능 페이지 (chatgpt.com/features/study-mode)**:
  - "How to use study mode" 탭 2개("숙제 문제 풀기", "시험 대비")가 Vimeo iframe 화면 녹화다. 음소거 자동재생에 컨트롤이 없다(`controls=0&muted=1`).
  - "Get inspired by real chats"는 프롬프트 카드 묶음이다. 카드마다 첨부파일 칩(Rubric.pdf, Class notes.pdf 등)이 붙어 있다. DOM에 같은 묶음이 3번 반복돼 무한 가로 흐름으로 보이지만, 실제로 움직이는지는 확인하지 못했다.
- **openai.com 홈 (2026-10-26)**:
  - 히어로가 곧 제품 입력창이다. 질문형 헤드라인 아래 큰 라운드 `<textarea>`가 있다. placeholder가 몇 초마다 바뀐다(HTML에서 "Quiz me on vocabulary", 내장 브라우저 캡처에서 "Teach me Mahjong for beginners"를 확인). 아래에는 pill 칩 5개가 있다.
  - 그 아래 "GPT-6 with Intelligent UI" 카드는 사용자 말풍선("Show me the solar system", "I want to build a bike")과 그 답으로 생성된 미니 UI(태양계, 자전거 도면, 차트)가 세로로 번갈아 흐른다. 관찰 메모상 자동 스크롤이다. **대화 → 결과물**을 한 프레임에 보여 주는 가장 직접적인 예다.
- **chatgpt.com/overview**:
  - 헤드라인 "Now you can chat, work & code…"에서 chat·work·code 세 단어가 각각 `<button aria-pressed>`다. 단어를 누르면 아래 아트워크와 설명 패널이 바뀐다. 글자마다 색이 칠해지는 효과가 있다.
  - `<h1 aria-label="…전체 문장…">`을 주고 글자 단위 span은 `aria-hidden`으로 숨긴다. 글자 분할 애니메이션의 접근성 처리 모범이다.
  - 히어로 아트는 CSS 변수(`--overview-intro-opacity`, scale)로 스크롤에 따라 사라진다. 소스로 추정한 것이고 직접 보지는 못했다.

### 2.6 Claude: 학습 모드와 제품 소개 페이지

- **학습 모드 (anthropic.com 발표, 2025-04)**: 답을 바로 주지 않고 "이 문제를 어떻게 접근해 보겠어요?"처럼 되묻는 소크라테스식 질문을 쓴다고 설명한다. 학습 모드만 다루는 전용 랜딩은 찾지 못했다.
- **교육 페이지 (claude.com/solutions/education)**: "How can I help?" 질문 카드 3장 캐러셀("1 of 3")이 있다. 각 카드에 미리 쓴 구체적 요청과 "Ask Claude" 버튼이 있다. 누르면 새 탭에서 실제 제품으로 간다.
- **제품 소개 (claude.com/product/overview)**: 이 조사에서 Experii와 가장 잘 맞는 레퍼런스다.
  - "Put Claude to work" 섹션의 각 예시가 **"1. The conversation" / "2. The result"** 2단 탭이다(`role="tablist"`, `aria-selected`, `aria-controls`).
  - 대화 패널 구성: 사용자 요청 말풍선 → 모델 칩("Opus · High") → 지금 하는 생각 한 줄 → 단계 체크리스트 → 반복 설정 줄 → 출처 칩("From Calendar", "From Slack"). 반복 설정 줄은 "Now standing: after every meeting this week"처럼 시간 반복을 나타낸다.
  - 결과 패널에는 결과물 그림과 "Try it in Claude" 링크(`claude.ai/new?q=요청문`, UTM 포함)가 있다.
  - 예시 카드들은 스택으로 겹쳐 있다. 스택에는 `role="group"`, `aria-roledescription="stack"`, `tabindex="0"`과 "드래그하거나 화살표 키로 넘긴다"는 aria-label이 있다. 맨 위가 아닌 카드 패널에는 `inert`가 걸려 있다. 현재 카드는 `sr-only aria-live="polite"` 문단 하나로만 알린다.
  - 카드 위 라벨이 "8:00 AM · Product"처럼 **시각과 역할**을 함께 보여 준다. 하루 일과가 흐르는 느낌을 만든다.
  - 섹션 제목은 단어마다 등장 시점이 어긋나게 나타나고(`--word-index`), h2에 전체 문장 aria-label을 단다.
- 스텝 패널이 저절로 넘어가는지는 소스만으로 판단하지 못했다. `data-loomstep-gated` 속성으로 보아 화면에 보일 때만 움직이게 막는 장치가 있는 것으로 추정한다.

### 2.7 같은 폴더의 다른 스크린샷에서 건진 장치

- **토스 (toss-d05~d09)**:
  - 화면 왼쪽에 세로 눈금형 진행 표시가 고정돼 있다.
  - "자산을 관리하는 일은 한껏 단순하게" 섹션은 왼쪽 아코디언 4개와 오른쪽 기울어진 폰으로 이뤄진다. 항목이 펼쳐지면 폰 속 해당 카드("카드값 나가기 3일 전 · 계좌 잔액 부족")가 화면 밖으로 떠오르고 나머지는 흐려진다.
  - 송금 장면은 전체 화면 영상이 스크롤에 따라 둥근 카드로 줄어들고, 폰 화면은 로딩에서 체크 표시로 바뀐다.
- **Cursor (cursor-d00, m00)**: 제품 창이 3단이다. 왼쪽 작업 목록에는 "now / 10m / 30m / 45m" 상대 시간이 붙어 있다. 가운데 대화에는 "Thought 4s", "Read AppManager.tsx" 같은 진행 로그가 있고, 오른쪽에는 생성된 문서가 열린다. 모바일에서는 데스크톱 창을 오른쪽만 잘라 보여 줘서 대화 내용이 읽히지 않는다.
- **Aside (aside-d00, HTML)**: 히어로가 브라우저 창 목업이다. "Working for 3m 46s" 같은 작업 상태줄에 반짝이는 그라디언트 텍스트 효과를 준다. 그런데 캡처된 프레임에서는 대화 본문이 비어 있었다. 페이지 하단에 "ChatGPT·Claude 구독을 그대로 쓰라"는 안내가 있다. PRD 6장이 참고한 ASIDE 방식의 근거다.

---

## 3. 장치 카탈로그

표의 "트리거"는 무엇이 움직임을 시작시키는지다. "Experii에서는"은 TSD 6.2의 예시 데이터(`content/loop.ts` 초안)를 기준으로 썼다.

### (a) 대화가 결과물(카드)로 바뀌는 장면

| # | 장치 | 레퍼런스 | 트리거 | Experii에서는 |
|---|---|---|---|---|
| A1 | **단계 탭: 대화 → 결과** | claude.com 제품 소개 "1. The conversation / 2. The result" | 탭 클릭, 화살표 키 | 폰 안에 3단 미니 탭 `대화 · 과제 · 카드`. TSD의 `LoopStepper` 4탭 중 ①~③과 1:1로 맞추면 탭을 두 겹으로 만들 필요가 없다 |
| A2 | **말풍선과 생성물이 번갈아 흐르는 세로 피드** | openai.com "GPT-6 with Intelligent UI" 카드 | 자동 스크롤(관찰 메모) | 자동 스크롤은 빼고 한 화면에 정지 상태로 둔다. 사용자 말풍선 "LEFT JOIN이랑 INNER JOIN 차이가 헷갈려" → AI 설명(테이블 두 개) → **과제 카드**가 말풍선 대신 카드 모양으로 끼어든다. 생성물을 말풍선과 다른 모양(테두리·그림자 있는 카드)으로 그려야 "대화가 물건이 됐다"는 게 읽힌다 |
| A3 | **진행 상태줄** | Claude "지금 하는 생각" 한 줄, Cursor "Thought 4s / Read …", Aside "Working for …", Readwise "Loaded tools…" | 단계 진입 시 한 번 | 과제 카드 위에 회색 한 줄: "방금 대화에서 JOIN 개념을 골라 과제를 만드는 중". 0.6초쯤 보였다가 카드로 바뀐다. 실제 AI가 도는 것처럼 보이므로 "예시 화면" 배지가 꼭 필요하다 |
| A4 | **출처 칩** | Claude "From Calendar / From Slack", ChatGPT 프롬프트 카드의 첨부 칩 | 정적 | 경험 카드 하단에 `출처 · 10월 26일 SQLD 대화` 칩. PRD 근거 1("공부 대화 맥락에서 바로")을 카드 한 장으로 증명한다. 카드에 세션에 없는 수치를 넣지 않는다(TSD 6.2) |
| A5 | **명사 색 체인** | bragdoc 히어로(Commits→Achievements→Workstreams→Documents 고유색) | 정적 + 등장 | 단계마다 색을 하나씩 정해 히어로 문장, 단계 탭, 폰 속 요소, 마지막 CTA까지 같은 색을 쓴다. TSD 11장 임시 토큰을 쓰면 대화는 사용자 말풍선색 `#3d5a99`, 경험 카드는 `#9a5b13`이다. 과제는 강조색 `#2f6f5e`를 빌려 쓰는 안이 있다. 리마인드 색은 토큰에 없어 새로 정해야 한다 |
| A6 | **경로를 따라 날아가 꽂히는 조각** | Readwise 히어로(`offset-path` 위를 하이라이트 카드가 이동) | 페이지 로드, reduced-motion이면 정지 | ②→③ 전환에서 사용자의 풀이 줄(`LEFT JOIN … WHERE o.id IS NULL`)이 짧은 곡선을 따라 내려가 경험 카드의 한 줄 답변 자리에 앉는다. 400ms 이하, `transform`·`opacity`만 쓴다. reduced-motion이면 바로 바꿔 끼운다 |
| A7 | **모델 칩** | Claude "Opus · High", Readwise 입력창 "Sonnet 5", "Fast (GPT-5)" | 정적 | 대화 입력창에 `내 GPT` 칩. "내 구독 AI를 쓴다"를 설명 없이 보여 준다. 칩 문구는 TSD 6.3 근거 표를 따른다. H4 확인 전에는 연결된 것처럼 단정하지 않는다 |

**Experii 추천 조합**: A1 + A3 + A4 + A5. A6은 시간이 남으면 붙인다. A2의 자동 흐름은 쓰지 않는다.

### (b) 4아이콘 다이어그램 없이 루프를 보여 주기

| # | 장치 | 레퍼런스 | 트리거 | Experii에서는 |
|---|---|---|---|---|
| B1 | **단계 목록 + 폰 속 해당 요소 떠오르기** | 토스 "자산을 관리하는 일은 한껏 단순하게" (아코디언 4개 ↔ 폰 카드가 앞으로 뜨고 나머지 흐림) | 토스는 스크롤, Experii는 탭 클릭 | 데스크톱은 왼쪽 탭 4개(학습 대화 / 현장 과제 / 경험 카드 / 리마인드), 오른쪽은 **같은 폰 한 대**. 단계가 바뀌어도 폰은 그대로 두고, 폰 속 해당 요소만 `translateZ`처럼 보이게 키우고 그림자를 준다. 나머지는 `opacity: .35`로 낮춘다. 폰을 단계마다 갈아 끼우는 것보다 "한 앱 안에서 이어진다"가 잘 읽힌다 |
| B2 | **루프를 닫는 화면 전환** | Readwise 폰의 Daily Review(다시 꺼낸 카드가 곧 앱 첫 화면), 마지막 CTA에 히어로 카드를 다시 까는 구성 | ④ 패널 안의 알림 클릭 | 30일 알림을 누르면 폰이 ③의 **같은 경험 카드**를 연다. 카드 위에 `다시 본 날 · 1일 뒤 · 7일 뒤 · 30일 뒤` 점 3개가 차 있다. 화살표 없이 "처음 만든 카드로 돌아왔다"가 보인다. 단계 표시 줄 끝에서 ①로 돌아가는 얇은 곡선 하나 정도는 넣어도 된다 |
| B3 | **헤드라인 단어가 곧 탭** | chatgpt.com/overview h1의 chat·work·code 버튼(`aria-pressed`) | 단어 클릭 | 섹션 제목을 "공부하고, 풀고, 남기고, 다시 꺼내요"로 쓰고 네 동사를 탭 버튼으로 만든다. h1·h2에는 전체 문장 `aria-label`을 단다. 단 TSD 6.2가 정한 `role="tablist"` 구조와 겹치므로, 탭 목록을 따로 두고 제목 단어는 시각적 강조만 맞추는 편이 안전하다 |
| B4 | **시점으로 붙인 단계 이름** | Quizlet START STRONG / STAY ON TRACK / FINISH STRONG | 정적 | 탭 위 작은 라벨에 시점을 단다: `공부한 날` · `공부한 날` · `공부한 날` · `1·7·30일 뒤`. 앞 세 단계가 하루 안에 끝나고 마지막만 시간이 길다는 비대칭이 바로 USP("공부하는 날마다", "다시 꺼내 준다")를 설명한다 |
| B5 | **카드가 상자를 오르내리는 Leitner 그림** | Nicky Case (2018) | 단계 넘기기 | 루프 섹션에는 과하다. 쓰지 않는다. PRD에 "기억 정도 평가" 기능이 없어서, 그리면 없는 기능을 약속하게 된다 |

**피할 것**: Readwise 3단 타일 같은 아이콘+제목+두 줄 반복. 모바일에서 화면 세 개를 써도 정보가 늘지 않는다(`readwise-m01`).

### (c) 시간이 흐르는 걸 보여 주기 (1·7·30일)

| # | 장치 | 레퍼런스 | 트리거 | Experii에서는 |
|---|---|---|---|---|
| C1 | **시간 라벨이 붙은 카드 스택, 드래그·화살표로 넘김** | claude.com 하루 일과 스택("8:00 AM · Product" 라벨, 드래그·화살표 키, `aria-roledescription="stack"`, 비활성 카드 `inert`) | 클릭·드래그·←/→ 키 | ④ 패널의 주 장치. 잠금화면 위에 알림 3장을 겹친다. 맨 위 카드 라벨 `공부 1일 뒤 · 배운 점`, 넘기면 `7일 뒤 · 활용 방안`, `30일 뒤 · 면접 예상 질문`. 카드를 넘길 때 잠금화면 상단 날짜도 함께 바뀐다(예: `10월 27일 화` → `11월 2일 월` → `11월 25일 화`) |
| C2 | **iOS 잠금화면 "스택" 레이아웃** | iOS 알림 스택(최신이 맨 위, 뒤로 갈수록 작고 흐림. Macworld 설명) | 정적, 스택 클릭 시 펼침 | 겹친 상태에서 뒤 카드 2장은 `scale(.94)`, `scale(.88)`, 투명도를 단계적으로 낮춘다. 누르면 세 장이 세로로 펼쳐진다. 실제 iOS 화면을 똑같이 베끼지 말고 CSS로 그린 단순한 잠금화면에 "예시 화면" 배지를 단다 |
| C3 | **알림 문구에 시점을 넣기** | 토스 "카드값 나가기 3일 전 · 계좌 잔액 부족" | 정적 | 알림 본문 첫머리에 시점을 쓴다. 초안: 1일 뒤 "어제 푼 과제 기억나요? LEFT JOIN은 왼쪽 표를 모두 남기고 짝이 없으면 비워 둬요." / 7일 뒤 "'아직 주문 안 한 회원'처럼 없는 걸 찾을 때 LEFT JOIN과 IS NULL을 써요." / 30일 뒤 "면접 질문: SQL을 실제로 써 본 적 있나요? → 내 답변 한 줄 보기". 문구는 확정 전 초안이고 PRD 7장 검사를 통과해야 한다 |
| C4 | **같은 물체의 상태 변화** | Duolingo 위젯(시간대별 캐릭터 표정), Readwise 리뷰 진행도 | 단계 넘기기 | 경험 카드 오른쪽 위의 작은 표시가 `다시 본 날` 점 0개 → 1개 → 2개 → 3개로 찬다. 숫자 카운터보다 조용하고, "귀찮지 않은" 톤과 맞는다 |
| C5 | **상대 시간 스탬프** | Cursor 작업 목록(now/10m/30m/45m), bragdoc(2 days ago / 1 week ago / Last 30 days) | 정적 | `Difference` 섹션이나 마지막 CTA 배경에 경험 카드 목록을 깔고 `오늘`, `7일 전`, `30일 전`, `3개월 전` 스탬프를 붙인다. "몇 달 치 기록은 나중에 만들 수 없다"(PRD 5장)를 숫자 주장 없이 보여 준다. 카드 개수·기간은 예시로 표시한다 |
| C6 | **스크롤에 맞춰 움직이는 타임라인** | 토스 핀 고정 섹션, CSS `animation-timeline: view()` | 스크롤 | 점진 향상으로만 쓴다. MDN 호환성 데이터(2026-10-26) 기준 Chrome 115+, Safari 26+는 지원한다. Firefox는 159(2026-10-27 출시 예정)부터라서 오늘 정식판(158)은 지원하지 않는다. `@supports (animation-timeline: view())` 안에서만 켜고 기본 동작은 탭 클릭으로 둔다 |
| C7 | **망각 곡선 + 리마인드 점** | Nicky Case 슬라이더, RemNote·Anki 설명문 | 드래그 | 쓰지 않기를 권한다. y축이 있는 곡선은 효과를 수치로 주장하는 것처럼 읽힌다. Experii는 그걸 뒷받침할 자료가 없다(PRD 7장, H2 `[가설]`). 쓴다면 축 숫자 없는 가로 타임라인에 점 3개만 둔다 |

**그리지 말 것**: 연속 기록 숫자, 리그·순위, "오늘 안 하면 기록이 끊겨요" 같은 압박 문구. PRD에 없는 기능이다. Duolingo가 2026년에 받는 비판(2.3)과도 같은 방향이다.

### (d) 방문자가 직접 만져 보게 하기

| # | 장치 | 레퍼런스 | 트리거 | Experii에서는 |
|---|---|---|---|---|
| D1 | **추천 질문 칩 → 미리 써 둔 대화 재생** | openai.com 홈 칩 5개, Claude 교육 페이지 질문 카드 + "Ask Claude", ChatGPT Study Mode 프롬프트 카드 | 칩 클릭 | ① 패널 아래 칩 3개: `JOIN 차이가 헷갈려` · `GROUP BY랑 HAVING` · `서브쿼리는 언제 써?`. 칩마다 대화 → 과제 → 카드 → 알림 세트를 `content/loop.ts`에 미리 써 둔다. LLM은 부르지 않는다. 칩을 고르면 ②~④ 패널의 예시도 그 주제로 바뀐다. 기본 선택은 TSD 예시(JOIN) |
| D2 | **타이핑 연출 + 브랜드 pill** | Readwise 입력창(IntersectionObserver threshold 1, 30ms/글자, reduced-motion이면 즉시 전체 표시, `aria-hidden` + 대체 텍스트) | 화면 진입 1회 또는 칩 클릭 | 사용자 말풍선을 한 글자씩 친다. 한글 완성형 음절은 NFC 기준 한 코드포인트라 `slice`로 끊어도 되지만, 이모지가 섞일 수 있으면 `Intl.Segmenter`나 `Array.from`으로 자른다. AI 답은 타이핑하지 말고 문단 단위로 페이드한다. 긴 글을 글자 단위로 치면 기다리게 되고 INP 측정과도 겹친다 |
| D3 | **빈칸 하나 풀어 보기** | Readwise 리뷰 카드의 실제 버튼, Nicky Case 조작형 해설 | 클릭 | ② 패널에서 풀이 SQL의 한 군데를 빈칸으로 두고 보기 2개(`INNER JOIN` / `LEFT JOIN`)를 준다. 고르면 맞든 틀리든 짧은 해설 뒤 ③ 경험 카드가 생긴다. 방문자가 "과제를 풀었다"를 손으로 한 번 겪게 하는 가장 작은 단위다. 터치 영역 44px 이상(TSD 11장) |
| D4 | **드래그·화살표로 넘기는 알림 스택** | claude.com 스택 | 드래그, ←/→ 키, 클릭 | C1과 같은 장치. 드래그는 Pointer Events로 직접 구현하면 라이브러리 없이 2~3KB 수준이다. 드래그를 못 하는 사용자를 위해 "다음 알림" 버튼을 꼭 같이 둔다(WCAG 2.5.7 Dragging Movements, AA) |
| D5 | **실제 입력창** | openai.com 홈(입력하면 ChatGPT로 이동) | 타이핑 + 전송 | 기본안에서는 제외한다. 이유는 5.4. 입력창 모양은 쓰되 칩을 고르는 장치로만 둔다 |
| D6 | **"이 질문으로 시작하기" 딥링크** | Claude "Try it in Claude"(`claude.ai/new?q=`), "Ask Claude" | 클릭 | Experii는 출시 전 제품이라 갈 곳이 없다. 같은 자리에 `이 질문으로 첫 공부 시작하기 → 사전 신청`을 두고 `#signup`으로 보낸다. 고른 칩은 분석 이벤트 속성으로만 남기고 폼 필드는 늘리지 않는다(TSD 7.1 범위) |

---

## 4. 조립안: SQLD 한 컷 스토리보드

TSD 6.2의 `LoopStepper`(탭 4개 + 패널 1개, 자동 진행 없음)를 그대로 쓰고 위 장치를 끼워 넣은 안이다. 모든 화면은 CSS로 그린 폰 하나 안에서 일어난다.

| 탭 | 폰 화면 | 들어가는 장치 | 움직임 (reduced-motion이면) | JS 없을 때 |
|---|---|---|---|---|
| ① 학습 대화 · 공부한 날 | Experii 대화 화면. 입력창에 `내 GPT` 칩. 사용자 "LEFT JOIN이랑 INNER JOIN 차이가 헷갈려" → AI가 예시 표 두 개로 설명하고 "직접 써 볼래요?"로 되묻는다(학습 모드식 질문) | A5, A7, D1, D2 | 사용자 말풍선 타이핑 → AI 문단 페이드 (모두 즉시 표시) | 대화 전체가 정적으로 보임 |
| ② 현장 과제 · 공부한 날 | 상태줄 "방금 대화에서 과제를 만드는 중" → 과제 카드 "가입 후 한 번도 주문하지 않은 회원을 찾아 마케팅팀에 넘겨 주세요" → 풀이 SQL, 빈칸 하나 | A3, D3 | 상태줄 0.6초 → 카드 등장 (상태줄 생략, 카드 바로 표시) | 과제와 정답 SQL 표시, 빈칸 없음 |
| ③ 경험 카드 · 공부한 날 | 경험 카드 한 장: 면접 답변 한 줄, 태그 `SQLD` `JOIN`, 날짜, 출처 칩 `10월 26일 SQLD 대화`, `다시 본 날` 점 3개(비어 있음) | A4, A6, C4 | 풀이 줄이 곡선을 따라 카드로 내려앉음 (바로 교체) | 카드 정적 표시 |
| ④ 리마인드 · 1·7·30일 뒤 | 잠금화면 + 알림 스택 3장. 넘길 때마다 날짜가 바뀌고 카드의 점이 하나씩 찬다. 30일 알림을 누르면 ③ 카드가 열리며 점 3개가 다 찬 상태 | C1, C2, C3, B2, D4 | 스택 넘김 220ms 슬라이드 (즉시 교체) | 알림 3장을 세로 목록으로 표시 |

**레이아웃**
- **데스크톱(1024px 이상)**: 왼쪽에 탭 목록(세로, 각 탭 아래 시점 라벨 B4), 오른쪽에 폰. 탭이 바뀌면 폰 속 해당 영역만 떠오른다(B1). 섹션 높이는 화면 1개 안에서 끝낸다. 스크롤을 붙잡는 핀 고정은 기본안에 넣지 않는다.
- **모바일(360~639px)**: 폰을 위에 두고 탭을 폰 아래 가로 4칸 세그먼트로 둔다. 가로 스와이프는 TSD대로 P1이다. Cursor처럼 넓은 화면을 잘라 보여 주지 말고, Readwise처럼 폰 하나만 남긴다.
- **섹션 바깥의 연결**: 히어로의 Before→After 말풍선 색과 ③ 카드의 색을 맞춘다(A5). 마지막 CTA 배경에 경험 카드 여러 장을 옅게 깔고 상대 시간 스탬프를 붙인다(C5, Readwise 마지막 CTA 구성).

**구현 메모 (TSD 12장 범위 안)**
- 상태는 `activeStep`과 `activeTopic`(칩) 두 개면 충분하다. 패널 전환은 CSS transition, 진입 감지는 IntersectionObserver 하나로 한다.
- 타이머(타이핑, 상태줄)는 탭을 바꾸면 모두 취소한다. 같은 칩을 빠르게 연타했을 때 말풍선이 겹치는 버그가 흔하다.
- 대화 데이터는 `content/loop.ts`에 칩 3개 × 4단계로 둔다. TSD의 content-guard 테스트가 금지 표현을 검사하는 범위에 들어간다.

---

## 5. 접근성·성능 함정

### 5.1 움직임

- **자동 재생 금지가 기본**: WCAG 2.2.2에 따르면 자동으로 시작해 5초 넘게 움직이는 콘텐츠는 멈춤 수단이 있어야 한다. openai.com의 자동 스크롤 피드, ChatGPT 기능 페이지의 무한 카드 흐름은 멈춤 버튼 없이 가져오면 안 된다. TSD 6.2도 자동 진행을 금지한다.
- **reduced-motion은 Readwise 방식으로 처리한다**: 등장 애니메이션 전체를 `@media (prefers-reduced-motion: no-preference)` 안에 넣고, JS 타이핑은 `matchMedia`로 확인해 처음부터 전체 문장을 보여 준다. "애니메이션을 끄는" 게 아니라 "완성 상태를 바로 보여 주는" 것이다.
- **첫 프레임은 완성 상태로**: Aside 캡처에서는 대화창이 비어 있었고, bragdoc은 서버 HTML이 `opacity:0`이었다. 스크린샷, 링크 미리보기 봇, 느린 기기, 인앱 브라우저에서 텅 빈 목업이 보일 수 있다. HTML에는 끝난 상태를 넣고, JS가 붙은 뒤에만 시작 상태로 되돌려 재생한다(TSD 6.2 "JS가 없을 때" 규칙의 연장).
- **움직이는 속성은 `transform`·`opacity`만**: 폰 속 요소 떠오르기(B1)에 `box-shadow`, `filter: blur()`, `backdrop-filter`를 애니메이션하면 중저가 안드로이드에서 프레임이 떨어진다. 잠금화면 유리 효과는 반투명 단색으로 대신한다. `will-change`는 계속 움직이는 요소에만 붙인다(Readwise는 경로를 따라 흐르는 히어로 카드에 쓴다).

### 5.2 스크린리더·키보드

- **글자 단위로 쪼갠 텍스트**: 쪼갠 span은 `aria-hidden`, 부모에 전체 문장 `aria-label`. chatgpt.com/overview h1과 claude.com 섹션 제목이 이렇게 한다.
- **타이핑 중인 텍스트에 `aria-live`를 걸지 않는다**: 글자마다 읽힌다. 단계가 바뀔 때 `sr-only aria-live="polite"` 문단 하나에 "2단계 현장 과제, 예시 화면"처럼 한 번만 알린다(claude.com 스택의 `data-stack-live`).
- **보이지 않는 패널은 `inert`**: 스택 뒤 카드나 비활성 탭 패널에 포커스가 들어가지 않게 한다(claude.com 스택).
- **드래그에는 대체 수단을**: 알림 스택에는 버튼과 ←/→ 키를 같이 둔다(WCAG 2.5.7).
- **목업 속 버튼은 진짜 버튼처럼 보이면 안 된다**: 폰 안 "보내기", "과제 받기" 같은 UI는 장식이다. 실제로 반응하는 건 칩·빈칸 보기·스택 넘기기뿐이라는 게 시각적으로 구분돼야 한다. 반응하는 요소에만 포커스 링과 커서 변화를 준다.

### 5.3 모바일·인앱 브라우저

- **넓은 목업 자르기 금지**: Cursor 모바일처럼 데스크톱 창의 오른쪽만 보이면 대화가 읽히지 않는다. 모바일은 폰 프레임 하나에 글자 크기 14px 이상을 지킨다.
- **캐러셀 애니메이션은 스냅 기준**: 가로 스와이프(P1)를 붙이면 Readwise처럼 IntersectionObserver의 `root`를 캐러셀로 두고 60% 이상 보일 때만 재생한다.
- **핀 고정과 sticky**: 카카오톡 같은 인앱 브라우저에서는 주소창 높이가 바뀌며 `100vh` 섹션이 튄다. TSD 11장대로 `100svh`·`100dvh`를 쓰고, `overflow: hidden` 부모 안에서는 `position: sticky`가 안 걸린다는 점을 조심한다. 기본안이 핀 고정을 쓰지 않는 이유 중 하나다.
- **영상 대신 CSS**: ChatGPT 기능 페이지는 Vimeo iframe 자동재생을 쓴다. 외부 스크립트와 CSP 부담이 크고, iOS 저전력 모드에서는 자동재생이 막힐 수 있다(실기기 확인 필요). TSD도 래스터·영상을 쓰지 않는다.

### 5.4 실제 GPT 호출을 붙이지 않는 이유 (D5)

- TSD 1.2가 GPT·Claude 연동 실연을 범위에서 뺐다(H4 `[확인필요]`).
- 랜딩에서 실제 LLM을 부르면 호출 비용, 남용·프롬프트 주입, 금지 표현이 섞인 답, 응답 지연(LCP·INP 예산)을 모두 떠안는다. 미리 써 둔 대화는 content-guard 테스트로 문구를 검사할 수 있고, 실제 호출은 그럴 수 없다.
- 사용자 요청("GPT를 연동해 학습을 돕는 화면")과 다르므로, 실연을 넣을지는 열린 결정으로 올려야 한다.

### 5.5 문구

- 알림·카드 예시에도 PRD 7장 금지 표현을 적용한다. 30일 알림은 "면접 예상 질문"이지 "합격 답변"이 아니다.
- 압박형 알림 문구("오늘 안 하면…")는 쓰지 않는다. Duolingo가 받는 2026년 비판(2.3)과 "귀찮지 않은" 톤을 함께 보면 그렇다.
- 경험 카드에 세션에 없던 성과 수치를 넣지 않는다(TSD 6.2).

---

## 6. 빌릴 것 · 피할 것 요약

**빌릴 것**
- claude.com: 대화/결과 2단 탭, 시간 라벨이 붙은 카드 스택(드래그 + 키보드 + `inert` + polite 알림), 출처 칩
- 토스: 단계 목록과 폰 속 요소 떠오르기, 시점이 들어간 알림 문구
- Readwise: 폰 하나로 줄이는 모바일 히어로, 화면에 다 들어왔을 때 한 번 시작하는 타이핑과 reduced-motion 즉시 표시, 마지막 CTA에서 소재 다시 쓰기
- bragdoc: 단계별 고유색을 페이지 끝까지 유지하기, 상대 시간 스탬프
- openai.com: 말풍선과 생성물을 모양으로 구분하는 피드(정지 상태로), 질문 칩
- Quizlet: 기능명 대신 시점 이름

**피할 것**
- 아이콘 + 제목 + 두 줄짜리 3~4칸 다이어그램
- 멈춤 버튼 없는 자동 스크롤·무한 가로 흐름
- JS가 돌아야 보이는 핵심 설명(`opacity:0` 상태로 서버 렌더링)
- 연속 기록·순위·압박 문구, 축에 숫자가 있는 망각 곡선
- 데스크톱 목업을 모바일에서 잘라 쓰기, 화면 녹화 영상
- 랜딩에서 실제 LLM 호출

---

## 7. 확인하지 못한 것

- **openai.com, chatgpt.com**: headless 캡처가 Cloudflare 인증 화면에 막혔다. placeholder가 바뀌는 것과 Intelligent UI 카드의 자동 스크롤은 내장 브라우저 관찰 메모(`openai-notes.md`)에만 근거한다. chatgpt.com/overview 히어로가 스크롤로 움직이는지 클릭으로 움직이는지는 CSS 변수 이름으로 추정했을 뿐이다.
- **ChatGPT Study Mode 프롬프트 카드**가 실제로 흐르는지, 멈춤 버튼이 있는지는 확인하지 못했다.
- **claude.com 스텝 패널**이 저절로 넘어가는지 알 수 없다. 스택의 드래그·키보드 동작은 aria-label 문구로만 확인했다.
- **Duolingo 홈**은 렌더링하지 못했다. 근거는 공식 블로그(2022, 2023)와 2026년 기사 하나다. 2026년 공식 변경 사항은 찾지 못했다.
- **Claude 학습 모드 전용 랜딩**은 찾지 못했다. 근거는 2025-04 발표문과 교육 페이지다.
- **Nicky Case 자료**는 2018년 것이다.
- **iOS 저전력 모드 자동재생 차단**은 알려진 동작이지만 이번에 실기기로 확인하지 않았다.
- **Firefox 159 출시일(2026-10-27)**은 MDN 호환성 데이터의 예정일이다.

---

## 출처

- Readwise: https://readwise.io (HTML, `https://d34adp677peecb.cloudfront.net/static/css/new-landing.eb5654788887.css`, 스크린샷 `readwise-d00~d07`, `m00~m01`)
- Anki: https://apps.ankiweb.net
- RemNote: https://www.remnote.com
- Quizlet: https://quizlet.com
- Duolingo 위젯 (2023-08-29): https://blog.duolingo.com/widget-feature
- Duolingo 마일스톤 (2022-01-21): https://blog.duolingo.com/streak-milestone-design-animation
- Android Authority (2026-06-02): https://www.androidauthority.com/duolingo-changes-i-want-to-see-3671847/
- bragdoc: https://www.bragdoc.ai
- OpenAI Study Mode 소개 (2025-07-29): https://openai.com/index/chatgpt-study-mode/
- ChatGPT Study Mode 기능 페이지: https://chatgpt.com/features/study-mode/
- ChatGPT Overview: https://chatgpt.com/overview
- OpenAI 홈 (2026-10-26): https://openai.com/ (curl HTML, `openai-d00~02.jpg`, `openai-notes.md`)
- Claude 제품 소개: https://claude.com/product/overview
- Claude 교육: https://claude.com/solutions/education
- Claude for Education 발표 (2025-04): https://www.anthropic.com/news/introducing-claude-for-education
- Nicky Case (2018-10): https://ncase.me/remember/
- 토스: https://toss.im (스크린샷 `toss-d05~d09`)
- Cursor: https://cursor.com (스크린샷 `cursor-d00`, `cursor-m00`)
- Aside: https://aside.com (스크린샷 `aside-d00~d01`, HTML)
- MDN browser-compat-data (2026-10-26 조회): https://github.com/mdn/browser-compat-data (`css/properties/animation-timeline.json`, `css/properties/offset-path.json`, `browsers/firefox.json`)
- iOS 잠금화면 알림 레이아웃: https://www.macworld.com/article/821238/ios-16-how-to-change-lock-screen-notifications.html
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ (2.2.2 Pause, Stop, Hide / 2.5.7 Dragging Movements)
