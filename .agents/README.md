# Experii 에이전트 작업 환경

로렌 탄(pstack)의 3층 구조를 Claude Code로 옮긴 개발 하네스다. 에이전트는 클라우드에서 일하고, 창업자는 폰으로 중간중간 판단만 넣는다. 단계와 규칙의 기준은 [plan.md](plan.md)다.

| 층 | 역할 | 어디서 돈다 | 지침 |
|---|---|---|---|
| 일 정하기 | Chief of Staff: Slack 인입 → Linear 이슈·브리프 → ✅ 승인 반영 → 상태 알림 | 클라우드 예약 작업, 서울 9~22시 매시 7분 | [routines/chief-of-staff.md](routines/chief-of-staff.md) |
| 코딩 | implementer: 승인된 일감 하나 → `claude/son-<n>` → PR | 클라우드 예약 작업 23:07, Claude 앱 "지금 실행" | [routines/implementer.md](routines/implementer.md) |
| 검증 | verifier: main에서 PR을 재판정 → `verify:pass`·`verify:fail` + 증거 | 클라우드 예약 작업 05:07·07:07 | [routines/verifier.md](routines/verifier.md) |

## 창업자가 폰에서 하는 일

1. `#experii-inbox`에 버그나 아이디어를 한 줄 쓴다.
2. 봇이 스레드에 단 브리프에 ✅(승인), ❌(기각), 답글(수정) 중 하나로 답한다.
3. 봇이 `[ask SON-n]`으로 물으면 답글로 결정한다.
4. 아침에 `#experii-ops` 요약을 읽는다. GitHub 앱에서 `verify:pass` PR의 스크린샷·영상을 보고 병합한다.
5. 진행 중인 세션은 Claude 앱 Code 탭에서 보고 고치거나 멈춘다.

## 파일 지도

| 파일 | 내용 |
|---|---|
| [plan.md](plan.md) | 상세 계획, 단계별 완료 조건, 진행 기록 |
| [hitl.md](hitl.md) | 폰 채널 좌표(Slack 채널 ID, 창업자 멤버 ID) |
| [unattended.md](unattended.md) | 무인 실행을 허용한 kind |
| [briefs/_TEMPLATE.md](briefs/_TEMPLATE.md) | 브리프 형식(Linear 본문, 로컬 브리프) |
| [hitl/slack-manifest.yaml](hitl/slack-manifest.yaml) | Experii Bot Slack 앱 매니페스트 |
| [pstack/](pstack/) | pstack 0.15.32 사본(클라우드용). 갱신은 `scripts/agents/sync-pstack.ps1` |
| `scripts/agents/gates.mjs` | 게이트: typecheck → unit → build → bundle → prod E2E |
| `scripts/agents/verify-doctor.mjs` | 판정 전 읽기 전용 점검 |
| `scripts/agents/publish-evidence.mjs` | 증거를 `claude/ev-*` 브랜치에 올리고 Markdown 출력 |
| `scripts/agents/session-start.mjs`, `guard.mjs` | 클라우드 전용 훅: 의존성 설치, main push·병합 차단 |
| `.claude/skills/verify-landing/` | 랜딩 판정 스킬과 기능 지도 |
| `.claude/rules/cloud.md` | 클라우드 세션 규칙 |

## 로컬 레인 (Windows에서만 확인할 수 있는 일)

Pre-MVP 스킬의 M0 스파이크나 M4 E2E처럼 실제 Windows 세션이 필요한 일은 로컬 백그라운드 세션으로 돌린다.

```powershell
.\scripts\agents\spawn.ps1 -Brief .agents\briefs\<slug>.md
claude agents              # 목록·상태
claude attach <id>         # 들어가서 직접 대화
```

로컬 레인은 커밋만 한다. push·PR·병합은 사람이 한다. 결정 로그는 `.audit/<slug>.tsv`에 남는다.

## 규칙 (pstack 원칙에서 가져옴)

- 완료 조건은 통과/실패로 판정할 수 있어야 한다. 기간("4시간 동안")은 완료 조건이 아니다.
- 한 일감은 다른 진행 중 일감과 파일이 겹치지 않는다.
- 사람이 한 번 지켜본 종류(kind)의 일만 무인으로 돌린다(`unattended.md`).
- 판정하는 세션은 코드를 쓴 세션이 아니다.
- 같은 실패가 반복되면 템플릿, 운영 파일, CLAUDE.md, verify 스킬에 규칙으로 넣는다.
- 처음엔 1레인, 사흘 무사하면 2레인. 검토할 수 있는 양이 상한이다.
