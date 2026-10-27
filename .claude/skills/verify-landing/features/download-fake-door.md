# 다운로드 가짜 문

`Windows 앱 다운로드` 버튼(히어로와 헤더)은 아직 앱이 없으므로 파일을 내려받지 않는다. 대신 "Experii 데스크톱 앱은 출시 전이에요." 안내를 띄우고 `download_click` 이벤트를 남기며, 안내의 `사전 신청하기`가 이메일 칸으로 보낸다.

## Sub-features

- `dl-notice` 버튼을 누르면 `#download-note`(role=dialog) 안내가 열리고 `사전 신청하기` 링크에 포커스가 간다.
- `dl-event` `download_click`이 `{ location: 'hero' | 'nav', variant }`로 한 번 기록된다.
- `dl-no-nav` 페이지 이동도 파일 다운로드도 없다.
- `dl-signup` 안내의 `사전 신청하기`를 누르면 `#signup`으로 가고 `#f-email`에 포커스가 간다.
- `dl-close` Escape나 `닫기`로 닫히고 포커스가 버튼으로 돌아간다.

## How to get to it (user POV)

- 히어로의 `Windows 앱 다운로드`(`#hero-cta [data-download="hero"]`)를 누른다.
- 헤더의 다운로드 버튼(`.nav [data-download="nav"]`)을 누른다. 폭 768px 이상에서만 보인다.

## Driving it with Playwright

Preconditions:

- Doctor가 0 또는 2다.
- `window.umami`를 기록용 목으로 바꾼다(`page.addInitScript`, `tests/e2e/download.spec.ts`의 `mockUmami`).

- **안내와 이벤트.** `npm --prefix landing run test:e2e:prod -- tests/e2e/download.spec.ts`. 클릭 뒤 `#download-note`가 보이고, 기록에 `['download_click', { location: 'hero', variant: 'h1' }]`가 있다. URL은 그대로이고 download 이벤트가 0개다.
- **증거 장면.** evidence의 `다운로드 버튼은 출시 전 안내를 연다` 장면이 `download-1440x900-notice.png`와 webm을 남긴다.

## Gotchas

- 안내는 popover다. Playwright 선택자 엔진은 `:popover-open`을 모르니 `page.waitForFunction`에서 `document.querySelector('#download-note:popover-open')`으로 확인한다.
- JS가 뜨기 전에 누른 클릭도 기록돼야 한다(`app/layout.tsx`의 인라인 스크립트). 이것을 고치면 `no-js.md`의 다운로드 경로도 같이 본다.
- 버튼 옆 `출시 예정` 표시는 창업자 결정 대기 항목이다. 지우지 않는다.
