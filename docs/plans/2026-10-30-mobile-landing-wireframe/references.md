# 레퍼런스: 폰에서 보드·필기 흐름을 움직여 보여 주는 방식

- 조사일 2026-10-30.
- 방법: 모두 간접 확인이다. 클라우드 세션의 네트워크 허용 목록 밖이라 서비스 사이트를 직접 열지 못했다(heptabase.com, aside.com, granola.ai, museapp.com, tldraw.com, mymind.com은 WebFetch에서 DNS 실패, figma.com·miro.com·notion.com·obsidian.md 등은 curl에서 프록시 403). 오류 안내에 따라 다른 사이트(land-book, godly, mobbin 포함)도 더 열지 않았다.
- 대신 WebSearch 결과 요약, 앱 스토어·리뷰·디렉터리 글, 공식 문서(W3C, NN/g), 개발자 글로 확인했다. 검색 요약에 원문이 인용된 것만 "확인(간접)"으로 적는다.
- 폰 폭(390px)에서의 실제 움직임, video 태그 속성(autoplay·loop·muted), 멈춤 버튼 유무는 어느 서비스도 확인하지 못했다. 직접 보려면 세션 네트워크 설정에서 위 도메인을 허용해야 한다.

## 사례

### 1. Granola (AI 노트, 데스크톱 + 모바일)
- 출처: https://www.granola.ai/ (검색 결과 제목), https://contra.com/p/l6ZQeUmR-granola-website-design-and-framer-development
- 첫 화면: 페이지 제목이 "The AI Notepad for back-to-back meetings". 제목이 짧고 대상(연속 회의하는 사람)을 바로 말한다. CTA 개수는 확인 못 함.
- 움직임: 확인 못 함. 사이트 제작 사례 글이 "첫 몇 초 안에 가치를 이해하게" 하는 것을 목표로 적었다는 것만 확인했다(Framer 제작).
- 폰 안내: macOS·Windows 데스크톱과 iOS·Android 앱이 있다(리뷰 여러 곳). 폰 방문자에게 어떤 버튼을 보이는지는 확인 못 함.
- 확인: 간접.

### 2. Heptabase (시각 노트·화이트보드)
- 출처: https://heptabase.com/ , https://heptabase.com/download , https://www.producthunt.com/products/heptabase
- 첫 화면: 검색 요약상 제목 "Master anything you learn"과 AI 리서치에 관한 한 줄. 날짜가 불확실해 현재 문구인지는 확인 못 함. Product Hunt 소개는 "The visual note-taking tool for learning complex topics".
- 움직임: 확인 못 함.
- 폰 안내: 다운로드 페이지가 MacOS(Intel·Apple Silicon), Windows, Linux, iOS, Android, Web Clipper를 한 화면에 나열한다(간접 확인). 홈에서 폰 방문자를 어떻게 보내는지는 확인 못 함.
- 확인: 간접.

### 3. Aside (AI Browser, 데스크톱 앱)
- 출처: https://piunikaweb.com/2026/09/14/aside-ai-browser-windows-release/ , https://go.tabbit.com/aside-ai-browser
- 첫 화면: 공식 문구는 확인 못 함. 소개 글들은 "로그인한 사이트 안에서 일하는 에이전트가 있는 Chromium 데스크톱 브라우저"로 설명한다. 한 가이드는 공개 사이트의 다운로드 버튼이 macOS용으로 표시된다고 적었다. 2026-09 기사는 Windows판 출시를 보도했다.
- 움직임, 폰 안내: 확인 못 함.
- 참고: 서비스 이름 + 기능 이름("AI Browser")을 붙여 부르는 방식은 Experii AI Board 이름 짓기의 출발점이다(human.md).
- 확인: 간접.

### 4. Napkin (napkin.ai, 글 → 도식)
- 출처: https://dataconomy.com/2024/08/27/what-is-napkin-ai-and-how-to-use-it , https://dev.to/proflead/how-to-use-napkin-ai-transform-text-into-visual-sketches-382o
- 첫 화면: 제목 "Get visuals from your text", 한 줄 설명 "Napkin turns your text into visuals so sharing your ideas is quick and effective", 버튼 "Get Napkin free" 하나(리뷰 글의 화면 설명, 2024년 기준).
- 움직임: 확인 못 함.
- 폰 안내: 웹 앱이라 해당 없음.
- 확인: 간접(2024년 글이라 현재와 다를 수 있다).

### 5. FigJam (Figma의 화이트보드)
- 출처: https://figma.com/figjam/online-whiteboard/ , https://www.figma.com/figjam/team-meetings/
- 첫 화면: 검색 색인상 "FREE ONLINE WHITEBOARDING" 머리말과 "Generate ideas, align on plans, and connect as a team…" 한 줄. CTA는 "Try FigJam for free"와 "See FigJam in action" 두 개로 보인다. 현재 페이지 문구인지 확인 못 함.
- 움직임: 확인 못 함.
- 폰 안내: 웹 앱이라 해당 없음.
- 확인: 간접.

### 6. Obsidian Canvas
- 출처: https://obsidian.md/canvas
- 첫 화면: "research, brainstorm, diagram, and lay out your ideas in unlimited space", 무료 핵심 플러그인이라는 안내(검색 요약). 검색 요약에서는 페이지 안 영상이 보이지 않았다. 영상 유무는 확인 못 함.
- 폰 안내: 확인 못 함(Obsidian은 데스크톱·모바일 앱이 모두 있다).
- 확인: 간접.

### 7. Muse (캔버스 앱, iPad·Mac)
- 출처: https://apps.apple.com/us/app/muse-tool-for-thought/id1501563902
- 첫 화면·움직임: museapp.com 홈은 확인 못 함. 앱 스토어 설명은 "Muse is a canvas for thinking", 한 캔버스에 글·이미지·PDF·링크를 둔다고 쓴다.
- 확인: 간접(앱 스토어만).

### 8. Miro
- 출처: https://miro.com/newsroom/introducing-innovation-workspace/
- 첫 화면: 2025-10 발표의 포지셔닝 "AI Innovation Workspace"만 확인했다. 홈 제목·CTA·움직임은 확인 못 함.
- 확인: 간접.

### 9. tldraw, Scrintal, mymind, Notion AI
- tldraw.com은 무료 온라인 화이트보드로 바로 쓰는 형태로 소개된다(https://flaviocopes.com/tldraw/). 랜딩이 따로 있는지는 확인 못 함.
- Scrintal은 "카드를 보드에 놓고 화살표로 잇는" 시각 노트로 소개된다. 홈 구성은 확인 못 함.
- mymind는 디자인 갤러리(https://www.footer.design/sites/mymind)에 실린 것만 확인했다. 홈 움직임은 확인 못 함.
- Notion AI 상품 페이지(https://www.notion.com/product/ai)의 현재 제목·영상은 확인 못 함.

### 10. 스크롤 연동 장면 넘김 사례 (노트 앱 밖)
- Apple AirPods Pro 상품 페이지: 스크롤 위치를 프레임 번호로 바꿔 canvas에 이미지 연속(복제 예제 기준 147장)을 그린다. 프레임을 미리 받아 둬야 끊기지 않는다. 작은 화면에서는 이미지 한 장으로 대체한다는 주장이 있으나 확인 못 함(https://css-tricks.com/?p=308477, https://github.com/Rachit-Pal/Apple-Scroll-Animation/blob/master/app.js).
- Framer 템플릿 "Saas ScrollSync Show"·"Sticky Scroll Reveal": 그림 패널 하나를 고정하고 옆 글 단계가 바뀔 때 그림을 바꾼다. 진행 표시를 같이 둔다(https://www.framer.com/marketplace/components/NLAcLPOOsCyypyXLCogP/).
- 단점(근거 있음):
  - NN/g: 스크롤 속도·방향을 바꾸는 스크롤재킹은 사용자 통제, 발견, 효율, 과업 성공을 해친다. 스크롤했는데 화면이 안 바뀌면 사용자가 당황한다. 목적이 있는 사용자일수록 참을성이 적다(https://www.nngroup.com/articles/scrolljacking-101/).
  - Baymard: 터치 기기에서 큰 안쪽 스크롤 영역은 사용자를 가둬 페이지 스크롤을 막는다(https://baymard.com/blog/inline-scroll-areas).
  - iOS Safari: 주소창이 접히고 펴질 때 `100vh`·`dvh` 높이가 바뀌어 고정 패널이 튀거나 scroll-snap이 원치 않게 넘어간다. 고정 패널은 `svh`가 안정적이라는 보고가 있다(https://bugs.webkit.org/show_bug.cgi?id=266835, https://bugs.webkit.org/show_bug.cgi?id=261185).

### 11. 폰·자동 재생 공통 제약
- WCAG 2.2.2(A등급): 자동으로 시작해 5초 넘게 움직이고 다른 내용과 함께 보이면 멈춤·정지·숨김 수단이 있어야 한다. 움직임 여러 개면 공통 컨트롤 하나를 권한다(https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide).
- `prefers-reduced-motion: reduce`이면 자동 재생 대신 정지 화면을 기본으로 보이라는 권고가 있다(https://specification.website/spec/accessibility/reduced-motion/).
- iOS 저전력 모드는 `muted playsinline autoplay` 영상도 자동 재생을 막고 재생 버튼을 덮어 보인다. `play()` 실패 시 포스터나 버튼으로 대체하라는 권고가 있다(https://bugs.webkit.org/show_bug.cgi?id=216887, https://discourse.webflow.com/t/autoplay-video-not-playing-on-low-power-mode/215057).
- 데스크톱 앱 안내 패턴: 휴대폰 번호·이메일로 다운로드 링크 보내기, QR, 기기에 따라 바뀌는 다운로드 버튼이 일반 패턴으로 정리돼 있다(https://www.apptamin.com/blog/app-download-button/). 위 노트 앱들이 폰에서 이 중 무엇을 쓰는지는 확인 못 함. Arc는 iPhone 앱을 "데스크톱의 동반 앱"으로 소개했다(https://www.slashgear.com/1518162/how-to-use-arc-browser-on-iphone/).

## 배울 점
1. 제목은 대상·쓰임을 한 줄로, 버튼은 하나. Granola "The AI Notepad for back-to-back meetings", Napkin "Get visuals from your text" + "Get Napkin free" 하나. → A·B·C 공통 첫 화면.
2. 움직임은 코드(CSS/JS)로 만든다. iOS 저전력 모드에서 영상 자동 재생은 보장되지 않는다. 회색 박스 콘티는 코드 애니메이션이 맞고, 첫 장면 정지 화면이 그대로 대체 화면이 된다. → A·B·C.
3. 5초 넘게 자동으로 움직이면 멈춤 버튼 하나를 둔다(WCAG 2.2.2). 움직임 줄이기 설정이면 정지 화면으로 시작한다. → A(히어로 아래 재생), C(장면 여러 개면 공통 컨트롤).
4. 장면 넘김은 "그림 고정 + 단계 글 + 진행 표시" 구조로 쓴다(Framer ScrollSync 계열). 스크롤 속도는 건드리지 않고, 고정 패널 높이는 `svh`로 잡는다. → B.
5. 데스크톱 앱은 폰에서 설치 버튼 대신 "링크를 보내 준다"로 안내한다. Experii는 출시 전이라 사전 신청 이메일 하나에 "Windows PC용, 출시되면 이 메일로 알린다"를 붙인다. → A·B·C 공통 CTA 문구.

## 따라 하지 않을 점
1. 스크롤 속도·방향을 바꾸는 스크롤재킹. NN/g 시험에서 통제감과 과업 성공을 떨어뜨렸다. 릴스에서 들어온 방문자는 빨리 훑는다.
2. Apple식 이미지 연속 canvas. 프레임 수십~수백 장을 미리 받아야 하고 폰 데이터·로딩 부담이 크다. 회색 박스 5장면에는 과하다.
3. `100vh`·`dvh`로 잡은 긴 sticky 구간. iOS 주소창 변화로 패널이 튀고 snap이 어긋난다는 보고가 있다. 5장면 × 1화면 높이를 넘기지 않는다.
4. 멈춤 버튼 없는 무한 반복. 5초를 넘으면 WCAG 2.2.2 위반이고, 글을 읽는 동안 시선을 계속 뺏는다.
5. 폰 화면에 "Windows 다운로드" 버튼 노출. 폰에서는 누를 수 없고 앱도 아직 배포 전이다.

## 시안 A·B·C에 주는 시사점
- A 보드 시연형: 히어로(짧은 제목 + 한 줄 정의 + 신청 버튼 하나) 바로 아래에 보드를 두되, 390×844 첫 화면 안에 보드 윗부분이 보이게 한다. 화면에 들어오면 5장면을 한 번 재생하고 마지막 장면(로드맵)에서 멈춘다. 멈춤·다시 보기 버튼 하나를 보드 모서리에 둔다.
- B 장면 넘김형: 보드 패널을 `svh` 기준으로 고정하고 아래 단계 글 5개가 지나가며 장면을 바꾼다. 스크롤 속도는 그대로 두고 진행 점 5개를 보인다. sticky 구간은 5화면 높이 이내로, 건너뛰기 링크를 둔다.
- C 이야기형: 상황·문제·해결 글 사이에 장면 1~2개짜리 짧은 움직임(5초 이하)을 넣는다. 5초 이하면 컨트롤이 필수는 아니지만 여러 개가 동시에 돌지 않게 화면에 들어온 것만 재생한다. 글이 주인공이라 첫 화면에는 움직임보다 문제 문장을 먼저 둔다.
