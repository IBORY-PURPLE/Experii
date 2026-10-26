# 디자인 시안 공통 브리프 (A·B 공용)

- 작성일: 2026-10-26
- 받는 사람: 디자인 에이전트 A(Claude), 디자인 에이전트 B(Codex·GPT)
- 산출물 위치: A는 `landing/prototypes/a/`, B는 `landing/prototypes/b/`. **자기 폴더 밖에는 아무것도 쓰지 않는다.**

## 1. 무엇을 만드나

Experii 사전 신청 랜딩페이지의 **실제로 눌러 볼 수 있는 시안** 하나. 취업 준비 대학생이 첫 화면에서 USP를 알아보고, 섹션 4에서 핵심 루프를 손으로 한 번 겪은 뒤 사전 신청까지 가게 만든다.

USP: SQLD를 공부하는 날마다 AI와 나눈 대화가 현장 과제가 되고, 푼 경험이 면접 답변 한 줄로 저장되며, 1·7·30일 뒤에 다시 꺼내 준다. 그래서 면접에서 "자격증 있어요" 대신 "이런 과제에서 이렇게 써 봤어요"라고 말하게 된다.

핵심 사용 사례 한 컷(반드시 끝까지 보여 줄 것): **SQLD 공부 대화 → 실제 현장 과제 풀기 → 푼 경험을 면접 답변 한 줄로 저장 → 1·7·30일 리마인드로 체화.** 이 흐름을 **Experii 앱 화면 안에서 GPT와 공부하는 화면**으로 그린다. 실제 API는 부르지 않고 미리 써 둔 대화로 재생하며, "예시 화면"과 `내 GPT · 연결 준비 중`으로 표기한다.

## 2. 먼저 읽을 것 (순서대로)

1. `C:/Users/chewo/Experii/landing/Experii_PRD_v0.1.md` — 제품 기준. 7장 금지 표현, 10장 섹션 구성
2. `C:/Users/chewo/Experii/landing/TSD.md` — 6장(섹션·LoopStepper·카피 근거 표), 11장(디자인·반응형·접근성), 12장(성능 예산)
3. `C:/Users/chewo/Experii/landing/research/10-landing-materials-brief.md` — **카피와 장면 대본의 원본.** 2장 섹션별 재료, 3장 S0~S13 대본·SQL·카드·알림 문구, 5장 금지 표현. 여기 있는 문구를 쓰고, 근거 없는 새 주장을 만들지 않는다
4. `C:/Users/chewo/.claude/skills/frontend-design/SKILL.md` — Anthropic 공식 frontend-design 스킬. 생성형 디자인의 흔한 티(크림 배경+테라코타, 모든 제목 위 대문자 눈썹, 똑같은 둥근 카드 묶음, 장식용 그라데이션, 섹션마다 페이드업)를 피하는 기준
5. 레퍼런스 캡처: `C:/Users/chewo/AppData/Local/Temp/claude/C--Users-chewo--claude-spares-spare-daJauR/87a16178-8dad-4a28-afbc-172203d9c45e/scratchpad/refshots/`
   - `toss-d00..d12.png`, `aside-d00..d08.png`, `apple-d00..d08.png`, `apple-airpods-d00..d14.png`, `cursor-*.png`, `readwise-*.png`, `tio-about-*.png` (데스크톱 1440×900, 약 850px 간격 스크롤), `*-m00/m01.png` (모바일 390×844), `*.txt` (페이지 텍스트)
   - `openai-d00.jpg`(히어로 입력창 + 칩), `openai-d01.jpg`·`openai-d02.jpg`(대화 → 생성된 인터랙티브 UI 카드), `openai-notes.md`
6. 참고(선택): `landing/research/01~03*.md`

## 3. 반드시 들어갈 것

| # | 항목 | 기준 |
|---|---|---|
| 1 | PRD 10장 섹션 7개 + 푸터 | 히어로(Before→After) · 문제 · 시대 변화 · 작동 방식 · 차별점 · 귀찮지 않은 시작 · 사전 신청 |
| 2 | 섹션 4 Experii 앱 화면 | 대본 S0~S13 전부: 질문 → AI 설명(표 포함) → 되묻기 → 과제 제안 → 과제 만드는 중 → 현장 과제 카드 → **방문자가 직접 푸는 빈칸**(INNER/LEFT, 오답 피드백) → 답변 한 줄 정리 → 내 경험 카드 목록 → 1·7·30일 알림(날짜 10월 27일 화 / 11월 2일 월 / 11월 25일 수) → 30일 알림을 누르면 같은 카드가 열리고 `다시 본 날` 점 3개 |
| 3 | 루프 조작 | TSD 6.2 기본: 탭 4개(`role="tablist"`, ←/→ 키) + 같은 폰 한 대. 브리프 4.3의 "처음부터 이어 보기" 재생(재생·일시정지·다시 보기). 다른 방식을 고르면 DESIGN.md에 TSD와의 차이와 대응을 쓴다 |
| 4 | 히어로 | 제목은 LCP 텍스트. Before→After 말풍선과 출처 칩. 주 CTA `사전 신청하기`, 보조 `어떻게 쓰는지 보기` |
| 5 | 사전 신청 폼 UI | TSD 7.1 필드 그대로(이메일, 신분, SQLD 상태, 유료 AI 구독, 동의, 허니팟). 시안에서는 제출하면 완료 화면만 보여 주고 아무 데도 보내지 않는다 |
| 6 | 표기 | 모든 목업에 `예시 화면` 배지. 연동·3분·비용 문구는 브리프 5.5 예정형. 리마인드에는 `출시 예정 기능` |
| 7 | 동작 없이도 읽힘 | JS가 꺼져 있으면 루프 4단계가 세로로 모두 보인다. 첫 HTML은 완성 상태. `prefers-reduced-motion`이면 움직임 없이 마지막 상태 |
| 8 | 반응형 | 360px부터. 1440px 데스크톱. `100svh`/`100dvh`. 터치 영역 44px. 가로 스크롤 없음 |

## 4. 인터랙션 수준

사용자는 toss.im · aside.com · openai.com · apple.com 수준의 완성도와 **인터랙티브한 효과**를 원한다. 장식이 아니라 USP를 증명하는 데 움직임을 쓴다.

- 페이지 전체에 **기억에 남는 순간 하나**를 정해 거기에 힘을 쓴다(예: 대화가 과제 카드로 바뀌는 순간, 알림 날짜가 넘어가며 같은 카드가 다시 열리는 순간, 히어로의 Before가 After로 바뀌는 순간). 나머지는 조용하게.
- 쓸 수 있는 것: 스크롤 위치에 따른 진행 표시, sticky 무대, 화면에 들어올 때 한 번만 실행되는 등장, 누름 피드백, 상태 변화 전환, 타이핑 연출(5초 미만), 카드 이동(`transform`만).
- 지킬 것: 애니메이션 라이브러리 금지(CSS + 작은 vanilla JS, IntersectionObserver). `transform`·`opacity`만 애니메이션. 5초 넘게 스스로 움직이는 것은 방문자가 시작하고 멈출 수 있어야 한다(WCAG 2.2.2). CSS 스크롤 연동(`animation-timeline`)은 `@supports` 안에서만. 레퍼런스의 카피·이미지·폰트·로고를 복제하지 않고 원리만 가져온다.

## 5. 토큰 제약

- 단계 색 체인(브리프 1.3)을 유지한다: 학습 대화 `#3d5a99`, 현장 과제 `#2f6f5e`, 경험 카드 `#9a5b13`, 리마인드는 각 시안이 정한다(배경 위 글자 대비 4.5:1 이상, 다른 세 색과 구별). 명도·채도는 대비를 위해 조정해도 되지만 "대화=파랑 계열, 과제=초록 계열, 카드=호박 계열" 의미는 지킨다.
- 배경·중립색은 TSD 11장에서 "임시값"이다. 데모의 크림색 `#f7f6f2`를 그대로 써도 되고, frontend-design 스킬 기준으로 다른 값을 골라도 된다. 바꾸면 이유를 DESIGN.md에 쓴다. 라이트 테마 하나.
- 글꼴: Pretendard Variable(TSD 4장). 시안에서는 `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css` 하나만 외부로 불러온다. 그 밖의 외부 스크립트·이미지·폰트는 쓰지 않는다. 래스터 이미지 없음(폰·잠금화면·카드 모두 HTML/CSS).
- 한글: 본문 16px·행간 1.65, `word-break: keep-all`, 제목 `text-wrap: balance`.

## 6. 산출물

1. `index.html` 한 파일. 인라인 CSS·JS. 브라우저로 바로 열린다. 200KB 이하.
2. `DESIGN.md` (한국어):
   1. 콘셉트 한 문단과 "기억에 남는 순간"
   2. 토큰: 색 4~8개(hex, 역할, 대비 값), 글자 크기 체계(360/1440), 간격·모서리 규칙
   3. 섹션별 레이아웃: 데스크톱·360px ASCII 와이어프레임
   4. 인터랙션 명세 표: 요소 · 시작 조건 · 무엇이 어떻게 움직이나 · 시간·곡선 · 동작 줄이기일 때 · JS 없을 때 · 참고한 레퍼런스와 바꾼 점
   5. 섹션 4 루프 조작 방식과 그 근거(TSD 6.2와 다르면 대응)
   6. Next.js 이식 메모: TSD 5장 컴포넌트(`Hero` `Problem` `Shift` `HowItWorks` `LoopStepper` `ChatMock` `TaskMock` `CardMock` `ReminderMock` `Difference` `EasyStart` `SignupSection` `Footer` `StickyCta`)에 어떻게 나뉘는지, 클라이언트 JS가 필요한 곳
   7. 자기 점검: frontend-design 스킬의 흔한 티 5개를 하나씩 대조한 결과, 금지 표현 검사 결과, 360px에서 확인한 것
3. 쓸 수 있으면 자기 시안의 360px·1440px 스크린샷을 `shots/`에 남긴다(선택).

## 7. 판정 기준 (미리 공개)

시안은 이름을 가리고 A/B로 비교한다. 기준은 플레이북 2.1과 같다.

1. 첫 화면 5초 안에 Before→After가 읽힌다
2. 루프 4단계가 한 컷으로 이해되고, 방문자가 과제를 직접 한 번 푼다
3. GPT 학습 장면이 예시 화면으로 정직하게 표시된다
4. 금지 표현 0건
5. 360px 가독성, 키보드 이동, 대비
6. 성능 예산과 움직임 절제(transform/opacity, 동작 줄이기)
7. 레퍼런스 수준의 완성도(타이포 위계, 여백, 리듬, 인터랙션의 손맛)와 독자성(템플릿처럼 보이지 않음)
8. Next.js로 옮기기 쉬움
