---
name: Experii Desktop
description: 공부한 대화가 경험 카드로 쌓이는 Windows 데스크톱 앱. 조용한 공부 책상에서 쌓은 경험에만 색과 입체가 있다.
colors:
  ink: '#1a2233'
  ink-hover: '#2d3544'
  ink-2: '#444b59'
  ink-3: '#5c626e'
  ink-4: '#7e828c'
  line: '#e4e5e7'
  line-2: '#d0d2d5'
  wash: 'rgb(26 34 51 / 0.05)'
  wash-2: '#edeeef'
  wash-3: '#f3f4f5'
  on-ink: '#ffffff'
  select: 'rgb(26 34 51 / 0.1)'
  blue: '#3d5a99'
  blue-hi: '#5c74a9'
  blue-lo: '#324a7d'
  blue-rail: '#b1bdd6'
  blue-wash: '#eff2f7'
  err: '#b42318'
  bg-side: '#f4f5f6'
  bg-main: '#f8f9f9'
  surface: '#ffffff'
  knob-now-top: '#ffffff'
  knob-now-bottom: '#f2f3f4'
  knob-off-top: '#f7f7f7'
  knob-off-bottom: '#e5e6e8'
  scrim: 'rgb(26 34 51 / 0.15)'
  scrollbar: 'rgb(26 34 51 / 0.2)'
  icon-tile: '#5474bb'
typography:
  wordmark-lockup:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '32px'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '-0.01em'
  wordmark:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '-0.01em'
  headline:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '20px'
    fontWeight: 600
    lineHeight: '24px'
    letterSpacing: '-0.01em'
  title-lg:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '18px'
    fontWeight: 600
    lineHeight: '24px'
  value:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 600
    lineHeight: '24px'
    fontFeature: 'tnum'
  quote:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 500
    lineHeight: 1.5
  title:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '15px'
    fontWeight: 600
    lineHeight: '24px'
  button:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '14px'
    fontWeight: 500
  body:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 500
    lineHeight: '20px'
  meta:
    fontFamily: "'Pretendard Variable', 'Segoe UI', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 400
    lineHeight: '20px'
  mono:
    fontFamily: "'Cascadia Mono', Consolas, ui-monospace, 'Pretendard Variable', monospace"
    fontSize: '13px'
    fontWeight: 400
rounded:
  r-1: '4px'
  r-2: '8px'
  r-3: '12px'
  r-4: '16px'
  pill: '999px'
spacing:
  sp-1: '4px'
  sp-2: '8px'
  sp-3: '12px'
  sp-4: '16px'
  sp-5: '20px'
  sp-6: '24px'
  sp-8: '32px'
  sp-10: '40px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.on-ink}'
    typography: '{typography.button}'
    rounded: '{rounded.r-2}'
    height: '32px'
    padding: '0 12px'
  button-primary-hover:
    backgroundColor: '{colors.ink-hover}'
  button-primary-disabled:
    backgroundColor: '{colors.wash-2}'
    textColor: '{colors.ink-3}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.button}'
    rounded: '{rounded.r-2}'
    height: '32px'
    padding: '0 12px'
  button-secondary-hover:
    backgroundColor: '{colors.wash-3}'
  button-ghost:
    textColor: '{colors.ink-2}'
    typography: '{typography.button}'
    rounded: '{rounded.r-2}'
    height: '32px'
    padding: '0 8px'
  button-ghost-hover:
    backgroundColor: '{colors.wash}'
    textColor: '{colors.ink}'
  button-small:
    height: '28px'
  button-large:
    height: '44px'
    padding: '0 20px'
  icon-button:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.r-2}'
    size: '28px'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.r-2}'
    height: '36px'
    padding: '0 12px'
  chip:
    backgroundColor: '{colors.wash-3}'
    textColor: '{colors.ink-3}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    height: '24px'
    padding: '0 12px'
  chip-useful:
    backgroundColor: '{colors.wash-2}'
    textColor: '{colors.ink}'
  chip-current:
    backgroundColor: '{colors.blue-wash}'
    textColor: '{colors.blue}'
  knob-done:
    backgroundColor: '{colors.blue}'
    textColor: '{colors.on-ink}'
    rounded: '{rounded.pill}'
    size: '56px'
  knob-now:
    backgroundColor: '{colors.knob-now-top}'
    textColor: '{colors.blue}'
    rounded: '{rounded.pill}'
    size: '56px'
  knob-locked:
    backgroundColor: '{colors.knob-off-bottom}'
    textColor: '{colors.ink-3}'
    rounded: '{rounded.pill}'
    size: '56px'
  tile:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-3}'
    padding: '16px 20px'
  card-view:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-3}'
  sidebar-row-selected:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-2}'
    height: '32px'
    padding: '0 8px'
  message-user:
    backgroundColor: '{colors.wash-2}'
    textColor: '{colors.ink}'
    rounded: '{rounded.r-3}'
    padding: '8px 12px'
  banner:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-3}'
    padding: '12px 16px'
  dialog:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-4}'
    padding: '24px'
    width: '440px'
  sign-in-card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-4}'
    padding: '32px 32px 24px'
    width: '400px'
  tab:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.r-2}'
    height: '52px'
    padding: '4px 12px'
  tab-active:
    backgroundColor: '{colors.surface}'
  note:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.r-3}'
    padding: '12px 16px'
    width: '264px'
  pin:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-3}'
    width: '328px'
  popover:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.r-3}'
    width: '320px'
---

# Design System: Experii Desktop

요구사항과 범위의 기준은 루트 `PRD.md`, 화면 배치·정보 순서·문구의 기준은 `docs/desktop/tsd.md`의 "D 화면 시안 결정"과 "디자인 통일 결정 (2026-10-30)"이다. 이 파일은 색·크기·부품 규칙의 기준이다. 값의 원본은 `src/renderer/styles/tokens.css` 하나이고, 위 머리말과 아래 괄호 속 숫자는 그 토큰을 옮겨 적은 것이다. 둘이 다르면 `tokens.css`를 고치고 이 파일을 맞춘다.

## Overview

**Creative North Star: "조용한 공부 책상"**

Experii 데스크톱은 GPT와 공부하는 책상이다. 오른쪽 열에서 대화하며 공부하고, 다 끝나면 [경험으로 남기기]로 대화를 경험 카드로 바꾼다. 카드는 가운데 길에 파랗게 솟은 둥근 칸으로 쌓이고, 머리줄은 쌓은 수를 센다. 이 책상에서 색과 입체를 가진 것은 쌓은 경험뿐이다. 나머지는 차가운 회색 바탕 위의 흰 면과 잉크 글자다.

화면 모드는 Operate다. 사용자는 공부하고, 카드를 평가하고, 지난 대화를 다시 열러 온다. 훑어보기 쉬움, 일관성, Windows 앱다운 동작이 표현보다 앞선다. 품질 기준은 Aside 앱이고 원리만 가져온다. 거의 검정 하나(잉크)의 농도와 회색 단계, 굵기보다 크기와 회색으로 나눈 위계, 겹친 상자 대신 1px 선과 옅은 그림자, 12px 스피너와 글로 조용히 알리는 진행 상태가 그 원리다.

이 방향은 창업자가 2026-10-30에 고른 화면 "길"과 로고 "쌓이는 E"다. 승인 시안은 저장소 밖 공유 노트에 있다(위치는 `docs/plans/2026-10-30-desktop-design/ai.md` 0장). 시안과 다르게 간 점은 그 계획 0장이 정했다: 잉크 `#1a2233`, 글자 크기 여섯 단, 카드 머리의 "경험 카드 · 과목 · 날짜"를 제목 아래 줄로 옮김. 화면 문구는 시안이 아니라 앱과 TSD를 따른다.

### 창업자 결정

색·버튼·입체·배치의 상위 기준은 창업자가 2026-10-30에 정한 "디자인 통일 결정"이다([`docs/desktop/tsd.md`](../../docs/desktop/tsd.md)의 "디자인 통일 결정 (2026-10-30)"). 실행 계약과 완료 조건, Aside 원리는 [`docs/plans/2026-10-30-desktop-design/ai.md`](../../docs/plans/2026-10-30-desktop-design/ai.md) 0~2장이다. 요지는 다음과 같다.

- 색은 파랑 #3d5a99와 잉크 #1a2233, 흰색과 중립 회색뿐이다. 빨강은 오류 글에만 쓴다.
- 파랑은 아래 Blue Places Rule의 자리에만 쓰고, 버튼·링크·포커스 링·글자 선택에는 쓰지 않는다.
- 칠한 버튼은 한 화면 상태에 하나이고 잉크색이다.
- 입체는 길의 둥근 칸에만 있다.
- 세 열 배치와 정보 순서는 그대로 두고, 문구는 시안이 아니라 앱을 따른다.

리뷰어의 취향은 이 결정을 넘지 못한다. 이 규칙에 없는 새 색 자리나 새 배치가 필요하면 창업자에게 묻는다.

**Key Characteristics:**

- 흰 면, 차가운 회색 바탕 두 단(사이드바와 가운데), 잉크 글자 네 단
- 파랑 하나는 경험이 쌓인 자리와 "지금"에만 쓴다
- 입체(그라데이션, 아래 턱, 손잡이 그림자)는 길의 둥근 칸에만 있다
- 색을 채운 버튼은 한 화면 상태에 하나이고 잉크색이다
- 세 열이 높이 64px 머리줄 하나를 나눠 쓴다. 가운데 머리는 탭이다
- 필기 페이지는 회색 점 격자 위에 흰 필기가 놓인다. 파랑도 칠한 버튼도 더하지 않는다
- 진행 상태는 12px 스피너와 하는 일을 적은 글로 조용히 알린다

## Colors

차가운 회색 위의 흰 면과 잉크 글자, 경험이 쌓인 자리만 표시하는 파랑 하나, 오류 글에만 쓰는 빨강으로 이뤄진다.

### Primary

- **길 파랑** (`--blue` #3d5a99): 경험이 쌓인 자리와 "지금"의 표시다. 아래 Blue Places Rule의 다섯 자리에만 쓴다. 흰 바탕에서 6.73:1이다.
- **손잡이 위·아래 파랑** (`--blue-hi` #5c74a9, `--blue-lo` #324a7d): 완료 칸의 볼록한 면을 만드는 그라데이션 끝 색이다. 다른 곳에는 쓰지 않는다.
- **길 줄 파랑** (`--blue-rail` #b1bdd6): 완료 칸에서 다음 완료 칸이나 진행 중 칸까지 잇는 6px 길과, 지금 채팅에 열린 대화의 타일 테두리다.
- **파랑 물** (`--blue-wash` #eff2f7): "진행 중" 칩의 바탕이다. 그 위 파랑 글자는 6.00:1이다.

### Neutral

- **잉크** (`--ink` #1a2233): 본문 글자, 칠한 버튼, 포커스 링, 캐럿이다. 흰 바탕 15.90:1. 칠한 버튼의 hover는 `--ink-hover` #2d3544다.
- **잉크 2** (`--ink-2` #444b59): 요약, 설명, 배너 본문, 고스트 버튼 같은 보조 글. 흰 바탕 8.76:1.
- **잉크 3** (`--ink-3` #5c626e): 메타 글, 이름표, 입력 자리 표시 글, 조용한 진행 상태. 가장 어두운 바탕에서도 4.5:1을 넘는다(흰 6.13, 사이드바 5.61, 사이드바 hover 5.11).
- **잉크 4** (`--ink-4` #7e828c): 조작의 테두리(버튼, 입력창, 입력 상자, 평가 칩 고리)와 목록 표시 같은 장식이다. 글자에는 쓰지 않는다. 흰 바탕 3.85:1, 사이드바 3.52:1.
- **선** (`--line` #e4e5e7)과 **진한 선** (`--line-2` #d0d2d5): 열 경계, 타일·카드 테두리, 구역 사이 1px 선, 잠긴 타일 점선, 아직 걷지 않은 길이다. 장식이고 조작 경계로 세지 않는다.
- **물** (`--wash` 잉크 5%, `--wash-2` #edeeef, `--wash-3` #f3f4f5): hover 면은 5%, 사용자 말풍선·개념 칩·가린 문자열은 wash-2, 보조 버튼 hover·가림 알림·코드 블록은 wash-3이다.
- **바탕**: 사이드바 `--bg-side` #f4f5f6, 가운데 길과 로그인 화면 `--bg-main` #f8f9f9(창 `backgroundColor`도 같은 값), 카드와 열의 면 `--surface` 흰색. 잉크 위 글자는 `--on-ink`다.
- **손잡이 면**: 진행 중 칸은 `--knob-now-top`에서 `--knob-now-bottom`으로, 잠긴 칸은 `--knob-off-top`에서 `--knob-off-bottom`으로 내려가는 면이다. 길의 칸에만 쓴다.
- **덮개, 스크롤바, 선택**: 대화 상자 덮개 `--scrim`(잉크 15%), 스크롤바 손잡이 `--scrollbar`(잉크 20%), 글자 선택 `--select`(잉크 10%).
- **아이콘 판 파랑** (`icon-tile` #5474bb): 작업 표시줄과 설치 파일 아이콘의 판에만 쓴다. `tokens.css`가 아니라 `scripts/build-icons.mjs`에 있고 앱 화면에는 나오지 않는다.

### Error

- **오류 빨강** (`--err` #b42318): 오류 배너의 제목, 대화 상자와 로그인 카드의 오류 글에만 쓴다. 흰 바탕 6.57:1.

### Contrast

글자는 4.5:1, 입력창·버튼의 경계와 아이콘은 3:1 이상이다. 실측 감사(14개 장면)의 최저값은 글자 5.28:1, 조작 경계 3.52:1(사이드바 바탕 위 `--ink-4`), 포커스 링 14.57:1이다. 이 기준에 못 미치는 곳은 모두 아래 예외 E1~E3에 적었고, 기준보다 진하게 둔 곳은 E4에 적었다.

### Named Rules

**The Blue Places Rule.** 파랑은 다섯 자리에만 쓴다. (1) 완료 칸: 파랗게 솟은 둥근 칸과 흰 체크. (2) 길: 완료 칸에서 다음 완료 칸이나 진행 중 칸까지 잇는 6px 실선. (3) 진행 중 칸의 2px 고리와 점 세 개. (4) "진행 중" 칩: 길의 타일과 필기 페이지의 요약 카드에 있다. (5) 지금 채팅에 열린 대화의 타일 테두리: 한 번에 많아야 하나이고, 진행 중 타일일 수도 있고 접힌 완료 타일일 수도 있다. 버튼, 링크, 포커스 링, 글자 선택, 아이콘 버튼, 사이드바, 채팅, 탭, 필기 페이지의 필기와 도구에는 쓰지 않는다. 탭과 요약 카드 줄의 작은 칸 그림은 길의 칸을 줄인 것이지만 파랑이 아니라 잉크 3이다. 실측 감사는 14개 장면 모두에서 이 다섯 자리 밖의 파랑을 0개로 쟀다.

**The One Ink Button Rule.** 색을 채운 버튼은 한 화면 상태에 하나이고 잉크색이다. 나머지는 테두리 버튼, 고스트 버튼, 링크다. 배너의 버튼은 모두 테두리 버튼이라 둘째 칠한 버튼을 만들지 않는다. 대화 상자가 열려 있으면 그 안의 하나만 센다. 카드를 만드는 중이나 답을 받는 중처럼 누를 일이 없는 상태에는 하나도 없다.

**The Red For Errors Rule.** 빨강은 오류 글에만 쓴다. 테두리, 바탕, 아이콘에는 쓰지 않는다. 호박·주황·초록·분홍은 데스크톱에서 쓰지 않는다(랜딩은 단계 색 세 개를 따로 쓴다).

## Typography

**Body Font:** Pretendard Variable (npm `pretendard`의 dynamic subset을 앱에 묶어 쓴다. 대체 글꼴은 Segoe UI, Malgun Gothic)

**Mono Font:** Cascadia Mono (대체 글꼴 Consolas)

**Character:** 한 가족의 글꼴에서 크기와 잉크 단계만 바꿔 위계를 만든다. 굵기는 400·500·600 세 단계뿐이다.

### Hierarchy

- **Logo** (600, 32px, line-height 1, -0.01em): 로그인 카드 로크업의 워드마크에만 쓴다. 사이드바 워드마크는 같은 모양에 16px이다.
- **Headline** (600, 20px, 24px 줄, -0.01em): 고정 막대의 과목명. 빈 화면의 제목도 같은 크기다(줄 높이 1.5).
- **Title Large** (600, 18px): 펼친 카드 제목(24px 줄), 대화 상자와 로그인 카드 제목(줄 높이 1.5).
- **Value / Quote** (16px): 고정 막대의 숫자(600, 고정폭 숫자), 펼친 카드의 "면접 한 마디"(500, 균형 줄바꿈).
- **Title** (600, 15px, 24px 줄): 타일 제목, 채팅 머리 제목, 잠긴 칸 말풍선 제목. 답변 속 제목도 같은 크기에 줄 높이 1.5다. 잠긴 타일 제목은 500에 잉크 3이다.
- **Body** (400, 14px, 1.5): 본문과 버튼 글(500). AI 답변은 줄 높이 1.6, 대화 상자와 로그인 설명은 1.65다.
- **Label / Meta** (13px, 20px 줄): 이름표와 칩은 500, 메타 줄·안내·진행 상태는 400이다. 앱에서 가장 작은 글자다.
- **Mono** (13px): 답변 속 코드와 가린 문자열(`***REDACTED***`)에만 쓴다.

줄바꿈은 `word-break: keep-all`이다. 제목은 `text-wrap: balance`, 문단은 `pretty`로 둔다. 경험 수, 고정 막대처럼 숫자를 세는 자리는 고정폭 숫자를 쓴다.

### Named Rules

**The Six Sizes Rule.** 글자 크기는 13·14·15·16·18·20px 여섯뿐이다. 로그인 로크업의 워드마크 32px(`--fs-logo`)는 로고의 일부라 이 여섯에 넣지 않는다(예외 E5).

**The Size-And-Grey Rule.** 위계는 크기와 잉크 단계로 만든다. 700 이상의 굵기는 쓰지 않는다. 워드마크도 600이다.

## Layout

Windows 창 하나에 고정된 데스크톱 화면이다. 기본 창은 1440×900(내용 1424×861), 최소 창은 1200×720(내용 1184×681)이다. 1440과 1280 폭(1280×800)에서 확인하고, 모바일 화면은 없다.

- **세 열**: 사이드바 248px, 가운데(가변, 길의 내용은 최대 640px, 양옆 24px), 채팅 380px. 열 사이에는 1px 선이 있다. 사이드바와 채팅은 접을 수 있고, 접으면 20px 띠(`--w-fold`)와 손잡이만 남아 가운데가 그 폭을 받는다.
- **머리줄**: 세 열이 높이 64px 띠 하나를 나눠 쓴다. 첫 줄(24px 줄, 띠 위에서 10~34px)에는 제목이나 큰 숫자, 둘째 줄(20px 줄, 34~54px)에는 그 이름표가 온다. 사이드바는 "Experii", 가운데는 탭(탭마다 "제목 / 이름표"), 채팅은 "대화 제목 / 과목 · 대화"다. 고정 막대("SQLD / 과목"과 "5 / 쌓인 경험")는 이 띠가 아니라 로드맵 탭의 첫 줄이라, 탭 머리 바로 아래에서 같은 64px로 붙어 다닌다. 첫 줄의 글자는 모두 20px 기준 줄 위에 앉아, 배율 100~200%에서 세 열의 기준선 차이가 0.00 장치 픽셀이다.
- **간격**: 4px 격자의 토큰(`--sp-1`~`--sp-10`: 4·8·12·16·20·24·32·40)만 쓴다. 묶음 안은 촘촘하게, 묶음 사이는 넉넉하게 둔다.
- **조작 높이**: 24(칩, 카드의 접기, 탭 닫기, 요약 카드의 펼치기, 필기의 출처 버튼과 지우기), 28(작은 버튼, 아이콘 버튼, 접기 버튼, ← → [+]), 32(버튼, 사이드바 과목 행, 채팅 머리 버튼, 보내기·멈추기), 36(입력창, 대화 상자 버튼, 도구 막대의 도구), 44(큰 버튼: 첫 과목 만들기, Continue with ChatGPT). 사이드바 경험 행과 탭은 두 줄 52px이다.
- **길의 기하**: 둥근 칸 56px, 길 6px, 칸과 타일 사이 20px, 칸 사이 12px.
- **확대**: Ctrl+= / Ctrl++ / Ctrl+- / Ctrl+0이 반 단계씩 확대·축소한다. 확대는 페이지가 1184×681 CSS px보다 작아지기 직전에서 멈추고, 창을 줄이면 맞는 단계로 내려온다(예외 E8).

### Named Rules

**The One Band Rule.** 세 열의 머리는 높이 64px 띠 하나다. 첫 줄은 제목이나 큰 숫자, 둘째 줄은 이름표다. 새 열이나 새 화면의 머리도 이 띠에 맞춘다.

**The 4px Rule.** 여백, 안쪽 여백, 간격은 4px 배수 토큰만 쓴다. 남겨 둔 1~2px 광학 보정 여섯 곳은 예외 E7에 적었다. 선 굵기, 윤곽선, 변형, 화살표 위치는 간격이 아니다.

## Elevation & Depth

평평한 흰 면이 1px 선과 옅은 그림자로 바탕에서 뜬다. 그림자는 잉크 색을 옅게 써서 아래로 퍼진다. 입체는 길의 둥근 칸에만 있다.

### Shadow Vocabulary

- **링** (`--ring`: 1px `--line` 테두리 그림자): 사이드바 선택 행, 배너, 로그인 카드의 윤곽.
- **sh-1** (`--sh-1`): 타일, 칠한 버튼, 사이드바 선택 행, 채팅 입력 상자, 배너.
- **sh-2** (`--sh-2`): 펼친 카드, 타일 hover.
- **sh-3** (`--sh-3`): 잠긴 칸 말풍선, 로그인 카드.
- **sh-4** (`--sh-4`): 대화 상자.
- **손잡이 깊이** (`--sh-knob-done`, `--sh-knob-pressed`, `--sh-knob-now`, `--sh-knob-off`, `--sh-knob-slot`): 둥근 칸의 아래 턱과 안쪽 그림자다. 누르면 칸이 2px 내려앉고 턱이 줄어든다. 빈 화면의 흐린 칸도 같은 깊이를 쓴다.

### Motion

- **시간**: `--dur-1` 100ms는 누름(버튼 97% 축소, 칸 2px 내려앉음)과 대화 상자·덮개의 열림, `--dur-2` 160ms는 hover와 상태 색, `--dur-3` 240ms는 카드 펼침이다. 곡선은 `--ease-out` 하나다.
- **카드 펼침**: 펼친 카드는 타일 높이의 그림자에서 2px 떠오르며 열린다. 글자는 흐려지지 않는다.
- **대화 상자**: 덮개가 100ms 페이드로, 상자가 98%에서 100ms로 커지며 열린다.
- **진행**: 스피너는 0.8초에 한 바퀴, 스트리밍 캐럿은 1초에 한 번 깜빡인다.
- **움직임 줄이기**: `prefers-reduced-motion: reduce`이면 모든 애니메이션과 전환을 끈다. 상태는 바로 바뀌고, 스피너는 하는 일을 적은 글 옆에 멈춰 선다.

### Windows 고대비

고대비에서는 링과 그림자, 손잡이 그라데이션이 사라진다. 그래서 둥근 칸은 2px 테두리와 불투명한 면을, 사이드바 선택 행·앞에 있는 탭·고른 도구·대화 상자·로그인 카드·배너는 1px 테두리를 얻는다. 길은 테두리로 그리므로 실선과 점선이 그대로 남는다. 이 테두리는 색 값 없이 시스템 색을 따른다(예외 E10).

### Named Rules

**The Knobs-Only Depth Rule.** 그라데이션, 안쪽 그림자, 아래 턱은 길의 둥근 칸과 빈 화면의 흐린 칸에만 있다. 타일, 카드, 버튼, 대화 상자는 1px 선과 옅은 그림자로만 뜬다.

**The Lift Rule.** 고른 항목은 색이 아니라 들어 올림으로 보인다. 흰 면, 링, sh-1, 굵기 500, `aria-current`가 함께 간다. 색 띠나 색 면으로 고름을 표시하지 않는다.

## Shapes

- **모서리 다섯 단**: `--r-1` 4px(인라인 코드, 가린 문자열 칩, STAR 글자 배지), `--r-2` 8px(버튼, 아이콘 버튼, 입력창, 사이드바 행, 가림 알림, 코드 블록), `--r-3` 12px(타일, 펼친 카드, 잠긴 칸 말풍선, 배너, 채팅 입력 상자, 사용자 말풍선), `--r-4` 16px(대화 상자, 로그인 카드), `--r-pill`(둥근 칸, 칩, 개념 칩, 아바타, 스피너, 진행 막대, 스크롤바 손잡이). 부품이 클수록 한 단계 크다.
- **말꼬리**: 사용자 말풍선은 오른쪽 아래 모서리만 4px이다.
- **화살표**: 펼친 카드는 왼쪽에서 둥근 칸의 가운데를, 잠긴 칸 말풍선은 위로 잠긴 타일을 가리킨다. 둘 다 1px 선을 두른 12px 사각형을 45° 돌린 것이다.
- **선의 뜻**: 1px 실선은 "있음", 점선과 점은 "아직"이다. 잠긴 타일은 점선 `--line-2`, 평가 전 칩은 점선 `--ink-4`, 아직 걷지 않은 길은 6px 점, 빈 화면의 첫 칸은 점선 고리다.
- **아이콘**: 24 격자의 한 가족이다. 둥근 끝과 이음, 획은 16px에서 1.5px, 20px에서 2px, 최대 2.5px다. 인라인 SVG로 그리고 색은 `currentColor`를 따른다.

### Named Rules

**The Dashed Means Not Yet Rule.** 점선과 점은 아직 오지 않은 것(잠긴 추천, 평가 전, 걷지 않은 길, 첫 칸 자리)에만 쓴다.

## Components

### Buttons

- **Shape:** 모서리 8px. 높이는 작은 28px, 기본 32px, 대화 상자 36px, 큰 44px이다. 글자는 14px 500(작은 13px, 큰 15px)이다.
- **Primary (칠한 버튼):** 잉크 면에 흰 글자, sh-1. hover는 `--ink-hover`, 누르면 97%로 줄어든다. 포커스는 면 안쪽 흰 테두리와 2px 잉크 링이라 칠한 면과 링이 붙지 않는다. 비활성은 wash-2 면에 잉크 3 글자다. 기다리는 동안(`aria-busy`)은 잉크 면을 지키고 스피너와 글을 단다. 화면 상태마다 하나다.
- **Secondary (테두리 버튼):** 흰 면, 1px `--ink-4` 테두리(3:1 이상), 잉크 글자. hover는 wash-3이다. 비활성은 `--line-2` 테두리에 잉크 3 글자다. 배너 버튼과 대화 상자의 [취소]가 이것이다.
- **Ghost (글자 버튼):** 면과 테두리 없이 잉크 2 글자, hover는 wash 면에 잉크 글자다. 카드의 접기, 대화 다시 열기, 카드 다시 만들기, 로그인 대기의 취소.
- **Icon button:** 28×28, 테두리 버튼과 같은 테두리. 채팅의 보내기·멈추기는 32×32다.
- **Link:** 잉크 13px에 `--ink-4` 밑줄(0.25em 띄움), hover에 밑줄이 잉크가 된다. 로그아웃, Manage usage에 쓴다. 파랗지 않다.
- **평가 버튼 쌍:** 고른 쪽은 2px 잉크 테두리와 체크 아이콘으로 보인다. 면을 칠하지 않는다. 테두리가 두꺼워져도 폭과 글자 위치는 그대로다.

### Chips

- **Style:** 24px 알약, 13px 500, 좌우 12px.
- **평가 칩:** 쓸 만해요는 wash-2 면에 잉크 글자, 아니에요는 `--ink-4` 실선 고리(예외 E4), 평가 전은 `--ink-4` 점선 고리다. 고리 칩은 면이 없다.
- **상태 칩:** "진행 중"은 파랑 물 면에 파랑 글자(파랑 자리 4). "카드 만드는 중"과 "다시 만드는 중"은 잉크 2 글자에 12px 스피너. "추천 · 잠김"은 기본 wash-3 면에 잉크 3 글자다.
- **개념 칩 (카드 안):** 높이 28px 이상 알약, wash-2 면, 잉크 2, 13px.

### Path (signature)

- **둥근 칸 (56px):** 완료 칸은 `--blue-hi`→`--blue`→`--blue-lo` 그라데이션에 손잡이 깊이와 흰 체크 24px. 진행 중 칸은 흰색에서 옅은 회색으로 내려가는 면에 2px 파랑 고리와 파랑 점 세 개. 잠긴 칸은 회색 면에 잉크 3 자물쇠다. 완료 칸만 키보드 순서에 들고, 진행 중·잠긴 칸은 옆 타일과 같은 일을 하므로 건너뛴다.
- **길 (6px):** 칸 가운데에서 다음 칸 가운데까지 이어진다. 완료 칸에서 다음 완료 칸이나 진행 중 칸까지는 `--blue-rail` 실선, 나머지는 `--line-2` 점이다.
- **타일:** 흰 면, 1px `--line`, 12px 모서리, sh-1, 안쪽 16·20px. hover에 sh-2로 뜬다. 첫 줄은 15px 600 제목과 오른쪽 칩이다. 완료 타일은 잉크 2 요약과 "면접 한 마디" 줄(위 1px 선, 13px 이름표, 14px 500 문장)을 둔다. 진행 중 타일은 위아래 12px이고 "n턴 대화 중 · 마치면 “경험으로 남기기”를 눌러 주세요"를 적는다.
- **지금 테두리:** 채팅에 열린 대화의 타일 하나가 `--blue-rail` 테두리를 얻는다(파랑 자리 5). 펼친 카드가 아니라 접힌 타일에만 그린다.
- **잠긴 타일:** 점선 `--line-2`, 면과 그림자 없음, 높이 56px 이상. 제목은 15px 500 잉크 3, 칩은 "추천 · 잠김"이다. hover와 펼침에 wash 면이 깔린다.
- **잠긴 칸 말풍선:** 흰 면, 1px 선, 12px 모서리, sh-3, 위를 가리키는 화살표. 15px 600 제목, "GPT가 추천한 다음 공부" 이름표, 잉크 2 이유, 테두리 버튼 [이걸로 시작].
- **빈 길:** 흐린 빈 길(점선 고리의 첫 칸, 70%와 40%로 옅어지는 칸 둘, 점 길) 옆에 20px 600 제목과 잉크 3 설명을 둔다. 과목이 없을 때는 [첫 과목 만들기](큰 칠한 버튼)가 그 화면의 하나뿐인 칠한 버튼이다.

### Stat Bar

- 로드맵 탭의 첫 줄로, 탭 머리 아래에 붙어 다니는 64px 띠, `--bg-main` 면, 아래 1px 선.
- 왼쪽은 과목명(20px 600) 아래 "과목" 이름표, 오른쪽은 숫자 셋이다. 숫자는 16px 600 고정폭이 첫 줄, 13px 잉크 3 이름표가 둘째 줄이다.
- "쓸 만해요 y/평가한 수"에는 이어진 진행 막대(56×4px 알약, `--line-2` 바탕, `--ink-2` 채움)가 숫자 옆에 붙는다. 파랑이 아니다(예외 E6). 화면 읽기 프로그램에는 "쓸 만해요 비율 n%"로 읽힌다.

### Tabs

- 가운데 열의 머리 띠(64px)다. 왼쪽부터 ← →(28px 글자 아이콘 버튼 둘), 로드맵 탭, 가는 세로 선, 필기 페이지 탭들, [+](새 대화, 채팅 머리의 [새 대화]와 같다)다. `--bg-main` 면에 아래 1px 선이고, 모두 위에서부터 걸려 있다.
- **탭:** 높이 52px(위아래 안쪽 4px, 24px 제목 줄 아래 20px 이름표 줄)라 글자가 머리 띠의 두 줄에 앉는다. 제목은 14px, 이름표는 13px 잉크 3이다. 로드맵 탭은 길 아이콘과 "과목명 / 로드맵", 페이지 탭은 작은 칸 그림과 "대화 제목 / 필기 N개 · 진행 중(카드가 있으면 날짜)"이다. 폭은 로드맵 120px 이상, 페이지 176~264px이다.
- **앞에 있는 탭:** 사이드바의 고른 행처럼 들어 올린다. 흰 면, 링, sh-1, 제목 굵기 500, `aria-current="page"`가 함께 가고, 색 띠나 색 면은 없다. 가리키면 wash 면이다. 고대비에서는 1px 시스템 색 테두리를 얻는다.
- **닫기:** 페이지 탭 오른쪽 안의 24px 글자 아이콘 버튼이다. 탭을 가리키거나 앞에 있거나 포커스가 있을 때만 보이고, 탭을 가운데 버튼으로 눌러도 닫힌다.
- **작은 칸:** 12px 원이다. 카드가 된 대화는 잉크 3으로 채우고 진행 중인 대화는 2px 잉크 3 고리다(파랑이 아니다).
- **넘침:** 페이지 탭이 폭을 넘으면 탭 줄만 막대 없이 옆으로 밀리고, 앞에 있는 탭이 보이게 밀린다. 포커스 링은 탭 안쪽(-2px)에 그린다.

### Open Card

- 타일 자리에서 그대로 펼쳐진다(모달 아님). 흰 면, 1px 선, 12px 모서리, sh-2, 둥근 칸을 가리키는 화살표, 좌우 20px.
- **머리:** 18px 600 제목, 평가 칩, 24px 고스트 [접기]가 둥근 칸의 가운데 줄에 선다. 제목 아래 줄에 "경험 카드 · 과목 · 날짜"(13px 잉크 3), 그 아래 잉크 2 요약.
- **본문:** 구역은 여백으로만 나눈다(선 없음). 구역 사이는 12px, STAR와 사실 묶음 앞은 16px이다.
  - 가림 알림: wash-3 면, 8px 모서리, 16px 방패 아이콘, 13px 500 잉크 2.
  - 면접 한 마디: 13px 500 잉크 3 이름표 아래 16px 500 잉크 문장.
  - STAR: 72px 이름표 열에 20px 글자 배지(S·T·A·R, wash-2, 4px 모서리)와 이름. 결과가 없으면 "(대화에서 결과를 확인하지 못함)"을 잉크 3으로 적는다.
  - 배운 개념 칩과 다음 할 일이 같은 이름표 열에 선다.
- **가린 문자열:** `***REDACTED***`는 본문 속 작은 코드 칩(wash-2 면, 4px 모서리, 고정폭 13px, 잉크 2)이다. 사용자의 말이 아니라 앱이 가린 것으로 읽힌다.
- **평가 줄:** 위 1px 선, "이 카드, 면접에 쓸 만한가요?"(14px 500)와 평가 버튼 쌍.
- **바닥줄:** 위 1px 선, "지시문 card-v1"(13px 잉크 3)과 고스트 버튼 [대화 다시 열기] [카드 다시 만들기].

### Note Page

- 대화 하나의 작업대다. 회색 점 격자 위에 필기가 놓이고, 카드 요약이 왼쪽 위에 고정된다. 이 장면에는 파랑이 없고(요약 카드의 "진행 중" 칩만 파랑 자리 4), 칠한 버튼은 채팅 머리의 [경험으로 남기기] 하나뿐이다. 도구, 확대, 놓을 자리, 알림은 모두 흰 면이나 테두리 버튼이다.
- **캔버스:** `--bg-main` 바탕에 `--line-2` 점 격자(24px, 확대를 따라 늘고 줄며 12px 밑으로는 두 배로 접는다)다. 점은 radial-gradient 무늬이고 입체가 아니다(예외 E12). 키보드 포커스는 안쪽 2px 잉크 링이다. 끌어 옮기기, 스페이스+끌기, Ctrl+휠 확대는 기능 그대로다.
- **필기:** 흰 면, 1px `--line`, 12px 모서리, sh-2, 안쪽 12·16px, 폭 264px(`--w-note`, `canvas.ts`의 `NOTE_W`와 같다)다. 글은 14px이고, 그 아래에 "Q2 · 오후 5:00" 24px 글자 버튼(13px 잉크 3, 누르면 채팅의 그 답으로 간다)이 있다. 오른쪽 위 모서리에 걸친 24px 둥근 지우기 버튼(`--ink-4` 테두리, sh-1)은 필기를 가리키거나 포커스가 있을 때만 보인다. 들고 옮기는 동안은 sh-3이고, 방금 놓인 필기는 wash-2에서 흰색으로 풀리며 내려앉는다.
- **요약 카드(핀):** 왼쪽 위 16px, 폭 328px, 타일 모양(흰 면, 1px 선, 12px 모서리, sh-2)이다. 첫 줄에 15px 600 제목, 칩(진행 중은 파랑 자리 4, 평가 전은 점선 고리, 만드는 중은 스피너), 펼치기 아이콘 버튼이 선다. 그 아래 13px 잉크 3 한 줄("〈과목〉 길 N번째 칸 · 질문 n개 · 필기 m개", 앞에 작은 칸 그림), 요약, "면접 한 마디", 맨 아래 줄에 평가 버튼 쌍이다. 카드가 없으면 요약 자리에 점선 상자("경험으로 남기면 이 대화로 카드를 만들어요")가 선다. 펼치면 같은 자리에 폭 380px의 카드 전체(Open Card)가 열리고, 길의 칸을 가리키던 화살표는 없으며, 페이지가 낮으면 카드가 안에서 스크롤한다.
- **다음 공부 정하기:** 오른쪽 위의 테두리 버튼(sh-1)이고, 누르면 같은 자리에 폭 320px(최소 248px)의 흰 면 패널(1px 선, 12px 모서리, sh-3)이 열린다. 15px 600 제목과 닫기 아이콘 버튼, 13px 잉크 3 설명, 추천마다 위 1px 선과 오른쪽에 [이걸로 시작]이 붙은 15px 600 제목과 13px 잉크 2 "근거 · …", 맨 아래에 전체 폭 테두리 버튼 [GPT와 상의해서 정하기]가 있다. 가운데가 711px 이하로 좁아져 카드와 나란히 서지 못하면 카드는 머리 줄만 남기고, 패널을 닫으면 돌아온다.
- **도구와 확대:** 아래 가운데의 도구 막대는 사이드바 회색 바탕에 1px 선, 12px 모서리, sh-3을 두른 두 칸짜리 선택 막대다(선택, 손). 고른 도구는 사이드바의 고른 행처럼 흰 면, 링, sh-1로 들어 올린다. 오른쪽 아래의 확대 묶음은 흰 면(1px 선, 12px 모서리, sh-2)의 "− 100% +"이고, 왼쪽 아래의 13px 잉크 3 안내는 폭이 760px 밑이면 숨는다.
- **놓을 자리:** 글을 끌어 오는 동안 가장자리에 `--ink-4` 2px 점선 틀이 서고, 포인터 아래에 놓일 필기의 점선 자리(`--ink-3` 2px, 흰 면)와 "여기에 놓으면 필기가 돼요"를 적은 이름표(흰 면, 1px 선, sh-2, 32px)가 따라온다. 아직 필기가 아니라서 점선이다(The Dashed Means Not Yet Rule).
- **알림:** 가운데 아래에 잠깐 뜨는 한 줄이다. 흰 면, 1px 선, 12px 모서리, sh-3, 높이 44px 이상이고, 되돌리기는 작은 테두리 버튼이다. 로드맵에는 도구 막대가 없어 더 낮게 선다.
- **채팅의 필기 표시:** 필기가 된 글은 `::highlight(noted)`로 wash-2 면이 깔리고(DOM은 그대로), 글을 고르면 곁에 작은 테두리 버튼 [필기에 추가](sh-3)가 뜬다.

### Sidebar

- `--bg-side` 면, 오른쪽 1px 선. 머리줄에는 워드마크 16px와 오른쪽 끝의 접기 버튼(28px 글자 아이콘 버튼, 워드마크 줄에 맞춘다)을 둔다.
- 구역 머리("과목", "〈과목〉에 쌓인 경험")는 32px 줄의 13px 500 잉크 3이다. 과목 머리의 + 아이콘 버튼은 과목이 하나라도 있을 때만 있다.
- **과목 행:** 32px, 이름과 오른쪽 경험 수(13px 잉크 3 고정폭). 과목 색 점은 없다.
- **경험 행:** 두 줄 52px. 24px 줄의 제목 아래 20px 줄의 "날짜 · 쓸 만해요/아니에요/평가 전". 평가 점은 없다. 새 카드를 만드는 동안에는 맨 위에 임시 행(제목, 스피너, "경험 카드를 만드는 중…", `role="status"`)이 생기고, 카드를 다시 만들 때는 그 행의 둘째 줄이 스피너와 "카드를 다시 만드는 중…"으로 바뀐다. 카드 글이 흘러 들어오면 제목이 먼저 바뀌고 요약이 제목 아래 13px 잉크 3으로 최대 두 줄 보인다.
- **상태:** hover는 wash 면, 고른 행은 들어 올림(The Lift Rule, 예외 E3).
- **첫 실행:** 사이드바에는 "아직 과목이 없어요"와 + 아이콘이 붙은 테두리 버튼 [과목 만들기] 하나만 둔다. 칠한 [첫 과목 만들기]는 가운데 빈 길에 있다.
- **계정 줄:** 맨 아래, 위에 1px 선. 32px 원 아바타("나", wash-2), 이름(500), "로그인됨"(13px 잉크 3), 링크 [로그아웃].

### Chat

- **머리:** 대화 제목(15px 600, 잘리면 전체 제목이 툴팁으로 나온다)이 첫 줄, "과목 · 대화"(13px 잉크 3)가 둘째 줄이다. 오른쪽 버튼은 두 줄의 가운데(띠 위에서 16~48px)에 32px로 선다: 테두리 [새 대화]와, 저장된 대화면 칠한 [경험으로 남기기]. 맨 끝에는 28px 접기 버튼이 서고, 머리의 오른쪽 안쪽 여백은 그만큼 줄어 8px다.
- **카드를 만드는 동안:** 채팅에 열린 대화의 카드를 만들고 있으면 머리 오른쪽에는 스피너와 "카드 만드는 중…"(13px 잉크 3, `role="status"`)과 테두리 [취소]만 둔다. [새 대화]는 카드가 나오거나 취소할 때까지 비켜서서 제목 자리를 지킨다. 그동안 새 대화는 사이드바의 과목 행이나 잠긴 칸의 [이걸로 시작]으로 열 수 있다. 이 상태에는 칠한 버튼이 없다.
- **날짜 구분:** "새 대화" 또는 "이어서 공부하는 중"(13px 잉크 3)과 양옆 1px 선.
- **말:** 사용자 말은 오른쪽에 wash-2 말풍선(최대 80%, 말꼬리 4px)이다. AI 답은 말풍선과 이름 없이 맨 글이고 줄 높이 1.6이다. 화면 읽기 프로그램에는 "ChatGPT"가 들린다.
- **마크다운:** 제목은 15px 600, 목록 표시는 잉크 4·잉크 3, 인라인 코드는 wash-2 면 4px 모서리, 코드 블록은 wash-3 면·1px 선·8px 모서리다. 줄은 쓴 대로 두고 긴 줄은 블록 안에서 옆으로 민다(SQL은 줄 모양으로 읽는다). 펜스에 언어가 있으면 블록 위에 13px 고정폭 잉크 3 이름표 줄이 선다. 표는 1px 선과 8px 모서리 상자 안에서 옆으로 밀리고(채팅 폭을 넓히지 않는다), 머리 줄은 wash-3 면에 굵기 600, 짝수 줄은 wash-3 줄무늬, 값은 13px 고정폭 숫자이며 NULL은 기울인 잉크 3이다. 인용은 1px `--line-2` 왼쪽 선과 잉크 2 글자. 링크는 누를 수 없는 맨 글자다(TSD O9).
- **도구 줄:** 답이 부른 도구는 답 글 위에 24px 알약(wash-3 면, 13px 잉크 3, 검색 아이콘)으로 한 줄씩 선다. 찾는 중이면 스피너와 잉크 2 글자, 실패하면 글자만 오류 빨강이고 면은 그대로다.
- **스트리밍:** 8×16px 잉크 캐럿이 깜빡이고, 보내기 버튼이 멈추기 버튼으로 바뀐다.
- **입력 상자:** 흰 면, 1px `--ink-4` 테두리, 12px 모서리, sh-1. 포커스는 상자 둘레의 2px 잉크 링이다. 비활성이면 `--line-2` 테두리와 wash-3 면이고 그림자가 없다. 아래 줄에 모델 고르기(28px 테두리 상자, 13px 500 잉크 2, 모델이 하나뿐이거나 답을 받는 중이면 `--line-2` 테두리로 잠긴다), "Using ChatGPT plan"(13px 잉크 3), 링크 [Manage usage]가 선다.

### Folding Panels

- 사이드바와 채팅은 머리의 접기 버튼(Ctrl+B, Ctrl+Shift+B)으로 접는다. 접으면 본문이 창 밖으로 미끄러져 나가고(`--dur-3`), 그 자리에는 폭 20px 띠가 자기 바탕(사이드바 `--bg-side`, 채팅 흰색)과 안쪽 1px 선으로 남는다.
- 띠 전체가 손잡이다. 16px 쉐브런(`--ink-4`)이 가운데에 서고, 가리키면 wash 면에 잉크 글자가 된다. 포커스 링은 안쪽에 그린다. 접힌 본문은 `inert`라 키보드가 들어가지 못하고, 접으면 포커스가 손잡이로, 펴면 접기 버튼으로 돌아간다.

### Banners

- 채팅 입력 상자 바로 위에 뜬다. 흰 면, 링과 sh-1, 12px 모서리, 안쪽 12·16px.
- 제목은 14px 600(오류면 빨강), 본문은 13px 잉크 2, 버튼은 작은 테두리 버튼이다. 칠한 버튼을 두지 않는다.
- 오류는 `role="alert"`, 안내는 `role="status"`다.

### Dialogs

- 덮개는 잉크 15%에 2px 흐림이다. 상자는 폭 440px, 16px 모서리, sh-4, 안쪽 24px다.
- 제목 18px 600, 설명 잉크 2(줄 높이 1.65), 입력 이름표 13px 500 잉크 3, 입력창 36px, 오류 글 13px 빨강.
- 버튼 줄은 오른쪽 정렬, 36px: 테두리 [취소]와 칠한 버튼 하나([만들기], [다시 만들기]).
- 열리면 첫 입력이나 버튼으로 포커스가 가고, Tab은 안에 갇히고, Escape가 닫고, 닫으면 연 버튼으로 포커스가 돌아온다.

### Sign-in

- `--bg-main` 바탕 가운데에 폭 400px 카드(16px 모서리, 링과 sh-3, 안쪽 위·옆 32px, 아래 24px).
- 로크업(아래 Logo) 아래 18px 600 제목, 전체 폭 큰 칠한 버튼 [Continue with ChatGPT].
- 기다리는 동안 칠한 버튼은 잉크 면을 지킨 채 스피너와 "브라우저에서 로그인을 마쳐 주세요…"를 달고, 아래 고스트 [취소]로 포커스가 간다.
- 그 아래 13px 잉크 3 안내, 1px 선 위의 13px 잉크 3 개인정보 문구. 오류 글은 13px 빨강 `role="alert"`다.

### Focus, Selection, Scrollbars

- **포커스 링:** 모든 바탕에서 2px 잉크, 2px 띄움(14.57~15.9:1). 입력창과 채팅 입력 상자는 테두리 위(-1px), 메시지 목록은 안쪽(-2px)에 그린다. 파랗지 않다.
- **선택과 캐럿:** 글자 선택은 잉크 10%, 캐럿은 잉크, 자리 표시 글은 잉크 3이다.
- **스크롤바:** 폭 12px, 홈과 버튼 없음. 손잡이는 스크롤 영역을 가리키거나 그 안에 포커스가 있을 때만 잉크 20%로 나타나고, 손잡이를 가리키면 더 굵은 `--ink-4`가 된다(예외 E1).
- **스피너:** 12px 고리, 2px `currentColor`, 한쪽이 빈다. 언제나 무엇을 하는지 적은 글 옆에 둔다.

### Logo and App Icon

- **쌓이는 E:** 세로 기둥(과목의 길)에 아래로 갈수록 긴 가로 막대 셋(경험 카드)이 붙는다. 마스터는 48 격자에 획 4(`M26 8H10V40H38M10 24H32`), 24·20·16px은 획 2의 따로 그린 그림이다(`assets/brand/mark.svg`, `mark-24.svg`, `mark-20.svg`, `mark-16.svg`). 둥근 끝과 이음, 앱 안에서는 `Logo.tsx`가 같은 길을 `currentColor`로 그린다.
- **사이드바:** 워드마크 "Experii"만 16px 600.
- **로그인 카드 로크업:** 마크를 위, 워드마크를 아래에 둔다. 마크는 20px 그림을 정확히 2배(40px 칸, 획 4)로 그리고 잉크 28px로 자른다. 카드 위 끝에서 마크 잉크까지 32px, 마크 잉크에서 대문자 윗선까지 16px이다(줄 상자 사이 12px). 워드마크는 32px 600, -0.01em.
- **가로 로크업 금지:** 마크와 워드마크를 옆으로 붙이지 않는다("E Experii"처럼 E가 두 번 읽힌다).
- **앱 아이콘:** `#5474bb` 판(모서리 = 크기×11/48) 위의 흰 마크, 마크는 판의 약 2/3. `npm run icons`(`scripts/build-icons.mjs`)가 `assets/icon.ico`와 `assets/icon.png`(256 판)를 만든다.
- **ICO 레이어:** 16·20은 판 없이 `#5474bb` 마크(16·20 그림), 24는 16 그림, 32는 20 그림, 40은 24 그림, 48은 24 판의 정확한 2배, 64는 32 판의 정확한 2배, 256은 마스터. 판의 대비는 밝은 작업 표시줄 4.12:1, 어두운 작업 표시줄 3.56:1, 판 위 흰 마크 4.57:1이다. `#3d5a99` 판은 어두운 작업 표시줄에서 2.42:1이라 쓰지 않는다.

### Window

- Windows 기본 제목 표시줄, 제목 "Experii". 밝은 테마로 고정하고(`nativeTheme.themeSource = 'light'`) 앱 메뉴가 없어 Alt를 눌러도 아무것도 뜨지 않는다.
- 첫 칠 전의 창 바탕은 `--bg-main`과 같다. 개발 실행에서도 창 아이콘은 `assets/icon.ico`다.
- 메뉴가 하던 단축키는 `src/main.ts`가 맡는다: 확대·축소(Ctrl+= / Ctrl++ / Ctrl+- / Ctrl+0), 전체 화면(F11). 새로 고침과 개발자 도구는 개발 실행에서만 된다.

## Do's and Don'ts

### Do:

- **Do** 색, 글자 크기, 모서리, 그림자, 간격을 `tokens.css`의 토큰으로만 쓴다. `tokens.css` 밖의 hex·rgb 리터럴과 TSX 안의 색·크기 리터럴은 0이다(그림 크기와 데이터 폭은 예외 E9).
- **Do** 새 화면과 새 부품에도 파랑 자리 다섯, 칠한 버튼 하나, 입체는 칸에만을 그대로 적용한다. 밤 기능 PR의 필기 페이지, 모델 드롭다운, 도구 표시, 표·코드 표시, 좌우 접기도 같다(`docs/plans/2026-10-30-desktop-design/ai.md` 2장). 규칙에 없는 새 색 자리나 새 배치가 필요하면 만들기 전에 창업자에게 묻는다.
- **Do** 머리는 64px 띠에 맞추고, 첫 줄에 제목이나 큰 숫자, 둘째 줄에 이름표를 둔다.
- **Do** 진행 상태는 12px 스피너와 하는 일을 적은 글(잉크 2나 잉크 3)로 조용히 알린다.
- **Do** 고른 항목은 들어 올리고(흰 면, 링, sh-1, 500, `aria-current`), 평가 전과 잠김은 점선으로 보인다.
- **Do** 오류 배너는 `role="alert"`, 안내 배너는 `role="status"`로 둔다.
- **Do** 새 화면은 1440과 1280 폭, Tab과 Shift+Tab 순서, Windows 고대비, 움직임 줄이기에서 확인하고, 글자 4.5:1과 조작 경계·아이콘 3:1을 잰다.

### Don't:

- **Don't** 버튼, 링크, 포커스 링, 글자 선택, 아이콘 버튼, 사이드바, 채팅에 파랑을 쓰지 않는다.
- **Don't** 빨강을 오류 글 밖에 쓰지 않는다. 호박, 주황, 초록, 분홍은 데스크톱에 없다.
- **Don't** 둥근 칸 밖에 그라데이션, 안쪽 그림자, 아래 턱을 두지 않는다.
- **Don't** 고름이나 강조를 색 띠(2px 이상의 왼쪽·오른쪽 테두리)나 색 면으로 보이지 않는다. 길의 6px 줄은 칸을 잇는 길이지 강조 띠가 아니다.
- **Don't** 테두리나 그림자를 가진 면 안에 또 테두리·그림자 면을 겹치지 않는다. 카드의 구역은 여백으로 나누고, 안쪽 묶음(가림 알림, 코드 블록, 사용자 말풍선)은 테두리 없는 옅은 면(wash-2, wash-3)으로만 둔다.
- **Don't** 700 이상의 굵기나 여섯 단 밖의 글자 크기를 쓰지 않는다(로그인 워드마크 32px만 예외).
- **Don't** 마크와 워드마크를 가로로 붙이지 않는다.
- **Don't** 어두운 테마나 메뉴 막대를 더하지 않는다(범위 밖). Aside, 듀오링고, 대시보드 상투에 대한 금지는 `PRODUCT.md`의 Anti-references를 따른다.

### Recorded Exceptions

규칙을 넘는 곳과 그 이유다. 숫자는 2단계 실측 감사와 4단계 수정에서 잰 값이다. 여기 없는 예외를 새로 만들지 않는다.

- **E1 스크롤바 손잡이 1.50:1.** 손잡이는 스크롤 영역을 가리키거나 포커스가 있을 때만 잉크 20%(합성색 #d1d3d6)로 나타나며, 흰 바탕과 `--bg-main`에서 1.50:1이다. 손잡이를 직접 가리키면 `--ink-4`로 3.85:1이 된다. 모든 스크롤 영역은 휠과 키보드로도 움직이고(메시지 목록은 포커스를 받는다), 손잡이는 위치를 알려 주는 표시라 3:1에서 뺐다.
- **E2 타일과 카드의 테두리 3:1 미만.** 길 바탕에서 `--line` 1.2:1(흰 바탕 1.26), 잠긴 타일 점선 `--line-2` 1.44:1, 채팅에 열린 대화의 테두리 `--blue-rail` 1.79:1(흰 바탕 1.89)이다. 타일은 글로 알아보고 타일 전체가 누르는 자리이며, 키보드 포커스는 2px 잉크 링(14.57~15.9:1)으로 보인다.
- **E3 사이드바 고른 행.** 색이 아니라 들어 올림이다. 흰 면 대 사이드바 회색 1.09:1, 링 1.15:1에 굵기 500과 `aria-current`가 더해진다. 창업자 결정("고른 항목은 흰 면, 윤곽선, 옅은 그림자로 들어 올린다")을 따르고, 색 띠는 craft floor가 금지한다. Windows 고대비에서는 1px 시스템 색 테두리를 얻는다.
- **E4 "아니에요" 칩의 고리 3.85:1.** 상태 칩은 글로 알아보는 표시지만 고리를 `--ink-4`(흰 바탕 3.85:1)로 둔다. 실측 감사가 테두리 있는 칩을 조작 경계로 세어 3:1을 요구하기 때문이다. `--line-2`로 되돌리면 1.51:1이 된다.
- **E5 `--fs-logo` 32px.** 로그인 로크업의 워드마크(`.gate-brand .wordmark`)에만 쓴다. 로고의 일부라 글자 크기 여섯 단에 넣지 않는다. 굵기는 600이라 굵기 예외는 없다.
- **E6 이어진 진행 막대.** 시안은 평가한 카드마다 16px 마디를 그은 끊긴 막대였다. 앱은 이어진 막대(56×4px)다. TSD D 명세의 "쓸 만해요 y/평가한 수와 진행 막대"(`docs/desktop/tsd.md` 817행)가 이 모양을 허용하고, 카드 수와 상관없이 같은 폭에 맞는다.
- **E7 4px 격자의 광학 보정 여섯 곳.** 아래만 1~2px 값을 남긴다. 새로 더하지 않는다.
  - `card.css` `.cv-redacted svg`의 위 여백 2px: 16px 방패 아이콘을 가림 알림 첫 줄(20px)의 가운데에 맞춘다. 시안도 2px다.
  - `card.css` `.card-view .redacted`의 위아래 안쪽 여백 1px: 줄 상자를 건드리지 않고 가린 문자열 칩의 면만 고정폭 글자 둘레로 넓힌다. 시안도 1px다.
  - `chat.css` `.md :not(pre) > code`의 위아래 안쪽 여백 1px: 답변 속 인라인 코드, 같은 이유다.
  - `controls.css` `.btn[aria-pressed='true']`의 좌우 안쪽 여백 11px: 고른 평가 버튼의 2px 테두리가 더한 1px를 돌려줘, 고를 때 버튼 폭과 글자 위치가 그대로다.
  - `path.css` `.stat .bar`의 위 여백 2px: 진행 막대의 가운데를 24px 줄 속 고정폭 숫자의 시각 중심에 맞춘다.
  - `tokens.css` `--band-pad` 10px(`.chat-head`, `.statbar`, `.side-brand`): 격자에서 2px 벗어나지만 두 줄 머리(24+20=44px)를 64px 띠 가운데에 둔다. 시안도 위 10px이고, 세 열의 기준선 차이는 배율 1~2에서 0.00 장치 픽셀이다.
- **E8 확대 한계(WCAG 1.4.4).** 키보드 확대는 페이지가 1184×681 CSS px 이상으로 남는 가장 큰 반 단계에서 멈춘다. 기본 창에서 120%, 최소 창에서 100%, 1920×1080 최대화에서 약 158%(폭 기준)다. 세 열이 폭을 지키게 하려는 한계이고, 200% 확대에는 좁은 배치(옆 열 줄이기, 고정 막대 다시 흘리기)가 필요해 창업자 결정을 기다린다.
- **E9 TSX 안의 크기.** 아이콘 16·20·24px과 로고 마크 40px(잉크 28px로 자름)은 픽셀에 맞춘 그림이라 토큰 밖이다. 진행 막대의 폭(%)은 데이터에서 나온다.
- **E10 Windows 고대비 블록.** `path.css`, `sidebar.css`, `dialog.css`, `chat.css`, `tabs.css`, `note.css`의 `@media (forced-colors: active)` 여섯 곳은 `currentColor` 테두리만 더하고 색 값을 쓰지 않는다. 둥근 칸의 면은 `var(--surface)`라 시스템이 Canvas 색으로 바꾼다.
- **E11 impeccable 검사.** `impeccable detect --json src/renderer` 정적 검사는 main을 합친 뒤에도 0건이다. 실행 중인 창의 `--cdp` 검사는 길·카드·채팅·로그인 11장면이 0건이었고, 새 화면(2026-11-01) 9장면에서는 두 가지를 보고했고, 모두 규칙 위반이 아니라 무시한다.
  - `flat-type-hierarchy`(advisory): 필기 페이지와 채팅 장면에는 20px 과목 제목이 없어 제목 15px 대 본문 14px(1.07배)로 읽힌다. 위계는 크기가 아니라 굵기 600과 잉크 단계로 만든다(Size-And-Grey Rule).
  - `text-occlusion`: "다음 공부 정하기" 패널이 그 밑의 필기를 덮는다. 떠 있는 패널이 캔버스 위에 놓이는 것이 설계이고, 패널을 닫으면 필기가 보인다.
  - 접는 패널의 가장자리 선을 `box-shadow`로 그렸을 때는 표가 "카드 안의 카드"로, 대화 제목이 "한 상자 안의 되풀이"로 읽혔다. 선을 1px 요소(`.pane::after`)로 바꿔 사라졌다.
- **E12 캔버스의 점 격자.** 필기 페이지의 바탕 점은 radial-gradient 무늬다. 그라데이션을 길의 칸에만 둔다는 규칙은 입체를 막으려는 것이고, 점 격자는 입체가 아니라 바탕에 박은 무늬라 예외로 둔다. 점의 크기와 자리는 화면 이동과 확대를 따라 `NotePage.tsx`가 CSS 변수(`--dot`, `--px`, `--py`)로 넘긴다.
- **E13 모델 고르기의 펼친 목록.** 접힌 모양(테두리, 모서리, 글자)은 토큰을 따르지만, 펼치면 나오는 목록은 `<select>`의 기본 목록이라 브라우저가 페이지 밖의 별도 창으로 그린다. 글꼴과 색은 따르지만 모서리와 그림자는 CSS로 바꿀 수 없다.
