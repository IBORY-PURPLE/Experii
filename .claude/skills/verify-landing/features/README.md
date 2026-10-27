# Experii 랜딩 검증 지도

랜딩의 사용자 기능을 검증하는 기준 문서다. 앱을 조작하기 전에 이 색인을 읽고, 해당 기능 파일을 레시피로 쓴다.

## 기본 전제

- 프로덕션 빌드를 `http://localhost:3100`에서 띄운다. `node scripts/agents/verify-doctor.mjs`가 0 또는 2여야 한다.
- 사전 신청은 dry-run이다. `SIGNUP_WRITE_ENABLED`를 채우지 않는다.
- 분석은 `window.umami` 목으로 기록만 본다. 실제 Umami로 보내지 않는다.
- 이 검증이 띄우지 않은 서버(특히 :3000 개발 서버)는 조작하지 않는다.

## 조작 규칙

- 모든 레시피는 새 페이지(`page.goto('/')`)에서 시작한다.
- 접근 이름(role, name)과 id, data 속성을 우선하고, 좌표나 DOM 순서는 피한다.
- `html`에 `scroll-behavior: smooth`가 있으니 스크롤은 `scrollTo({ top, behavior: 'instant' })`로 한다.
- 데스크톱 기준 화면은 1440×900과 1280×800이다. 짧은 노트북 창은 1536×730, 1366×657, 1280×690이다.

## 증거와 생략 보고

- 사용자 동작과 그 결과 상태를 둘 다 찍는다. 마지막 화면 하나로는 부족하다.
- 증거마다 기능 ID와 진입 경로를 남긴다. `manifest.json`의 scene 이름이 그 역할을 한다.
- 갈 수 없는 경로는 시도한 명령과 충족되지 않은 전제를 적는다. 다른 경로로 대신 검증하고 통과라고 보고하지 않는다.

## 기능 파일 형식

H1 제목과 사용자에게 보이는 동작 한 문단으로 시작한다. 그 뒤에 H2 네 개를 이 순서로 둔다: `Sub-features`, `How to get to it (user POV)`, `Driving it with Playwright`, `Gotchas`.

## 기능

- [히어로 데모](./hero-demo.md): 자동 재생, 일시정지·다시 보기, 동작 줄이기, 짧은 창.
- [다운로드 가짜 문](./download-fake-door.md): 출시 전 안내, `download_click`, 이동·다운로드 없음.
- [섹션 4 직접 해 보기](./loop-stepper.md): 대화 → 과제(오답·정답) → 카드 저장 → 알림 → 카드 다시 열기.
- [사전 신청 폼](./signup.md): 필수 항목 오류, dry-run 완료, UTM 숨은 필드.
- [JS 없음](./no-js.md): 정지 화면 히어로, 세로 4단계, 일반 POST 제출.
