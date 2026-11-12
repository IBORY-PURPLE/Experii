# PRD 색인

CLAUDE.md와 AGENTS.md가 가리키는 `PRD.md`다. 이 파일은 요구사항을 담지 않고, 영역별로 따를 문서만 연결한다. 작업하는 파일이 어느 영역인지 보고 그 문서를 읽는다.

데스크톱 앱과 웹 앱은 PRD 하나([docs/app/prd.md](docs/app/prd.md))를 같이 쓰고 TSD는 앱마다 따로 둔다. 랜딩은 PRD와 TSD가 별도다.

| 영역 | 현재 단계 | 따를 문서 |
|---|---|---|
| `apps/desktop/` Windows 데스크톱 앱 (Electron + React + TypeScript) | 데스크톱 MVP v1: 창업자 PC 도그푸딩, H2 검증. 2026-10-30 개정: 루프 v2(필기 페이지)와 FR-10~17 | [docs/app/prd.md](docs/app/prd.md) 1~9장, [docs/desktop/tsd.md](docs/desktop/tsd.md) |
| `apps/web/` 웹 앱 (Next.js) | 웹 공개 실험 v0(2026-11-13): 초대 링크, 캡쳐 → 자동 필기, 목 Claude | [docs/app/prd.md](docs/app/prd.md) 10장, [docs/web/tsd.md](docs/web/tsd.md) |
| `landing/` 사전 신청 랜딩페이지 | 랜딩 v0.1: USP 검증과 사전 신청 수집 | [landing/Experii_PRD_v0.1.md](landing/Experii_PRD_v0.1.md), [landing/TSD.md](landing/TSD.md) |
| 개발 하네스 (`.agents/`, `scripts/agents/`, `.github/`, `.claude/`) | 하네스 구축 | [.agents/plan.md](.agents/plan.md) |
| 보관 (따르지 않음) | 이전 Pre-MVP 스킬, 웹 + MCP MVP, 데모, 리서치 | [docs/archive/](docs/archive/README.md) |

## 결정되지 않은 충돌

- 제품 형태는 Windows 데스크톱 앱이다(2026-10-29 결정). 랜딩 PRD 6장은 아직 "모바일 애플리케이션"으로 적혀 있다. 이 문구를 고칠지는 창업자가 판단한다. 근거는 [landing/reports/overnight-summary.md](landing/reports/overnight-summary.md)의 "창업자 결정이 필요한 것"이다.
- 열린 PR #21(통합 PRD, 브랜치 `claude/unified-prd`)도 `docs/desktop/prd.md`를 옮기고(`docs/archive/desktop-prd-v1.md`로) 루트 `PRD.md`를 통째로 바꾼다. 그 PRD의 다음 문장이 웹 결정(Claude 사용, 서버 저장, 랜딩 별도)과 부딪힌다. 행 번호는 `origin/claude/unified-prd`의 `PRD.md` 기준이다.
  - GPT만 쓴다: 267행 "Claude 등 다른 AI 연결 … 지금은 GPT만 한다", 38행 "별도 API AI와 릴레이 서버 없이 사용자 ChatGPT 구독 하나로 간다"
  - 공부 대화와 필기는 서버에 저장하지 않는다: 298행 "대화, 필기(캡처 이미지 포함), 카드는 사용자 PC에만 저장한다", 305행 "공부 대화, 필기, 보드 원본은 서버에 저장하지 않는다"
  - 랜딩 PRD 통합: 3행 "흩어져 있던 색인 1개와 PRD 4개를 하나로 합쳤고", 378행 "13. 랜딩페이지" 장
  - 정리 방법: (a) 웹 PR(`claude/web-capture-notes`)을 먼저 병합하고 #21을 웹 결정에 맞춰 고친다(추천). (b) #21을 먼저 병합하고 웹 장을 통합 PRD로 옮긴다. 순서는 창업자가 정한다.
