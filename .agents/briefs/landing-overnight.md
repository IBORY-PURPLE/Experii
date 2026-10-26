# 랜딩페이지 밤샘 완성: Aside식 데스크톱 앱 히어로 + 다운로드 버튼, 검증까지

<!-- 파일 이름(확장자 제외) = 브랜치·로그 이름 → landing-overnight -->

## 목표
`landing/`의 Experii 사전 신청 랜딩을 **데스크톱 화면 기준** "검증까지 끝난 완성본"으로 만든다. 기준 문서: `landing/Experii_PRD_v0.1.md`(제품), `landing/TSD.md`(제약), `landing/design/DESIGN.md`(청사진), `landing/research/11-aside-hero-motion.md`(이번 히어로 레퍼런스). 아래 "필수 수정"은 2026-10-26 23:4x 창업자 지시이며, 이 문서들과 충돌하면 **필수 수정이 우선**이다(문서는 고치지 말고 요약의 주의 항목에 충돌을 적는다).

## 필수 수정 (창업자 지시, 2026-10-26 밤)
- [ ] **M1 히어로를 Aside식으로**: 가운데 정렬 제목(기존 h1 문구 유지) + 서브 + 주 버튼 `Windows 앱 다운로드`(M2) + 보조 `사전 신청하기` → 그 아래 **가운데에 Experii 데스크톱 앱 창**. 창은 첫 화면 아래로 이어지고 히어로 카드 경계에서 잘린다. 기존 Before→After 그림은 히어로 밖 바로 아래(또는 창 옆이 아닌 다음 블록)로 옮기되 지우지 않는다(USP 근거).
- [ ] **M1-a 앱 창 구성**: 창 제목줄(–, □, ×), 왼쪽 사이드바(Experii 로고, `오늘 공부`, `내 경험 카드`, `리마인드`, 과목 `SQLD · 2과목`), 본문 첫 상태 = 입력창 `오늘 공부하다 막힌 걸 물어보세요` + 칩 `내 GPT · 연결 준비 중` + 최근 경험 카드 3장. 창 위 `예시 화면` 배지. 래스터 이미지 금지(HTML/CSS).
- [ ] **M1-b 자동 재생 한 컷**: `content/loop.ts` 세트 A 대본 그대로 — 입력창 타이핑 → 전송 → 대화(AI 설명·표) → 현장 과제 카드 → **커서가 움직여 `LEFT JOIN` 보기를 누름(누름 원 피드백)** → 결과 2행 → 경험 카드 저장(사이드바 `내 경험 카드` 숫자 증가) → 데스크톱 알림 토스트 1일·7일·30일(날짜 10월 27일 화 / 11월 2일 월 / 11월 25일 수) → 30일 알림 클릭 → 같은 카드 열림 + `다시 본 날` ●●●. 한 번만 재생하고 정지, `다시 보기` 버튼. 재생 중 `일시정지` 버튼 상시 노출(WCAG 2.2.2). 화면에 들어왔을 때 시작, 탭이 숨으면 일시정지. `prefers-reduced-motion`·JS 없음이면 마지막 상태 정지 화면.
- [ ] **M2 다운로드 버튼(가짜 문 테스트)**: 히어로와 헤더에 `Windows 앱 다운로드`. 앱이 아직 없으므로 파일을 내려받지 않는다. 클릭 → `track('download_click', { location, variant })` → 정직한 안내(작은 대화상자 또는 버튼 아래 펼침): "Experii 데스크톱 앱은 출시 전이에요. 사전 신청하면 출시할 때 다운로드 링크를 이메일로 보내 드려요." + `사전 신청하기`(→ `#signup`, 이메일 입력에 포커스). 버튼 옆에 작은 `출시 예정` 표시. `lib/analytics.ts`의 이벤트 이름에 `download_click` 추가.
- [ ] **M3 폰 레이아웃 제거**: 섹션 4의 폰 프레임(`PhoneFrame`, `.phone`)을 없애고 같은 **데스크톱 앱 창 컴포넌트**로 바꾼다. 히어로 = 보는 버전(자동 재생), 섹션 4 = 직접 해 보는 버전(탭·빈칸 풀기·알림 넘기기 유지). 창 컴포넌트는 하나를 공유한다(`components/app-window/` 등).
- [ ] **M4 데스크톱 전용**: 기준 화면 1440×900, 1280×800. 모바일 최적화는 이번 범위 밖이다. 단 360px에서 가로 넘침으로 화면이 깨지지 않게 최소한만(앱 창은 축소 표시 또는 숨김 + 안내 한 줄).
- [ ] **M5 이전 루프 결함 8개**(검증자 발견, 수정 중단됨): 칩 앵커 오프셋(V-3/V-4), `.ctx` 대비, 1024px 폰 삐져나옴(M3로 소멸 가능), 이어 보기 종료 상태, ③ 쿼리 조각 조기 표시, 포커스 순서. M3·M4로 사라진 것은 로그에 "M3로 해소"라고 적는다.

## 완료 조건 (done means) — 매 반복 직접 돌려 판정
- [ ] `cd landing && npm run build` 성공
- [ ] `cd landing && npx vitest run` 전부 통과 (content-guard → 금지 표현 0, Claude 언급은 폼 구독 질문 1곳뿐)
- [ ] `cd landing && npx playwright test --project=desktop --project=nojs` 전부 통과 (mobile 프로젝트는 이번 완료 조건에서 뺀다. playwright.config에 1280×800 프로젝트 `desktop-1280` 추가 허용)
- [ ] E2E로 판정: (a) 1440×900·1280×800 첫 화면에 제목·다운로드 버튼·앱 창 윗부분이 보인다 (b) 히어로 데모가 끝까지 재생되고 `일시정지`가 멈춘다, `다시 보기`가 처음부터 다시 튼다 (c) reduced motion에서 정지 화면 (d) 다운로드 클릭 → 안내 표시 + `download_click` 이벤트(window.umami 목) + 페이지 이동·파일 다운로드 없음 (e) DOM에 `PhoneFrame`/`.phone` 없음 (f) 섹션 4에서 빈칸 오답→정답, 알림 3단계→카드 열림
- [ ] axe serious·critical 0, 데스크톱 13px 미만 글자 0, 1280·1440 가로 넘침 0
- [ ] 로렌 탄 시각·Cursor 개발자 시각 검증 에이전트 2개(`scratchpad/verify-workflow.js` 방식, 대상은 이 브랜치 프로덕션 빌드)에서 **재현된 결함 0**

## 범위
- 건드려도 됨: `landing/app/**`, `landing/components/**`, `landing/content/landing.ts`, `landing/content/loop.ts`, `landing/lib/**`, `landing/tests/**`, `landing/*.config.*`, `landing/package.json`의 scripts, `landing/reports/**`
- 건드리면 안 됨: PRD·TSD·DESIGN·research·prototypes·supabase, `landing/content/privacy.ts`, `package.json` dependencies(추가·삭제·버전 변경 금지), 저장소 루트의 다른 폴더
- 카피: 화면 문구는 `landing/content/*.ts`에만. 새 주장·수치·후기를 지어내지 않는다. 연동은 "준비 중"(TSD 6.3), Claude 연동 언급 금지(TSD D1)
- 레퍼런스: aside.com은 관찰만. 코드·에셋·카피를 복사하지 않는다(라이선스 없음)

## 권한
- 브랜치 `landing-overnight`(main 기준). 반복마다 진전이 있으면 커밋, 없으면 `git checkout -- .`으로 되돌린다
- 작성자: `GIT_AUTHOR_NAME=Claude`(환경에 설정됨). 메시지 끝에 `~/.claude/settings.json`의 `attribution.commit` 문구
- push·PR·main 병합·외부 서비스 연결·키 입력 금지. `SIGNUP_WRITE_ENABLED`는 비워 둔다
- dev 서버는 이미 3000번에서 이 체크아웃을 보고 있다(핫 리로드). 프로덕션 확인은 `next build` 뒤 `next start -p 3100`

## 탈출구
- 같은 검사가 **3회 연속** 실패하면 멈추고 `.audit/landing-overnight.tsv` 마지막 줄과 `landing/reports/BLOCKED.md`에 시도한 것과 이유를 적는다
- 완료 조건을 완화해서 끝내지 않는다
- 멈출 때 미커밋 편집은 `wip:` 커밋 하나로 남긴다

## 아침 산출물
- `.audit/landing-overnight.tsv` (ts, phase, decision, why, evidence, result) — 로컬 파일(.gitignore 대상)
- `landing/reports/overnight-summary.md`: 10줄 요약 → **주의 항목**(눈으로 봐야 할 것, PRD와의 충돌: 모바일 앱 ↔ 데스크톱 앱·다운로드, 기각한 지적, 못 한 것) → 완료 조건 최종 표
- `landing/reports/shots/`: 1440·1280 히어로 재생 단계별, 섹션 4 상태별, 다운로드 안내
