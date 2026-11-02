# Experii 랜딩 최종 디자인 명세

| 항목 | 내용 |
|---|---|
| 문서 | 랜딩 구현 청사진. Next.js 빌더가 이 문서 하나를 보고 만든다 |
| 작성일 | 2026-10-26 |
| 기반 시안 | `landing/prototypes/a` (판정 라벨 design-2). 이식 원본은 `prototypes/a/index.html` |
| 가져올 시안 | `landing/prototypes/b` (판정 라벨 design-1)의 히어로 질문 칩·세트 B/C, 1·7·30 큰 숫자 줄, 시대 변화의 꼬리질문 강조, 폰 속 `출시 예정 기능` 배지 |
| 판정 자료 | 판정자 4명 결과, `scratchpad/judge-shots/INDEX.md`와 캡처, 두 시안의 `DESIGN.md` |
| 우선순위 | PRD(`Experii_PRD_v0.1.md`) → TSD(`TSD.md`) → 재료 브리프(`research/10-landing-materials-brief.md`) → 이 문서. 이 문서가 앞의 셋과 다르면 2.5절에 이유를 적었다 |

**카피 출처 표기**

| 표기 | 뜻 |
|---|---|
| `[§2.1]` | `research/10`의 그 절 문구를 글자 그대로 쓴다 |
| `[TSD 6.3]` | TSD 문구를 그대로 쓴다. 브리프와 충돌해 TSD를 따른 곳이다 |
| `[파생: …]` | 브리프 문구를 줄이거나 말투만 바꿨다. 무엇을 바꿨는지 함께 적었다 |
| `[A안]` | 시안 A(prototypes/a)가 처음 쓴 문구. 판정자 넷이 통과시켰고 브리프 규칙에 어긋나지 않는다 |
| `[초안]` | 이 문서가 처음 쓴 문구. 공개 전에 창업자가 확인한다 |

모든 화면 문구는 `content/landing.ts`·`content/loop.ts`·`content/privacy.ts`에만 둔다(TSD 6.3). 아래 표의 문구가 곧 그 파일의 값이다.

---

## 1. 판정 요약

### 1.1 점수 표

기준 이름은 판정자 설명에서 추정했다. C1 첫 화면 5초 안에 Before→After가 읽히는가 · C2 루프 4단계를 직접 풀고 닫히는 것까지 보여 주는가 · C3 정직성(예시 표기, 준비 중, 출시 예정) · C4 금지 표현·경쟁사·사회적 증거 없음 · C5 360px 품질(가독성 13px, 넘침, 터치 영역) · C6 움직임·접근성·JS 없음 · C7 시각 완성도와 기억에 남는 한 장면 · C8 Next.js·TSD 컴포넌트로 옮기기 쉬운가.

| 판정자 (관점) | 시안 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | 평균 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 · SQLD 공부하는 비전공 3학년, 카톡 인앱 360px | design-1 (b) | 6 | 6.5 | 8.5 | 9 | 4.5 | 7 | 6.5 | 6.5 | 6.81 |
| | **design-2 (a)** | 9 | 8.5 | 9 | 10 | 7 | 8 | 7.5 | 7 | **8.25** |
| 2 · 토스 출신 프로덕트 디자이너 | design-1 (b) | 6 | 6.5 | 8 | 10 | 4 | 7 | 5.5 | 6.5 | 6.69 |
| | **design-2 (a)** | 9 | 9 | 9 | 10 | 7 | 8.5 | 7.5 | 7.5 | **8.44** |
| 3 · Next.js 이식 담당 프런트엔드 엔지니어 | design-1 (b) | 5 | 6 | 9 | 10 | 4 | 7 | 6 | 6 | 6.63 |
| | **design-2 (a)** | 9 | 9 | 9 | 10 | 7 | 9 | 8 | 7 | **8.50** |
| 4 · GPT 교차 판정 (Codex) | design-1 (b) | 5 | 8 | 9 | 10 | 3 | 6 | 7 | 7 | 6.88 |
| | **design-2 (a)** | 9 | 9 | 9 | 10 | 6 | 9 | 9 | 7 | **8.50** |
| **기준별 평균** | design-1 (b) | 5.50 | 6.75 | 8.63 | 9.75 | 3.88 | 6.75 | 6.25 | 6.50 | **6.75** |
| | design-2 (a) | 9.00 | 8.88 | 9.00 | 10.00 | 6.75 | 8.63 | 8.00 | 7.13 | **8.42** |

### 1.2 승자와 이유

**승자: design-2 (`prototypes/a`).** 판정자 넷이 모두 골랐다. 그중 판정자 4는 design-1을 만든 모델 계열(GPT)인데도 design-2를 골랐다. 같은 계열 편향이 반대 방향으로 작용했는데도 결론이 같으므로, 이 결론은 계열을 넘어선 합의로 본다.

표수보다 아래의 재현되는 사실로 정했다. 캡처는 합성자가 다시 열어 확인했다.

| 근거 | design-2 (a) | design-1 (b) |
|---|---|---|
| 첫 화면 Before→After (C1) | 360·1440 모두 면접관 질문, 상황 라벨이 붙은 두 답, 출처 칩까지 첫 화면 안 (`design-2/m-00.png`, `d-00.png`) | 360에서 After 둘째 줄이 잘림(`design-1/m-00.png`), 1440에서도 After가 900px 경계에 걸림(`d-00.png`). 원인은 92px·47px 제목(`b/index.html:61`, `:300`) |
| 빈칸 풀기 (C2) | 오답은 빨간 빈칸 + `결과 0행` + 이유, 정답은 초록 + 결과 표 + `다음 단계` (`d-state-wrong.png`, `d-state-right.png`) | 오답 INNER JOIN 버튼이 정답과 같은 초록 채움(`design-1/d-state-wrong.png`, `b/index.html:155`). 색은 정답, 글은 오답 |
| 가르치는 내용의 정확성 | 회원·주문 표를 따로 그리고 결과 표 A·B에 캡션 | 회원과 주문을 한 표에 나란히 넣어 서준 옆에 주문 102가 보임(`b/index.html:456`). 캡션 없는 표를 두고 AI가 "결과 표 B"를 말함(`:463`) |
| 루프가 닫히는 장면 (C2·C7) | 잠금화면 날짜가 10월 27일 → 11월 2일 → 11월 25일로 넘어가고, 31칸 눈금 핀이 1→7→30, 30일 알림을 열면 같은 카드가 올라오며 점이 하나씩 참 (`d-state-tab4.png`, `d-state-close.png`) | 연보라 카드 아래 폰 절반이 빈 화면, 닫힌 카드는 아래에 덧붙고 버튼은 `이 알림 열기`로 남음 (`d-state-r30.png`, `d-state-close.png`) |
| 360 품질 (C5) | 가로 넘침 0, 표 셀 13px. 다만 목업 글자 205개 중 119개가 13px 미만 (INDEX) | 가로 넘침 1px(`scrollWidth` 361, 회전한 메모 카드), 목업 글자 120개 중 99개가 13px 미만, 최소 10px (INDEX) |
| JS 없음 (C6) | 탭과 재생을 숨기고 4단계를 세로로 완성 상태로 펼침 (`d-nojs-02.png`~`04.png`) | 탭과 재생이 그려지지만 동작하지 않고, 4단계가 폰 안 스크롤에 갇힘 (`design-1/d-nojs-00.png`) |
| 폼 (TSD 7) | `method=post`, 필드별 오류·`aria-invalid`·`aria-describedby`, 첫 오류로 포커스, UTM 숨은 필드 | 오류 한 줄, `method` 없음(JS 없이 제출하면 이메일이 URL에 실림, `b/index.html:615`), UTM 필드 없음 |

design-1이 앞선 점도 분명하다. 히어로 질문 칩 3개가 세트 B·C 대본으로 루프 전체를 바꾸는 장치(브리프 §2.1, §3.6)는 design-1에만 있고 작동한다(`design-1/d-state-chip-phone.png`). 1·7·30 큰 숫자 줄과 시대 변화의 꼬리질문 강조도 판정자 3명이 가져가자고 했다. 이 넷을 2.2절에서 옮긴다.

### 1.3 판정자 간 불일치와 처리

| # | 쟁점 | 의견 | 처리와 이유 |
|---|---|---|---|
| D-1 | Before 답에 취소선 | 판정자 2: 취소선을 더하자 / 판정자 1: 공부 중인 자격증을 지우는 것처럼 보여 무시당하는 느낌 | **취소선 없음.** 대상 사용자 관점의 반응이 근거다. PRD 7장의 깎아내리지 않는 톤과도 맞다. 점선 테두리, 흐린 글자, 상황 라벨 `자격증만 있을 때`로 변화를 보인다 |
| D-2 | 시대 변화를 검은 섹션으로 | 판정자 3·4: design-1의 검정 무대가 대담하다 / 판정자 2: 검정·거의 검정·베이지가 번갈아 리듬이 깨지고 흔한 티 2번에 가깝다 / 판정자 1: 검정 위에서 검은 StickyCta 테두리가 사라짐(`design-1/m-03.png`) | **밝은 바탕 유지.** 재현된 결함(m-03)과 브리프 §2.1 "다크 배경의 긴박감 연출" 회피가 근거다. 대담함은 글자 크기(이 섹션만 display 크기)와 둘째 꼬리질문을 먹색으로 채운 말풍선으로 가져온다 |
| D-3 | 섹션 4 진입 시 자동 재생 | 판정자 3: 5초 미만이라 괜찮다 / 판정자 1·2·4: 브리프의 약 1초 타이핑보다 길고, 방문자가 읽는 동안 폰이 움직이며, 재생 중간 프레임이 비어 보인다 | **진입 자동 재생 삭제.** 재생 중간 캡처에서 폰 대부분이 비어 있다(`design-2/d-03.png`, `m-03.png`). 탭 ①은 완성 상태(S4)로 시작한다. 타이핑 연출은 히어로 거울 입력창에서 한 번만 한다(브리프 §2.1). 2.5절 C-6 |
| D-4 | 푸터 문의 이메일 | 판정자 1: `문의 이메일 (준비 중)`이 정직하다 / 판정자 3: TSD D3는 `hello@experii.app` | **값은 `content/privacy.ts`의 `CONTACT_EMAIL` 하나로.** 지금 저장소 값은 `null`이고 이때 `문의 이메일 (준비 중)`을 그린다. 공개 전 체크리스트(TSD 14.4)에서 메일 수신을 설정하고 `hello@experii.app`을 넣으면 `mailto:` 링크로 바뀐다. design-1의 `hello@experii.kr`는 도메인이 틀렸다 |
| D-5 | 왼쪽 세로 눈금 내비 | 판정자 2: 눈금 모티프가 내비·눈금 자·타임라인을 잇는다 / 판정자 1: 이름 없는 줄이라 뜻을 모르겠다 / 판정자 3·4: 30×22px라 작고, TSD 12장 클라이언트 목록 밖 | **유지하되 고친다.** 1280px 이상에서만, 누르는 영역 44×32px, 1440px 이상에서는 지금 섹션 이름을 늘 보인다. 클라이언트 섬 `TickNav` 하나가 늘어나는 것은 2.5절 C-8에 적었다 |
| D-6 | 이식 부담 (C8) | 판정자 3: design-1의 JS가 단순하다 / 판정자 2·3: design-2가 서버 우선이고 상태 지도가 문서로 있다 | **design-2 구조 + design-1의 "모든 조작은 먼저 타이머를 취소한다" 규칙.** 5.10절. Runner는 `useTimeline` 훅 하나로 옮긴다 |
| D-7 | Claude 언급 | 판정자 1·2·4는 `GPT·Claude 준비 중`을 정직하다고 봤다 / 판정자 3: TSD D1 위반 | **랜딩에서 Claude 연동 문구를 뺀다.** TSD D1(2026-10-26 확정)이 브리프보다 우선한다. 폼의 구독 질문에서만 `Claude 유료`를 묻는다(TSD 6.3) |

---

## 2. 최종 방향

### 2.1 기반

`prototypes/a`의 페이지 구조, 토큰, 섹션 4 무대(탭 4개 + 폰 한 대 + 단계 틴트 + 빈칸이 다음 단계를 막는 구조 + 잠금화면 날짜 넘김과 같은 카드 복귀), JS 없음 처리(`html:not(.js)`), 폼, StickyCta 규칙을 그대로 가져온다. 이 페이지에서 기억에 남는 한 장면은 하나다. 섹션 4 ④에서 **날짜가 넘어가고 같은 카드가 돌아오는 순간**이다. 이 장면은 문제 섹션 메모 카드의 빈 `다시 연 날 ○○○`과 짝을 이루고, 루프가 닫힐 때 `다시 본 날 ●●●`으로 채워진다. 나머지 섹션은 정지 화면으로 조용히 둔다.

### 2.2 design-1(b)에서 가져올 것

| # | 무엇 | b의 위치 | 왜 | 어떻게 바꿔 넣나 |
|---|---|---|---|---|
| G-1 | 히어로 거울 입력창 + 질문 칩 3개. 칩을 누르면 섹션 4가 그 세트 대본(A·B·C)으로 열린다 | `b/index.html:363-377`, 세트 데이터 `:789-832`, 전환 `:818-831` | 브리프 §2.1 "시작점이 오늘의 공부"를 히어로에서 보이는 유일한 장치. 판정자 넷이 모두 가져가자고 했다 | 칩과 화살표는 서버 컴포넌트의 일반 링크 `href="#how-join"` `#how-group` `#how-rank`. `LoopStepper`가 해시와 링크 클릭을 읽어 세트를 바꾼다(5.11). 히어로는 클라이언트 코드가 없다. 자리는 데스크톱 히어로 왼쪽 아래 빈 곳(`design-2/d-00.png`의 CTA 아래 약 250px 공백), 모바일은 면접 그림 **아래**(첫 화면 Before→After를 밀어내지 않게) |
| G-2 | 세트 B·C 문자열 | `b/index.html:802-807` | 브리프 §3.6 원문과 대부분 같다 | 브리프 §3.6을 원본으로 다시 옮긴다. b가 지어낸 제목(`첫 구매 쿠폰 대상 찾기` 등)과 B·C 7일 알림의 덧붙인 줄은 쓰지 않는다. 5.11절 표가 최종 문자열이다 |
| G-3 | 1·7·30 큰 숫자 줄 (가는 선 + 큰 글자 + 작은 라벨) | `b/index.html:195-199`, `:569-573`, 캡처 `design-1/d-06.png` | 브리프 §2.0 장치. 판정자 1·2·3이 정적 요약으로 가져가자고 했고, JS가 없어도 리마인드 비트가 보인다 | 섹션 4 무대 아래 가로 3칸(모바일 세로 3줄). 자간은 b의 -0.06em이 아니라 -0.02em(브리프 §2.0: 영문 디스플레이 자간을 한글에 쓰지 않는다). 대신 a의 ④ 설명 안 `.beats`는 뺀다 |
| G-4 | 시대 변화의 꼬리질문이 강해지는 말풍선 | `b/index.html:94-96`, `design-1/d-04.png` | 판정자 2: 테두리 말풍선 → 채운 말풍선으로 질문이 세지는 것이 보인다 | 첫 말풍선은 회색 면, 둘째 `그럼 SQL을…`은 먹색(`--color-ink`) 면에 흰 글자, 한 단계 큰 글자 |
| G-5 | 폰 속 리마인드 화면의 `출시 예정 기능` 배지 | `b/index.html:530` | 모바일에서 잠금화면을 보는 동안 출시 예정 표기가 화면 밖에 있었다(`design-2/m-state-tab4.png`) | 잠금화면 날짜 아래 흰 반투명 알약. ④ 설명 안의 배지도 그대로 둔다 |
| G-6 | "사용자 조작은 먼저 재생·타이머를 멈춘다" 계약 | `b/index.html:698`, `:730`, `:820` | 판정자 3: React `useEffect` 정리 규칙으로 좋다 | 5.10절 타이머 취소 규칙 |

### 2.3 가져오지 않을 것

| 무엇 | 출처 | 이유 |
|---|---|---|
| Before 취소선 | b `:67` | D-1 |
| 검정 시대 변화 섹션, 거의 검정 루프 무대, 베이지 신청 띠, 검정 푸터 | b `:89`, `:102`, `:233`, `:260` | D-2, frontend-design 흔한 티 1·2번, `design-1/m-03.png` |
| 92px 히어로, -0.045em 이상 자간 | b `:36`, `:61` | TSD 11장(데스크톱 48~56px), 브리프 §2.0 |
| 섹션 4 진입 자동 재생(약 4.2초) | a `:1437-1445` | D-3 |
| 폰 속 S0 칩을 누를 수 있는 알약처럼 그리기 | a `:228`, `:709` | 누르면 아무 일도 없다. 브리프 §5.8 "장식 버튼이 진짜로 눌리는 것처럼 보이지 않게" |
| ④ 설명 안 1·7·30 `.beats` | a `:853-857` | G-3 숫자 줄과 겹친다 |
| `--full: calc(50% + 50%)` 우회 | a `:20` | 시안이 HTML 전체를 금지어 검사해서 생긴 우회다. 실제 `content-guard`는 `content/*.ts`만 검사한다(TSD 6.3). CSS에는 `100%`를 그대로 쓴다 |
| 헤더 반투명 + `backdrop-filter` | a `:67` | 아래 콘텐츠가 비쳐 보이고(`design-2/m-01.png`, `m-03.png`), 폰 그림자가 헤더 밑으로 번진다(`d-04.png`). 인앱 브라우저 성능에도 불리하다 |

### 2.4 반드시 고칠 것 (design-2 기준, 재현 근거 포함)

| # | 문제 | 재현 근거 | 고치는 법 | 확인 (7장) |
|---|---|---|---|---|
| F-1 | 폰 목업 글자가 13px 미만 | INDEX 5단계 측정: `#stage .screen` 글자 요소 205개 중 119개가 13px 미만(11~12.5px). `a/index.html:246` SQL 12px, `:268` 카드 라벨 11.5px, `:218` `연결 준비 중` 11px, `:244` 테이블 코드 11.5px, `:274` 쿼리 조각 11.5px, `:277` 태그 11.5px, `:314` 꼬리질문 SQL 11.5px, `:449` 모바일 시점 라벨 11px | 폰 안 모든 글자 13px 이상(3.2절 폰 글자 체계). 페이지 쪽 배지·라벨·눈금 이름도 13px 이상 | V-14 |
| F-2 | 모바일에서 탭·`다음 알림`·`다음 단계`·재생이 폰 아래 접힘 밖 | INDEX: "the step-4 '다음 알림' button, the player and the '다음 단계' buttons sit below the fold", `design-2/m-state-tab4.png` | 1023px 이하: 탭을 폰 **위**로, 단계 행동 버튼을 폰 **바로 아래**로. 폰 높이 520px. 헤더 60 + 탭 64 + 폰 520 + 행동 48 + 간격 = 약 664px로 780px 화면 안(5.3절) | V-8 |
| F-3 | 360px에서 정답 결과 표가 폰 오른쪽 끝에 닿음 | `design-2/m-state-right.png`의 `joined_at` 열 | 무대 안쪽 여백 12 → 8px, 폰 폭 304 → 312px, 표 칸 여백 `4px 6px`. 화면 안쪽 폭 298px, 대화 영역 278px | V-10 |
| F-4 | 폰 속 S0 칩이 누를 수 있는 알약처럼 보임 | `a/index.html:228`, `:709` | 테두리 없는 회색 태그, `aria-hidden`, 포인터 없음. 지금 세트의 칩만 대화색 틴트 | V-7 |
| F-5 | 섹션 4 진입 자동 재생과 비어 보이는 중간 프레임 | `a/index.html:1437-1445`, `design-2/d-03.png`, `m-03.png` | 삭제. 탭 ①은 서버 HTML의 완성 상태(S4)를 그대로 둔다 | V-6 |
| F-6 | 눈금 내비 누르는 영역 30×22px | `a/index.html:75` | 44×32px. 1280px 이상만. 1440px 이상은 지금 섹션 이름 상시 표시 | V-24 |
| F-7 | 탭 목록 `aria-orientation="vertical"`인데 959px 이하에서 가로 | `a/index.html:688`, `:445` | 1024px 이상 `vertical`, 미만 `horizontal`을 `matchMedia`로 맞춘다. 화살표는 두 축 모두 받는다 | V-12 |
| F-8 | 보기를 누른 뒤 결과 표시 `setTimeout(240)`이 탭을 바꿔도 취소되지 않음 | `a/index.html:1356` | 5.10절 타이머 등록부에 넣고 모든 조작에서 취소 | V-11 |
| F-9 | JS 없을 때도 `빈칸에 들어갈 JOIN을 직접 골라 보세요`가 보임(답은 이미 채워져 있음) | `design-2/m-nojs-02.png`, 규칙 누락 `a/index.html:190` | `html:not(.js)`에서 힌트 숨김 | V-20 |
| F-10 | 반투명 헤더로 콘텐츠가 비치고, 신청 섹션에서 헤더 CTA가 폼 버튼과 겹침 | `design-2/m-01.png`, `m-03.png`, `d-04.png`, `m-09.png`·`m-10.png` | 헤더 흰 바탕 + 아래 1px 선. `#signup`이 보이거나 StickyCta가 보이면 헤더 CTA 숨김 | V-22 |
| F-11 | 히어로 서브와 섹션 6에 Claude 연동 문구 | `a/index.html:619`, `:971-972` | TSD D1. 2.5절 C-1 | V-25 |
| F-12 | `3분` 숫자 | `a/index.html:966` | TSD 6.3 "숫자를 쓰지 않는다". 2.5절 C-2 | V-25 |
| F-13 | 데스크톱 히어로 왼쪽 아래 빈 공간, 무대 왼쪽 열 설명과 재생 사이 약 200px 빈 공간 | `design-2/d-00.png`, `d-state-tab1.png`, 원인 `a/index.html:437` `.panels{min-height:318px}` | 히어로 빈 곳에 G-1. `min-height` 삭제, 재생 알약은 설명 바로 뒤 | V-1, V-5 |
| F-14 | 잠금화면을 보는 동안 모바일에서 `출시 예정 기능`이 안 보임 | `design-2/m-state-tab4.png` | G-5 | V-8 |
| F-15 | JS 없을 때도 패널에 `role="tabpanel"`이 남음 | 판정자 3, `a/index.html:697` | 탭 역할 속성은 하이드레이션 뒤에만 붙인다(5.12) | V-20 |
| F-16 | 메모 카드 빈 점 테두리 `#b6bfcb` 대비 1.86:1 | `a/index.html:143` | 의미 있는 그래픽 선은 `--color-line-3` `#8a94a3`(흰 바탕 3.07:1) | V-15 |

### 2.5 문서 간 충돌과 결정

| # | 충돌 | 결정 | 근거 |
|---|---|---|---|
| C-1 | 브리프 §2.1 서브 둘째 줄과 §2.6 카드 ②가 `GPT·Claude`를 쓴다. TSD D1은 Claude 연동을 랜딩에 쓰지 않는다 | 히어로 서브는 브리프 §2.1 첫 문장만 쓴다(브리프가 둘째 줄을 "쓴다면"으로 선택 사항으로 둠). 섹션 6 카드 ②와 미니 화면은 ChatGPT만 | 우선순위 PRD → TSD → 브리프. TSD가 브리프보다 나중에 고쳐졌다(D1~D3 확정 2026-10-26) |
| C-2 | 브리프 §2.6 `3분 안에 시작하도록 만들고 있어요` / TSD 6.3 `3분이면 준비 끝`: "숫자를 쓰지 않는다" | 숫자를 뺀다: `시작하도록 만들고 있어요` | TSD 6.3. 브리프 §5.5도 "숫자 생략"을 허용한다 |
| C-3 | 섹션 6 제목: 브리프 §2.6 `연결하고, 공부만 하세요` / TSD 6.1 #6 `출시하면 이렇게 시작해요` | TSD 문구를 h2로 | TSD 6.1이 출시 전 기능임을 제목으로 밝히라고 정했다 |
| C-4 | 섹션 6 띠: 브리프 `AI는 쓰고 있는 구독을 그대로 써요.` / TSD 6.3 `AI는 내 ChatGPT 구독(Plus·Pro)으로 써요` | TSD 문구 | TSD 6.3 "조건을 같이 쓴다" |
| C-5 | TSD 6.2 ① 화면 상단 `ChatGPT 연결됨` / 브리프 §3.7 `내 GPT · 연결 준비 중`, `연결됨`은 쓰지 않는다 | 브리프 §3.7 | TSD 2장 원칙 2(근거 없는 약속 금지)와 6.3 "출시 전 기능은 출시 예정임을 밝힌다"가 브리프 쪽을 뒷받침한다. TSD 6.2 표는 문구가 "확정 전 초안"이라고 적혀 있다 |
| C-6 | 브리프 §4.3 "① 사용자 말풍선 타이핑을 화면에 들어올 때 한 번(약 1초)" | 섹션 4 진입 연출 없음. 같은 질문의 타이핑은 히어로 거울에서 한 번(1024px 이상) | D-3 증거. TSD 6.2 "사용자가 누를 때만 넘어간다"와 브리프 §2.0 "첫 프레임은 완성된 상태"를 함께 지키는 가장 단순한 방법 |
| C-7 | 브리프 §2.3 꼬리질문 말풍선 "화면 진입 시 한 번만 등장" | 정지 | 움직임은 섹션 4 한 곳에 모은다(frontend-design: 한 장면에 힘을 몬다). 판정자 넷 모두 a의 정지 처리를 문제 삼지 않았다. (2026-11-02: 스크롤 등장과 히어로 등장을 더하면서 이 원칙은 3.4로 바뀌었다) |
| C-8 | TSD 12장 클라이언트 컴포넌트 목록: `LoopStepper`·`SignupForm`·`StickyCta`·attribution | `TickNav` 하나를 더한다(약 1KB, 1280px 이상). 다른 섬은 늘리지 않는다: 히어로 칩은 링크, 거울 타이핑은 CSS, CTA 클릭 추적은 attribution 섬의 위임 리스너 | 브리프 §2.0 장치. 없어도 링크로 동작한다 |
| C-9 | TSD 9.2 `loop_step` 속성 `step`·`variant`, `cta_click` `location`: `hero`·`easy_start`·`sticky` | `loop_step`에 `topic`을 더하고, `cta_click` `location`에 `nav`·`how`를 더한다 | 브리프 §2.4 "고른 칩은 분석 이벤트 속성으로만 남긴다". 폼 필드는 늘리지 않는다 |
| C-10 | TSD 11장 토큰 출발점 크림 `#f7f6f2` | 흰 `#ffffff` + 차가운 회색 무대 `#f2f4f7`. 단계 색 4개는 TSD 값 유지 | a/DESIGN.md 2.1: 크림 + 호박 카드색 조합이 흔한 티 1번이 된다. TSD 11장도 "브랜드가 정해지기 전 임시값" |
| C-11 | 브리프 §2.0 섹션마다 눈썹 라벨 | 히어로 포지셔닝 한 줄만. 섹션 이름은 TickNav가 맡는다 | frontend-design: 필요 없는 라벨을 제목 위에 얹지 않는다. 판정자 넷 모두 문제 삼지 않았다 |

---

## 3. 토큰

### 3.1 색

| Tailwind 토큰 | hex | 역할 | 대비 (WCAG 2.x) |
|---|---|---|---|
| `--color-bg` | `#ffffff` | 페이지 바탕, 폰 화면, 폼 카드 | — |
| `--color-surface` | `#f2f4f7` | 무대 카드(히어로 면접 그림, 섹션 4·6·7), AI 말풍선, 거울 입력창 | ink 14.43, ink-3 5.28, ink-4 4.69 |
| `--color-surface-2` | `#e8ecf1` | 메모 줄, 진행 막대 바탕, 장식 버튼 면 | ink-3 4.91. **ink-4는 쓰지 않는다(4.36)** |
| `--color-line` | `#e3e7ed` | 구분선(헤더 아래, 폰 앱바, 표 줄) | 장식선 |
| `--color-line-2` | `#cfd6df` | 입력 테두리, 탭 구분선, 칩 테두리 | 장식선 (입력 테두리는 ink 글자와 포커스 링이 상태를 보인다) |
| `--color-line-3` | `#8a94a3` | 의미 있는 그래픽 선: 빈 점(○), 눈금 자 눈금, 비활성 TickNav 눈금 | 흰 바탕 3.07 (1.4.11 통과) |
| `--color-ink` | `#1a2233` | 본문·제목·주 버튼 면 | 흰 15.90, surface 14.43, 단계 틴트 위 14.02 이상 |
| `--color-ink-2` | `#4e5968` | 강조 보조 글(칩 글자, 배지 글자) | 흰 7.11, surface 6.45 |
| `--color-ink-3` | `#5b6676` | 두 톤 문장의 회색 부분, 리드, 캡션 | 흰 5.82, surface 5.28, 단계 틴트 위 5.13 이상 |
| `--color-ink-4` | `#646e7c` | 작은 라벨, 비활성 탭, 폰 속 `who` | 흰 5.17, surface 4.69, 틴트 위 4.56 이상 |
| `--color-talk` / `--color-talk-tint` | `#3d5a99` / `#eef2f9` | ① 학습 대화: 사용자 말풍선, 히어로 After 테두리, 포커스 링, 강조 행 | 흰 6.73, 틴트 위 5.99, 흰 글자 6.73 |
| `--color-task` / `--color-task-tint` | `#2f6f5e` / `#ebf4f1` | ② 현장 과제: 과제 카드 테두리, 빈칸, 보기 버튼 | 흰 5.91, 틴트 위 5.27, 흰 글자 5.91 |
| `--color-card` / `--color-card-tint` / `--color-card-line` | `#9a5b13` / `#f8f1e7` / `#e8d6bf` | ③ 경험 카드: 머리띠, 출처 칩, 섹션 5 카드 | 흰 5.41, 틴트 위 4.83, 흰 글자 5.41 |
| `--color-remind` / `--color-remind-tint` | `#a3325c` / `#f8eef3` | ④ 리마인드(베리, 브리프 X4를 a가 정함): 알림 라벨, 눈금 핀, `다시 본 날` 점 | 흰 6.63, 틴트 위 5.84, 흰 글자 6.63 |
| `--color-lock` / `--color-lock-glow` | `#3b1d2c` / `#5b2a43` | 폰 속 잠금화면 바탕과 위쪽 빛(정지 그라데이션) | 흰 글자 15.02 / 11.31. 흰 78% 글자 9.62 |
| `--color-err` / `--color-err-tint` | `#b42318` / `#fdf1f0` | 오답 빈칸, `결과 0행`, 폼 오류 | 흰 6.57, 틴트 위 5.95 |
| `--color-code` | `#f6f8f9` | 폰 속 SQL 블록 바탕 | ink 15.3, task 5.54 |

- 단계 틴트 4개는 섹션 4 무대 배경에만 쓴다. 틴트를 겹친 층 4개의 `opacity`만 바꿔 전환한다(색 자체를 애니메이션하지 않는다).
- 잠금화면 위 반투명 흰 알약 `rgba(255,255,255,.16)` 위 흰 글자: 9.13.
- 다크 모드 없음, `color-scheme: light`(TSD 1.2·11).

### 3.2 글자

**글꼴**: Pretendard Variable 한 가족(npm `pretendard` 1.3.9, 동적 서브셋 자체 호스팅, TSD 4·C8). 고정폭은 SQL 코드에만 쓴다.

```
--font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "D2Coding", monospace;
```

**페이지 크기 체계** (px / 행간). 1024 값은 `lg:`, 1440 값은 `xl:`(1280px 이상)에서 적용한다.

| 토큰 | 쓰임 | 360 | 1024 | 1440 | 굵기 | 자간 |
|---|---|---|---|---|---|---|
| `text-h1` | 히어로 제목 (LCP) | 30 / 1.3 | 48 / 1.24 | 56 / 1.24 | 760 | -0.02em, lg+ -0.028em |
| `text-display` | 시대 변화 질문 h2 (이 섹션만) | 28 / 1.3 | 44 / 1.26 | 52 / 1.24 | 760 | -0.026em |
| `text-h2` | 섹션 제목 | 26 / 1.34 | 36 / 1.3 | 44 / 1.28 | 760 | -0.02em, lg+ -0.026em |
| `text-numeral` | 1·7·30 큰 숫자 줄 | 34 / 1.1 | 48 / 1.1 | 56 / 1.1 | 760 | -0.02em |
| `text-lead` | 두 톤 리드, 히어로 서브 | 17 / 1.62 | 19 / 1.62 | 20 / 1.62 | 400, 굵은 앞 구절 650 | 0 |
| `text-sum` | 문제 정리 문장 | 20 / 1.5 | 24 / 1.5 | 28 / 1.5 | 500, 굵은 구절 700 | -0.01em |
| `text-quote` | 고객 인용 | 18 / 1.55 | 20 / 1.55 | 22 / 1.55 | 600 | -0.01em |
| `text-close` | 섹션 4 마무리 한 줄 | 20 / 1.45 | 22 / 1.45 | 24 / 1.45 | 720 | -0.015em |
| `text-bubble` | 히어로·시대 변화 말풍선 | 16 / 1.5 | 17 / 1.5 | 18 / 1.5 | 400 (After 640, 크기 +1~2) | 0 |
| `text-tab` | 단계 탭 이름 | 15 / 1.3 | 20 / 1.3 | 20 / 1.3 | 740 | -0.015em |
| `text-body` | 본문 | 16 / 1.65 | 16 / 1.65 | 16 / 1.65 | 400 | 0 |
| `text-small` | 캡션, 출처 줄, 푸터, 사실 줄 | 14 / 1.5 | 14 / 1.5 | 14 / 1.5 | 400~600 | 0 |
| `text-micro` | 배지, 시점 라벨, 눈금 이름, 칩 메타 | 13 / 1.4 | 13 / 1.4 | 13 / 1.4 | 600~700 | 0 |

- 페이지 어디에도 13px 미만 글자를 두지 않는다.
- 모든 글에 `word-break: keep-all; overflow-wrap: break-word`. 제목에 `text-wrap: balance`. 히어로 h1은 두 줄을 `<span class="block">`으로 고정한다(`공부하는 오늘이,` / `면접에서 말할 경험이 됩니다`).
- 자간은 큰 제목만 -0.02~-0.028em. 영문 디스플레이처럼 좁히지 않는다(브리프 §2.0).
- 한 줄 길이: 본문·리드 최대 34em(약 70자).

**폰 속 글자 체계** (모든 폭에서 같다, 최소 13px)

| 쓰임 | 크기 / 행간 | 굵기 |
|---|---|---|
| 말풍선 본문, 과제 본문, 알림 본문, 카드 본문 | 14 / 1.55 | 400 |
| 이름표 `AI`, 카드 칸 이름, 과목 칩, 날짜, 상태 줄, 태그, 출처, 토스트, 잠금 안내, 섬 배지, 표 캡션 | 13 / 1.45 | 600~750 |
| 표 셀 | 13 / 1.35, 칸 여백 `4px 6px`, `tabular-nums` | 400, 머리 650 |
| SQL | 13 / 1.6 고정폭, `white-space: pre-wrap`, 줄마다 2ch 내어쓰기, `overflow-wrap: anywhere` | 400, 키워드 750 |
| 경험 카드 답변 한 줄 | 15 / 1.5 | 720 |
| 잠금화면 날짜 / 요일 | 46 / 1.1, -0.03em / 15 | 760 / 550 |
| 보기 버튼 | 14 고정폭 | 750 |

### 3.3 간격·레이아웃·모서리·그림자

| 항목 | 값 |
|---|---|
| 간격 단위 | 4px 배수. 자주 쓰는 값 4·8·12·16·24·32·48·64 |
| 페이지 좌우 여백 | 16px(<640) · 32px(640~1023) · 40px(≥1024) |
| 콘텐츠 최대 폭 | 1080px(TSD 11장). 본문 줄 최대 34em |
| 섹션 위아래 | 88px(<640) · 112px(640~1023) · 128px(≥1024) |
| 중단점 | Tailwind 기본: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. TSD 11장의 640·1024와 맞는다. `md`는 StickyCta에만 |
| 높이 | `100vh` 금지. 필요하면 `100svh`·`100dvh`(TSD 11) |

| 모서리 토큰 | 값 | 쓰임 |
|---|---|---|
| `--radius-stage` | 24px(<1024) · 32px(≥1024) | 무대 카드 |
| `--radius-phone` | 40px(<1024) · 50px(≥1024) | 폰 바깥 |
| `--radius-app` | 16px | 폰 속 카드(과제, 경험 카드, 알림 18) |
| `--radius-bubble` | 18px, 꼬리 쪽 한 모서리 6px | 말풍선 |
| `--radius-btn` | 14px(52px 버튼) · 12px(44px 버튼) | 버튼 |
| `rounded-full` | 999px | 칩, 알약, 배지 |

그림자는 세 곳에만 준다. 나머지는 선이나 면으로 나눈다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--shadow-phone` | `inset 0 0 0 1px #c8cfd8, 0 34px 60px -24px rgb(26 34 51 / .34), 0 12px 24px -14px rgb(26 34 51 / .2)` | 폰 프레임 |
| `--shadow-key` | `0 16px 34px -14px rgb(26 34 51 / .32)` | 지금 떠오른 요소(과제 카드, 새 경험 카드, 섹션 5 `오늘` 카드) |
| `--shadow-memo` | `0 10px 26px -14px rgb(26 34 51 / .3)` | 메모 더미 맨 앞 장 |

### 3.4 모션 토큰

움직이는 속성은 `transform`과 `opacity`뿐이다(`visibility`는 즉시 바뀌는 값으로만). 기본 곡선은 `--ease-out-quint: cubic-bezier(.22,1,.36,1)`(브리프 §2.0 Aside 수치). 라이브러리는 GSAP(ScrollTrigger 포함)만 쓰고, 스크롤 등장에만 쓴다(2026-11-02 창업자 결정으로 "애니메이션 라이브러리 없음"을 바꿨다, TSD 12). 나머지는 CSS다.

| 이름 | 시간 | 곡선 | 무엇이 | 쓰는 곳 |
|---|---|---|---|---|
| press | 160ms | quint | `scale(.97)` | 모든 버튼·칩 `:active` |
| rise | 320ms | quint | 위 10px → 0, 투명 0 → 1 | 폰 속 새로 나타나는 요소(한 번만) |
| stagger | 350ms 간격 | — | — | S5 체크 줄(기본 배속) |
| sheet | 420ms | quint | 아래 40px → 0 + 투명도 | S6 과제 카드 |
| panel | 220ms | ease | 투명도 | 탭 전환 시 폰 화면 |
| detail | 300ms | quint | rise | 탭 전환 시 설명 |
| tint | 500ms | quint | 틴트 층 투명도 | 무대 배경 |
| pop | 280ms | quint | `scale .9 → 1.06 → 1` | 빈칸이 채워질 때 |
| result-delay | 240ms | — | — | 보기를 누르고 결과를 띄우기까지 |
| fly | 400ms | X `cubic-bezier(.2,.7,.3,1)` / Y `cubic-bezier(.65,0,.85,.55)` | 두 겹 `translate`로 곡선 | S8 쿼리 조각이 카드로 내려앉음 |
| slide | 420ms | quint | `translateX(100%) → 0` | S9 목록 화면 |
| date | 360ms | quint | 위·아래 45% 이동 + 투명도 | 잠금화면 날짜 넘김 |
| stack | 260ms | quint | 뒤 카드 `translateY(13px) scale(.94)`, `26px .88` | 알림 스택 |
| ruler | 550ms | quint | 채움 `scaleX`, 핀 `translateX` | 눈금 자 |
| dot | 280ms, 시작 420ms 뒤 150ms 간격 | quint | `scale 0 → 1` | `다시 본 날` 점 |
| lift | 500ms | quint | `translateY(-100%)` | 잠금화면이 걷힘 |
| tap | 550ms | quint | 원 `scale .35 → 1.5` + 투명도 | 이어 보기의 가짜 탭 표시 |
| hint | 1500ms, 1회 | ease | 탭 배경 투명도 0 → .14 → 0 | 다음 탭 힌트 |
| pulse | 1000ms 반복, busy 동안만(최대 약 1.3초) | ease-in-out | 투명도 1 ↔ .45 | S5 상태 라벨 |
| sticky | 300ms | quint | `translateY(110%) → 0` | StickyCta |
| tick | 350ms | quint | `scaleX(2.2)` | TickNav 지금 눈금 |
| type-chat | 음절·글자당 약 42~50ms | 선형 | 글자 수 | 이어 보기 S1·S3 입력창 타이핑 |
| type-hero | 1.5s, 400ms 뒤 시작, `steps(30)` | — | 덮개 `translateX(0 → 100%)` | 히어로 거울(1024px 이상만) |
| hero-in | 700ms, 단계 간격 90ms | quint | 제목·설명은 아래 24px → 0만(투명도는 그대로), 버튼 줄·앱 창은 투명도만 | 히어로. CSS keyframes, 로드 때 한 번. 순서는 제목 → 설명 → 버튼 → 앱 창. 글을 투명하게 시작하면 그려진 것으로 집계되지 않아 LCP가 늦어진다(느린 폰 측정 1.3초 → 3.4초) |
| reveal | 800ms, 함께 나타나는 것끼리 70ms 간격 | `power4.out`(quint와 같은 곡선) | 아래 30px → 0 + 투명도 | 섹션 제목·카드(`data-reveal`). GSAP + ScrollTrigger, 화면 높이 82% 지점에서 요소마다 한 번. 방문자의 첫 스크롤·키·클릭 뒤에 시작 |
| hover | 160ms | quint | `translateY(-2px)` | `.btn`. `hover: hover`이고 모션 줄이기가 아닐 때만. 누르면 `:active`(press)가 이긴다 |

- 모든 등장 애니메이션은 `@media (prefers-reduced-motion: no-preference)` 안에 둔다. 전역 규칙으로 `reduce`일 때 `transition`·`animation` 시간을 0으로 만든다. JS도 같은 설정을 실시간으로 읽는다(5.12).
- 화면에 들어올 때 저절로 움직이는 것은 히어로 앱 창의 자동 재생(한 번, 재생·멈춤 버튼이 있다), 히어로 등장(`hero-in`, 한 번), 스크롤 등장(`reveal`, 요소마다 한 번)이다. 뒤의 둘은 2026-11-02 창업자 결정으로 더했다. 나머지 움직임은 모두 방문자 조작에 대한 반응이다.
- 스크롤 등장은 GSAP가 실행된 뒤에만 숨긴다. 이미 화면에 있거나 지나친 요소(깊은 링크, 복원된 스크롤)는 숨기지 않는다. 모션 줄이기이면 GSAP를 받지 않고, 보는 중에 켜면 남은 것을 바로 보인다. 제품 데모(`#stage`)와 히어로 앱 창에는 걸지 않는다.

### 3.5 Tailwind v4 `@theme` 제안 (`app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* color */
  --color-bg: #ffffff;
  --color-surface: #f2f4f7;
  --color-surface-2: #e8ecf1;
  --color-line: #e3e7ed;
  --color-line-2: #cfd6df;
  --color-line-3: #8a94a3;
  --color-ink: #1a2233;
  --color-ink-2: #4e5968;
  --color-ink-3: #5b6676;
  --color-ink-4: #646e7c;
  --color-talk: #3d5a99;   --color-talk-tint: #eef2f9;
  --color-task: #2f6f5e;   --color-task-tint: #ebf4f1;
  --color-card: #9a5b13;   --color-card-tint: #f8f1e7;  --color-card-line: #e8d6bf;
  --color-remind: #a3325c; --color-remind-tint: #f8eef3;
  --color-lock: #3b1d2c;   --color-lock-glow: #5b2a43;
  --color-err: #b42318;    --color-err-tint: #fdf1f0;
  --color-code: #f6f8f9;

  /* font */
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "D2Coding", monospace;

  /* type: base = 360, -lg = 1024, -xl = 1440 (xl: 1280px 이상에서 적용) */
  --text-h1: 1.875rem;       --text-h1--line-height: 1.3;
  --text-h1-lg: 3rem;        --text-h1-lg--line-height: 1.24;
  --text-h1-xl: 3.5rem;      --text-h1-xl--line-height: 1.24;
  --text-display: 1.75rem;   --text-display--line-height: 1.3;
  --text-display-lg: 2.75rem; --text-display-lg--line-height: 1.26;
  --text-display-xl: 3.25rem; --text-display-xl--line-height: 1.24;
  --text-h2: 1.625rem;       --text-h2--line-height: 1.34;
  --text-h2-lg: 2.25rem;     --text-h2-lg--line-height: 1.3;
  --text-h2-xl: 2.75rem;     --text-h2-xl--line-height: 1.28;
  --text-numeral: 2.125rem;  --text-numeral--line-height: 1.1;
  --text-numeral-lg: 3rem;   --text-numeral-xl: 3.5rem;
  --text-lead: 1.0625rem;    --text-lead--line-height: 1.62;
  --text-lead-lg: 1.1875rem; --text-lead-xl: 1.25rem;
  --text-sum: 1.25rem;       --text-sum-lg: 1.5rem;  --text-sum-xl: 1.75rem;
  --text-quote: 1.125rem;    --text-quote-lg: 1.25rem; --text-quote-xl: 1.375rem;
  --text-close: 1.25rem;     --text-close-lg: 1.375rem; --text-close-xl: 1.5rem;
  --text-bubble: 1rem;       --text-bubble-lg: 1.0625rem; --text-bubble-xl: 1.125rem;
  --text-tab: 0.9375rem;     --text-tab-lg: 1.25rem;
  --text-body: 1rem;         --text-body--line-height: 1.65;
  --text-small: 0.875rem;    --text-small--line-height: 1.5;
  --text-micro: 0.8125rem;   --text-micro--line-height: 1.4;
  --text-phone: 0.875rem;    --text-phone--line-height: 1.55;
  --text-phone-meta: 0.8125rem; --text-phone-meta--line-height: 1.45;
  --text-lockdate: 2.875rem; --text-lockdate--line-height: 1.1;

  /* radius */
  --radius-stage-sm: 1.5rem;  --radius-stage: 2rem;
  --radius-phone-sm: 2.5rem;  --radius-phone: 3.125rem;
  --radius-app: 1rem;
  --radius-bubble: 1.125rem;
  --radius-btn: 0.875rem;     --radius-btn-sm: 0.75rem;

  /* shadow */
  --shadow-phone: inset 0 0 0 1px #c8cfd8, 0 34px 60px -24px rgb(26 34 51 / .34), 0 12px 24px -14px rgb(26 34 51 / .2);
  --shadow-key: 0 16px 34px -14px rgb(26 34 51 / .32);
  --shadow-memo: 0 10px 26px -14px rgb(26 34 51 / .3);

  /* layout */
  --container-content: 67.5rem;

  /* motion */
  --ease-out-quint: cubic-bezier(.22, 1, .36, 1);
  --animate-rise: rise 320ms var(--ease-out-quint) both;
  --animate-sheet: sheet 420ms var(--ease-out-quint) both;
  --animate-fadein: fadein 220ms ease both;
  --animate-pop: pop 280ms var(--ease-out-quint);
  --animate-hint: hint 1500ms ease both;
  --animate-tap: tap 550ms var(--ease-out-quint) both;
  --animate-pulse-label: pulse-label 1000ms ease-in-out infinite;

  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes sheet { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
  @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pop { 0% { transform: scale(.9); } 60% { transform: scale(1.06); } to { transform: none; } }
  @keyframes hint { 30% { opacity: .14; } to { opacity: 0; } }
  @keyframes tap { from { transform: scale(.35); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
  @keyframes pulse-label { 50% { opacity: .45; } }
}

:root {
  color-scheme: light;
  /* Tailwind 네임스페이스가 없는 시간 값은 일반 변수로 둔다 */
  --dur-press: 160ms; --dur-panel: 220ms; --dur-detail: 300ms; --dur-tint: 500ms;
  --dur-fly: 400ms; --dur-slide: 420ms; --dur-date: 360ms; --dur-stack: 260ms;
  --dur-ruler: 550ms; --dur-dot: 280ms; --dur-lift: 500ms; --dur-sticky: 300ms; --dur-tick: 350ms;
}
```

### 3.6 전역 규칙

- `body`: `bg-bg text-ink font-sans text-body`, `word-break: keep-all`, `-webkit-font-smoothing: antialiased`.
- 포커스: `:focus-visible { outline: 3px solid var(--color-talk); outline-offset: 3px }`. 어두운 잠금화면 위에서는 흰색 링.
- `html { scroll-padding-top: 72px }`(고정 헤더 60px + 여백). `prefers-reduced-motion: no-preference`일 때만 `scroll-behavior: smooth`.
- 버튼 높이: 주·보조 CTA 52px, 작은 버튼·칩·보기·폼 칩 44px 이상(TSD 11).
- `[hidden] { display: none !important }`.

---

## 4. 섹션별 명세

### 4.0 공통

**헤더** (`app/page.tsx`의 `<header>`, 서버)

```
1440: ┌────────────────────────────────────────────────────────────┐ 60px, 흰 바탕, 아래 1px line
      │ Experii                                     [사전 신청하기] │ 로고 21px 820, 버튼 44px
      └────────────────────────────────────────────────────────────┘
360:  │ Experii                       [사전 신청하기] │ 같은 구조, 좌우 16px
```

- `position: sticky; top: 0; z-index: 30`. 반투명·블러 없음(F-10).
- 로고 링크 `#top`, 높이 44px. CTA `사전 신청하기` → `#signup`, `data-cta="nav"` [§2.0 CTA 반복].
- 헤더 CTA는 `body[data-signup-visible]`이거나 `body[data-sticky="on"]`일 때 투명도 0 + `pointer-events: none` + `tabindex=-1` 효과(`inert`). 이 속성은 StickyCta가 붙인다(4.9).

**TickNav** (1280px 이상, 클라이언트)

```
x=12px, 세로 가운데      ─   처음
                         ─   문제
                         ─   질문이 달라졌어요
                        ━━   작동 방식      ← 지금 섹션: 눈금 2.2배·ink. 1440px 이상이면 이름 상시 표시
                         ─   언제 시작하나요
                         ─   귀찮지 않은 시작
                         ─   사전 신청
```

- `<nav aria-label="섹션 바로 가기">` 안 링크 7개. 링크 하나의 누르는 영역 44×32px, 눈금 10×2px(`--color-line-3`, 지금 섹션은 `--color-ink` + `scaleX(2.2)`).
- 이름(`text-micro` 600, ink-2, 흰 바탕 알약)은 마우스·포커스 때 나타나고, 1440px 이상에서는 지금 섹션 이름을 늘 보인다(1440에서 콘텐츠는 x=180부터라 겹치지 않는다).
- 이름 문구는 브리프 눈썹 라벨에서 가져온다: `처음`[초안] · `문제`[§2.2] · `질문이 달라졌어요`[§2.3] · `작동 방식`[§2.4] · `언제 시작하나요`[§2.5] · `귀찮지 않은 시작`[§2.6] · `사전 신청`[§2.7].
- 지금 섹션 표시는 IntersectionObserver(`rootMargin: -45% 0px -50% 0px`)로 `aria-current="true"`. JS가 없으면 링크만 동작.

**CTA 반복** [§2.0, §2.7]: `사전 신청하기`를 헤더·히어로·섹션 6·StickyCta에 같은 문구로 둔다. 모든 CTA 링크에 `data-cta` 값(`nav`·`hero`·`easy_start`·`sticky`·`how`)을 달고, attribution 클라이언트 섬의 위임 클릭 리스너 하나가 `track('cta_click', { location, variant })`를 보낸다.

---

### 4.1 섹션 1 · 히어로 `#top` (`Hero`, 서버)

**레이아웃**

```
1440 (wrap 1080, 두 열: 1fr | 540, 간격 72)
  면접에 집중한 학습 앱                                   ← text-small 600 ink-3 (lg 16px)
  공부하는 오늘이,                                        ← h1 56, 두 줄 고정, 두 열을 가로지름
  면접에서 말할 경험이 됩니다
  ┌ 왼쪽 ─────────────────────────────┐  ┌ figure.interview (surface, r32, 34/32px) ┐
  │ SQLD 공부하며 AI와 나눈 대화가     │  │ 면접관                            [예시] │
  │ 현장 과제가 되고, 면접에서 꺼낼    │  │ ( SQL 써 보셨어요? )  흰 면              │
  │ 답변 한 줄로 남아요.   lead ink-3  │  │                       자격증만 있을 때   │
  │                                    │  │                   ( 자격증 있어요. )     │ 점선 line-3, ink-3
  │ [사전 신청하기] [어떻게 쓰는지 보기]│  │                    과제를 풀어 봤을 때   │
  │                                    │  │ ( 주문 없는 회원을 찾는 과제에서         │ 흰 면, talk 2px
  │ ┌ 거울 입력창 (surface, r20) ────┐ │  │   LEFT JOIN으로 이렇게 써 봤어요. )      │ 640 굵기
  │ │ LEFT JOIN이랑 INNER JOIN 차이가 │ │  │              [▭ 10월 26일 SQLD 대화에서] │ card 칩
  │ │ 헷갈려▍                     (↑)│ │  └──────────────────────────────────────────┘
  │ └────────────────────────────────┘ │
  │ (JOIN 차이가 헷갈려) (GROUP BY랑 HAVING) (ROW_NUMBER랑 RANK)
  └────────────────────────────────────┘

360 (한 열, DOM 순서 = 읽는 순서: 서브 → CTA → 그림 → 거울)
  y   60 ┌ 헤더 ───────────────────────────┐
  y   82  면접에 집중한 학습 앱
  y  104  공부하는 오늘이,               h1 30
          면접에서 말할 경험이 됩니다
  y  200  SQLD 공부하며 AI와 나눈 대화가 현장 과제가 되고,
          면접에서 꺼낼 답변 한 줄로 남아요.          lead 17 (2~3줄)
  y  290  [사전 신청하기][어떻게 쓰는지 보기]         52px
  y  370  ┌ figure ───────────────────────┐
          │ 면접관                  [예시] │
          │ ( SQL 써 보셨어요? )           │
          │         자격증만 있을 때       │
          │        ( 자격증 있어요. )      │
          │        과제를 풀어 봤을 때     │
          │ ( 주문 없는 회원을 찾는 과제에서│
          │   LEFT JOIN으로 이렇게 써 봤어요.)│
          │    [▭ 10월 26일 SQLD 대화에서] │
  y ≈705  └────────────────────────────────┘   ← 780px 첫 화면 안에서 끝나야 한다 (V-1)
  ───── 첫 화면 끝 ─────
          ┌ 거울 입력창 ──────────────────┐
          │ LEFT JOIN이랑 INNER JOIN 차이가│
          │ 헷갈려                     (↑) │
          └────────────────────────────────┘
          (JOIN 차이가 헷갈려) (GROUP BY랑 HAVING)
          (ROW_NUMBER랑 RANK)
```

- 그리드: `lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-x-18`, 영역 `copy figure / mirror figure`. 모바일은 `copy / figure / mirror`.
- 섹션 위 22px · 아래 56px(<1024), 위 64px · 아래 120px(≥1024).

**카피**

| 자리 | 문구 | 출처 |
|---|---|---|
| 포지셔닝 한 줄 | 면접에 집중한 학습 앱 | [§2.1] (PRD 1장) |
| h1 (변형 h1, 기본) | 공부하는 오늘이, 면접에서 말할 경험이 됩니다 | [§2.1] [TSD 6.4] |
| h1 (변형 h2, P1) | "자격증 있어요" 대신 "이렇게 써 봤어요" | [§2.1] [TSD 6.4] |
| h1 (변형 h3, P1) | 자격증 공부하면서 면접 답변도 같이 쌓으세요 | [§2.1] [TSD 6.4] |
| 서브 | SQLD 공부하며 AI와 나눈 대화가 현장 과제가 되고, 면접에서 꺼낼 답변 한 줄로 남아요. | [§2.1] 첫 문장만. 둘째 줄은 쓰지 않는다(C-1) |
| 주 CTA | 사전 신청하기 → `#signup`, `id="hero-cta"`(감싸는 행), `data-cta="hero"` | [§2.1] |
| 보조 CTA | 어떻게 쓰는지 보기 → `#how` | [§2.1] |
| 그림 배지 | 예시 | [A안] |
| 면접관 이름표 / 말풍선 | 면접관 / SQL 써 보셨어요? | [§2.1] |
| Before 상황 라벨 / 말풍선 | 자격증만 있을 때 / 자격증 있어요. | 라벨 [A안], 말풍선 [§2.1] |
| After 상황 라벨 / 말풍선 | 과제를 풀어 봤을 때 / 주문 없는 회원을 찾는 과제에서 LEFT JOIN으로 이렇게 써 봤어요. | 라벨 [A안], 말풍선 [§2.1] |
| 출처 칩 | 10월 26일 SQLD 대화에서 | [§2.1] |
| 거울 입력창 문장 | LEFT JOIN이랑 INNER JOIN 차이가 헷갈려 | [§2.1] |
| 화살표 링크 `aria-label` | 이 질문으로 예시 화면 보기 → `#how-join` | [§2.1] |
| 칩 3개 | JOIN 차이가 헷갈려 → `#how-join` · GROUP BY랑 HAVING → `#how-group` · ROW_NUMBER랑 RANK → `#how-rank` | [§2.1] |
| 칩 묶음 `aria-label` | SQLD 질문 예시 | [초안] |
| 그림 `aria-label` | 같은 면접 질문에 대한 두 가지 답변 예시 | [A안] |

**거울 입력창 구조**

```html
<div class="mirror" (surface, r20, 패딩 14/16, flex, gap 12)>
  <p class="mirror-text" (text 17 lg:18, ink, overflow hidden, relative)>
    <span aria-hidden="true">LEFT JOIN이랑 INNER JOIN 차이가 헷갈려</span>
    <span class="sr-only">예시 질문: LEFT JOIN이랑 INNER JOIN 차이가 헷갈려</span>
    <span class="mirror-cover" aria-hidden="true"></span>   ← lg 이상 타이핑 덮개
  </p>
  <a href="#how-join" data-topic="join" aria-label="이 질문으로 예시 화면 보기" (44×44 원, ink 면, 흰 위쪽 화살표 SVG)/>
</div>
<ul aria-label="SQLD 질문 예시" (flex wrap, gap 8, mt 12)>
  <li><a href="#how-join"  data-topic="join"  (44px 알약, 흰 면, line-2 1.5px, ink-2 15px 600)>JOIN 차이가 헷갈려</a></li>
  …
</ul>
```

- 진짜 `<textarea>`·`<input>`을 쓰지 않는다(브리프 §2.1 구현 메모). 글자 위 커서는 기본 화살표. 반응하는 것은 화살표와 칩뿐이다.
- `sr-only`의 "예시 질문:" 접두는 [초안]. 입력창으로 오해하지 않게 한다.

**인터랙션**

| 요소 | 시작 조건 | 움직임 | 시간 | 동작 줄이기 | JS 없음 |
|---|---|---|---|---|---|
| 거울 타이핑 (1024px 이상) | 페이지 로드, CSS만 | `.mirror-cover`(바탕 surface, 왼쪽 끝 2px talk 커서)가 `translateX(0) → 100%`로 `steps(30)` 이동해 글자가 왼쪽부터 드러난다. 한 번 치고 멈춘다 | 400ms 뒤 1.5s | 덮개 없음, 문장이 바로 보인다 | CSS라 같다 |
| 거울 (1023px 이하) | — | 움직임 없음. 문장이 두 줄로 접혀 덮개가 어색하고, 첫 화면 밖이다 | — | — | — |
| 칩·화살표 | 클릭·Enter | `#how-{topic}`으로 스크롤(부드럽게는 no-preference일 때만). `LoopStepper`가 세트를 바꾸고 ①로 연다(5.11) | 브라우저 기본 | 즉시 이동 | 스크롤만 된다. 섹션 4는 세트 A로 보인다 |
| CTA | 클릭 | `:active` press | 160ms | 없음 | 링크 |

- LCP 요소는 h1이다. 히어로에 이미지가 없다(TSD 12).

---

### 4.2 섹션 2 · 문제 `#problem` (`Problem`, 서버)

**레이아웃**

```
1440
  공부 시간은 늘었는데, 면접에서 꺼낼 게 없어요                      h2 44
  ───────────────────  ───────────────────  ───────────────────      위 1.5px ink 선, 3열 gap 40
  "AI와 공부하며 공부   "웹 리서치로 얻은     "웹 리서치 시간이
   시간은 늘어났는데…"   정보가 노션과 카톡…"   너무 아까움"            quote 22
  창업자와 주변 대학생 2명이 실제로 한 말이에요.                       small ink-4
                                                                       (위 여백 104)
  ┌ 메모 더미 (440) ─────────────┐          정리해서 저장은 했는데, 다시 열어 본 적은 없어요.
  │ ┌ SQL JOIN 정리  저장함 · 9월 3일 ┐      공부는 했는데, 면접에서 꺼낼 경험으로는 남지 않아요.
  │  ┌ SQL JOIN 정리 저장함 · 9월 17일┐                                  sum 28, 굵은 앞 구절
  │   ┌ SQL JOIN 정리 저장함 · 10월 2일┐
  │   │ ▬▬▬▬▬▬▬ / ▬▬▬▬▬ / ▬▬▬         │
  │   │ 다시 연 날  ○ ○ ○              │  ← 빈 점 테두리 line-3
  │   └────────────────────────────────┘
360: 제목 → 인용 3개 세로(gap 26) → 출처 → 메모 더미 → 정리 문장
```

- 메모 카드: 흰 면, line 1px, r14, 패딩 12/14. 앞 두 장은 `translateY(0/40px) scale(.94/.97)`, 맨 앞 장 `translateY(80px)` + `--shadow-memo`. 회전하지 않는다(design-1의 회전 카드가 360에서 1px 넘침을 만들었다). 메모 더미는 `aria-hidden="true"`.

**카피**

| 자리 | 문구 | 출처 |
|---|---|---|
| h2 | 공부 시간은 늘었는데, 면접에서 꺼낼 게 없어요 | [§2.2] |
| 인용 1 | "AI와 공부하며 공부 시간은 늘어났는데 이해도는 떨어지는 느낌" | [§2.2] (PRD 3장) |
| 인용 2 | "웹 리서치로 얻은 정보가 노션과 카톡에 누적만 되어 있고 실제로 다시 보지 않음" | [§2.2] |
| 인용 3 | "웹 리서치 시간이 너무 아까움" | [§2.2] |
| 출처 줄 | 창업자와 주변 대학생 2명이 실제로 한 말이에요. | [§2.2] |
| 메모 제목 / 스탬프 | SQL JOIN 정리 / 저장함 · 9월 3일 · 저장함 · 9월 17일 · 저장함 · 10월 2일 | 제목 [A안], 스탬프 형식 [§2.2] |
| 메모 빈 칸 | 다시 연 날 ○ ○ ○ | [§2.2] |
| 정리 1 | **정리해서 저장은 했는데,** 다시 열어 본 적은 없어요. | [§2.2] |
| 정리 2 | **공부는 했는데,** 면접에서 꺼낼 경험으로는 남지 않아요. | [§2.2] |

인용은 `<blockquote>`, 큰따옴표는 문구에 포함된 굽은 따옴표(“ ”)를 쓴다.

**인터랙션**: 없음. 정지 화면. JS 없음·동작 줄이기와 같다.

---

### 4.3 섹션 3 · 시대 변화 `#shift` (`Shift`, 서버)

**레이아웃**

```
1440 (두 열 1fr | 460, gap 88, 세로 가운데)
  서류는 AI가 도와줘요.                     면접관
  면접에서 나누는 대화는요?   display 52    ( SQLD 있으시네요. )                  surface 면, bubble 20
  "자격증 있어요"는 첫 질문까지만 답이 돼요.  ( 그럼 SQL을 어떤 과제에서              ink 면 + 흰 글자, 22, 640
  그다음 질문에 답하려면 … 있어야 해요.         어떻게 써 봤어요? )
360: 제목(display 28) → 두 톤 단락 → 면접관 이름표 → 말풍선 두 개(세로, gap 10)
```

- 바탕은 페이지와 같은 흰색이다(D-2). 대담함은 display 크기와 둘째 말풍선의 먹색 면으로 만든다(G-4).

**카피**

| 자리 | 문구 | 출처 |
|---|---|---|
| h2 (display) | 서류는 AI가 도와줘요. 면접에서 나누는 대화는요? | [§2.3] [TSD 6.1 #3]. lg 이상에서 `서류는 AI가 도와줘요.` / `면접에서 나누는 대화는요?` 두 줄 |
| 두 톤 단락 | **"자격증 있어요"는 첫 질문까지만 답이 돼요.** 그다음 질문에 답하려면 직접 써 본 경험이 있어야 해요. | [§2.3] |
| 이름표 | 면접관 | [§2.3] |
| 말풍선 1 | SQLD 있으시네요. | [§2.3] |
| 말풍선 2 | 그럼 SQL을 어떤 과제에서 어떻게 써 봤어요? | [§2.3] |

**인터랙션**: 없음(C-7). 정지 화면.

---

### 4.4 섹션 4 · 작동 방식 `#how` (`HowItWorks` 서버 + `LoopStepper` 클라이언트)

이 절은 바깥 틀이다. 무대 안은 5장.

**레이아웃**

```
1440
  공부하고, 풀고, 남기고, 다시 꺼내요                    h2 44
  SQLD 공부 하루가 면접 답변 한 줄이 되기까지             lead ink-3
  <span id="how-join"> <span id="how-group"> <span id="how-rank">   ← 무대 바로 위, scroll-margin-top 72
  ┌ stage #stage (단계 틴트, r32, 패딩 48 48 32) ───────────────────────────────────┐
  │ ① 공부한 날                                              ╭ phone 352×724 ╮      │
  │   학습 대화                 ← 세로 탭, 위아래 line-2      │ (예시 화면)    │      │
  │ ② 공부한 날 / 현장 과제                                   │ 단계 화면      │      │
  │ ③ 공부한 날 / 경험 카드                                   │                │      │
  │ ④ 1·7·30일 뒤 / 리마인드                                  │                │      │
  │                                                           │                │      │
  │ AI와 평소처럼 공부해요. 막힌 개념을 …   (detail, lead 18) │                │      │
  │ (②: 폰 화면의 빈칸에 … 직접 골라 보세요.)                 │                │      │
  │ (④: [출시 예정 기능], 31칸 눈금 자, 사실 줄)              │                │      │
  │ [다음 단계: 현장 과제]  ← 행동 버튼                        │                │      │
  │ (▶ 처음부터 이어 보기 ▬ ▬ ▬ ▬)  ← 설명 바로 뒤(F-13)       │                │      │
  └───────────────────────────────────────────────────────────│                │──────┘
  예시 화면이에요. 쓰던 GPT를 연결해 …      (small ink-4)       ╰────────────────╯ ← 96px 삐져나옴
  공부한 날 한 번 남기면, 그다음은 Experii가 꺼내 줘요.  (close 24)
  이 질문으로 첫 공부 시작하기                             (talk, 밑줄, 44px)
  ─────────────────── 1·7·30 숫자 줄 (가로 3칸, gap 48) ───────────────────
  [출시 예정 기능]  알림은 공부한 날로부터 1일, 7일, 30일 뒤, 딱 세 번 와요.
  ──────────────          ──────────────          ──────────────     위 1.5px 선 (지금 단계 무관, 정지)
  10월 27일 화요일          11월 2일 월요일          11월 25일 수요일   micro ink-4
  1일 뒤                    7일 뒤                   30일 뒤            numeral 56
  배운 점                   활용 방안                면접 예상 질문     small ink-3

360
  공부하고, 풀고,
  남기고, 다시 꺼내요                   h2 26
  SQLD 공부 하루가 면접 답변 한 줄이 되기까지
  ┌ stage (틴트, r24, 패딩 8) ─────────┐
  │[학습 대화|현장 과제|경험 카드|리마인드]│  탭 64 (칸마다 시점 라벨 13 + 이름 15)
  │ ╭ phone 312×520 ────────────────╮  │
  │ │          (예시 화면)           │  │
  │ │  단계 화면                     │  │
  │ ╰───────────────────────────────╯  │
  │ [     다음 단계: 현장 과제      ]  │  행동 행 48 ← 폰과 한 화면(F-2)
  │ AI와 평소처럼 공부해요. …          │  detail
  │ (④: 출시 예정 기능 · 눈금 자 · 사실 줄)│
  │ (▶ 처음부터 이어 보기 ▬▬▬▬)        │
  └────────────────────────────────────┘
  캡션 / 마무리 한 줄 / 링크
  1·7·30 숫자 줄: 세로 3줄, 줄마다 [선 / 날짜 / 34px 숫자 / 라벨]
```

**카피 (바깥)**

| 자리 | 문구 | 출처 |
|---|---|---|
| h2 | 공부하고, 풀고, 남기고, 다시 꺼내요 | [§2.4] 제목 후보 1 |
| 리드 | SQLD 공부 하루가 면접 답변 한 줄이 되기까지 | [§2.4] 제목 후보 2 |
| 폰 아래 캡션 | 예시 화면이에요. 쓰던 GPT를 연결해 이렇게 공부하도록 준비하고 있어요. 지금 보이는 대화는 미리 써 둔 예시예요. | [§2.4] [§3.7] |
| 마무리 한 줄 | 공부한 날 한 번 남기면, 그다음은 Experii가 꺼내 줘요. | [§3.2 S13] |
| 데모 끝 링크 | 이 질문으로 첫 공부 시작하기 → `#signup`, `data-cta="how"`. '→'는 붙이지 않는다 | [§2.4] |
| 숫자 줄 배지 | 출시 예정 기능 | [§2.4] [TSD 6.3] |
| 숫자 줄 사실 줄 | 알림은 공부한 날로부터 1일, 7일, 30일 뒤, 딱 세 번 와요. | [A안] (§3.5 "딱 1·7·30일 세 번이라는 사실을 쓴다") |
| 숫자 줄 3칸 | 10월 27일 화요일 / 1일 뒤 / 배운 점 · 11월 2일 월요일 / 7일 뒤 / 활용 방안 · 11월 25일 수요일 / 30일 뒤 / 면접 예상 질문 | [§2.0] [§3.5] |

- 숫자 줄은 `HowItWorks`(서버)가 그린다. `aria-label="리마인드 시점"`의 `<ol>`. JS·세트와 무관하게 늘 같다(날짜는 세 세트 공통).
- 섹션 4의 탭 설명·버튼·재생 문구는 5.4절 표.

---

### 4.5 섹션 5 · 차별점 `#difference` (`Difference`, 서버)

**레이아웃**

```
1440 (그리드 120px | 4×1fr | 76px | 76px, column-gap 16)
  지원할 때가 아니라, 공부하는 날마다                                          h2 44
  몇 달 치 기록은 나중에 한꺼번에 만들 수 없어요. 공부한 그날 남긴 카드에는 … (lead 두 톤)
               자격증 공부 ──────────────────────────────────── ┊ 지원 ┊ 면접   축 라벨 small 650 ink-3
  Experii      |||||●|||||||||●||||||||●||||||||●|||||||||||||  ┊- - -┊- - -   card 눈금 = 공부한 날, 점 4개
  지원할 때     (빈칸)                                           ┊▬▬▬▬▬┊▬▬▬    회색 #aab3bf 막대, 이름 없음
  쓰는 도구
               [3개월 전 ][30일 전  ][7일 전   ][오늘 ★key]                     카드 4장이 '공부' 칸 아래 정렬
               [예시] 면접 날짜가 정해지기 전부터, 공부한 날마다 한 칸씩.
  지원할 때 쓰는 도구와 같이 써도 돼요. Experii는 그 전 몇 달을 맡아요.            (diff notes 18)
  꾸준히 공부한 만큼 쌓여요.
360: 축 두 줄은 이름을 위로 올리고 6칸 그리드 유지(4×1fr 44 44), 카드 4장은 세로(시간순), 노트
```

- 카드: 흰 면, `--color-card-line` 1px, r14. 머리띠 card 면 + 흰 글자 13px 750(`3개월 전` 등), 메타 13px ink-3, 답변 14.5→15px 600. `오늘` 카드만 `--shadow-key`.
- 타임라인 그림은 `aria-hidden`, `figcaption.sr-only`로 뜻을 적는다.

**카피**

| 자리 | 문구 | 출처 |
|---|---|---|
| h2 | 지원할 때가 아니라, 공부하는 날마다 | [§2.5] |
| 리드 | **몇 달 치 기록은 나중에 한꺼번에 만들 수 없어요.** 공부한 그날 남긴 카드에는 날짜와 내가 쓴 쿼리, 푼 과제가 그대로 있어요. | [§2.5] |
| 축 라벨 | 자격증 공부 · 지원 · 면접 | [TSD 6.1 #5] |
| 줄 이름 | Experii · 지원할 때 쓰는 도구 | [TSD 6.1 #5] [§2.5] |
| 카드 1 | 3개월 전 / SQLD 1과목 · 정규화 / 주문서 엑셀을 회원·주문 테이블로 나누는 과제를 풀어 봤습니다. | [§2.5] |
| 카드 2 | 30일 전 / SQLD 2과목 · 서브쿼리 / 평균보다 많이 주문한 회원을 서브쿼리로 찾는 과제를 풀어 봤습니다. | [§2.5] |
| 카드 3 | 7일 전 / SQLD 2과목 · GROUP BY / 취소 주문은 빼고 결제 2건 이상인 재구매 회원을 뽑는 과제를 풀어 봤습니다. | [§2.5] |
| 카드 4 | 오늘 / SQLD 2과목 · JOIN / 주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제를 풀어 봤습니다. | [§2.5] |
| 아래 줄 | [예시] 면접 날짜가 정해지기 전부터, 공부한 날마다 한 칸씩. | 배지 [§2.5 "모두 예시 표기"], 문장 [§2.5] |
| 노트 1 | **지원할 때 쓰는 도구와 같이 써도 돼요.** Experii는 그 전 몇 달을 맡아요. | [§2.5] |
| 노트 2 | 꾸준히 공부한 만큼 쌓여요. | [§2.5] |
| 그림 설명 (sr-only) | Experii의 경험 카드는 자격증 공부 첫날부터 쌓이고, 지원할 때 쓰는 도구는 지원 시점부터 시작해요. | [A안] |

**인터랙션**: 없음. 정지 화면.

---

### 4.6 섹션 6 · 귀찮지 않은 시작 `#start` (`EasyStart`, 서버)

**레이아웃**

```
1440
  출시하면 이렇게 시작해요                                                     h2 44
  ┌ 무대 (surface, r32, 패딩 44/40/40) ───────────────────────────── [예시 화면] ┐
  │ ① (번호 원 26, ink)    │ ② (번호 원)                │ ③ (번호 원)           │ 열 사이 line-2 세로선
  │ 가입은 짧게 시작하도록 │ 쓰던 AI 그대로 이미 구독 중 │ 첫 질문 하나 오늘 막힌 │ 두 톤 17, min-height 5em
  │ 만들고 있어요.         │ 인 ChatGPT를 Experii 앱에 … │ SQLD 개념 하나를 …     │
  │ ┌ 흰 미니 화면 ──────┐ │ ┌ 흰 미니 화면 ──────────┐ │ ┌ 흰 미니 화면 ──────┐ │ min-height 112
  │ │ Experii            │ │ │ 내 AI 연결             │ │ │ [SQLD] 오늘 공부하다│ │
  │ │ [          ]       │ │ │ ChatGPT       [준비 중]│ │ │  막힌 걸 물어보세요 │ │
  │ │ [  시작하기  ]     │ │ └────────────────────────┘ │ └────────────────────┘ │
  │ └────────────────────┘ │                            │                        │
  └───────────────────────────────────────────────────────────────────────────────┘
  Experii 이용료는 받지 않아요. AI는 내 ChatGPT 구독(Plus·Pro)으로 써요.      [사전 신청하기]
360: 번호를 단 세로 쌓기(①→②→③, gap 30), 띠 문장, 버튼(전체 폭)
```

- 번호는 실제 순서라 쓴다(가입 → 등록 → 첫 질문).
- 미니 화면 ①·③은 `aria-hidden`(장식). ②는 텍스트로 읽힌다. `시작하기`는 버튼처럼 보이지 않게 포커스·커서 반응 없음.

**카피**

| 자리 | 문구 | 출처 |
|---|---|---|
| h2 | 출시하면 이렇게 시작해요 | [TSD 6.1 #6] (C-3) |
| 무대 배지 | 예시 화면 | [§2.6] |
| 카드 ① | **가입은 짧게** 시작하도록 만들고 있어요. | [파생: §2.6에서 `3분 안에` 삭제, TSD 6.3·C-2] |
| 카드 ② | **쓰던 AI 그대로** 이미 구독 중인 ChatGPT를 Experii 앱에 등록할 수 있게 준비하고 있어요. | [파생: §2.6의 `GPT·Claude를 연결할 수 있게` → TSD D1 `ChatGPT를 Experii 앱에 등록할 수 있게`] |
| 카드 ③ | **첫 질문 하나** 오늘 막힌 SQLD 개념 하나를 물어보면 시작이에요. | [§2.6] |
| 미니 ① | Experii / 시작하기 | [A안] |
| 미니 ② | 내 AI 연결 / ChatGPT / 준비 중 | [파생: §2.6 미니 화면에서 Claude 줄 삭제, C-1] |
| 미니 ③ | SQLD / 오늘 공부하다 막힌 걸 물어보세요 | [§2.6] [§3.2 S0] |
| 띠 문장 | **Experii 이용료는 받지 않아요.** AI는 내 ChatGPT 구독(Plus·Pro)으로 써요. | [TSD 6.3] (C-4) |
| 버튼 | 사전 신청하기 → `#signup`, `data-cta="easy_start"` | [§2.6] |

**인터랙션**: 버튼 press만. 정지 화면.

---

### 4.7 섹션 7 · 사전 신청 `#signup` (`SignupSection` 서버 + `SignupForm` 클라이언트)

**레이아웃**

```
1440 (무대 surface r32 패딩 64, 두 열 1fr | 500, gap 64)
  ┌──────────────────────────────────────────────────────────────────┐
  │ SQLD 공부 중이라면,            ┌ 흰 폼 (r20, 패딩 32) ─────────┐ │
  │ 먼저 만나 보세요   h2 44       │ 이메일                         │ │
  │ (sticky top 110)               │ [                       ] 52px │ │
  │ SQLD를 공부 중인 대학생께       │ 지금 상황                      │ │
  │ 먼저 연락드려요   lead 20       │ (대학생)(졸업 후 취업 준비)(기타)│ │ 44px 칩
  │                                │ SQLD 공부 상태                 │ │
  │                                │ (지금 공부 중)(공부할 계획)…   │ │
  │                                │ 유료 AI 구독  여러 개 고를 수 있어요│
  │                                │ (ChatGPT 유료)(Claude 유료)(유료 구독 없음)
  │                                │ ┌ 동의 상자 (surface) ───────┐ │ │
  │                                │ │ [필수] 개인정보 수집·이용 동의│ │
  │                                │ │ · 수집 항목 … (4줄)         │ │ │
  │                                │ │ 개인정보 처리방침 전문      │ │ │ → /privacy
  │                                │ │ ☐ 만 14세 이상이며 …        │ │ │
  │                                │ └────────────────────────────┘ │ │
  │                                │ [        사전 신청하기       ] │ │ 52px 전체 폭
  │                                └────────────────────────────────┘ │
  └──────────────────────────────────────────────────────────────────┘
360: 무대 패딩 28/14/14, 제목 → 안내 → 폼(패딩 22/16). 칩은 줄바꿈 flex
```

**카피**

| 자리 | 문구 | 출처 |
|---|---|---|
| h2 | SQLD 공부 중이라면, 먼저 만나 보세요 | [§2.7] |
| 폼 위 안내 | SQLD를 공부 중인 대학생께 먼저 연락드려요 | [§2.7] [TSD 7.1] |
| 필드 이름 | 이메일 · 지금 상황 · SQLD 공부 상태 · 유료 AI 구독 (보조: 여러 개 고를 수 있어요) | [A안] (TSD 7.4 오류 문구와 같은 낱말) |
| 선택지 | 대학생 · 졸업 후 취업 준비 · 기타 / 지금 공부 중 · 공부할 계획 · 이미 취득 · 해당 없음 / ChatGPT 유료 · Claude 유료 · 유료 구독 없음 | [TSD 7.1] |
| 동의 | `content/privacy.ts`의 `consent.label`·`items`·`agree`, 링크 `consent.policyLink` → `/privacy` | [TSD 7.2] |
| 버튼 | 사전 신청하기 | [§2.7] |
| 오류 | 이메일 주소를 확인해 주세요 · 지금 상황을 골라 주세요 · SQLD 공부 상태를 골라 주세요 · 하나 이상 골라 주세요 · 동의해야 신청할 수 있어요 · 잠시 후 다시 시도해 주세요 | [TSD 7.4] |
| 완료 | 신청됐어요. / 출시와 시범 사용 소식을 이메일로 알려 드릴게요. | [§2.7] [TSD 7.3] |

**인터랙션과 동작** (TSD 7)

| 요소 | 동작 |
|---|---|
| 제출 | `<form method="post" action={submitSignup}>` + `useActionState`. JS가 없으면 일반 POST로 같은 Server Action이 돈다 |
| 검증 표시 | 필드별 오류 `<p id="e-{name}">`, 입력에 `aria-invalid="true"`와 `aria-describedby`. 칩 묶음은 `<fieldset><legend>`, 오류일 때 칩 테두리 err. 제출 실패 시 첫 오류 필드로 포커스 |
| `none` 배타 | `유료 구독 없음`을 고르면 다른 구독이 풀리고 반대도 같다. 서버도 같은 규칙(TSD 7.1) |
| 숨은 필드 | `website` 허니팟(화면 밖, `tabindex=-1`, `autocomplete=off`, `aria-hidden`), `hero_variant`(서버가 채움), `utm_source`·`utm_medium`·`utm_campaign`·`utm_content`·`utm_term`·`referrer_host`(attribution이 채움) |
| 완료 | 폼을 완료 상자로 바꾸고 완료 상자(`tabindex=-1`)로 포커스. 입력한 이메일을 다시 그리지 않는다 |
| 이벤트 | 첫 입력 `form_start`, 성공 `signup_success`, 실패 `signup_error` (TSD 9.2) |
| 칩 | 진짜 `<input type=radio|checkbox>`를 꾸민 것. 선택 시 ink 면 + 흰 글자, 포커스 링은 칩 겉에 |
| 움직임 | press만. 동작 줄이기·JS 없음 같음 |

---

### 4.8 푸터 (`Footer`, 서버)

```
1440: Experii   출시 전 제품이며 화면은 예시입니다.          개인정보 처리방침   문의 이메일 (준비 중)
360:  Experii / 출시 전 제품이며 화면은 예시입니다. / 개인정보 처리방침 · 문의 이메일 (준비 중)  (줄바꿈 flex)
```

| 자리 | 문구 | 출처 |
|---|---|---|
| 로고 | Experii | — |
| 고지 | 출시 전 제품이며 화면은 예시입니다. | [TSD 6.1] |
| 링크 1 | 개인정보 처리방침 → `/privacy` | [TSD 6.1] |
| 문의 | `CONTACT_EMAIL`이 `null`이면 `문의 이메일 (준비 중)`(텍스트), 값이 있으면 그 주소를 `mailto:` 링크로 | [A안] / [TSD D3] (D-4) |

- 위 1px line, 패딩 44px + `env(safe-area-inset-bottom)` + 48px, small 14px ink-3. 링크 높이 44px.

---

### 4.9 StickyCta (`StickyCta`, 클라이언트, P1)

```
360 (767px 이하만)
  ┌────────────────────────────────────┐ 화면 맨 아래 고정, 흰 95% 바탕, 위 1px line
  │ [         사전 신청하기          ] │ 52px, 좌우 16, 아래 10 + safe-area
  └────────────────────────────────────┘
```

| 항목 | 규칙 |
|---|---|
| 보이는 조건 | 폭 767px 이하 **그리고** 히어로 CTA 행(`#hero-cta`), 섹션 4 무대(`#stage`), `#signup`이 모두 화면 밖. 무대 조건은 폰과 행동 버튼을 가리지 않으려고 더했다([A안], `design-1/m-state-*.png`에서 가린 문제) |
| 움직임 | `translateY(110%) → 0`, 300ms quint. 숨을 때 반대 |
| 접근성 | 숨었을 때 `inert`. 링크 문구 `사전 신청하기`, `data-cta="sticky"` |
| 헤더와의 관계 | 보일 때 `body[data-sticky="on"]`, `#signup`이 보일 때 `body[data-signup-visible]`을 붙인다. 둘 중 하나면 헤더 CTA 숨김(4.0) |
| 동작 줄이기 | 즉시 나타나고 사라진다 |
| JS 없음 | 그리지 않는다(`.js` 아래에서만 `display:block`) |

---

## 5. 섹션 4 `LoopStepper` 상세 명세

### 5.1 역할과 경계

- `LoopStepper`는 섹션 4 무대 전체(`#stage`)를 그리는 **유일한 클라이언트 컴포넌트**다. 탭, 단계 설명, 폰 화면 4개, 재생 알약, 단계 행동 버튼, ④ 눈금 자가 모두 안에 있다.
- 화면 4개는 표시 컴포넌트 `ChatMock`·`TaskMock`·`CardMock`·`ReminderMock`(+ 공용 `ExperienceCard`)이 그린다. 상태는 `LoopStepper`의 `useReducer` 하나에만 있고, 목업은 props만 받는다.
- 기하·`html:not(.js)` 규칙·키프레임은 Tailwind 유틸리티로 쪼개지 않고 `components/loop/loop.css` 한 파일에 둔다(판정자 3, a/DESIGN.md 6장).
- 문구는 `content/loop.ts`에서 서버 컴포넌트 `HowItWorks`가 읽어 props로 넘긴다(클라이언트 번들 대신 RSC 페이로드에 실린다). 문장을 HTML 문자열로 넘기지 않는다. 굵은 구절은 `Rich` 배열로 표현한다(5.11). `dangerouslySetInnerHTML` 금지(TSD 13).

### 5.2 상태 모델

```ts
type Step = 1 | 2 | 3 | 4;
type TopicId = 'join' | 'group' | 'rank';            // 세트 A·B·C
type Blank =
  | { status: 'empty' }
  | { status: 'wrong'; choice: string }
  | { status: 'right'; choice: string };
type Replay = 'idle' | 'playing' | 'paused' | 'ended';

interface LoopState {
  ready: boolean;              // 하이드레이션 뒤 true. false인 동안 서버 HTML과 같은 완성 상태를 그린다
  activeStep: Step;
  activeTopic: TopicId;
  at1: number;                 // ① 대화 장면 번호(5.4). 완성 = last1(topic)
  at2: number;                 // ② 0 빈 화면 · 1 상태줄 · 2~4 체크 · 5 과제 카드 · 6 코드+보기
  busy: boolean;               // ② 상태 라벨 깜빡임
  blank: Blank;
  resultShown: boolean;        // 240ms 지연 뒤 true
  at3: 0 | 1 | 2;              // ③ 0 빈 화면 · 1 AI+카드(쿼리 칸 빔) · 2 쿼리 조각 들어옴
  listShown: boolean;          // ③ S9 목록 화면
  reminderIndex: -1 | 0 | 1 | 2;   // ④ -1 알림 전 · 0 1일 · 1 7일 · 2 30일
  cardOpened: boolean;         // ④ S13 같은 카드가 열림
  revisitFilled: 0 | 1 | 2 | 3; // 잠금화면 미니 표시와 S13 점
  replay: Replay;
  replayMs: number;            // 진행 막대용
  seen: Step[];                // 처음 열기 연출을 이미 한 단계
  complete: Step[];            // 완성 상태에 도달한 단계
  noteVisible: boolean;        // 이어 보기 끝 안내
}
```

- **초기 상태(서버·첫 클라이언트 렌더)**: `ready=false`, 모든 단계 완성 상태(①=S4, ②=정답 LEFT JOIN·결과 표시, ③=목록, ④=알림 목록), `activeTopic='join'`. 서버 HTML과 같아 하이드레이션 불일치가 없다.
- **하이드레이션 직후 `useEffect`** → `dispatch({ type: 'hydrate', topic: topicFromHash() })`: `ready=true`, ①은 완성 상태 유지(대화 맨 위로 스크롤), ②~④는 "아직 안 연" 상태(`at2=0`, `blank=empty`, `at3=0`, `listShown=false`, `reminderIndex=-1`, `cardOpened=false`). ②~④는 숨은 패널이라 화면 변화가 없다. 해시에 세트가 있으면 그 세트로 바꾼다.
- 액션: `hydrate` · `selectTopic` · `activate(step, {focus, viaReplay})` · `introTick(step, patch)` · `choose(option)` · `showResult` · `advanceReminder` · `openCard` · `closeCard` · `fillDot(n)` · `replayStart|Pause|Resume|Tick|End|Stop` · `solveAgain`(이어 보기 끝 안내의 "직접 풀기").

### 5.3 화면 기하 (`loop.css` 변수)

| 변수 | <640 | 640~1023 | ≥1024 | 뜻 |
|---|---|---|---|---|
| `--sp` | 8px | 16px | 48px | 무대 안쪽 여백 |
| `--tabs-h` | 64px | 64px | — | 가로 탭 묶음 높이(칸 56 + 위아래 4) |
| `--pw` | `min(312px, 100vw - 48px)` | 340px | 352px | 폰 폭 |
| `--ph` | 520px | 600px | 724px | 폰 높이 |
| `--bz` | 7px | 7px | 9px | 베젤 두께 |
| `--rp` | 40px | 40px | 50px | 폰 바깥 모서리 |
| `--phcol` | — | — | 400px | 폰 열 폭 |
| 화면 위치 | `top: calc(var(--sp) + var(--tabs-h) + 12px + var(--bz))`, `left: calc(50% - var(--pw)/2 + var(--bz))` | 같음 | `top: calc(var(--sp) + var(--bz))`, `right: calc(var(--sp) + (var(--phcol) - var(--pw))/2 + var(--bz))` | `.js .screen`은 `#stage` 기준 절대 위치 |
| 화면 크기 | `width: calc(var(--pw) - 2*var(--bz))`, `height: calc(var(--ph) - 2*var(--bz))`, 모서리 `calc(var(--rp) - var(--bz))` | | | |

- 1023px 이하 무대 순서(`.js .stage { display:flex; flex-direction:column; gap:12px }`): 탭(order 1, 높이 `--tabs-h` 고정) → 폰 프레임(order 2) → 패널 설명(order 3) → 재생(order 4). 설명 안에서는 행동 행이 맨 앞(`order:-1`)이다. 화면이 780px일 때 헤더 60 + 무대 위 여백 8 + 탭 64 + 12 + 폰 520 + 12 + 행동 48 = 724px로 한 화면 안(V-8).
- 1024px 이상(`grid-template-columns: minmax(0,1fr) var(--phcol)`, `column-gap: 48px`): 왼쪽 열에 세로 탭 → 설명 → 행동 → 재생. 폰은 오른쪽 열 1행에서 시작해 `margin-bottom: -96px`로 무대 아래로 삐져나온다. `.panels`에 `min-height`를 두지 않는다(F-13).
- 360px에서 화면 안쪽 폭 298px, 대화 영역(좌우 10px) 278px. 3열 결과 표가 이 안에 들어와야 한다(F-3, V-10).
- 화면 위 `padding-top: 40px`(섬 자리). 섬 배지 `예시 화면`은 `top: 9px` 가운데, ink 면 흰 글자 13px 650.

### 5.4 DOM 구성과 장면 S0~S13

**무대 골격**

```html
<div id="stage" class="stage" data-step="1" data-ready>           <!-- data-ready: 하이드레이션 뒤 -->
  <div class="tints" aria-hidden="true"><i/><i/><i/><i/></div>     <!-- talk/task/card/remind 틴트 층 -->
  <div class="phone" aria-hidden="true"></div>                      <!-- PhoneFrame: 빈 프레임 -->
  <div class="ctrl">
    <div role="tablist" aria-label="작동 방식 4단계" aria-orientation="vertical|horizontal" class="steps">
      <button role="tab" id="loop-tab-1" aria-controls="loop-panel-1" aria-selected="true" tabindex="0">
        <span class="st-num">1</span><span class="st-when">공부한 날</span><span class="st-name">학습 대화</span>
      </button> … ×4
    </div>
    <div class="panels">
      <div class="panel" id="loop-panel-1" role="tabpanel" aria-labelledby="loop-tab-1" data-step="1">
        <div class="detail">
          <h3 class="nj"><small>공부한 날</small>1 학습 대화</h3>         <!-- JS 없을 때만 보임 -->
          <p class="two"><b>…</b> …</p>
          <p class="hint">…</p>                                          <!-- ②만, JS 있을 때만 -->
          <div class="act">[행동 버튼 또는 힌트 자리]</div>
          <div class="ruler" aria-hidden="true">…</div>                 <!-- ④만, JS 있을 때만 -->
        </div>
        <div class="screen scr-chat">…</div>                             <!-- 목업 -->
      </div> … ×4
    </div>
    <div class="player">…</div>
  </div>
  <p id="loop-live" class="sr-only" aria-live="polite"></p>
</div>
```

- `role="tablist"`·`role="tab"`의 역할 속성은 서버에서 그려도 된다(JS 없으면 `display:none`이라 접근성 트리에 없다). **패널의 `role="tabpanel"`·`aria-labelledby`와 `hidden`은 `ready` 뒤에만** 붙인다(F-15).
- `ready` 전 `.js` 상태에서는 CSS `.js .stage:not([data-ready]) .panel:not([data-step="1"]) { display:none }`로 ①만 보인다.

**단계별 설명 문구**

| 단계 | 탭 시점 라벨 / 이름 | 두 톤 설명 | 출처 | 행동 행 |
|---|---|---|---|---|
| ① | 공부한 날 / 학습 대화 | **AI와 평소처럼 공부해요.** 막힌 개념을 물으면 예시 표로 풀어 주고, 거꾸로 질문도 던져요. | [§2.4] | 버튼 `다음 단계: 현장 과제` [A안] |
| ② | 공부한 날 / 현장 과제 | **배운 걸 바로 써 봐요.** 방금 대화에서 실무 상황 과제가 나와요. | [§2.4] | 정답 전: 힌트 문장(아래), 정답 뒤: 버튼 `다음 단계: 경험 카드` [A안]. 같은 48px 자리를 바꿔 끼워 밀림이 없다 |
| ③ | 공부한 날 / 경험 카드 | **푼 경험이 답변 한 줄로.** 면접에서 꺼낼 한 줄을 카드로 저장해요. | [§2.4] | 버튼 `다음 단계: 리마인드` [A안] |
| ④ | 1·7·30일 뒤 / 리마인드 | **잊을 즈음 다시 꺼내 줘요.** 배운 점, 활용 방안, 면접 예상 질문이 알림으로 와요. `출시 예정 기능` | [§2.4] | 버튼 `다음 알림` → (30일 알림일 때) `30일 알림 열기` → (카드가 열린 뒤) `처음 알림부터 다시` [A안] |

②의 힌트 문장(세트별, [A안]·[초안]): A `폰 화면의 빈칸에 들어갈 JOIN을 직접 골라 보세요.` · B `폰 화면의 빈칸에 들어갈 절을 직접 골라 보세요.` · C `폰 화면의 빈칸에 들어갈 함수를 직접 골라 보세요.`

④ 눈금 자(설명 안, JS 있을 때만): 31칸 눈금(`--color-line-3`), 0일 점(card), 1·7·30일 점(remind 테두리, 지나가면 참), 채움 선과 핀은 `--cur`(0·1·7·30)에 따라 `scaleX`·`translateX`. 아래 양끝 라벨 `10월 26일 공부한 날` / `11월 25일` [A안]. 핀이 밖으로 밀리지 않게 클립 래퍼 안에 둔다(a/DESIGN.md 7.4에서 찾은 버그).

**재생 알약** (`.player`)

| 상태 | 보이는 글 | 아이콘 | 진행 막대 |
|---|---|---|---|
| idle | 처음부터 이어 보기 [§2.4] | ▶ | 4칸 비움 |
| playing | 일시정지 [§4.3] | ❙❙ | 칸 길이 비율 74·46·30·60(단계 길이), 시간만큼 `scaleX` |
| paused | 이어 보기 [A안] | ▶ | 멈춘 자리 |
| ended | 다시 보기 [§4.3] | ↻ | 가득 |

- 버튼 52px, 흰 면 + line-2 안쪽 테두리, 아이콘 원 36px ink. 보이는 글이 곧 이름이다. `aria-label`을 따로 두지 않는다(design-1의 `재생` / `처음부터 이어 보기` 불일치는 WCAG 2.5.3 위반이었다).
- 끝나면 아래에 안내 줄: `빈칸은 직접 풀어 볼 수 있어요.` + 링크 버튼 `현장 과제에서 직접 풀기` [A안] (§4.3 "직접 풀어 보세요 안내").

**장면별 DOM** (세트 A 기준. 세트 B·C 문자열은 5.11)

화면 ① `scr-chat` (S0~S4)

```html
<div class="screen scr-chat">
  <span class="island">예시 화면</span>
  <div class="appbar"><span class="subj">SQLD · 2과목</span><span class="adate">10월 26일 (월)</span></div>
  <div class="thread" tabindex="0" role="group" aria-label="예시 대화, 미리 써 둔 대화">
    <div class="s0" data-in="0" data-out="1">                          <!-- S0: 이어 보기 0~1.8초에만 보임 -->
      <p class="s0-guide">오늘 공부하다 막힌 걸 물어보세요</p>
      <ul class="s0-tags" aria-hidden="true"><li>JOIN 차이가 헷갈려</li><li>…</li><li>…</li></ul>
    </div>
    <p class="m me" data-in="1">LEFT JOIN이랑 INNER JOIN 차이가 헷갈려</p>          <!-- S1 -->
    <div class="m ai" data-in="2"><span class="who">AI</span><p>…문단 1</p>           <!-- S2 -->
      <div class="tbls" data-in="3"><table class="mt">members…</table><table class="mt">orders…</table></div>
      <p data-in="4">…문단 2</p><table class="mt" data-in="5">결과 표 A…</table>
      <p data-in="6">…문단 3</p><table class="mt" data-in="7">결과 표 B… (서준 NULL 행 .hl)</table>
    </div>
    <p class="m ai" data-in="8"><span class="who">AI</span>…되묻기</p>                <!-- S3 -->
    <p class="m me" data-in="9">LEFT JOIN 하고 주문 칸이 NULL인 행?</p>
    <div class="m ai" data-in="10"><span class="who">AI</span><p>…과제 제안</p>        <!-- S4 -->
      <span class="fake" aria-hidden="true">과제 받기</span></div>
  </div>
  <div class="composer">
    <span class="gpt">내 GPT <small>연결 준비 중</small></span>
    <span class="field-mock" aria-hidden="true"><span class="ph">질문을 입력하세요</span><span class="typed"></span></span>
    <span class="send" aria-hidden="true"></span>
  </div>
</div>
```

- `data-in`이 `at1` 이하이고 `data-out` 미만이면 보인다. 새로 켜지는 요소에만 `rise`를 한 번 붙이고 `animationend`에서 뗀다(다시 보여도 반복하지 않는다).
- S0 태그: 테두리 없는 surface 면, ink-2 13px, 포인터 없음. 지금 세트 칩만 talk-tint 면 + talk 글자(F-4).
- 타이핑 글자(`.typed`)는 `aria-hidden`. 말풍선은 완성 문장 그대로 읽힌다.
- 결과 표 캡션 `결과 표 A (INNER JOIN, 3행)` / `결과 표 B (LEFT JOIN, 4행)`이 S3 질문의 "결과 표 B"와 짝이다(design-1의 결함 방지).

화면 ② `scr-task` (S5~S7)

```html
<div class="thread" tabindex="0" role="group" aria-label="예시 화면, 현장 과제">
  <div class="m ai ctx" data-in="1">…과제 제안(흐리게 .7)<span class="fake muted" aria-hidden="true">과제 받기</span></div>
  <div class="status" data-in="1"><p class="status-label">방금 대화에서 과제를 만드는 중…</p>
    <ol class="checks"><li data-in="2"><b>대화에서 개념 찾기</b> · LEFT JOIN, IS NULL</li>
      <li data-in="3"><b>상황 고르기</b> · 쇼핑몰 회원·주문 데이터</li><li data-in="4"><b>현장 과제 만들기</b></li></ol></div>
  <article class="task key" data-in="5">
    <div class="task-h"><span class="task-pill">현장 과제</span><span class="task-from">쇼핑몰 마케팅팀 요청 (가상 상황)</span></div>
    <p>…과제 본문</p>
    <p class="task-tables"><span class="k">쓰는 테이블</span><code>members(…)</code><code>orders(…)</code></p>
  </article>
  <div class="solve" data-in="6">
    <pre class="sql"><code><span class="ln">…</span><span class="ln"><span class="blank">[ ? ]</span> orders o</span>…</code></pre>
    <div class="opts" role="group" aria-label="빈칸에 들어갈 JOIN 고르기">
      <button class="opt" aria-pressed="false">INNER JOIN</button><button class="opt" aria-pressed="false">LEFT JOIN</button>
    </div>
    <div class="run"><span class="fake muted" aria-hidden="true">실행</span></div>
    <div class="result">…5.6</div>
  </div>
</div>
```

- 체크 줄은 진행 표시라 `100%` 같은 숫자를 쓰지 않는다(브리프 §5.1).
- 과제 카드는 말풍선이 아니라 task 1.5px 테두리 카드(브리프 §2.4 "대화가 물건이 됐다").
- 보기 묶음 `aria-label` 세트별: A `빈칸에 들어갈 JOIN 고르기` [A안] · B `빈칸에 들어갈 절 고르기` [초안] · C `빈칸에 들어갈 함수 고르기` [초안].

화면 ③ `scr-card` (S8~S9): 층 두 개 + 날아가는 조각

```html
<div class="screen scr-card">
  <span class="island">예시 화면</span>
  <div class="layer l-chat">                                       <!-- S8 -->
    <div class="appbar">SQLD · 2과목 / 10월 26일 (월)</div>
    <div class="thread">
      <pre class="sql ctx"><code>…풀이 발췌, 날아갈 줄에 .src-line</code></pre>
      <p class="m ai" data-in="1"><span class="who">AI</span>방금 푼 과제를 면접 답변 한 줄로 정리했어요. 내 말투에 맞게 고쳐도 돼요.</p>
      <ExperienceCard data-in="1" snippetVisible={at3 >= 2} plan />   <!-- 쿼리 칸은 at3=2에서 채워짐 -->
      <span class="fake save" data-in="1" aria-hidden="true">경험 카드로 저장</span>
    </div>
  </div>
  <div class="layer l-list">                                       <!-- S9: 오른쪽에서 밀려 들어옴 -->
    <div class="appbar"><span class="ab-title">내 경험 카드</span><span class="adate">10월 26일 (월)</span></div>
    <ol class="xlist">
      <li class="xl-new"><p class="xl-stamp"><span class="when">오늘</span>SQLD 2과목 · JOIN</p>
        <p class="xl-title">주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제</p><ExperienceCard key plan tags source /></li>
      <li class="xl-old ctx">7일 전 · SQLD 2과목 · GROUP BY / 결제 2건 이상인 재구매 회원을 뽑는 과제</li>
      <li class="xl-old ctx">30일 전 · SQLD 2과목 · 서브쿼리 / 평균보다 많이 주문한 회원을 찾는 과제</li>
    </ol>
    <p class="toast">저장했어요. 내일 다시 꺼내 드릴게요.</p>
  </div>
  <span class="fly" aria-hidden="true"><span>LEFT JOIN … IS NULL</span></span>
</div>
```

`ExperienceCard`(공용, 세 곳: S8·S9·S13)

| 칸 | 문구 (세트 A) | 출처 |
|---|---|---|
| 머리띠 (card 면, 흰 13px 700) | 경험 카드 · 2026.10.26 (월) | [§3.4] |
| 면접 질문 | SQL을 써 본 적 있나요? | [§3.4] |
| 내 답변 한 줄 (+ 연필 아이콘 장식) | 쇼핑몰 회원·주문 데이터에서 한 번도 주문하지 않은 회원을 LEFT JOIN과 IS NULL로 추려, 첫 구매 쿠폰 대상 목록을 만드는 과제를 풀어 봤습니다. | [§3.4] |
| 배운 점 | LEFT JOIN은 왼쪽 테이블 행을 모두 남기고, 짝이 없으면 NULL로 채운다. | [§3.4] |
| 내가 쓴 쿼리 (접힘 표시 장식) | `LEFT JOIN … IS NULL` (조각) | [A안] (§3.4 "접힘") |
| 태그 | SQLD · 2과목 · JOIN | [§3.4] |
| 출처 | 출처 · 10월 26일 SQLD 대화 | [§3.4] |
| 다시 볼 날 (S8·S9) | 다시 볼 날 ○ 10월 27일 ○ 11월 2일 ○ 11월 25일 | [§3.4] |

props: `{ card: CardCopy; snippetVisible: boolean; showPlan: boolean; showTags: boolean; showSource: boolean; isKey?: boolean }`. 칸 이름 13px 700 ink-4, 답변 15px 720.

화면 ④ `scr-lock` (S10~S13): 층 두 개

```html
<div class="screen scr-lock">
  <span class="island">예시 화면</span>
  <div class="layer l-card">                                       <!-- S13: 잠금화면이 걷히면 보임 -->
    <div class="appbar"><span class="ab-title" tabindex="-1">경험 카드</span><span class="adate">11월 25일 (수)</span></div>
    <div class="thread">
      <p class="revisit-line">다시 본 날 · <i class="dot"/>10월 27일 · <i class="dot"/>11월 2일 · <i class="dot"/>11월 25일</p>
      <ExperienceCard tags source />                                <!-- '다시 볼 날' 줄 없이 -->
      <div class="follow"><p class="fl-label">공부 30일 뒤 · 면접 예상 질문</p>
        <p class="fl-q">면접 질문: "SQL을 실제로 써 본 적 있나요?"</p>
        <p class="fl-k">꼬리질문 대비</p><p>같은 결과를 다른 방법으로도 낼 수 있나요? → NOT EXISTS로도 찾을 수 있어요.</p>
        <pre class="sql">…NOT EXISTS 쿼리(§3.3)</pre></div>
    </div>
  </div>
  <div class="lock">                                                 <!-- S10~S12 -->
    <p class="lock-date" aria-hidden="true">
      <span class="ld" data-pos="now"><span class="md">10월 27일</span><span class="dow">화요일</span></span>
      <span class="ld" data-pos="next">11월 2일 / 월요일</span><span class="ld" data-pos="next">11월 25일 / 수요일</span></p>
    <p class="lock-badge">출시 예정 기능</p>                           <!-- G-5 -->
    <p class="lock-revisit" aria-hidden="true">다시 본 날 <i class="dot-w"/><i class="dot-w"/><i class="dot-w"/></p>
    <ol class="stack">
      <li class="notif" data-off="0"><span class="n-date">10월 27일 화요일</span>
        <span class="n-head"><i class="n-ico">E</i><span class="n-app">Experii</span><span class="n-label"> · 공부 1일 뒤 · 배운 점</span></span>
        <span class="n-body">…미리보기</span><span class="n-more">…펼친 줄</span>
        <button class="n-hit" aria-label="다음 알림 보기"></button></li> … ×3
    </ol>
    <p class="lock-hint" aria-hidden="true">알림을 눌러 넘겨 보세요</p>
  </div>
</div>
```

- 잠금화면 바탕: `radial-gradient(130% 55% at 50% 0%, var(--color-lock-glow), transparent 70%), var(--color-lock)` (정지). 시계는 두지 않는다(브리프 X7, 날짜가 주인공).
- `lock-badge`: `rgba(255,255,255,.16)` 알약, 흰 13px 700, 날짜 아래 가운데. `lock-revisit`: 흰 85% 13px + 흰 테두리 점 3개(10px), `revisitFilled`만큼 흰 면으로 참. 브리프 §3.2 S11 "경험 카드 미니 표시의 다시 본 날 점"이다.
- JS가 있으면 `.n-date`는 `sr-only`(화면은 큰 날짜가 맡고, 스크린리더는 알림마다 날짜를 듣는다).
- 맨 앞 알림의 `n-hit`만 보이고 포커스된다. 뒤 알림은 `aria-hidden="true"`, `n-hit` `hidden`. 30일 알림의 `n-hit` 이름은 `30일 알림 열기`.

**장면표 S0~S13** (세트 A 문구. 시간은 이어 보기 기준 ms, 5.8)

| 장면 | 탭 | 화면 상태 | 문구 | 출처 | 움직임 |
|---|---|---|---|---|---|
| S0 | ① | `at1=0`: 안내 + 칩 태그, 입력창 빈 칸 | 오늘 공부하다 막힌 걸 물어보세요 / 칩 3개 / `내 GPT` `연결 준비 중` / 질문을 입력하세요 | [§3.2 S0] | 정지. 이어 보기에서만 보인다 |
| S1 | ① | 입력창 타이핑 → `at1=1` 말풍선 | LEFT JOIN이랑 INNER JOIN 차이가 헷갈려 | [§3.2 S1] | 600~1750 타이핑, 1800 말풍선 rise |
| S2 | ① | `at1=2..7` | 문단 1: 둘 다 member_id로 두 테이블을 잇는 건 같아요. 차이는 짝이 없는 행을 어떻게 하느냐예요. / 표 `members`(member_id, member_name: 1 민지, 2 서준, 3 하린) · `orders`(order_id, member_id: 101 1, 102 1, 103 3) / 문단 2: **INNER JOIN**은 양쪽에 짝이 있는 행만 남겨요. 주문이 없는 서준은 빠져서 결과가 3행이에요. / 결과 표 A (INNER JOIN, 3행): 민지 101 · 민지 102 · 하린 103 / 문단 3: **LEFT JOIN**은 왼쪽(회원) 행을 모두 남기고, 짝이 없으면 주문 칸을 NULL로 채워요. 그래서 4행이에요. / 결과 표 B (LEFT JOIN, 4행): 민지 101 · 민지 102 · **서준 NULL** · 하린 103 | [§3.2 S2] [§3.1] | 2000부터 500ms 간격 rise(문단 단위, 타이핑 없음) |
| S3 | ① | `at1=8`, 타이핑, `at1=9` | AI: 그럼 하나 물어볼게요. 주문을 한 번도 안 한 회원만 뽑으려면, 결과 표 B에서 어떤 행을 고르면 될까요? / 사용자: LEFT JOIN 하고 주문 칸이 NULL인 행? | [§3.2 S3] | 5400 rise, 5650~6300 타이핑, 6350 말풍선 |
| S4 | ① 끝 | `at1=10` | 맞아요. 회원 데이터를 다룰 때 자주 나오는 모양이에요. 방금 배운 걸로 현장 과제 하나 풀어 볼래요? / `과제 받기`(장식) | [§3.2 S4] | 6800 rise + ② 탭 hint 1회 |
| S5 | ② | `at2=1..4`, busy | 방금 대화에서 과제를 만드는 중… / 대화에서 개념 찾기 · LEFT JOIN, IS NULL / 상황 고르기 · 쇼핑몰 회원·주문 데이터 / 현장 과제 만들기 | [§3.2 S5] | 줄마다 rise, 간격 350ms(기본 배속). 라벨 pulse는 busy 동안만 |
| S6 | ② | `at2=5` | 현장 과제 · 쇼핑몰 마케팅팀 요청 (가상 상황) / 가입은 했지만 아직 한 번도 주문하지 않은 회원에게 첫 구매 쿠폰을 보내려고 해요. 대상 회원의 아이디, 이름, 가입일을 뽑아 주세요. / 쓰는 테이블 `members(member_id, member_name, joined_at)` · `orders(order_id, member_id, ordered_at)` | [§3.2 S6] | sheet 420ms |
| S7 | ② | `at2=6`, `blank` | SQL(§3.2 S7, 빈칸 `[ ? ]`) / 보기 `INNER JOIN` · `LEFT JOIN` / `실행`(장식) / 결과는 5.6 | [§3.2 S7] [§3.3] | 5.6 |
| S8 | ③ | `at3=1` → 조각 날기 → `at3=2` | AI: 방금 푼 과제를 면접 답변 한 줄로 정리했어요. 내 말투에 맞게 고쳐도 돼요. / 경험 카드(§3.4) / `경험 카드로 저장`(장식) | [§3.2 S8] [§3.4] | rise → fly 400ms → 조각이 카드 쿼리 칸에 들어감 |
| S9 | ③ | `listShown` | 내 경험 카드 / 오늘 · SQLD 2과목 · JOIN — 주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제 / 7일 전 · SQLD 2과목 · GROUP BY — 결제 2건 이상인 재구매 회원을 뽑는 과제 / 30일 전 · SQLD 2과목 · 서브쿼리 — 평균보다 많이 주문한 회원을 찾는 과제 / 토스트: 저장했어요. 내일 다시 꺼내 드릴게요. | [§3.2 S9] | 가짜 탭 → 목록 slide 420ms → 토스트 rise |
| S10 | ④ | `reminderIndex=0` | 10월 27일 화요일 / Experii · 공부 1일 뒤 · 배운 점 / LEFT JOIN은 왼쪽 표의 행을 모두 남겨요. 주문이 없는 회원은 주문 칸이 NULL이라 IS NULL로 찾았죠. / 어제 쓴 쿼리 다시 보기 → | [§3.5] | 알림이 위에서 내려옴(stack) |
| S11 | ④ | `reminderIndex=1`, 점 1 | 11월 2일 월요일 / Experii · 공부 7일 뒤 · 활용 방안 / '한 번도 ~하지 않은' 대상을 찾을 땐 같은 모양이에요. 예: 강의를 결제하고 한 번도 듣지 않은 수강생 찾기. / IS NULL 조건은 ON이 아니라 WHERE에 둬요. ON에 넣으면 회원이 모두 그대로 나와요. | [§3.5] | 날짜 360ms, 스택 260ms, 눈금 550ms, 점 280ms |
| S12 | ④ | `reminderIndex=2`, 점 2 | 11월 25일 수요일 / Experii · 공부 30일 뒤 · 면접 예상 질문 / 면접 질문: "SQL을 실제로 써 본 적 있나요?" 내 답변 한 줄 다시 보기 → | [§3.5] | 같음. 행동 버튼이 `30일 알림 열기`로 |
| S13 | ④ 끝 | `cardOpened`, 점 3 | 다시 본 날 · 10월 27일 · 11월 2일 · 11월 25일 / 같은 경험 카드 / 공부 30일 뒤 · 면접 예상 질문 / 면접 질문: "SQL을 실제로 써 본 적 있나요?" / 꼬리질문 대비 / 같은 결과를 다른 방법으로도 낼 수 있나요? → NOT EXISTS로도 찾을 수 있어요. / NOT EXISTS SQL | [§3.2 S13] [§3.3] [§3.5] | lift 500ms → 점이 420ms 뒤 150ms 간격으로 참. 반복하지 않는다 |

SQL 원문(줄·들여쓰기 그대로, 테이블 별칭에 `AS` 없음): 정답·빈칸 문제는 §3.3 정답 SQL, 꼬리질문은 §3.3 NOT EXISTS SQL. 키워드(`SELECT`·`FROM`·`ON`·`WHERE`·`IS NULL`·`NOT EXISTS`)는 750 굵기.

### 5.5 기본 상태와 단계 처음 열기

| 단계 | 하이드레이션 뒤 기본 | 방문자가 처음 열 때(이 페이지 방문 중 한 번) | 다시 열 때 |
|---|---|---|---|
| ① | 완성(S4), 대화 맨 위(질문과 표가 보이게) | 연출 없음(C-6) | 그대로 |
| ② | 빈 화면(`at2=0`) | S5→S7 연출 1.35배속(약 1.7초): 0 상태줄 + busy · 250 체크1 · 600 체크2 · 950 체크3 + busy 끔 · 1400 과제 카드 · 2200 코드와 보기(배속 전 ms). 빈칸은 비운 채 멈춘다 | 중간에 끊겼으면 완성(코드+보기, 빈칸 상태는 유지) |
| ③ | 빈 화면 | S8→S9 1.3배속(약 2.3초): 0 AI+카드 · 450 fly · 860 조각 들어감 · 1400 저장 가짜 탭 · 1800 목록 | 목록 |
| ④ | 알림 전(`-1`) | 120ms 뒤 1일 알림이 내려옴 | 지금 알림 그대로 |

- 처음 열기 연출은 방문자가 탭(또는 `다음 단계`)을 눌러 시작한 것이고 5초 미만이다. 다음 단계로 저절로 넘어가지 않는다(TSD 6.2).
- 연출 중 다른 조작이 오면 연출을 멈추고 그 단계를 완성 상태로 둔다(5.10).

### 5.6 빈칸 풀기 (S7)

| 동작 | 화면 |
|---|---|
| 보기 누름 | 즉시 빈칸에 그 글자가 들어가며 pop 280ms. 누른 보기 `aria-pressed="true"`, 다른 보기 `false`. 240ms 뒤 결과 표시 + 대화 맨 아래로 부드럽게 스크롤 |
| 오답 | 빈칸 err 실선 + err-tint 면 + err 글자. 누른 보기는 **흰 면 + err 테두리 + err 글자**(정답처럼 초록으로 채우지 않는다, design-1 결함). 결과: `결과 0행` 칩(err-tint, err 13px 700) + AI 말풍선 `결과가 0행이에요. INNER JOIN은 주문이 없는 회원을 처음부터 빼서, o.order_id가 NULL인 행이 남지 않아요. LEFT JOIN으로 바꿔 볼까요?` [§3.2 S7]. 보기는 그대로 다시 누를 수 있다. 행동 자리는 힌트 문장 유지 |
| 정답 | 빈칸 task 실선 + task-tint 면. 누른 보기 task 면 + 흰 글자. 결과: 표 캡션 `결과 2행`, 열 `member_id · member_name · joined_at`, 행 `2 · 서준 · 2026-09-10` / `4 · 도윤 · 2026-10-12` + AI `맞아요. 주문이 없는 회원은 주문 칸이 NULL로 남아서 WHERE에서 골라져요.` [§3.2 S7]. 행동 자리가 `다음 단계: 경험 카드` 버튼으로 바뀐다 |
| 알림 문장(`#loop-live`) | 정답: `결과 2행, 서준과 도윤. 맞아요. 주문이 없는 회원은 주문 칸이 NULL로 남아서 WHERE에서 골라져요.` [§3.2 S7 접근성] / 오답: `결과 0행. INNER JOIN은 주문이 없는 회원을 처음부터 빼요. LEFT JOIN으로 바꿔 볼까요?` [A안] |
| 반응하는 요소 | 보기 버튼 두 개만. 커서 pointer, 포커스 링. `과제 받기`·`실행`은 `aria-hidden` span, 커서 기본 |

### 5.7 리마인드와 루프 닫기 (S10~S13)

| 조작 | 결과 |
|---|---|
| `다음 알림` 또는 맨 앞 알림 탭 (`reminderIndex` 0→1→2) | 날짜가 위로 밀리고 다음 날짜가 아래에서 올라옴, 맨 앞 알림이 위로 빠지고 뒤 카드가 앞으로, 눈금 핀 1→7→30, 지나간 날 점 채움, 잠금화면 미니 점 `revisitFilled = reminderIndex`. 알림 문장 `11월 2일 월요일, 공부 7일 뒤, 활용 방안 알림` [A안]. 알림을 눌러 넘겼으면 새 맨 앞 알림 버튼으로 포커스 |
| 30일 알림에서 `30일 알림 열기` 또는 알림 탭 | 잠금화면 lift, 카드 층 보임, `revisit-line` 점 3개가 420ms 뒤 150ms 간격으로 참, 눈금 30일 점 채움, 버튼 `처음 알림부터 다시`. 알림 문장 `30일 알림을 열었어요. 10월 26일에 만든 경험 카드가 다시 열렸어요. 다시 본 날 10월 27일, 11월 2일, 11월 25일.` [A안]. 알림 탭으로 열었으면 카드 앱바 제목 `경험 카드`로 포커스(`preventScroll`) |
| `처음 알림부터 다시` | 카드 닫기, 점 비움, `reminderIndex=0` |
| 가려진 층 | `visibility: hidden`(전환 끝난 뒤)으로 Tab 순서에서 뺀다 |

### 5.8 이어 보기 시간표 (21초, 브리프 §3.2 요약표와 같다)

| ms | 장면 | 탭 | 동작 |
|---:|---|---|---|
| 0 | S0 | ① | `activate(1, viaReplay)`, 모든 단계 처음 상태로(`instant`, 전환 없이), `at1=0` |
| 600 → 1750 | S1 | ① | 입력창 타이핑 |
| 1800 | S1 | ① | 입력창 비움, `at1=1` |
| 2000 · 2500 · 3000 · 3500 · 4000 · 4500 | S2 | ① | `at1=2..7` (세트 B·C는 S2 항목 수만큼만, 5.11) |
| 5400 | S3 | ① | AI 되묻기 |
| 5650 → 6300 | S3 | ① | 사용자 답 타이핑 |
| 6350 | S3 | ① | 사용자 말풍선 |
| 6800 | S4 | ① | 과제 제안 + ② 힌트 |
| 7400 | S5 | ② | `activate(2)`, 상태줄 + busy |
| 7650 · 8000 · 8350 | S5 | ② | 체크 1·2·3, 8350에 busy 끔 |
| 8800 | S6 | ② | 과제 카드 |
| 9600 | S7 | ② | 코드와 보기 |
| 10400 | S7 | ② | 가짜 탭이 정답 보기를 누름(tap 표시 + 채움) |
| 11200 | S7 | ② | 정답 결과 |
| 12000 | S8 | ③ | `activate(3)`, AI + 카드 |
| 12450 | S8 | ③ | fly |
| 12860 | S8 | ③ | 조각 들어감 |
| 13400 | S8 | ③ | 저장 가짜 탭 |
| 13800 | S9 | ③ | 목록 + 토스트 |
| 15000 | — | ④ | `activate(4)`, 카드 닫음, `reminderIndex=-1` |
| 15120 | S10 | ④ | 1일 알림 |
| 16500 | S11 | ④ | 7일 알림 |
| 18000 | S12 | ④ | 30일 알림 |
| 19500 | S13 | ④ | 가짜 탭 + 카드 열림(점은 19920·20070·20220) |
| 21000 | 끝 | — | `replay=ended`, 모든 단계 complete, 안내 줄 표시, 알림 문장 `이어 보기가 끝났어요. 빈칸은 현장 과제 단계에서 직접 풀어 볼 수 있어요.` [A안] |

- 단계 시작 지점 `OFF = [0, 7400, 12000, 15000]`, 칸 길이 `[7400, 4600, 3000, 6000]`. 이어 보기 중 탭 하이라이트와 틴트는 따라 바뀌지만 탭 바뀜 알림 문장은 내지 않는다(시작 때 `처음부터 이어 보기를 시작해요. 미리 써 둔 예시 화면이에요.` [A안] 한 번만).
- 시계는 `useTimeline(events, { speed, total, onTick, onEnd })` 훅 하나. `requestAnimationFrame`으로 경과 시간을 재고 이벤트를 순서대로 실행한다. `play()`·`pause()`·`stop()`. 언마운트 때 `cancelAnimationFrame`.
- 문서가 숨겨지면(`visibilitychange` → hidden) 재생을 `paused`로 바꾼다. 돌아왔을 때 밀린 이벤트가 한꺼번에 터지지 않게 한다.
- 안내 줄의 `현장 과제에서 직접 풀기`: 재생 상태 idle, 빈칸 비움, ②를 완성 상태(코드+보기)로 열고 두 보기 중 **첫 번째 버튼**에 포커스(`preventScroll`). 시안 A처럼 정답 버튼에 포커스를 주지 않는다(답을 알려 주는 셈이다).

### 5.9 키보드와 aria

| 요소 | 규칙 |
|---|---|
| 탭 목록 | roving tabindex(선택된 탭만 0). ←·↑ 이전, →·↓ 다음(끝에서 처음으로), Home 처음, End 끝. 화살표로 옮기면 바로 그 탭이 열린다(자동 활성화) |
| `aria-orientation` | 1024px 이상 `vertical`, 미만 `horizontal`. `matchMedia('(min-width:1024px)')` 변화를 듣는다(F-7) |
| 탭 / 패널 | `role="tab"` `id` `aria-controls` `aria-selected`. 패널 `role="tabpanel"` `aria-labelledby`, 비활성 패널 `hidden` (ready 뒤) |
| 대화 영역 | 스크롤되는 `.thread`는 `tabindex="0"` `role="group"` `aria-label`(키보드로 스크롤 가능) |
| 보기 | 진짜 `<button>`, 44px 이상, `aria-pressed` |
| 알림 | 맨 앞 알림의 `n-hit` 버튼만 활성. 이름 `다음 알림 보기` / `30일 알림 열기` [A안] |
| 행동 버튼 | `다음 단계: …`를 누르면 해당 탭을 열고 그 탭으로 포커스 |
| 재생 | 보이는 글이 이름. 진행 막대 `aria-hidden` |
| 알림 문장 | `#loop-live` 하나(`aria-live="polite"`). 같은 문장을 다시 읽히도록 비웠다가 60ms 뒤 넣는다. 탭 바뀜 `2단계 현장 과제, 예시 화면` [§3.2 끝], 세트 바뀜 `질문을 바꿨어요. GROUP BY랑 HAVING. 1단계 학습 대화, 예시 화면` [초안] |
| 타이핑 | 타이핑 글자 `aria-hidden`, `aria-live`를 걸지 않는다(§3.2 S1) |
| 장식 | `과제 받기`·`실행`·`경험 카드로 저장`·S0 태그·연필·접힘 표시·날아가는 조각·가짜 탭 원은 `aria-hidden`, 포커스·포인터 없음 |
| 포커스 링 | 밝은 화면 talk 3px, 잠금화면 위 흰 3px |

### 5.10 타이머 취소 규칙

모든 지연 실행은 `LoopStepper` 안의 등록부 하나를 거친다.

```ts
const timers = useRef(new Set<number>());
const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.current.delete(id); fn(); }, ms); timers.current.add(id); };
const cancelAll = (opts?: { keepReplay?: boolean }) => {
  timers.current.forEach(clearTimeout); timers.current.clear();   // 결과 240ms, 점 채우기, fly 정리, tap 표시 정리
  intro.current?.stop(); intro.current = null;                    // 단계 처음 열기 연출
  if (!opts?.keepReplay) stopReplay();                            // replay → idle, 진행 0
  setTyped('');                                                   // 입력창 타이핑 지움
};
```

| 무엇이 오면 | 먼저 하는 일 | 그다음 |
|---|---|---|
| 탭 클릭·화살표·Home·End | `cancelAll()` | 그 단계를 연다. 처음이면 처음 열기 연출, 연출이 끊긴 단계면 완성 상태 |
| `다음 단계: …` | `cancelAll()` | 위와 같음 + 포커스 |
| 보기 클릭 | `cancelAll()` | 5.6. 결과 240ms는 `later()`로 |
| 알림 탭·`다음 알림` | `cancelAll()` | 5.7. 점 채우기는 `later()`로 |
| 세트 바꿈(칩 클릭, `hashchange`) | `cancelAll()` | 5.11 |
| `현장 과제에서 직접 풀기` | `cancelAll()` | 5.8 끝 |
| 재생 버튼 | 재생 중이면 일시정지, 멈춤이면 이어서, idle·ended면 `cancelAll({keepReplay:true})` 뒤 처음부터 | — |
| 문서 숨김 | 재생 중이면 일시정지 | — |
| 동작 줄이기 설정이 바뀜 | 진행 중인 연출을 끊고 그 단계 완성 상태 | 재생 중이면 그대로(다음 이벤트부터 순간 전환) |
| 언마운트 | `cancelAll()` + rAF 취소 + 리스너 해제 | — |

- 같은 칩이나 탭을 빠르게 연타해도 말풍선이 겹치지 않아야 한다(브리프 §3.2 끝). 모든 장면 반영은 "몇 번째 상태로 설정"이지 "하나 덧붙이기"가 아니므로 연타해도 결과가 같다.

### 5.11 세트 A·B·C 처리

**세트 바꾸는 길**

1. 히어로 칩·화살표는 `<a href="#how-{topic}" data-topic="{topic}">`.
2. `LoopStepper`는 마운트 때 `location.hash`를 읽고, `hashchange`와 `document`의 `click`(캡처, `a[data-topic]`)을 듣는다. 같은 칩을 다시 눌러 해시가 그대로여도 클릭으로 받는다.
3. `selectTopic(t)`: `cancelAll()` → `activeTopic=t` → ①을 그 세트의 완성 상태(S4)로, ②~④를 처음 상태로, `seen`은 ①만 → `activate(1)` → 대화 맨 위로 → 알림 문장. 스크롤은 브라우저 앵커(`#how-*`는 무대 바로 위, `scroll-margin-top: 72px`)가 한다.
4. JS가 없으면 앵커로 스크롤만 되고 세트 A가 보인다.
5. 섹션 4 바깥(히어로 After, 1·7·30 숫자 줄, 섹션 5 카드)은 세트와 무관하다.

**`content/loop.ts` 모양**

```ts
export type TopicId = 'join' | 'group' | 'rank';
export type Rich = string | { b: string };                 // { b } = 굵게
export interface MockTable { caption?: string; columns: string[]; rows: string[][]; highlightRow?: number }
export type SqlLine = { indent?: number; parts: Array<string | { kw: string } | { blank: true }> };
export type ChatItem = { kind: 'p'; text: Rich[] } | { kind: 'tables'; tables: MockTable[] } | { kind: 'table'; table: MockTable };

export interface LoopTopic {
  id: TopicId;
  chip: string;                        // 히어로·S0 칩
  question: string;                    // S1
  explain: ChatItem[];                 // S2, 길이 = n2 (A 6, B 2, C 1)
  ask: string; reply: string;          // S3
  offer: string;                       // S4
  checks: [{ b: string; rest?: string }, { b: string; rest?: string }, { b: string; rest?: string }]; // S5
  task: { from: string; body: string; tables: string[]; note?: string };                              // S6
  hint: string; optionsLabel: string;
  sql: SqlLine[]; options: [string, string]; answer: string;                                         // S7
  right: { result: MockTable | { chip: string; line: string }; ai: string; live: string };
  wrong: { chip: string; ai: string; live: string };
  card: { question: string; answer: string; lesson: string; snippet: string; tags: string[] };       // S8
  excerpt: SqlLine[]; flyLine: number;                                                               // S8 발췌, 날아갈 줄
  list: { now: { when: string; meta: string; title: string }; old: [ListRow, ListRow] };           // S9
  reminders: [Reminder, Reminder, Reminder];                                                         // S10~12: { preview, more? }
  follow: { question: string; tail?: { q: string; sql: SqlLine[] } };                               // S13
}
export const loopShared = { subject: 'SQLD · 2과목', studyDate: '10월 26일 (월)', cardHead: '경험 카드 · 2026.10.26 (월)',
  source: '출처 · 10월 26일 SQLD 대화', reminderDates: ['10월 27일 화요일', '11월 2일 월요일', '11월 25일 수요일'],
  reminderLabels: ['공부 1일 뒤 · 배운 점', '공부 7일 뒤 · 활용 방안', '공부 30일 뒤 · 면접 예상 질문'],
  revisit: '다시 본 날 · 10월 27일 · 11월 2일 · 11월 25일', /* … 5.4 표의 공통 문구 */ } as const;
```

①의 `at1` 번호: S0=0, S1=1, S2 항목=2..(1+n2), S3 질문=n2+2, 답=n2+3, S4=n2+4. 시간: S2 항목은 2000 + 500×k, 나머지는 5.8 그대로.

**세트 A**: 5.4 장면표와 5.6 문구. `chip` JOIN 차이가 헷갈려, `snippet` `LEFT JOIN … IS NULL`, `excerpt`는 `FROM members m` / `LEFT JOIN orders o`(날아갈 줄) / `  ON m.member_id = o.member_id` / `WHERE o.order_id IS NULL;` [A안].

**세트 B · GROUP BY와 HAVING** (브리프 §3.6 B)

| 칸 | 문구 | 출처 |
|---|---|---|
| chip | GROUP BY랑 HAVING | [§3.6] |
| S1 | GROUP BY랑 HAVING 차이가 뭐야? WHERE랑 헷갈려 | [§3.6] |
| S2 문단 | WHERE는 묶기 전에 행을 하나씩 거르고, HAVING은 GROUP BY로 묶은 다음 그룹을 걸러요. 그래서 COUNT(*) 같은 집계 조건은 HAVING에 써요. | [§3.6] |
| S2 표 | 캡션 `orders`, 열 `order_id · member_id · status`, 행 101 1 PAID / 102 1 PAID / 103 3 PAID / 104 3 CANCELLED / 105 4 PAID | [파생: §3.6 예시 데이터를 표로] |
| S3 | AI: 취소된 주문은 빼고 2번 이상 결제한 회원을 찾으려면, '취소 제외'와 '2번 이상'은 각각 어디에 쓸까요? / 사용자: 취소 제외는 WHERE, 2번 이상은 HAVING? | [§3.6] |
| S4 | 맞아요. 방금 배운 걸로 현장 과제 하나 풀어 볼래요? | [파생: §3.2 S4에서 가운데 문장 삭제] |
| S5 | 대화에서 개념 찾기 · WHERE, GROUP BY, HAVING / 상황 고르기 · 쇼핑몰 주문 데이터 / 현장 과제 만들기 | [§3.6] |
| S6 | 쇼핑몰 CRM팀 요청 (가상 상황) / 결제 완료 주문이 2건 이상인 재구매 회원을 뽑아 주세요. 취소된 주문은 세지 않아요. / 쓰는 테이블 `orders(order_id, member_id, ordered_at, status)` / 덧붙임 `status는 'PAID' 또는 'CANCELLED'` | [§3.6] |
| S7 SQL | `SELECT member_id, COUNT(*) AS paid_orders` / `FROM orders` / `WHERE status = 'PAID'` / `GROUP BY member_id` / `[ ? ] COUNT(*) >= 2;` | [§3.6] |
| 보기 / 정답 | `WHERE` · `HAVING` / `HAVING` | [§3.6] |
| 정답 결과 | 표 캡션 `결과 1행`, 열 `member_id · paid_orders`, 행 `1 · 2` | [§3.6 결과 `(1, 2)`] |
| 정답 AI | 맞아요. WHERE는 묶기 전의 행을, HAVING은 묶은 뒤의 그룹을 걸러요. | [파생: '맞아요.' + §3.6 B 1일 알림 첫 문장] |
| 오답 칩 / AI | `실행 오류` [초안] / WHERE에는 COUNT 같은 집계 함수를 쓸 수 없어서 오류가 나요. 묶은 다음 거르는 건 HAVING이에요. | AI [§3.6] |
| 알림 문장 | 정답 `결과 1행, 회원 1번. 맞아요.` / 오답 `실행 오류. WHERE에는 COUNT 같은 집계 함수를 쓸 수 없어요.` | [초안] |
| 카드 면접 질문 | 데이터에서 조건에 맞는 고객을 뽑아 본 적 있나요? | [파생: §3.6 B 30일 알림] |
| 카드 답변 한 줄 | 주문 데이터에서 취소 주문은 WHERE로 빼고, GROUP BY와 HAVING으로 결제 2건 이상인 재구매 회원을 뽑는 과제를 풀어 봤습니다. | [§3.6] |
| 카드 배운 점 | WHERE는 묶기 전의 행을, HAVING은 묶은 뒤의 그룹을 거른다. | [파생: §3.6 B 1일 알림을 §3.4 배운 점 말투로] |
| 카드 쿼리 조각 / 태그 | `HAVING COUNT(*) >= 2` [파생] / SQLD · 2과목 · GROUP BY [§3.6] |  |
| S8 발췌 | `WHERE status = 'PAID'` / `GROUP BY member_id` / `HAVING COUNT(*) >= 2;`(날아갈 줄) | [파생] |
| S9 목록 | 오늘 · SQLD 2과목 · GROUP BY — 결제 2건 이상인 재구매 회원을 뽑는 과제 / 30일 전 · SQLD 2과목 · 서브쿼리 — 평균보다 많이 주문한 회원을 찾는 과제 / 3개월 전 · SQLD 1과목 · 정규화 — 주문서 엑셀을 회원·주문 테이블로 나누는 과제 | [파생: §3.2 S9 줄 + §2.5 카드 더미에서 '를 풀어 봤습니다' 삭제. 오늘 주제와 겹치는 `7일 전 GROUP BY`는 뺀다] |
| 1일 알림 | WHERE는 묶기 전의 행을, HAVING은 묶은 뒤의 그룹을 걸러요. 집계 조건은 HAVING에. / 펼친 줄 `어제 쓴 쿼리 다시 보기 →` | [§3.6] / [§3.5 재사용] |
| 7일 알림 | 'n번 이상', '합계 n원 이상'처럼 그룹 단위 조건이 나오면 HAVING이에요. 예: 한 학기에 세 번 이상 결석한 학생 찾기. / 펼친 줄 없음 | [§3.6] |
| 30일 알림 | 면접 질문: "데이터에서 조건에 맞는 고객을 뽑아 본 적 있나요?" 내 답변 한 줄 다시 보기 → | [§3.6] |
| S13 꼬리질문 | 없음(브리프에 없다) | — |

**세트 C · ROW_NUMBER와 RANK** (브리프 §3.6 C)

| 칸 | 문구 | 출처 |
|---|---|---|
| chip | ROW_NUMBER랑 RANK | [§3.6] |
| S1 | ROW_NUMBER랑 RANK 차이가 뭐야? | [§3.6] |
| S2 문단 | 둘 다 순서대로 번호를 매겨요. 값이 같으면 RANK는 같은 순위를 주고 다음 순위를 건너뛰어요(1, 1, 3). ROW_NUMBER는 같아도 1, 2, 3처럼 서로 다른 번호를 줘요. | [§3.6] |
| S2 표 | 없음(104~106의 날짜가 브리프에 없어 표를 지어내지 않는다) | — |
| S3 | AI: 회원마다 주문을 딱 1건만 남기고 싶다면 어느 쪽이 안전할까요? / 사용자: 겹치면 안 되니까 ROW_NUMBER? | [§3.6] |
| S4 | 맞아요. 방금 배운 걸로 현장 과제 하나 풀어 볼래요? | [파생: 세트 B와 같음] |
| S5 | 대화에서 개념 찾기 · ROW_NUMBER, PARTITION BY / 상황 고르기 · 쇼핑몰 주문 데이터 / 현장 과제 만들기 | [§3.6] |
| S6 | 고객센터팀 요청 (가상 상황) / 회원마다 가장 최근 결제 주문 1건만 뽑아 주세요. 같은 날 주문이 두 건인 회원도 있어요. / 쓰는 테이블 `orders(order_id, member_id, ordered_at, status)` | [§3.6], 테이블 [파생: 세트 B와 같은 테이블] |
| S7 SQL | `SELECT member_id, order_id, ordered_at` / `FROM (` / `  SELECT member_id, order_id, ordered_at,` / `         [ ? ] OVER (PARTITION BY member_id ORDER BY ordered_at DESC) AS rn` / `  FROM orders` / `  WHERE status = 'PAID'` / `) t` / `WHERE rn = 1;` | [§3.6] |
| 보기 / 정답 | `ROW_NUMBER()` · `RANK()` / `ROW_NUMBER()` | [§3.6] |
| 정답 결과 | 칩 `결과 3행` + 줄 `회원 1·3·4가 한 건씩`(표 없음. 회원 4번의 같은 날 두 주문 중 어느 것이 남는지는 정해지지 않으므로 주문 번호를 적지 않는다) | 줄 [§3.6], 칩 [파생] |
| 정답 AI | 맞아요. 윈도우 함수 결과(rn)는 같은 SELECT의 WHERE에서 바로 쓸 수 없어서 FROM 안에 한 번 감쌌어요. | [파생: '맞아요.' + §3.6 AI 덧붙임] |
| 오답 칩 / AI | `결과 4행` [파생: 회원 1·3 한 건 + 회원 4 두 건] / 같은 날 결제한 주문이 두 건이면 RANK는 둘 다 1이라 회원 4번은 2건이 나와요. 회원당 1건이 필요하면 ROW_NUMBER예요. | AI [§3.6] |
| 알림 문장 | 정답 `결과 3행, 회원 1·3·4가 한 건씩. 맞아요.` / 오답 `결과 4행. RANK는 같은 날 주문에 같은 번호를 줘요.` | [초안] |
| 카드 면접 질문 | 중복 데이터를 정리해 본 적 있나요? | [파생: §3.6 C 30일 알림] |
| 카드 답변 한 줄 | 주문 데이터에 ROW_NUMBER로 회원별 최신순 번호를 매기고, 인라인 뷰로 1번만 골라 회원별 최근 결제 주문을 뽑는 과제를 풀어 봤습니다. | [§3.6] |
| 카드 배운 점 | 값이 같을 때 RANK는 같은 번호, ROW_NUMBER는 다른 번호를 준다. | [파생: §3.6 C 1일 알림] |
| 카드 쿼리 조각 / 태그 | `ROW_NUMBER() … rn = 1` [파생] / SQLD · 2과목 · 윈도우 함수 [§3.6] |  |
| S8 발췌 | `ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY ordered_at DESC) AS rn`(날아갈 줄) / `FROM orders` / `WHERE status = 'PAID'` / `) t` / `WHERE rn = 1;` | [파생] |
| S9 목록 | 오늘 · SQLD 2과목 · 윈도우 함수 — 회원별 최근 결제 주문을 뽑는 과제 / 7일 전 · SQLD 2과목 · GROUP BY — 결제 2건 이상인 재구매 회원을 뽑는 과제 / 30일 전 · SQLD 2과목 · 서브쿼리 — 평균보다 많이 주문한 회원을 찾는 과제 | 첫 줄 [파생: §3.6 C 답변 한 줄 줄임], 나머지 [§3.2 S9] |
| 1일 알림 | 값이 같을 때 RANK는 같은 번호, ROW_NUMBER는 다른 번호를 줘요. / `어제 쓴 쿼리 다시 보기 →` | [§3.6] / [§3.5 재사용] |
| 7일 알림 | '그룹마다 n건만' 뽑을 땐 PARTITION BY + ROW_NUMBER를 인라인 뷰로 감싸요. 예: 학과별 최근 공지 1건. | [§3.6] |
| 30일 알림 | 면접 질문: "중복 데이터를 정리해 본 적 있나요?" 내 답변 한 줄 다시 보기 → | [§3.6] |
| S13 꼬리질문 | 없음 | — |
| 주의 | 화면 어디에도 `1위`를 쓰지 않는다. `content-guard`가 부분 문자열로 실패한다(§3.6 주의). `1번`, `가장 최근`으로 쓴다 | [§3.6] |

- `[초안]`·`[파생]` 문자열은 `content/loop.ts`에서 줄 끝 주석으로 출처를 남긴다(예: `// 파생: §3.6 B 1일 알림`). 창업자 검토 때 찾기 쉽게.
- 금지어 검사 대상이다. B·C 문자열에도 `최고`·`1위`·`유일`·`보장`·`무조건`·`100%`가 없어야 한다. `PARTITION`에 `TIO`가 들어 있으므로 경쟁사 이름 검사를 더한다면 부분 문자열이 아니라 단어 경계로 한다.

### 5.12 동작 줄이기 · JS 없음 · 첫 렌더

| 상황 | 처리 |
|---|---|
| `prefers-reduced-motion: reduce` | CSS 전역 규칙으로 전환·애니메이션 0초. JS는 `matchMedia`를 실시간으로 읽어 단계 처음 열기 연출 대신 완성 상태를 바로 보이고, fly·타이핑·가짜 탭을 건너뛰고, 점은 한 번에 찬다. 탭 전환·빈칸 풀기·알림 넘기기는 그대로 된다 |
| 동작 줄이기 + 이어 보기 | 14장면을 600ms 간격 순간 전환(8.4초): ① S0 · S1 · S2 끝 · S3 답 · S4 → ② 체크 3 · 과제 카드 · 정답 채움+결과 → ③ 카드(조각 포함) · 목록 → ④ 1일 · 7일 · 30일 · 카드 열림. 진행 막대는 21초 비율로 맞춘다 [§3.8] |
| JS 없음 | `html:not(.js)`: 탭·재생·행동 행·눈금 자·힌트·잠금 안내·잠금화면 큰 날짜·미니 점 숨김. 네 패널이 세로로, 패널마다 `h3.nj`(시점 라벨 + `1 학습 대화`) + 두 톤 설명 + 완성 상태 화면. ① S1~S4 전체(S0 없음) ② 정답 LEFT JOIN이 채워진 SQL + 결과 2행 + AI 확인 ③ 목록(새 카드 펼침, 점 0개) ④ 알림 3장을 날짜와 함께 세로 목록 + `출시 예정 기능`. 1024px 이상이면 패널마다 `[설명 | 화면 360px]` 두 열 [§3.8] |
| `.js` 표시 | `app/layout.tsx`의 `<head>`에서 첫 페인트 전에 `document.documentElement.classList.add('js')`. `next/script` `strategy="beforeInteractive"`의 인라인 자식으로 넣고, `<html lang="ko" suppressHydrationWarning>`. TSD 13 CSP의 `'unsafe-inline'` 범위. 빌드 뒤 HTML `<head>`에 이 스크립트가 CSS보다 앞서 들어갔는지 확인한다(V-21) |
| 첫 렌더 | 서버 HTML = 위 완성 상태. 폰 높이·탭 높이가 고정이라 하이드레이션으로 바뀌는 것은 고정 상자 안쪽뿐이다(CLS 0.05 이하, TSD 12) |

### 5.13 분석 이벤트

| 이벤트 | 시점 | 속성 |
|---|---|---|
| `loop_step` | 페이지 방문 중 그 단계를 처음 열 때(이어 보기 포함 한 번) | `step` 1~4, `variant`, `topic` (C-9) |
| `cta_click` | `이 질문으로 첫 공부 시작하기` | `location: 'how'`, `variant`. 고른 세트는 같은 방문의 `loop_step.topic`으로 이미 남는다 |

`track()`은 `lib/analytics.ts`의 것을 쓰고, 이메일·자유 입력값을 넣지 않는다(TSD 9.2).

---

## 6. 컴포넌트 분할 (TSD 5장 이름)

| 컴포넌트 | 파일 | 서버/클라이언트 | props | 비고 |
|---|---|---|---|---|
| RootLayout | `app/layout.tsx` | 서버 | `children` | `lang="ko"`, `suppressHydrationWarning`, `.js` 인라인 스크립트, Pretendard 자체 호스팅, 메타데이터(TSD 10), Umami(운영만) |
| Page | `app/page.tsx` | 서버 | — | 헤더, `TickNav`, 섹션 1~7, Footer, StickyCta 조립. `variant='h1'` |
| VariantPage (P1) | `app/v/[variant]/page.tsx` | 서버 | `params.variant` | `generateStaticParams` h2·h3, canonical `/`, noindex (TSD 6.4) |
| `Hero` | `components/sections/Hero.tsx` | 서버 | `{ variant: 'h1'\|'h2'\|'h3' }` | 거울 입력창과 칩 포함(링크만). 타이핑은 CSS |
| `Problem` | `components/sections/Problem.tsx` | 서버 | — | |
| `Shift` | `components/sections/Shift.tsx` | 서버 | — | |
| `HowItWorks` | `components/sections/HowItWorks.tsx` | 서버 | `{ variant }` | 제목, `<LoopStepper topics shared copy variant />`, 캡션, 마무리, 링크, 1·7·30 숫자 줄 |
| `LoopStepper` | `components/loop/LoopStepper.tsx` (+ `loop.css`, `useTimeline.ts`) | **클라이언트** | `{ topics: Record<TopicId, LoopTopic>; shared: typeof loopShared; copy: LoopCopy; variant }` | 상태 전부(5.2), 탭·설명·행동·재생·눈금 자·알림 문장 |
| `ChatMock` | `components/loop/ChatMock.tsx` | 클라이언트 모듈(표시 전용) | `{ topic: LoopTopic; at: number; typed: string; freshKeys: Set<string> }` | S0~S4 |
| `TaskMock` | `components/loop/TaskMock.tsx` | 〃 | `{ topic; at: number; busy: boolean; blank: Blank; resultShown: boolean; onChoose(option: string): void; tapTarget?: string }` | S5~S7. 보기 버튼만 반응 |
| `CardMock` | `components/loop/CardMock.tsx` | 〃 | `{ topic; at: 0\|1\|2; listShown: boolean; flyRef: Ref; saveTap: boolean }` | S8~S9. fly 좌표는 `LoopStepper`가 ref로 재서 CSS 변수로 넣는다 |
| `ReminderMock` | `components/loop/ReminderMock.tsx` | 〃 | `{ topic; shared; index: -1\|0\|1\|2; opened: boolean; revisitFilled: 0\|1\|2\|3; onAdvance(fromHit: boolean): void; cardTitleRef: Ref }` | S10~S13 |
| `ExperienceCard` | `components/loop/ExperienceCard.tsx` | 〃 | `{ card; shared; snippetVisible; showPlan; showTags; showSource; isKey? }` | CardMock에서 나눈 공용 조각(TSD 5장 목록 밖이지만 `loop/` 안) |
| `Difference` | `components/sections/Difference.tsx` | 서버 | — | |
| `EasyStart` | `components/sections/EasyStart.tsx` | 서버 | — | |
| `SignupSection` | `components/sections/SignupSection.tsx` | 서버 | `{ variant }` | 제목·안내 + `SignupForm` |
| `SignupForm` | `components/signup/SignupForm.tsx` | **클라이언트** | `{ variant: HeroVariant }` | `useActionState(submitSignup)`, 오류·포커스·`none` 배타, `form_start` 등 |
| `ChoiceChips` | `components/signup/ChoiceChips.tsx` | 클라이언트 모듈 | `{ name; legend; hint?; type: 'radio'\|'checkbox'; options: {value,label}[]; error?: string }` | `<fieldset><legend>` + 진짜 input |
| `SignupSuccess` | `components/signup/SignupSuccess.tsx` | 클라이언트 모듈 | — | 완료 문구, 마운트 때 포커스 |
| `Footer` | `components/sections/Footer.tsx` | 서버 | — | `CONTACT_EMAIL`(content/privacy.ts) |
| `PhoneFrame` | `components/ui/PhoneFrame.tsx` | 서버 호환(훅 없음) | `{ className? }` | 빈 프레임. 화면은 겹쳐 놓는다(5.3) |
| `ExampleBadge` | `components/ui/ExampleBadge.tsx` | 서버 호환 | `{ label: '예시 화면'\|'예시'; tone: 'island'\|'chip' }` | 섬(ink 면) / 칩(흰 면 line-2 테두리). 전체 폭으로 늘이지 않는다(design-1 결함) |
| `StickyCta` | `components/ui/StickyCta.tsx` | **클라이언트** | `{ label: string; href: '#signup' }` | 4.9. `body` 데이터 속성으로 헤더 CTA 제어 |
| `Button` | `components/ui/Button.tsx` | 서버 호환 | `{ href; variant: 'ink'\|'soft'\|'pill'\|'pill-dark'; size: 'md'\|'sm'; cta?: 'nav'\|'hero'\|'easy_start'\|'sticky'\|'how' }` | `data-cta`만 단다. 추적은 attribution 섬 |
| `TickNav` | `components/ui/TickNav.tsx` | **클라이언트** | `{ items: { href: string; label: string }[] }` | C-8. 1280px 이상만 그린다(CSS) |
| attribution 섬 | 기존 `lib/attribution.ts` + 마운트 컴포넌트 | 클라이언트 | — | UTM 수집(TSD 9.1) + `data-cta` 위임 클릭 리스너 하나 |

**content 파일**

| 파일 | 담는 것 |
|---|---|
| `content/landing.ts` | 히어로(변형 3개, 서브, CTA, 그림, 거울, 칩), 문제, 시대 변화, 섹션 4 바깥(제목, 리드, 캡션, 마무리, 링크, 숫자 줄), 차별점, 섹션 6, 신청 섹션 제목·안내·필드 이름·선택지·오류·완료, 푸터 고지, StickyCta, TickNav 이름 |
| `content/loop.ts` | `LoopTopic` 세 개, `loopShared`, `loopCopy`(탭 이름·시점 라벨·두 톤 설명·행동 버튼·재생 라벨·안내 줄·알림 문장·`aria-label`들), 이어 보기 시간표 상수 |
| `content/privacy.ts` | 기존 그대로(`CONSENT_VERSION`, `CONTACT_EMAIL`, `consent`, 처리방침) |

**클라이언트 JS 예산**(TSD 12, gzip 150KB 이하): `LoopStepper` 묶음 약 10KB 목표(시안 A 인라인 JS가 gzip 6.9KB), `SignupForm`, `StickyCta`, `TickNav`, attribution.

---

## 7. 검증 체크리스트

실기기와 Playwright(360×780, 1280×800, 1440×900, 1024×768)에서 확인한다. CLAUDE.md 규칙대로 실제 브라우저에서 본 뒤 완료를 보고한다. 번호는 2.4절 `확인` 칸과 연결된다.

**히어로**

- [ ] **V-1** 360×780: 헤더 아래 h1, CTA 두 개, 면접관 질문, Before, After, 출처 칩이 스크롤 없이 모두 보인다(그림 아래 끝 y ≤ 780). 1440×900도 같다. 데스크톱 왼쪽 아래에 거울 입력창과 칩이 있다
- [ ] **V-2** 1440: 거울 문장이 약 0.4초 뒤 1.5초 동안 왼쪽부터 한 번 드러나고 멈춘다. 360에서는 처음부터 완성 문장이다. 동작 줄이기에서는 어디서나 완성 문장이다
- [ ] **V-3** 칩 `GROUP BY랑 HAVING` 클릭 → 무대가 헤더 바로 아래로 오고, ① 탭 선택, 폰에 `GROUP BY랑 HAVING 차이가 뭐야? WHERE랑 헷갈려`와 orders 표, 알림 문장이 한 번 읽힌다. `ROW_NUMBER랑 RANK`, 화살표(JOIN)도 같다. 같은 칩을 다시 눌러도 ①로 돌아온다
- [ ] **V-4** URL을 `/#how-rank`로 직접 열면 세트 C로 열린다

**섹션 4 기본·탭**

- [ ] **V-5** 1440: 무대 왼쪽 열에 탭 → 설명 → 행동 → 재생이 빈 공간 없이 이어지고, 폰이 무대 아래로 약 96px 삐져나온다
- [ ] **V-6** 페이지를 내려 무대가 처음 보일 때 폰이 움직이지 않고 ①의 완성 대화(질문, members·orders 표, 결과 표 A·B 캡션)가 보인다
- [ ] **V-7** 폰 속 S0 칩 태그는 이어 보기 0~1.8초에만 보이고, 테두리 없는 회색 태그라 누를 수 있어 보이지 않는다
- [ ] **V-8** 360: 무대 맨 위를 헤더 바로 아래에 맞추면 탭, 폰 전체, 행동 버튼(`다음 단계: …` 또는 `다음 알림`)이 한 화면에 있다. ④에서 폰 속 날짜 아래 `출시 예정 기능`이 보인다
- [ ] **V-9** ② 첫 열기: 상태줄 → 체크 3줄(간격 일정) → 과제 카드가 아래에서 올라옴 → SQL과 보기 두 개. 빈칸은 `[ ? ]`이고 행동 자리에 힌트 문장
- [ ] **V-10** 360: `INNER JOIN` → 빈칸 빨간 실선, 누른 보기는 흰 면 빨간 테두리, `결과 0행` + AI 설명, 다시 누를 수 있다. `LEFT JOIN` → 초록, `결과 2행` 표의 `joined_at` 열이 대화 영역 안에 다 들어온다(표 `scrollWidth` ≤ 부모 폭), 행동 자리가 `다음 단계: 경험 카드`로. 세트 B `WHERE` → `실행 오류`, `HAVING` → `결과 1행` 표. 세트 C `RANK()` → `결과 4행`, `ROW_NUMBER()` → `결과 3행 · 회원 1·3·4가 한 건씩`
- [ ] **V-11** 보기를 누르고 240ms 안에 ③ 탭을 누르면 ②의 결과 알림 문장이 나오지 않는다. 탭을 빠르게 연타해도 말풍선이 겹치거나 두 번 나오지 않는다
- [ ] **V-12** 키보드: Tab으로 탭 목록에 들어가 ←→↑↓·Home·End로 이동하면 바로 열리고 포커스 링이 보인다. 1024px 이상 `aria-orientation="vertical"`, 미만 `horizontal`. 다음 Tab이 대화 영역(스크롤 가능) → 보기 버튼으로 간다
- [ ] **V-13** ③ 첫 열기: 쿼리 조각이 곡선으로 카드 `내가 쓴 쿼리` 칸에 내려앉고 → 목록 화면이 오른쪽에서 들어오며 토스트가 뜬다

**리마인드·루프 닫기**

- [ ] **V-16** ④: 1일(10월 27일 화요일) → `다음 알림` → 11월 2일 월요일(미니 점 1) → 11월 25일 수요일(점 2, 버튼 `30일 알림 열기`) → 잠금화면이 걷히고 같은 경험 카드 + `다시 본 날` 점 3개가 하나씩 찬다. 버튼 `처음 알림부터 다시`. 1440에서 눈금 핀이 1→7→30으로 이동하고 자 밖으로 밀리지 않는다
- [ ] **V-17** 알림을 폰 안에서 탭(Enter)해 넘기면 포커스가 새 맨 앞 알림으로, 30일 알림을 열면 카드 제목 `경험 카드`로 간다. 가려진 층의 요소는 Tab 순서에 없다

**이어 보기**

- [ ] **V-18** `처음부터 이어 보기` → 10초 시점에 ② 정답 보기가 가짜 탭으로 눌려 있고 버튼은 `일시정지`. 일시정지 → `이어 보기` → 이어서 재생. 21초에 ④ 카드가 열린 채 멈추고 `다시 보기` + 안내 줄. `현장 과제에서 직접 풀기` → ②, 빈칸 비움, 첫 보기에 포커스
- [ ] **V-19** 재생 중 탭·보기·알림을 누르면 재생이 멈추고(버튼 `처음부터 이어 보기`) 누른 단계가 완성 상태로 열린다. 다른 브라우저 탭으로 갔다 오면 일시정지 상태다

**JS 없음·동작 줄이기·첫 렌더**

- [ ] **V-20** `javaScriptEnabled: false`: 섹션 4에 탭·재생·힌트가 없고 네 패널이 세로로 완성 상태(②는 LEFT JOIN 채움 + 결과 2행, ④는 알림 3장 세로). 패널에 `role="tabpanel"`이 없다. 히어로 칩은 `#how-*`로 스크롤만 된다. 폼이 일반 POST로 제출되고 완료 화면이 나온다(TSD 15.1)
- [ ] **V-21** 빌드 결과 HTML `<head>`에 `.js` 스크립트가 있고, 느린 3G에서도 첫 페인트에 섹션 4가 탭 레이아웃으로 그려진다(세로 목록이 번쩍이지 않는다). 하이드레이션 경고 0
- [ ] **V-23** 동작 줄이기(`reducedMotion: 'reduce'`): 탭을 처음 열면 완성 상태가 바로 보이고, 이어 보기는 0.6초 간격 순간 전환(약 8.4초), 점은 한 번에 찬다

**전역**

- [ ] **V-14** 스크립트 측정: `#stage .screen` 안 글자 요소의 계산된 `font-size`가 모두 13px 이상(0개 미만), 페이지 전체도 13px 미만 0개. INDEX와 같은 방식(텍스트 노드를 가진 요소, `.sr-only` 제외)
- [ ] **V-15** axe serious·critical 0. 본문 대비 4.5:1 이상. 빈 점·눈금 등 의미 있는 그래픽 3:1 이상
- [ ] **V-22** 360 스크롤: StickyCta는 히어로 CTA, 섹션 4 무대, 신청 섹션이 보이는 동안 숨고 그 밖에서는 보인다. 보일 때 헤더 CTA가 숨는다. 신청 섹션이 보이면 데스크톱에서도 헤더 CTA가 숨는다. 헤더 뒤로 콘텐츠가 비치지 않는다. iOS safe-area 위에 떠 있다
- [ ] **V-24** 1280 이상: TickNav 링크마다 누르는 영역 44×32px, 지금 섹션 눈금이 길고 진하다. 1440에서는 지금 섹션 이름이 늘 보이고 콘텐츠와 겹치지 않는다. 1279px 이하에서는 없다
- [ ] **V-25** `content-guard` 통과(금지어 0, 세트 B·C 포함). 랜딩 화면 문구에 `Claude`는 폼의 `Claude 유료` 한 곳뿐이고, `3분`이 없다
- [ ] **V-26** 모든 상태에서 360px 가로 넘침 없음(`document.documentElement.scrollWidth === innerWidth`): 기본, 탭 4개, 오답, 정답, 리마인드 3단계, 카드 열림, 이어 보기 중
- [ ] **V-27** Lighthouse 모바일: LCP는 h1, LCP ≤ 2.5s, CLS ≤ 0.05, INP ≤ 200ms, Performance 90 · Accessibility 95 이상(TSD 12)
- [ ] **V-28** 카카오톡 인앱(iOS·Android): 폰 무대 높이가 주소창 변화에 튀지 않는다, StickyCta safe-area, 이메일 입력 시 키보드가 입력을 가리지 않는다, 폰 속 대화 영역 스크롤이 페이지 스크롤을 붙잡지 않는다(`overscroll-behavior: contain`이 끝에서만 걸리는지)
- [ ] **V-29** 이벤트(미리보기에서 `window.umami` 목으로): 단계 처음 열기마다 `loop_step`(step·variant·topic) 한 번, CTA마다 `cta_click`(location) 한 번, 폼 `form_start`·`signup_success`

---

## 8. 창업자가 확인할 것

| # | 무엇 | 이 문서의 기본값 |
|---|---|---|
| O-1 | 히어로 서브: research/10 §2.1 문장 vs TSD 6.3 확정안(`내 ChatGPT 계정을 Experii 앱에 등록하면, 이제 공부만 하세요. 면접 소재는 Experii가 쌓아 둡니다.`) | research/10 §2.1. 헤드라인 영역은 변화 하나만 말한다(브리프 0장 1). TSD 문장으로 바꾸려면 `content/landing.ts` 한 줄 |
| O-2 | 섹션 6 카드 ① `가입은 짧게 시작하도록 만들고 있어요.`(숫자 삭제로 어색할 수 있음) | 그대로. 측정 뒤 숫자를 쓸 수 있으면 TSD 6.3 근거 표부터 고친다 |
| O-3 | 세트 B·C의 `[파생]`·`[초안]` 문자열(5.11) | 그대로 쓰되 공개 전 검토 |
| O-4 | `CONTACT_EMAIL` | 공개 전 `hello@experii.app` 수신 설정 뒤 값 입력(TSD 14.4) |
| O-5 | TickNav를 TSD 12장 클라이언트 목록에 더할지 | 더한다(C-8). 빼도 다른 것은 그대로 동작한다 |
