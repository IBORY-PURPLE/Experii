# JS 없음

JavaScript가 꺼져 있어도 랜딩은 읽고 신청할 수 있다. 히어로 앱 창은 루프를 마친 마지막 장면으로 멈춰 있고, 섹션 4는 4단계가 세로로 모두 보이며, 폼은 일반 POST로 제출된다.

## Sub-features

- `nojs-hero` 히어로 창이 마지막 장면(`다시 본 날` ●●●, 카드 수 4)으로 멈춰 있고 재생 컨트롤이 없다.
- `nojs-stage` `#stage .panel` 4개가 모두 보이고 tabpanel 역할이 없다.
- `nojs-download` 다운로드 버튼이 출시 전 안내를 띄우고 Escape로 닫힌다.
- `nojs-form` 폼이 일반 POST로 제출돼 "신청됐어요."가 나온다.
- `nojs-phone` 폰 프레임 흔적(`[class*="phone" i]`)이 없다.

## How to get to it (user POV)

- 브라우저에서 JavaScript를 끄고 랜딩을 연다.

## Driving it with Playwright

Preconditions:

- Doctor가 0 또는 2다.

- **회귀.** `npm --prefix landing run test:e2e:prod -- --project=nojs`. nojs 프로젝트는 `javaScriptEnabled: false`, 360×780이다. 데스크톱 폭 테스트는 스펙 안에서 `setViewportSize`로 바꾼다.

## Gotchas

- nojs 프로젝트의 기본 뷰포트는 모바일 폭이다. 히어로 창 판정은 데스크톱 폭 테스트에서만 한다.
- 다운로드 안내는 JS 없이 popover 속성만으로 열린다. 이 경로를 바꾸면 `download-fake-door.md`도 같이 본다.
