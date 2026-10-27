---
name: verify-landing
description: Experii 사전 신청 랜딩(landing/, Next.js)을 프로덕션 빌드로 띄워 사용자처럼 조작하고 스크린샷·영상 증거를 남긴다. 랜딩 UI를 바꾼 뒤 PR을 열기 전, verifier 판정, 랜딩 버그 재현에 쓴다.
---

# verify-landing

대상은 `landing/`의 한 페이지(`/`)와 개인정보 처리방침(`/privacy`)이다. 표면은 브라우저이고, 하네스는 레포에 있는 Playwright(`@playwright/test` 1.64.1)다. 판정은 항상 프로덕션 빌드(:3100)로 한다. 개발 서버(:3000)는 쓰지 않는다.

## Launch

1. 의존성: `npm --prefix landing ci`. 클라우드 세션에서는 SessionStart 훅이 이미 돌렸다.
2. 빌드: `npm --prefix landing run build`. `landing/.next/BUILD_ID`가 생긴다.
3. 서버는 직접 띄우지 않는다. `evidence`·`test:e2e:prod` 스크립트의 Playwright webServer가 `next start -p 3100`을 띄우고, 끝나면 내린다.
   - 손으로 조작해야 할 때만 `npm --prefix landing run start -- -p 3100`을 백그라운드로 띄우고 그 PID를 적어 둔다.
4. 준비 확인: Doctor가 0 또는 2를 돌려준다.

## Doctor

`node scripts/agents/verify-doctor.mjs`는 읽기 전용이다.

- `0`: :3100이 지금 `.next/BUILD_ID`의 빌드를 서빙한다.
- `2`: :3100에 아무것도 없다. Playwright가 띄운다.
- `1`: 빌드가 없거나, 다른 빌드나 개발 서버가 :3100을 잡고 있다. 내가 띄운 서버가 아니면 건드리지 말고 멈춘다.

이상하면 언제든 먼저 이것을 돌린다. 출력의 "uncommitted changes"는 증거가 커밋되지 않은 코드에서 나왔다는 뜻이니 판정 댓글에 적는다.

## Drive

- **전체 장면**: `EVIDENCE_ID=<ID> npm --prefix landing run evidence`. PowerShell에서는 `$env:EVIDENCE_ID='<ID>'; npm --prefix landing run evidence`이다.
  - 장면: 히어로 데모 3개 창(1440×900, 1280×800, 1536×730), 다운로드 안내, 비포·애프터, 섹션 4 직접 해 보기.
- **기능 회귀**: `npm --prefix landing run test:e2e:prod -- tests/e2e/<spec>.ts`. 스펙은 `features/`의 각 파일에 적혀 있다.
- **새 장면**: `landing/tests/evidence/journeys.spec.ts`에 장면을 추가한다. 일회성 스크립트로 찍지 않는다.
- **선택자**: `features/`에 적힌 것을 쓴다. 접근 이름(role, name)과 data 속성을 좌표보다 우선한다.
- **동작 줄이기**: evidence 프로젝트는 자동 재생을 보려고 `reducedMotion: 'no-preference'`를 쓴다. 일반 E2E는 `reduce`다.
- **브라우저**: Windows 로컬은 msedge, CI와 클라우드(`CLAUDE_CODE_REMOTE=true`)는 Playwright 번들 chromium이다. `PW_CHANNEL`로 덮어쓸 수 있다.

## Evidence

- **위치**: `landing/reports/evidence/<ID>/` (gitignore).
  - 장면별 PNG, 여정별 webm, 그리고 `manifest.json`(sha, buildId, 파일·장면·뷰포트)이 남는다.
- **증명 기준**:
  - 실제 사용자 경로(클릭, 스크롤, 키보드)로 동작한다. 동작과 그 결과 상태를 둘 다 찍는다.
  - 내부 setter나 테스트 전용 경로를 쓰지 않는다.
  - 분석 이벤트는 `window.umami`를 기록용 목으로 바꿔 확인한다(`tests/e2e/download.spec.ts` 방식).
  - 사전 신청은 dry-run이다(`SIGNUP_WRITE_ENABLED`가 비어 있음). "신청됐어요."만 보지 말고 쓰기가 일어나지 않았는지도 본다.
- **버그**: main 빌드에서 재현되는 증거(FAIL)와 수정 브랜치에서 사라진 증거(PASS)를 둘 다 남긴다.
- **게시**: `node scripts/agents/publish-evidence.mjs <ID> landing/reports/evidence/<ID> [--role=verify]`를 돌리고, 출력된 Markdown을 PR 본문이나 판정 댓글에 붙인다.

## Cleanup

- Playwright가 띄운 서버는 Playwright가 내린다.
- 직접 띄운 서버는 적어 둔 PID만 종료한다. Windows는 `taskkill /PID <pid> /T /F`, Linux는 `kill <pid>`다. 프로세스 이름으로 죽이지 않는다.
- 증거 폴더는 지우지 않는다.

## Helpers

| 파일 | 쓰임 |
|---|---|
| `scripts/agents/verify-doctor.mjs` | Doctor |
| `scripts/agents/gates.mjs` | 전체 게이트(typecheck → unit → build → bundle → prod E2E), `landing/test-results/gates.json` |
| `scripts/agents/publish-evidence.mjs` | 증거를 `claude/ev-*` 브랜치에 올리고 Markdown 출력 |
| `landing/tests/evidence/journeys.spec.ts` | 증거 장면 |

## 기능 지도

[features/README.md](features/README.md)

## 알려진 결함 (2026-10-27)

창 높이 761~778px에서 히어로가 약 10초에 빈칸 장면에서 멈추고 "조금 내리면 이어서 재생돼요"가 뜬다(`landing/reports/overnight-summary.md` 다음 개선 1). 판정 장치가 FAIL을 낼 수 있는지 확인하는 변이 시험 대상이다.
