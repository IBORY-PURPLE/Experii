# PRD 색인

CLAUDE.md와 AGENTS.md가 가리키는 `PRD.md`다. 이 파일은 요구사항을 담지 않고, 영역별로 따를 문서만 연결한다. 작업하는 파일이 어느 영역인지 보고 그 문서를 읽는다.

| 영역 | 현재 단계 | 따를 문서 |
|---|---|---|
| `landing/` 사전 신청 랜딩페이지 | 랜딩 v0.1: USP 검증과 사전 신청 수집 | [landing/Experii_PRD_v0.1.md](landing/Experii_PRD_v0.1.md), [landing/TSD.md](landing/TSD.md) |
| `skill/` Pre-MVP Claude Code 스킬 (코드 아직 없음) | Pre-MVP: 로컬 스킬로 경험 카드가 면접에 쓸 만한지 창업자가 검증 | [Pre_MVP/prd.md](Pre_MVP/prd.md), [Pre_MVP/tsd.md](Pre_MVP/tsd.md), [Pre_MVP/plan.md](Pre_MVP/plan.md) |
| 개발 하네스 (`.agents/`, `scripts/agents/`, `.github/`, `.claude/`) | 하네스 구축 | [.agents/plan.md](.agents/plan.md) |
| 참고 (지금 범위 아님) | 전체 MVP: 웹 + MCP + Supabase | [PRD_MVP_V1.md](PRD_MVP_V1.md), [TSD_MVP_V1.md](TSD_MVP_V1.md) |

## 결정되지 않은 충돌

- 랜딩 PRD 6장은 제품 형태를 "모바일 애플리케이션"으로 적었다. 2026-10-26 지시 이후 랜딩은 Windows 데스크톱 앱과 다운로드 버튼을 보여 준다. 창업자가 정리할 때까지 문서를 고치지 않는다. 근거는 [landing/reports/overnight-summary.md](landing/reports/overnight-summary.md)의 "창업자 결정이 필요한 것"이다.
