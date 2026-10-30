# AI용 계획: Experii AI Board 폰 랜딩 와이어프레임과 움직임 콘티

- 승인: 2026-10-31(플랜 모드 승인, 정해 줄 것 1~4 추천안). 이름은 "Experii AI Board"(서비스 Experii, 기능 AI Board = AI를 쓰는 칠판)로 창업자가 정했다.
- 1쪽 요약: `docs/plans/2026-10-30-mobile-landing-wireframe/human.md`
- 사람이 본 것은 1쪽 요약이고 이 파일이 실행 기준이다.
- 2026-10-31 창업자 요청으로 클라우드 세션에서 이어서 한다. 아래 "클라우드에서 할 때"를 따른다.

## 목표와 완료 조건

폰으로 들어온 대학생용 랜딩(`mobile_landing/`)의 블록별 와이어프레임과 AI Board 움직임 콘티를 정한다. 실제 앱 화면은 넣지 않고 회색 박스로 그린다.

완료 조건:
1. 회색 박스 시안 3개(보드 시연형 / 장면 넘김형 / 이야기형)가 폰 폭에서 실제로 움직이고, 창업자가 고를 수 있게 띄워져 있다.
2. 시안마다 390×844, 360×780 캡처(첫 화면, 움직임 처음·중간·끝)가 있고, 가장 작은 글자 13px 이상, 가로 스크롤 0을 스크립트로 확인했다. 움직임 줄이기 설정에서 마지막 장면이 보인다.
3. 창업자가 고른 뒤 `mobile_landing/docs/WIREFRAME.md`(블록 순서, 블록마다 목적·문구 초안·근거)와 `mobile_landing/docs/MOTION.md`(장면 5개, 장면마다 보일 것·시간·높이, 멈춤·다시 보기·움직임 줄이기 규칙)가 있다.
4. 네 고리(L1 인정, L2 흩어짐, L3 안 남음, L4 해법)가 모두 어느 블록엔가 있고 "GPT 대화창 vs AI Board" 블록이 있다. 어제 점검의 고칠 곳 3개(GPT 비교, 과목 선택, 출시 표시)가 반영돼 있다.
5. `PRD.md` 색인에 `mobile_landing/` 한 줄(현재 단계: 와이어프레임, 따를 문서: 랜딩 PRD v0.1과 이 계획)이 있다.
6. 확정안을 AI 독자 3명(페르소나는 아래)으로 다시 읽혀 어제 점검과 비교한 결과가 `docs/plans/2026-10-30-mobile-landing-wireframe/reader-check.md`에 "가설"로 있다.

코드를 바꾸지 않으므로 `gates.mjs`는 대상이 아니다.

## 확인된 사실

- 기준: `docs/plans/2026-10-30-brand-core-landing/criteria.md`(창업자 확인 끝: 과목은 사용자가 고름, 비교 대상은 GPT 직접 사용, "학습과 실제 역량 연결"). 어제 점검 결과: `docs/plans/2026-10-30-brand-core-landing/out/report.md`(GPT 반문 8/12, 과목 좁혀 읽음 12/12, 계정 연결 걱정 12/12, 폴더·PDF 가져오기 질문 8/12, 면접 연습 못 읽음 12/12).
- AI Board 흐름(개발 중): 브랜치 `claude/night-flow-2394ae` 등의 `docs/plans/2026-10-30-overnight-desktop/flow-v2.md` 0장. 페이지 = 대화 = 로드맵 칸, 첫 질문 때 필기 페이지가 생김, 저장된 GPT 답 안의 글만 끌어 필기(원문 그대로, 출처 Q 번호), 필기 페이지 맨 앞 요약 자리에 경험 카드, 끝에 다음 공부 구역. 필기 페이지 시안 A·B·C는 선택 대기. 개정 PRD(루프 v2, FR-16·17)는 그 브랜치들의 `docs/desktop/prd.md`에 있고 main에는 아직 없다. `git fetch origin claude/night-flow-2394ae && git show origin/claude/night-flow-2394ae:docs/plans/2026-10-30-overnight-desktop/flow-v2.md`로 읽는다.
- 데스크톱 v1(main)에서 하지 않는 것: 현장 과제, 면접 답변 화면, 리마인더, 모바일(`docs/desktop/prd.md` 6장). 앱은 Windows용, ChatGPT Plus·Pro 로그인.
- 폰 규칙: `landing/design/DESIGN.md` F-1~F-5(13px 이상, 44px 누름 영역, 360px 가로 스크롤 없음, 모든 프레임 완결), `landing/research/10-landing-materials-brief.md`(폰 틀 높이 제한, 데스크톱 화면 잘라 넣기 금지), `landing/research/11-aside-hero-motion.md`(한 번 재생, 다시 보기, 멈춤 늘 보임, 움직임 끄면 마지막 장면).
- 나중 구현에서 재사용할 움직임 엔진: `landing/components/loop/useTimeline.ts`, `landing/components/hero/HeroDemo.tsx`(큐 대본, 포인터 누르기, 재생 게이트, 움직임 줄이기). 애니메이션 라이브러리 금지(`landing/prototypes/DESIGN-BRIEF.md:45`).
- 금지 표현: 성과 보장, 단정(최고·1위·유일), 경쟁사 이름·비방, 광고 표시 없는 대가성 후기(`criteria.md` E15).

## 단계별 작업

### 1. 재료 (먼저)
- `criteria.md`, 어제 `report.md`, flow-v2.md 0장을 읽고 `docs/plans/2026-10-30-mobile-landing-wireframe/questions.md`에 "폰 페이지가 답할 질문"을 블록 뼈대 7개(후킹, 상황, 문제, 해결, GPT 대비, 안심, 신청)에 나눠 적는다. 각 질문에 근거(어제 독자 수치, 기준표 항목)를 붙인다.

### 2. 레퍼런스 (1과 병렬)
- 웹 조사: 캔버스·화이트보드 앱(FigJam, tldraw, Miro, Heptabase, Aside 등)의 랜딩이 끌어 놓기·필기 흐름을 폰에서 어떻게 움직여 보여 주는지, 첫 화면 구성과 재생 방식. 결과 `docs/plans/2026-10-30-mobile-landing-wireframe/references.md`(출처 URL, 배울 점 3~5개, 따라 하지 않을 점).

### 3. 시안 3개 (1·2 뒤)
- 독립 HTML 3개(CSS·바닐라 JS, 외부 라이브러리 없음). 회색 박스와 문구 초안, 보드 움직임 5장면(대화 → 끌어 필기 → 필기 섹션 → 경험 카드 → 로드맵 칸)이 실제로 돈다. 색은 회색조 + 강조 1색, 글꼴은 시스템 글꼴.
  - A 보드 시연형: 첫 화면 히어로 아래에서 보드가 바로 재생(높이 제한), 이어 글 블록
  - B 장면 넘김형: 스크롤로 내려가며 장면이 하나씩(sticky 사용 시 2.5~3 svh 이내)
  - C 이야기형: 상황·문제·해결 글 사이사이에 짧은 장면 하나씩
- 공통: 첫 화면에 "Experii AI Board", "대학생을 위한 AI 면접 역량 도우미", 신청 버튼. 보드 흐름에 "개발 중인 화면" 표시, 면접 연습 등은 "출시 뒤" 블록. 과목은 "AI로 공부하는 모든 과목"(예시는 SQL). 재생은 한 번, 멈춤·다시 보기. 버튼은 사전 신청 하나(실제 저장 없음).
- 검증: Playwright로 390×844, 360×780 캡처(첫 화면, 장면 1·3·5), 최소 글자 크기와 `scrollWidth > clientWidth` 측정, `reducedMotion: 'reduce'`로 마지막 장면 확인.

### 4. 고르기 (사람 차례)
- 창업자에게 세 시안을 띄우고 안마다 다른 점과 장단점 한 줄, 추천안과 이유를 준다. 고르기 전에는 확정 문서를 쓰지 않는다. 섞으라고 하면 섞은 안을 다시 띄운다.

### 5. 확정 (4 뒤)
- `mobile_landing/docs/WIREFRAME.md`, `mobile_landing/docs/MOTION.md`, `mobile_landing/README.md`(이 폴더가 무엇인지, 공식 홈 `landing/`과의 관계, 배포는 Vercel Root Directory로 따로)를 쓴다. `PRD.md` 색인에 한 줄 추가.
- AI 독자 3명(GPT로 SQLD 공부하는 컴공 3학년 / GPT로 학교 수업 공부하고 PDF로 저장하는 경영학과 4학년 / "그냥 GPT 쓰면 되는데"라는 취준생)에게 고른 안의 폰 첫 화면 캡처와 전체 문구만 보여 주고 어제와 같은 질문을 한다. 결과를 `reader-check.md`에 가설로 적는다.

## 클라우드에서 할 때

- 내장 브라우저가 없으니 시안은 Artifact로 하나씩 게시하고 링크를 창업자에게 준다(`.claude/rules/ui-change.md`의 "띄운다"를 대신함). 캡처는 사전 설치된 Playwright로 찍는다.
- 시안 HTML은 세션 scratchpad에 두고 커밋하지 않는다. 확정 문서와 계획 파일만 커밋한다.
- push는 `claude/*` 브랜치에만 한다. 이 작업 브랜치는 `claude/mobile-landing-wireframe`이다. PR은 창업자가 요청할 때만 연다(`.claude/rules/cloud.md`).

## 멈춤 조건
- 창업자가 시안을 고르기 전(4단계)
- 개발 세션의 보드 흐름과 어긋나는 새 흐름이 필요할 때
- 1쪽 요약의 범위(실제 앱 화면, 페이지 코드, 배포)를 넘어야 할 때

## 범위 밖
실제 앱 화면 넣기, 페이지 코드, 디자인(색·글꼴), 배포, 신청 저장 연결, 공식 홈페이지 수정. 다음 구현 계획에서 할 것: `scripts/agents/gates.mjs`·`verify-doctor.mjs`·`session-start.mjs`·`.github/workflows/landing-ci.yml`의 `landing/` 하드코딩, 신청 테이블 `waitlist_signups.hero_variant`(h1~h3만 허용), Vercel Root Directory `mobile_landing`.

## 진행 기록

| 날짜 | 단계 | 결과 | 근거 |
|---|---|---|---|
| 2026-10-31 | 승인 | 1쪽 요약 승인, 추천안 4개. 실제 앱 화면 제외는 창업자 지시 | 대화 |
| 2026-10-31 | 이동 | 창업자 요청으로 클라우드 세션으로 옮김. 브랜치 `claude/mobile-landing-wireframe` | 대화 |
| 2026-10-31 | 1 재료 | `questions.md`: 블록 7개별 질문과 근거, 보드 흐름에서 지킬 사실 8개, 어제 고칠 곳 3개 → 블록 대응 | 이 폴더 `questions.md` |
| 2026-10-31 | 2 레퍼런스 | `references.md`: 사례 9곳, 배울 점 5, 따라 하지 않을 점. 서비스 사이트는 네트워크 허용 목록 밖이라 모두 간접 확인(검색 요약·리뷰·W3C·NN/g) | 이 폴더 `references.md` |
| 2026-10-31 | 3 시안 | 독립 HTML 3개(CSS·바닐라 JS, 라이브러리 없음, scratchpad, 커밋 안 함). Artifact 게시: A https://claude.ai/artifact/RH4oJFpCSeFu9CtbvDKAkn , B https://claude.ai/artifact/Vszm2KoAJ4ywet57xTjyU4 , C https://claude.ai/artifact/HvkfFrcYVXFgByZ27okkrG | Playwright 측정 스크립트 |
| 2026-10-31 | 3 측정 | 6개 화면(3안 × 390×844·360×780) 모두: 최소 글자 13px(13px 미만 0개), 가로 스크롤 0(scrollWidth = clientWidth), 누름 영역 44px 미만 0개, 페이지 오류 0, 멈춤 뒤 시간 정지 확인, 움직임 줄이기에서 마지막 장면(로드맵 + 다음 공부 칸 + 경험 카드) 보임. 캡처 첫 화면·장면 1·3·5(A는 2·4 추가)·움직임 줄이기 38장. 첫 화면 보드 위치: A·B 위 끝 335~339px, C 541px(390×844) | scratchpad `wf/shots/report.json` |
| 2026-10-31 | 4 고르기 | 창업자에게 링크 3개와 장단점, 추천안을 주고 멈춤 | 대화 |
