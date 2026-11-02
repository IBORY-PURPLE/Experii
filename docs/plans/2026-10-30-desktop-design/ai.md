# 데스크톱 화면 디자인 통일: AI용 실행 계획

- **승인:** 2026-10-30 창업자. 1쪽 요약은 [human.md](human.md)다.
- **기준:** 사람이 본 것은 1쪽 요약이고, 실행 기준은 이 파일이다.
- **영역:** `apps/desktop/` 데스크톱 MVP v1. 기준 문서는 `docs/desktop/prd.md`, `docs/desktop/tsd.md`(특히 838행까지의 "D 화면 시안 결정")다.

## 0. 결정

| # | 질문 | 결정 | 근거 |
|---|---|---|---|
| 1 | B안 모양을 얼마나 바꾸나 | **일부.** 로드맵 칸의 눌리는 입체와 길은 지킨다. 타일·카드·버튼으로 번진 입체와 색은 걷어 낸다 | 답이 없어 추천안으로 갔다(planning-flow 3번) |
| 2 | 강조색 | **파랑 하나.** 화면의 주 색은 파랑(`#3d5a99` 계열)과 검정(잉크)뿐이다. 나머지는 흰색과 회색이다. 호박(card)과 초록(task)은 데스크톱 UI에서 뺀다. 빨강(err)은 오류 글에만 남긴다 | 창업자 원문: "강조색 호박은 제외하고 파랑만 두고 메인 색은 파랑과 검정으로만 진행하자". 빨강을 남긴 것은 해석이고, 창업자가 다르게 말하면 바꾼다 |
| 3 | 앱 이름 | **Experii**, 내부 ID `experii` | 창업자. TSD O12에 확정으로 적었다 |
| 4 | 디자인 도구 | 설치하고 쓴다 | 창업자: "무료 디자인 도구 깃허브에서 설치 후에 해당 스킬을 사용해서 개발 진행해줘" |
| 5 | 시안 | **화면 "길", 로고 "쌓이는 E"** | 창업자: "네, 길·E로"(2026-10-30). 내용은 TSD "디자인 통일 결정 (2026-10-30)" |

- **승인된 시안(구현 기준 그림):** 공유 노트 폴더 `desktop-design-pick/`에 둔다. 저장소에는 넣지 않는다.
  - 폴더: `C:\Users\chewo\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\side-session-notes\local_288f0e38-e3f0-44f4-882e-9754d397bd90\desktop-design-pick\`
  - `approved-path.html`(같은 폴더의 `font/`로 열린다)과 장면 캡처 `shots/path-{1440,1280}-s{1,2,3}.png`, 로고 사양 `logo-e.md`가 있다.
  - 시안과 다르게 가는 점은 다음과 같고, 시안보다 이 목록이 앞선다.
    - 잉크는 시안의 `#111827` 대신 랜딩·현재 앱과 같은 `#1a2233`이다. 회색 단계는 이 잉크에서 다시 뽑고 대비를 다시 잰다.
    - 카드 머리의 "경험 카드 · 과목 · 날짜"는 지우지 않고 제목 아래 줄로 옮긴다(TSD D 명세 문구 유지).
    - 글자 크기는 토큰 6종 이하로 줄인다(시안은 13·14·15·16·18·20·22의 7종).

- **랜딩과의 관계:** 랜딩은 단계 색 3개를 그대로 쓴다. 데스크톱만 파랑·검정으로 줄인다. 그래서 두 영역의 색이 한동안 다르고, 이 차이는 TSD에 적는다. 랜딩 파일은 이 계획에서 고치지 않는다.

## 1. 완료 조건

모두 통과해야 끝난다.

1. **시안 선택:** 창업자가 화면 방향 1개와 로고 1개를 내장 브라우저에서 골랐다. 결과는 TSD "D 화면 시안 결정" 절 끝에 "디자인 통일 결정 (날짜)"로 덧붙였다.
2. **디자인 규칙 문서:** `apps/desktop/DESIGN.md`(impeccable 형식, 앱 범위) 하나에 다음이 있다. TSD 3장 또는 D 절이 이 파일을 가리킨다.
   - 색, 글자 크기·굵기, 모서리, 그림자·고도, 간격, 조작 높이, 움직임 토큰
   - 부품 규칙
3. **숫자:** `apps/desktop/src/renderer/`에서 다음이 성립한다. 아래 "검사 명령"으로 확인한다.
   - `:root` 밖의 hex·rgb 리터럴 0
   - TS 안의 색 리터럴 0
   - `border-radius` 값은 토큰 6종 이하
   - `font-size`는 토큰 6종 이하
   - `font-weight`는 3종(로고 그림 제외)
   - `box-shadow`는 토큰만 쓴다
   - 간격은 4px 배수 토큰만 쓴다
4. **색 자리:**
   - 메인 화면에서 파랑이 보이는 자리는 DESIGN.md에 적은 "경험이 쌓이는 자리"뿐이다.
   - 색이 꽉 찬 버튼은 한 화면에 하나다.
   - 고른 항목, 평가 전, 잠김 표시는 한 가지 모양씩이다.
5. **접근성:**
   - 글자 대비 4.5:1 이상, 입력창·버튼 경계와 아이콘 3:1 이상
   - 모든 바탕에서 포커스 링이 보인다.
   - `prefers-reduced-motion`이면 움직임이 꺼진다.
   - 대화 상자는 포커스를 가두고, 닫으면 포커스를 되돌린다.
   - 안내 배너는 `role="status"`, 오류 배너는 `role="alert"`다.
6. **창 틀:**
   - 고른 방향의 제목 표시줄 방식이 적용됐다.
   - `nativeTheme.themeSource = 'light'`이다.
   - Alt 메뉴가 뜨지 않는다.
   - 개발 실행에서도 창 아이콘이 Experii 마크다.
7. **로고·아이콘:**
   - `assets/icon.ico`에 16·20·24·32·40·48·64·256 레이어가 있고, 16·20·24는 작은 크기용으로 따로 그렸다.
   - `packagerConfig.icon`과 `MakerSquirrel.setupIcon`을 넣었다.
   - `name`은 `experii`, `productName`은 `Experii`다.
   - `win32metadata`(CompanyName, FileDescription, ProductName)와 `appCopyright`를 채웠다.
   - 설치본에서 작업 표시줄, 시작 메뉴, Alt+Tab 아이콘을 밝은·어두운 테마에서 확인했다.
8. **impeccable 검사:**
   - `impeccable detect --json apps/desktop/src/renderer` 결과가 0건이거나, 남은 것마다 무시 사유를 DESIGN.md에 적었다.
   - dev:mock 창의 렌더 검사(`--cdp`)도 같다.
9. **회귀:** 다음이 모두 통과한다.
   - `npm --prefix apps/desktop test`, `run typecheck`, `npx oxlint`, `npx oxfmt --check`, `run package`, `npx playwright test`
   - 저장소 규칙의 `node scripts/agents/gates.mjs`(landing 기본, 백그라운드)
10. **창업자 확인:** 실제 Electron 창의 전후 스크린샷을 창업자가 봤고, PR은 창업자가 병합한다.

### 검사 명령 (3번 기준)

```bash
rg -n "#[0-9a-fA-F]{3,8}\b|rgba?\(" apps/desktop/src/renderer --glob '!tokens.css'
rg -n "border-radius:" apps/desktop/src/renderer/*.css | rg -v "var\(--r"
rg -o "font-size: [^;]+" apps/desktop/src/renderer/*.css | sort -u
rg -o "font-weight: [^;]+" apps/desktop/src/renderer/*.css | sort -u
rg -n "box-shadow:" apps/desktop/src/renderer/*.css | rg -v "var\(--sh|none"
```

## 2. 확인된 사실

### 현재 UI (main 62dcd01 기준, 리서치 감사에서 셈)

- **토큰:** `styles.css:1-32`의 변수 24개는 색 21개와 ease·글꼴뿐이다. 나머지는 모두 리터럴이다.
  - 모서리 36곳 13종, 그림자 11곳 9종
  - 글자 크기 51곳 9종(13px가 33곳), 굵기 31곳 8종(550~800)
  - 간격 119곳 21종(이 중 10종은 4px 배수가 아님)
- **버튼 12종:**
  - `.btn` `:842-855`, `.primary` `:857-861`, `.amber` `:863-868`(그림자 `#6f410c`), `.yes`·`.no` `:694-704`
  - `.bubble .btn.primary` `:761-765`(흰 바탕 반전), `.gate-card .btn` `:1201-1204`, `.send` `:1082-1102`, `.icon-btn` `:115-126`
  - `.link` `:307-315`, `.cv-fold` `:573-581`, `.knob` 3종 `:424-441`
- **선택 표현 3종:** `.subject[aria-current]` `:147-151`, `.exp` `:198-201`(hover와 같은 규칙), `.tile[aria-current]` `:466-469`
- **딱딱한 아래 그림자 7종:**
  - 칸 `:426`(`#2b4275`)·`:435`·`:441`
  - 타일 `:456`·`:468`, 카드 `:557`, 남기기 버튼 `:867`
  - 칸 그림자만 TSD 결정(`tsd.md:838`)이고, 나머지는 번진 값이다.
- **머리줄 어긋남:** 상태 막대 아래 선은 y=97, 채팅 머리는 y=71이다(`.statbar` `:325-336`, `.chat-head` `:814-820`).
- **접근성:**
  - 추천 말풍선 안 포커스 링 1.00:1, `.cv-fold` 링 1.24:1
  - `Dialog.tsx:9-31`에 포커스 가두기가 없다.
  - reduced-motion 규칙이 없다.
  - `.icon-btn`은 26px이다.
  - 입력 테두리 `#cfd6df`는 흰 바탕에서 1.46:1이다.
  - info 배너가 `role="alert"`다(`ChatPanel.tsx:99-101`).
  - 클릭되지 않는 AI 답 링크가 진짜 링크처럼 파랗다(`:982-984`).
- **창과 이름:**
  - `main.ts:51-60`에 `titleBarStyle`·`icon`이 없고, `backgroundColor`는 `#f2f4f7`(`:57`)이다.
  - `auth.ts:65` 로그인 완료 페이지에 `#1a2233`이 인라인으로 있다.
  - `package.json` name·productName이 `desktop`이다.
  - `forge.config.mts:11-16`에 `icon`이 없다.
  - exe는 Electron 기본 아이콘이고 LegalCopyright는 "2015 GitHub"다.
- **로고:**
  - 데스크톱은 글자 'Experii'뿐이다(사이드바 19/800, 게이트 22/800).
  - 랜딩의 `landing/app/icon.svg`는 결정 기록 없이 들어온 잉크 판 'E'다. 어두운 작업 표시줄에서 1.02:1이다.

### Aside 디자인 원리 (aside.com CSS와 히어로 앱 그림에서 실측)

- **이 값들은 원리로만 쓴다.** 토큰 이름·값 묶음, 로고, 글꼴(Geist·AsideDisplay), 아이콘(Central Icons), 문구, 하늘색은 가져오지 않는다.
- **색:**
  - 화면 대부분은 거의 검정 하나(`#090b0c`)의 농도와 중립 회색이다. 글자는 85%·55%·25% 3단이다.
  - 브랜드 색은 상태 표시(안 읽음 점, 단계 줄 링크)에만 쓴다.
  - 주 버튼은 거의 검정이고, hover 80%, 눌림 95% 축소다.
- **굵기:** 400·450·500·600이고 700 이상은 없다. 위계는 크기와 회색으로 만든다.
- **고도:**
  - 1px 실선 대신 0.5px 링(검정 10~15%)과 옅은 그림자(5~10%)를 쓴다. 사다리는 결과 카드 sm → 작업 카드 md → 입력 lg → 창 xl → 대화 상자 2xl이다.
  - Windows 100% 배율에서는 0.5px가 흐리니 1px·8~10%로 시작한다.
- **모서리:** 기준 10px × 1.4 사다리(8.4·11.2·16.8·22.4·33.6)와 알약이다. 부품이 클수록 한 단계 크다.
- **간격·높이:** 4px 격자, 높이 24·28·32·36·40/44, 아이콘 12·14·16·20, 사이드바 행 32px
- **선택 행:** 색이 아니라 "들어 올림"이다(흰 85%, 링, 그림자 md).
- **대화:** 사용자 말풍선은 회색 8%, 오른쪽 정렬이다. AI 답은 이름표·말풍선 없이 맨 글이다. 입력창 아래에 12px 회색 옵션 줄이 있다.
- **대화 상자:**
  - 덮개는 검정 15%에 흐림 4px이다.
  - 상자는 반경 최대 단계, 그림자 최대 단계다.
  - 100ms 페이드와 95% 확대가 붙는다. 버튼 줄은 오른쪽 정렬이다.
- **스크롤바:** 숨기고, 넘칠 때만 위·아래 페이드를 둔다.
- **빈 화면:** 로고를 옅게 찍는다. 작업 화면에는 로고가 거의 없다.
- **진행 상태:** 12px 스피너, 반짝이는 글자, 단계 줄로 조용하게 보여 준다.
- **Electron 45(Chromium 156):** `backgroundMaterial`(mica)과 `titleBarOverlay`를 쓸 수 있다. `corner-shape: superellipse`는 실제 창에서 확인하기 전에는 쓰지 않는다.

### 도구 (2026-10-30 설치)

- **impeccable 4.8.0** (`pbakaus/impeccable` @02523ae, Apache-2.0)
  - skill: `~/.claude/skills/impeccable`. 보조 에이전트 4개: `~/.claude/agents/impeccable-*.md`. 엔진 0.1.18: `~/.impeccable/bin`
  - 훅은 설치하지 않았다(수동 복사).
  - telemetry off(`~/.impeccable/config.json`). 방향 카탈로그 요청은 끄더라도 나간다.
  - 쓸 명령: `context`(세션마다 한 번), `document`, `extract`, `critique`, `audit`, `polish`, `quieter`·`typeset`·`layout`(필요할 때), `detect --json`
  - `live`·`generate`는 preload가 필요한 renderer라 쓰지 않는다.
  - UI를 고치기 직전에는 `reference/craft-floor.md`를 읽는다.
- **impeccable 문서 위치:**
  - `PRODUCT.md`·`DESIGN.md`는 `apps/desktop/`에 둔다. impeccable은 위로 올라가며 찾는다.
  - `PRODUCT.md`는 디자인 판단용 맥락(사용 장면, 톤, 금지 참조)만 담고, 첫 줄에 "요구사항·범위의 기준은 `docs/desktop/prd.md`다"를 적는다. 요구사항을 다시 쓰지 않는다.
  - 저장소 루트에는 impeccable 파일을 쓰지 않는다.
- **prototype** (`emilkowalski/skills` @a81dbca, MIT, `~/.claude/skills/prototype`)
  - 시안 3개를 "이름 붙은 축"으로 나누고, PICKER.md의 전환 막대를 그대로 쓴다.
  - 우리 규칙과 맞추는 법:
    - 표에는 추천을 넣지 않고, 추천과 이유는 표 밖에 한 줄로 쓴다(ui-change.md).
    - 시안은 scratchpad의 독립 HTML로 만들고 커밋하지 않으며, 고른 뒤 지운다.
    - `launch.json`에는 넣지 않는다.
    - 내장 브라우저가 `file://`를 조작하지 못하므로 127.0.0.1 임시 정적 서버로 띄운다.

### 로고·아이콘 요구 (리서치)

- **ICO:** 레이어 16·20·24·32·40·48·64·256. 16·20·24는 픽셀 격자에 맞춘 별도 그림으로, 획 2px 이상, 틈 1px 이상이다.
- **원본과 생성 순서:** SVG 원본 → `@resvg/resvg-js`로 PNG → `png-to-ico`
- **패키저·설치 설정:** `packagerConfig.icon`은 확장자 없이 적는다. `MakerSquirrel`의 `name: 'experii'`, `setupIcon`을 넣는다.
- **앱 및 기능 아이콘:** `iconUrl`에 공개 https 주소가 필요하다. 지금은 없다(랜딩 작업으로 넘김).
- **대비:** 밝은(`#f3f3f3`)과 어두운(`#202020`) 작업 표시줄 양쪽에서 3:1 이상이어야 한다.
  - 잉크 판은 어두운 쪽에서 1.02:1이다.
  - 흰 판에 잉크 마크, 또는 밝힌 파랑 판에 흰 마크로 간다.
- **인앱 마크:** 인라인 SVG(`currentColor`)로 두어 CSP를 그대로 둔다. Aside 마크와 닮은 원형 링 실루엣은 피한다.

### 다른 작업과 겹침

- **로그인 작업(siwc-login):** PR #9로 main에 병합됐다(`b6e4ce5`, 2026-10-30 저녁). 병합 전에는 커밋 `0f1741f`가 로컬 브랜치 `claude/desktop-siwc-login-25d38c`에만 있었고, 아래 목록과 순서는 그때 정한 것이다.
  - main 쪽: `auth.ts`(251줄), `session.ts`, `handlers.ts`, `responses.ts`, `db.ts`, `pkce.ts`, `tokens.ts`, `idtoken.ts`(신규)
  - renderer: `App.tsx`는 `signIn`·`signOut`·`relogin`·배너 동작만, `Gate.tsx`는 오류 문구 표에 5줄을 더했다. 화면 모양(JSX·class·CSS)은 바꾸지 않았다.
  - 공유·preload: `preload.ts`, `shared/api.ts`, `shared/ipc.ts`, 테스트
- **순서(2026-10-30 바꿈):**
  - 처음 계획은 "로그인 작업이 main에 합쳐진 뒤 2단계 시작"이었다.
  - 로그인 커밋을 보니 renderer 변경이 동작과 문구뿐이라 화면 모양 작업과 같은 줄을 고치지 않는다. 그래서 2단계를 main `a7dde52`에서 바로 시작한다.
  - 대신 로그인 커밋이 바꾼 파일 중 `auth.ts`와 main 쪽 파일, `preload.ts`, `shared/*`는 이 작업에서 고치지 않는다. `auth.ts` 완료 페이지 색은 로그인 작업이 합쳐진 뒤 따로 맞춘다.
  - `App.tsx`·`Gate.tsx`는 로그인 커밋이 바꾼 함수와 오류 표 밖의 JSX만 고친다. 먼저 합쳐지는 쪽 뒤에 오는 쪽이 충돌을 푼다.
- **병합 뒤(2026-10-30 저녁):** 로그인 작업이 PR #9로 main에 들어왔고(`b6e4ce5`), 이 브랜치에 main을 합쳤다. 위 제한은 풀렸다. 로그인 동작(`signIn`·`signOut`·토큰·세션)은 그대로 두고 화면 모양만 고친다. `auth.ts` 로그인 완료 페이지의 인라인 색도 이 작업에서 토큰 값에 맞춘다.
- **밤 기능 PR(2026-10-30 밤, 창업자 결정):** 다른 세션들이 main 위에서 기능 PR을 따로 만들고, 아침에 이 브랜치보다 먼저 병합한다. 계획은 [PR #10](https://github.com/IBORY-PURPLE/Experii/pull/10)의 `docs/plans/2026-10-30-overnight-desktop/ai.md`다.
  - 겹치는 파일: `Markdown.tsx`, `App.tsx`, `Sidebar.tsx`, `ChatPanel.tsx`, `Roadmap.tsx`, `CardView` 주변, `styles.css`, 새 화면(필기 페이지), `package.json`·`package-lock.json`(remark-gfm과 캔버스 라이브러리 1개를 더한다). `docs/desktop/tsd.md`는 머리 단락, v1 범위 줄, 3.6 모델 줄만 바꾸고 열린 항목(O9~O13)과 파일 끝은 건드리지 않는다.
  - 오늘 밤에는 기능 세션들의 브랜치를 이 브랜치에 합치지 않는다. 남은 수정은 TSX를 꼭 필요한 줄만 고쳐 충돌을 줄인다.
  - 아침에 기능 PR들이 main에 들어가면 이 브랜치가 main을 합치고 충돌을 푼다(뒤에 오는 쪽이 푼다).
    - `styles.css`: 이 브랜치는 이 파일을 지우고 `styles/*.css`로 나눴으므로 수정/삭제 충돌이 난다. main이 더한 규칙을 맞는 구역 파일로 옮기고 값은 토큰으로 바꾼다.
    - 새 화면과 새 부품(필기 페이지, 모델 드롭다운, 도구 표시, 표·코드 표시, 좌우 접기)은 DESIGN.md 규칙(파랑 자리, 칠한 버튼 하나, 입체는 칸에만)을 그대로 적용한다. 규칙에 없는 새 배치나 새 색 자리를 정해야 하면 멈추고 묻는다.
    - `package-lock.json`: main 쪽을 받은 뒤 Terminal 패널에서 `npm install`로 다시 만든다.
    - 합친 뒤 1장 9번 회귀와 전후 스크린샷을 다시 한다.

## 3. 단계별 작업

### 1단계: 시안 (지금 진행, 코드 변경 없음)

- **입력:**
  - 이 파일 0·2장
  - B안 명세 `tsd.md:793-838`
  - D 단계 B 스크린샷(공유 노트 `desktop-d-shots/`)
  - 현재 화면 스크린샷(증거 브랜치 `claude/ev-desktop-m2-impl`, `m3-impl`)
  - Aside 캡처
- **화면 방향 3개:** prototype 규칙대로 축이 서로 다르다. 셋 다 지키는 것은 같다: B 3단 배치와 정보 순서, 칸의 입체, 파랑·검정만.
  - **길:** 표현 축. 큰 입체 칸과 길이 주인공이고, 파랑을 길에 모은다.
  - **시트:** 배치 축. 칸과 길을 가늘게 줄이고, 펼친 카드를 흰 시트로 띄워 카드가 주인공이 된다.
  - **창:** 크롬 축. 사이드바와 머리줄을 창 틀과 하나로 합친다(`titleBarOverlay` 상상도). 가운데와 오른쪽은 흰 시트 한 장으로 두고, 가장 절제한다.
- **장면:** 방향마다 같은 3장면을 Windows 창 틀(제목 표시줄, 최소화·최대화·닫기)까지 그린다.
  - 카드를 펼친 메인
  - "카드를 다시 만들까요?" 대화 상자
  - 첫 실행 빈 화면
- **로고 3방향:** 단색(검정)을 먼저 만들고, 파랑 변형을 둔다. 원형 링 실루엣은 쓰지 않는다.
  - **쌓이는 E:** 세로 기둥(길)에 가로 막대 셋(쌓인 카드)
  - **말이 카드로:** 말풍선 꼬리가 카드 모서리가 된다.
  - **ii 길:** 두 i의 점이 길 위의 칸이고, 둘째가 한 단계 높다.
  - 크기마다 확인한다: 16·20·24·32·48·256, 사이드바 로크업, 게이트 카드, 빈 화면 워터마크, 밝은·어두운 작업 표시줄 모형.
- **산출물:** `scratchpad/design-drafts/`
  - `screens.html`: picker와 iframe으로 세 방향을 넘겨 본다.
  - `dir-path.html`, `dir-sheet.html`, `dir-frame.html`
  - `logo.html`: picker로 세 로고를 넘겨 본다.
  - `font/PretendardVariable.woff2`
- **방법:**
  - 방향 3개와 로고는 하위 에이전트 4개가 나눠 만든다(병렬 가능).
  - 만들기 전에 impeccable `reference/craft-floor.md`를 읽고, 만든 뒤 `impeccable detect --json <파일>`로 검사한다.
  - 이어서 비판 에이전트가 규칙 위반을 찾는다: 파랑·검정 밖의 색, B 배치 변경, Aside 복제, 색만 다른 변형.
- **검증:**
  - 내장 브라우저에서 1440과 1280 폭으로 열고, 콘솔 오류가 0인지, 세 장면을 모두 볼 수 있는지 확인한다.
  - 장면별로 스크린샷을 찍는다.
- **사람 차례:**
  - 창업자가 방향 1개와 로고 1개를 고른다.
  - 섞으라고 하면 섞은 안을 다시 띄운다.
  - 고르면 시안 파일을 지우고 TSD에 결정을 적는다.

### 2단계: 규칙과 화면 통일

- **브랜치:** worktree `.claude/worktrees/desktop-design-system`, 브랜치 `claude/desktop-design-system`(main `a7dde52`에서 시작, upstream 없음). push는 `git push origin HEAD:refs/heads/claude/desktop-design-system`로만 한다.
- **할 일:**
  1. **impeccable 준비:** `context --target apps/desktop/src/renderer/App.tsx`를 실행한다. 이어서 `apps/desktop/PRODUCT.md`(맥락만)를 쓰고 `document`를 돌려 `apps/desktop/DESIGN.md`를 만든다. 이때 고른 방향을 기준으로 다시 쓴다(지금 우연히 굳은 값을 규칙으로 올리지 않는다).
  2. **토큰:** `src/renderer/tokens.css`를 만든다.
     - 색: 잉크·회색 3단·파랑과 옅은 파랑·err
     - 모서리 6단, 고도 5단(그림자), 글자 크기 6단, 굵기 3종
     - 간격 4px 단계, 조작 높이 24·28·32·36·44, 움직임 시간·곡선
     - 호박·초록·remind 토큰은 데스크톱에서 지운다.
     - `main.ts` `backgroundColor`, `format.ts` 과목 색, `auth.ts` 완료 페이지 색을 토큰 값과 맞춘다(과목 색 점은 회색 또는 파랑 농도로).
  3. **부품 순서:** 주인공부터 한다.
     - 펼친 카드(`CardView`: 상자 겹침을 줄이고 파랑은 정해 둔 자리에만)
     - 로드맵(칸·타일·상태 막대·잠긴 칸 말풍선, 입체는 칸에만)
     - 대화(말풍선·마크다운·입력창·옵션 줄·배너)
     - 버튼 4종(주=검정 또는 파랑 하나, 보조, 글자만, 위험)과 아이콘 버튼
     - 칩, 입력창, `Dialog`(포커스 가두기·되돌리기, 덮개 토큰, 열림 움직임), `Gate`, 사이드바 행(고른 항목 한 모양), 스크롤바, 아이콘(공개 라이선스 세트 하나를 인라인 SVG로, 획 하나)
  4. **창 틀:** 고른 방향대로 적용한다.
     - `titleBarStyle`·`titleBarOverlay`(색은 토큰)
     - `nativeTheme.themeSource = 'light'`
     - `Menu.setApplicationMenu(null)`
     - 머리줄 3구역 높이를 하나로 맞춘다.
  5. **다듬기:** 부품마다 impeccable `polish`(필요하면 `quieter`·`typeset`·`layout`)를 돌린 뒤 `detect`로 확인한다.
- **검증:**
  - 부품마다 dev:mock 창에서 전후 스크린샷을 찍는다(Playwright `_electron`).
  - e2e 선택자가 바뀌면 테스트를 같이 고친다.
  - 1장 3·4·5번 검사를 통과해야 한다.
- **사람 차례:** 화면별 전후 비교를 창업자가 본다.

### 3단계: 로고·앱 아이콘

- **원본:** `apps/desktop/assets/brand/`에 둔다: `mark.svg`, `mark-16.svg`, `mark-24.svg`, `lockup.svg`
- **생성:** `apps/desktop/scripts/build-icons.mjs`로 만든다(devDependencies `@resvg/resvg-js`, `png-to-ico`, 정확한 버전). 결과는 `assets/icon.ico`, `assets/icon.png`다.
- **설정:**
  - `forge.config.mts`: `packagerConfig.icon='assets/icon'`, `appCopyright`, `win32metadata`, `MakerSquirrel({ name: 'experii', setupIcon: 'assets/icon.ico' })`
  - `package.json`: `name: 'experii'`, `productName: 'Experii'`
  - 개발 실행에서만 `BrowserWindow.icon`을 지정한다.
- **인앱:** `Logo.tsx`(인라인 SVG). 사이드바 머리와 게이트에 같은 로크업을 두고, 빈 화면에는 옅은 마크를 둔다.
- **검증:**
  - Terminal 패널에서 `npm run make`를 실행한다(TSD 6장 함정 1).
  - 설치한 뒤 작업 표시줄, 시작 메뉴, Alt+Tab, 제목 표시줄을 밝은·어두운 테마와 100·125·150% 배율에서 확인한다.
  - 아이콘이 바뀌지 않으면 `ie4uinit.exe -show`를 실행한다.
- **사람 차례:** 창업자가 설치해서 확인한다.
- **TSD와 겹침:** TSD M4(설치본)와 겹치므로, 설치본 단계는 이 결과를 쓴다.

### 4단계: 검증과 PR

- **impeccable:**
  - `audit`, `critique`(renderer)
  - dev:mock 창을 원격 디버깅 포트로 띄워 `detect --cdp <port> --json`을 돌린다. 개발 창에서만 하고, 실제 로그인 정보가 있는 창에서는 하지 않는다.
- **회귀:** 1장 9번 전체
- **PR:**
  - 브랜치 `claude/desktop-design-system`, base는 main
  - 본문 순서: 핵심 정리 → 전후 스크린샷(`node scripts/agents/publish-evidence.mjs`) → Why / What changed / Scope / Blast Radius / Verification → 완료 조건 표
  - 병합은 창업자가 한다.
  - 병합 순서: 밤 기능 PR들이 먼저다. 이 PR은 그 뒤 main을 합쳐 충돌을 풀고(2장 "다른 작업과 겹침") 회귀를 다시 통과한 다음 병합한다. 본문에 이 순서를 적는다.

## 4. 멈춤 조건

- 고른 안이 B 3단 배치나 PRD 기능을 바꾸면 멈추고 묻는다.
- 로그인 동작(`signIn`·`signOut`·토큰·세션 처리)이나 오류 문구를 바꿔야 할 일이 생기면 멈추고 묻는다. 이 작업은 화면 모양만 바꾼다.
- 범위·비용이 human.md와 달라지면(새 화면, 새 기능, 유료 도구) 멈추고 묻는다.
- impeccable이 저장소 루트에 파일을 쓰거나, 훅 설치나 원격 이미지 생성을 권하면 따르지 않는다.
- 같은 검사가 3번 연속 실패하면 멈추고 보고한다.

## 5. 위험과 대응

| 위험 | 대응 |
|---|---|
| 데스크톱과 랜딩의 색·로고가 한동안 다르다 | TSD에 적는다. 랜딩은 마크가 확정된 뒤 별도 작업으로 한다 |
| 회색 일색이 되어 Experii답지 않다 | 칸의 입체와 길을 지키는 자리로 둔다. 완료 조건 4번과 이름 가림 시험을 창업자 확인에 넣는다 |
| 0.5px 링, 스쿼클이 Windows에서 흐리거나 안 된다 | 1px·8~10% 링, 일반 `border-radius`로 시작한다 |
| 앱 및 기능 아이콘이 비어 보인다(`iconUrl` 없음) | 알려진 한계로 적는다. 랜딩에 공개 주소가 생기면 넣는다 |
| e2e 선택자가 깨진다 | class 대신 역할·이름 선택자를 쓰고, 고친 테스트를 같은 커밋에 둔다 |

## 6. 범위 밖

- 랜딩 파일: 파비콘, 헤더 워드마크, OG, 창 목업, `iconUrl` 호스팅
- 어두운 테마, 새 기능, MSIX
- impeccable `live`·`generate`, 이미지 생성

## 7. 진행 기록

| 날짜 | 단계 | 결과 | 근거 |
|---|---|---|---|
| 2026-10-30 | 결정 | Q1 일부(기본), Q2 파랑·검정, Q3 Experii, Q4 설치 | 창업자 대화 |
| 2026-10-30 | 도구 설치 | impeccable @02523ae(skill, 에이전트 4, 엔진 0.1.18, telemetry off, 훅 없음), prototype @a81dbca | Terminal "design skills" 탭 출력 |
| 2026-10-30 | TSD O12 | Experii 확정으로 적음 | `docs/desktop/tsd.md` 645행 |
| 2026-10-30 | 1단계 시안 | 화면 방향 3개(길·시트·창)와 로고 3안 완성. 빌더 4 → 비평 2 → 수정 4. 비평의 꼭 고칠 것은 모두 반영. detect 남은 지적은 길·시트·로고 0건, 창 5건(창틀 cramped-padding 4, flat-type-hierarchy 1, 둘 다 사유 기록). 색은 파랑·잉크·무채색만, 장면마다 칠한 버튼 1개, 1440·1280 콘솔 오류 0. 창업자 선택 대기 | 워크플로 wf_27b80a6b-3c8 결과, scratchpad `review/` 장면 캡처 |
| 2026-10-30 | 1단계 선택 | 창업자가 화면 "길", 로고 "쌓이는 E"를 골랐다. TSD D 절 끝에 결정을 적었다. 승인 시안과 로고 사양은 공유 노트 `desktop-design-pick/`에 남기고 나머지 시안·임시 서버는 지웠다 | 창업자 대화 "네, 길·E로" |
| 2026-10-30 | 순서 변경 | 로그인 커밋 `0f1741f`가 아직 main에 없지만 renderer 변경이 동작·문구뿐이라 2단계를 main `a7dde52`에서 시작한다. 겹치는 파일 규칙은 2장 "다른 작업과 겹침"에 적었다. 목표·범위·비용은 그대로다 | `git diff a7dde52...0f1741f -- apps/desktop/src/renderer` |
| 2026-10-30 | 2단계 F1 | 스타일을 `styles/` 8개 파일로 나누고 새 토큰과 `apps/desktop/PRODUCT.md`를 더했다. 나눈 뒤 e2e 스크린샷이 기준과 같았다(스피너·스트리밍 타이밍 차이만). 세션이 끊겨 워크플로 결과는 남지 않았고 커밋만 남았다 | `24a52c1` |
| 2026-10-30 | main 병합 | 로그인 작업(PR #9)이 main에 들어와 `b6e4ce5`를 합쳤다. `tsd.md` 충돌은 main의 O11과 이 브랜치의 O12를 함께 두어 풀었다. 겹침 제한을 풀었다 | `git merge origin/main` |
| 2026-10-30 | 2단계 F2 | 공통 부품(버튼·칩·입력창·포커스·대화 상자 틀·아이콘·`Logo.tsx`)을 새 토큰으로 바꿨다. 버튼은 주·보조·글자·아이콘 4종이고, 위험 버튼은 쓸 곳이 없어 만들지 않았다 | `9a5c55f` |
| 2026-10-30 | 2단계 구역 | 카드, 길과 고정 막대, 대화, 사이드바, 로그인과 대화 상자, 로고와 창 틀을 시안대로 바꿨다. 6개 구역을 동시에 작업하고 구역마다 커밋했다 | `6581bb4` `a8eb10f` `cee7759` `42b5278` `9cc5728` `b296dd6` |
| 2026-10-30 | 3단계 로고 | `assets/brand/mark*.svg` 4개, `npm run icons`로 `icon.ico`(16·20·24·32·40·48·64·256)와 `icon.png`, 이름 `experii`/`Experii`, `win32metadata`·`appCopyright`, 기본 제목 표시줄·밝은 테마·메뉴 없음. 계획과 다른 점: `lockup.svg`는 만들지 않았다(로크업은 `Logo.tsx`가 그린다. 글자를 윤곽선으로 바꾸지 않은 SVG는 다른 글꼴로 보인다). `iconUrl`은 공개 주소가 없어 비웠다(5장 위험) | `b296dd6` |
| 2026-10-30 | 2단계 통합 | legacy 토큰 0, 머리줄 3구역의 글자 기준선을 배율 100~200%에서 차이 0px로 맞췄다. 1장 3번 숫자 검사 통과, e2e 15/15 | `b386470` |
| 2026-10-30 | 2단계 감사 | 실측 감사 결과: 글자 대비 최저 5.28:1, 조작 경계 최저 3.52:1(아니에요 칩 테두리 1.51→3.85:1로 고침), 칠한 버튼은 장면마다 1개, 허용 자리 밖 파랑 0, 포커스 이동 실패 4→0(1280 폭에서 고정 막대가 가리던 것), 움직임 줄이기에서 남는 움직임 0, 배너 역할 안내=status·오류=alert, impeccable detect 정적·실시간(11장면) 0건 | `f9e1d78` |
| 2026-10-30 | 병합 순서 | 창업자 결정: 밤 기능 PR들(PR #10 계획)을 아침에 먼저 병합하고, 이 브랜치가 뒤에 main을 합쳐 충돌을 푼다. 오늘 밤에는 기능 브랜치를 합치지 않는다. 2장 "다른 작업과 겹침"과 3장 4단계에 반영했다. 목표·범위는 그대로이고, 병합 전에 main 합치기와 회귀 한 번이 늘었다. 남은 수정에서 `App.tsx`의 쓰지 않는 `primary` 필드 정리(K6)는 충돌을 줄이려고 미뤘다 | 상위 세션 메시지(2026-10-30 밤) |
| 2026-10-30 | 4단계 비평 | 리뷰 4개를 동시에 돌렸다: impeccable 마감 리뷰, UX 비평, 기술 감사, 브랜드·창. 마감 리뷰 판정은 fix였다. 바탕·글자·재질은 시안과 같았고 고칠 것은 5개였다(가린 값 칩, 면접 한 마디 구분선, 카드 만드는 중 머리줄, 날짜 구분선, DESIGN.md) | 워크플로 wf_26be9fde-2a7 결과 |
| 2026-10-30 | 4단계 수정 | 키보드 확대·전체 화면을 되살렸다(K1; 확대는 최소 창 크기를 지키는 단계까지, 기본 창에서 120%). 로그인 로크업 간격을 32/16px로 맞추고 대기 중 포커스를 [취소]로 옮겼다(K2). 첫 실행 만들기 버튼은 하나로 줄였다(K4). 가린 값은 칩으로 보이고 면접 한 마디 구분선은 없앴다. 파랑 테두리는 채팅에 열린 대화의 칸 하나에만 둔다. 칸 제목 굵기를 시안대로 하고, 고대비 모드 테두리를 더하고, 4px 밖 간격을 정리했다(남긴 6곳은 DESIGN.md E7). 카드를 만드는 동안 머리줄에는 상태 글과 [취소]만 둔다. 날짜 구분선은 시안에도 선이 있어 그대로 뒀다 | `f9cf552` `ae8e948` `bc2085a` `54b9df6` `8c5b544` `919fccf` `b3ac4f1` |
| 2026-10-30 | 범위 정리 | 수정 담당이 넣은 "대화별 안 보낸 글 보관"(`9739700`)을 되돌렸다. main에도 있던 동작을 바꾸는 기능 수정이라 1쪽 요약의 "기능은 그대로"를 넘고, 밤 기능 PR과 겹치는 `App.tsx`를 고친다. 기능 PR이 들어온 뒤 별도 PR로 다시 적용한다 | `e654e7b` |
| 2026-10-30 | 4단계 문서 | `apps/desktop/DESIGN.md`와 `.impeccable/design.json`을 썼다. impeccable 규칙상 새 디자인 체계에는 둘 다 필요하다. 토큰 주석, TSD 파랑 자리 목록, TSD O12의 실제 설치 이름을 맞췄다 | `1c2646c` `9dba6f2` `2f4732a` |
| 2026-10-30 | 4단계 판정 | 마감 리뷰 재판정: 남은 두 항목(카드 만드는 중 제목 잘림, DESIGN.md)은 해결됐고 새 스크린샷 회귀는 0이라 판정은 ship이다. 판정 범위는 그 두 항목과 스크린샷 10장이다. 나머지 7장은 오케스트레이터가 열어 봤다 | 리뷰어 판정, scratchpad `final-shots` |
| 2026-10-30 | 최종 회귀 | typecheck, vitest 126, oxlint, oxfmt(커밋 내용 LF 81개 파일), package + e2e 15/15, 1장 3번 숫자 검사, impeccable detect 정적 0건을 통과했다. `gates.mjs`는 landing만 검사하는데 이 브랜치는 landing을 바꾸지 않아(0개 파일) 돌리지 않았다. `npm run make`로 `Experii-1.0.0 Setup.exe`를 만들었다 | `2f4732a`, scratchpad `ui-runs/final-221254`, Terminal "experii make" 탭 |
| 2026-11-01 | main 병합 | 창업자 승인으로 밤 기능 PR(#10~#16, #18)이 main에 들어가(`194a27c`), 이 브랜치(`ec60e3c`)에 main을 합쳤다. GitHub이 DIRTY였고 이번에는 진짜 충돌이었다: 내용 충돌 6개(`App`·`CardView`·`ChatPanel`·`Roadmap`·`Sidebar`·`icons`)와 `styles.css` 수정/삭제. 기능은 main, 모양은 이 브랜치로 손으로 풀었다. 타입 검사가 `Markdown.tsx`의 `HastNode` 타입 중복과 `toollines.test.ts`의 `makingCard` 누락을 잡았다. `package-lock.json`은 자동 병합 결과에 `npm install`을 돌려도 바뀌지 않았다 | `6bdf68f` |
| 2026-11-01 | 새 화면 | main의 `styles.css` 추가분(약 1,360줄)을 `styles/`로 옮겼다. 새 파일은 `panes.css`(접는 패널), `tabs.css`(가운데 머리), `note.css`(필기 페이지)이고, 탭·표·코드·도구 줄·모델 고르기·접기 버튼·요약 줄은 `base`·`sidebar`·`path`·`chat`·`controls`·`tokens`에 더했다. 값은 모두 토큰이다. 새 토큰은 너비(`--w-fold`, 탭, 필기, 핀, 다음 공부)와 도착 시간(`--dur-land`, `--dur-settle`)이다. 새 파랑 자리 없음, 필기 페이지의 칠한 버튼 없음. 들어 올림은 탭과 도구 막대의 고른 도구에 쓴다(사이드바의 고른 행과 같은 모양) | `6bdf68f` |
| 2026-11-01 | 계획과 다른 점 | (1) 접기 버튼은 28px 글자 아이콘 버튼이다. 32px일 때 카드를 만드는 동안 채팅 제목이 5px 잘렸다(이 브랜치가 지키던 "제목 안 잘림"). 28px에 머리 오른쪽 안쪽 여백 8px, 간격 8px로 제목 폭이 150.7px가 됐다(필요 140px). (2) 코드 블록은 줄을 바꾸지 않고 옆으로 민다. main의 기능이라 두고 DESIGN.md의 "가로 스크롤 없음" 문구를 고쳤다. (3) 완료 칸도 키보드 순서에서 뺐다. 이제 옆 타일과 같은 일(필기 페이지 열기)을 한다. (4) 접힌 패널의 가장자리 선을 `box-shadow` 대신 1px 요소로 그린다. impeccable CDP 검사가 그림자 때문에 표를 "카드 안의 카드"로 읽었다. (5) 캔버스에 키보드 포커스 링을 더했다. main은 `outline: none`이라 링이 없었다 | `6bdf68f` `390d374` |
| 2026-11-01 | 테스트 | 모양을 따라 고친 곳: 칸 제목 `h3`→`h2`(e2e 2곳, 단위 4곳), 사이드바 제목에 툴팁 `title`, 접기 전환 `0.22s`→`0.24s`(`--dur-3`), 증거 스크린샷은 `scale: 'css'`로 CSS 픽셀 크기. 이 PC에서는 `setContentSize(1280, 800)`이 1281폭으로 들어와(화면 배율 200%, main `194a27c`도 같은 테스트 2개가 실패) 너비를 1px 오차로 받게 했다 | `6bdf68f` |
| 2026-11-01 | 검증 | typecheck, vitest 226, oxlint 0, oxfmt(커밋 내용 LF 104개 파일), package, e2e 42/42. 1장 3번 숫자 검사: 색 리터럴 0, 모서리·글자 크기(여섯 단과 로고)·굵기·그림자는 토큰뿐, 간격 리터럴 0. 새 장면 실측: 파랑은 허용 자리뿐(길 장면은 다섯 자리, 필기 페이지는 "진행 중" 칩 하나), 칠한 버튼은 장면마다 1개, 글자 대비 최저 5.56:1, 세 머리의 글자 기준선 차이 0px(배율 1·1.25·1.5·2). impeccable 정적 0건, CDP는 새 9장면에서 두 가지(제목 15px 대 본문 14px의 advisory, 떠 있는 패널이 필기를 덮음)를 보고해 DESIGN.md E11에 적었다. `gates.mjs`는 landing만 검사하고 이 브랜치는 landing을 바꾸지 않아 돌리지 않았다 | scratchpad `shots-a3`, 증거 브랜치 `claude/ev-desktop-design-impl` |
