# Experii Pre-MVP 기술 명세서 (TSD)

| 항목 | 내용 |
|---|---|
| 문서 | TSD · Pre-MVP (초안) |
| 작성일 | 2026-10-23 |
| 대상 | [prd.md](prd.md)의 P0·P1. P2는 설계 방향만 |
| 런타임 | Claude Code (로컬). 보조 스크립트는 Python 3.11+ |
| 표기 | **(확인 필요)** = 구현 전 공식 문서나 실험으로 다시 확인할 항목. 13장에 모아 둠 |

## 0. 요약

- **형태**: Claude Code Skill `experii` (`~/.claude/skills/experii/`). UI·트리거와 코어 로직을 분리한다.
- **2계층**: ① Capture(대화 원문 → `.md`), ② Distill(원문 → 경험 카드 `.md` + `.json`).
- **지능 분담**: 요약·추출은 모델(Claude Code)이, 저장·포맷·검증은 Python 코어가 맡는다. (전체 MVP의 "요약은 AI가, 저장은 Experii가" 원칙과 동일)
- **저장소**: `~/.experii/` 로컬 파일만. 서버·네트워크 없음.
- **언어 선택**: 코어를 Python으로 둔다. 다음 단계 MCP 서버(FastMCP, Python)가 같은 코어를 `import`해 재사용하기 위함.
- **원문 획득**: 기본은 모델이 보는 현재 컨텍스트, 보강은 Claude Code 세션 transcript(JSONL) 읽기.

## 1. 설계 원칙

1. **요약은 모델이, 저장·규칙은 코어가.** 스크립트는 LLM을 부르지 않는다. 지능은 전부 Claude Code 세션의 모델이 담당한다.
2. **트리거·UI와 코어를 분리한다.** Skill은 얇은 래퍼다. 정제 결과를 받아 저장·검증하는 `core/`는 Skill을 몰라야 다음 단계 MCP가 그대로 재사용한다.
3. **카드는 사람용(`.md`)과 기계용(`.json`)을 함께 쓴다.** `.md`는 창업자가 읽고 고치고, `.json`은 MCP가 조합한다.
4. **로컬 우선, 전송 없음.** Pre-MVP는 아무것도 서버로 보내지 않는다. 비밀값은 저장 전에 마스킹한다.
5. **명령 하나로 끝낸다.** `Experii해줘` 한 번에 Capture와 Distill이 순차 실행된다.
6. **검증 가능하게 남긴다.** 카드마다 창업자 자가 평가(`useful`)와 메타데이터를 남겨 H2를 측정한다.

## 2. 아키텍처

```
┌──────────────────────── Claude Code 세션 ────────────────────────┐
│                                                                  │
│   사용자: "Experii해줘 — SQLD 서브쿼리"                            │
│        │                                                         │
│        ▼                                                         │
│   SKILL.md 지침에 따라 모델이 수행:                                 │
│     1) 원문 확보  ──(보강)──▶  transcript JSONL 읽기               │
│     2) 경험 카드 JSON 작성 (도메인·태그·STAR·면접 한마디)            │
│        │                                                         │
│        ▼  카드 JSON을 넘겨 호출                                    │
│   ┌──────────────── core/ (Python, Skill 비의존) ─────────────┐  │
│   │  models.py   카드 스키마 검증                               │  │
│   │  redact.py   비밀값 마스킹                                  │  │
│   │  format.py   .md / .json 직렬화                            │  │
│   │  storage.py  ~/.experii/ 읽기·쓰기                          │  │
│   └────────────────────────┬──────────────────────────────────┘  │
│        │                   ▼                                     │
│        │        ~/.experii/raw/*.md  ~/.experii/cards/*.{md,json}│
│        ▼                                                         │
│   화면 출력: 카드 요약 + 저장 경로                                 │
└──────────────────────────────────────────────────────────────────┘
                              ┆ (다음 단계, 범위 밖)
                              ▼
          mcp_server.py (FastMCP) → 같은 core/ 재사용 → 조합·callback
```

| 구성 요소 | 역할 |
|---|---|
| `SKILL.md` | 트리거와 모델 지침. 2계층 절차, 카드 포맷, 호출 규칙을 적는다 |
| `scripts/` | 모델이 호출하는 얇은 CLI. 인자로 카드 JSON을 받아 `core/`에 넘긴다 |
| `core/` | Skill·MCP 공용. 스키마·마스킹·포맷·저장. **여기에 트리거/UI 로직을 넣지 않는다** |
| `~/.experii/` | 로컬 저장소. raw(원문) + cards(경험 카드) |

## 3. 디렉토리 구조

### 3.1 Skill (코드)

```
~/.claude/skills/experii/
  SKILL.md
  scripts/
    save_card.py        # stdin/인자로 카드 JSON → core 저장, 경로 반환
    save_raw.py         # 원문 텍스트 → core 저장 (1계층)
    list_cards.py        # (P2) 카드 목록 요약
  core/
    __init__.py
    models.py           # ExperienceCard, RawCapture 스키마 + 검증
    storage.py          # ~/.experii/ 경로 해석·읽기·쓰기
    format.py           # md ↔ dict, json 직렬화
    redact.py           # 비밀값 패턴 탐지·마스킹
    paths.py            # 홈 경로, slug 생성, 파일명 규칙
  tests/
    test_models.py
    test_redact.py
    test_storage.py
```

### 3.2 저장소 (데이터)

```
~/.experii/
  raw/
    2026-10-23-143000-sqld-subquery.md
  cards/
    2026-10-23-143000-sqld-subquery.md
    2026-10-23-143000-sqld-subquery.json
  index.json            # (P2) 카드 목록 캐시: [{id, date, domain, tags, useful}]
```

- 홈 기준 경로는 `Path.home() / ".experii"`. Windows에서도 `C:\Users\chewo\.experii`로 해석된다.
- `raw/`와 `cards/`의 파일은 같은 `id`를 공유해 쌍을 이룬다.

## 4. 데이터 모델

### 4.1 RawCapture (1계층)

`raw/{id}.md` — 프런트매터 + 대화 원문.

```markdown
---
id: 2026-10-23-143000-sqld-subquery
date: 2026-10-23T14:30:00
source: claude-code
session_ref: f8cab555-...      # transcript로 보강 시 세션 ID, 아니면 null
capture_method: context | transcript
---

(대화 원문 — 역할별로 정리된 텍스트)
```

### 4.2 ExperienceCard (2계층)

`cards/{id}.json` (정본) + `cards/{id}.md` (사람용 렌더).

```json
{
  "id": "2026-10-23-143000-sqld-subquery",
  "date": "2026-10-23",
  "domain": "데이터베이스",
  "tags": ["SQLD", "서브쿼리", "쿼리최적화"],
  "learning_id": null,
  "duration_estimate": "2h",
  "source": "claude-code",
  "raw_ref": "2026-10-23-143000-sqld-subquery",
  "summary": "상관·인라인·스칼라 서브쿼리 3유형을 직접 쿼리로 작성하며 차이를 익힘",
  "interview_line": "SQLD 준비 중 서브쿼리 유형별 동작과 최적화 포인트를 쿼리 작성으로 학습했습니다.",
  "star": {
    "situation": "SQLD 자격증 준비, 서브쿼리 단원",
    "task": "세 유형의 차이와 쓰임을 구분해 설명",
    "action": "각 유형을 예제 쿼리로 작성하고 실행 계획 비교",
    "result": "유형 선택 기준을 한 문장으로 정리, 오답 3개 교정"
  },
  "concepts": ["상관 서브쿼리 행별 평가", "인라인 뷰", "스칼라 서브쿼리 성능"],
  "next_steps": "상관 서브쿼리 성능 튜닝 → EXISTS 변환 연습",
  "useful": null,
  "created_at": "2026-10-23T14:30:12"
}
```

- `useful`: 창업자 자가 평가(H2). 생성 시 `null`, 나중에 `true/false`로 고친다.
- `learning_id`: 선택. 전체 MVP의 `SQLD-1` 체계로 이어지는 연결 고리(PRD 7.3).
- `.md`는 이 JSON을 `format.py`가 렌더한 결과이며, 사람이 `.md`를 고치면 재동기화는 하지 않는다(Pre-MVP 범위). 정본은 창업자가 어느 쪽을 고쳤는지로 판단 — **(확인 필요, D 참조)**.

## 5. Skill 레이어 설계

### 5.1 트리거

- 자연어: "Experii해줘", "experii", "경험 정리해줘"(SKILL.md description에 한국어 트리거 포함).
- 명시 호출: `/experii`.
- 인자: 뒤에 붙는 주제 문구를 도메인/태그 힌트로 쓴다. 예: "Experii해줘 — SQLD 서브쿼리", "Experii해줘 SQLD-1로".

### 5.2 SKILL.md가 모델에 지시하는 절차

1. **원문 확보**: 현재 세션 대화를 역할별로 정리한다. 컨텍스트가 압축돼 초반이 희미하면 6장의 transcript 보강을 시도한다.
2. **원문 저장**: `scripts/save_raw.py`에 원문을 넘겨 `raw/{id}.md`를 만든다.
3. **카드 작성**: 원문을 바탕으로 4.2 스키마의 카드 JSON을 만든다. 추측으로 사실을 지어내지 않는다(세션에 없는 성과를 넣지 않는다).
4. **카드 저장**: `scripts/save_card.py`에 카드 JSON을 넘긴다. 스크립트가 검증·마스킹·저장 후 경로를 돌려준다.
5. **보고**: 카드의 한 줄 요약·면접 한 마디·저장 경로를 화면에 보여 주고, "이 카드가 면접에 쓸 만한지" 평가를 요청한다(H2).

### 5.3 호출 규칙

- 스크립트는 **데이터 I/O만** 한다. 요약·판단은 하지 않는다.
- 카드 JSON은 인자가 길므로 임시 파일 경로나 stdin으로 전달한다 — **(확인 필요: Skill에서 stdin 전달 방식)**.

## 6. 원문 캡처 메커니즘

두 접근을 비교하고, Pre-MVP는 **접근 A를 기본, 접근 B를 보강**으로 쓴다(D1).

### 접근 A — 현재 컨텍스트 직접 정리 (기본, P0)

Skill 실행 시점에 모델은 이미 현재 대화를 보고 있다. 모델이 그 대화를 역할별 텍스트로 재구성해 저장한다.

- 장점: 외부 파일 의존 없음, 단순, 즉시 동작.
- 단점: 컨텍스트가 압축되면 초반 원문이 손실(요약본만 남음).

### 접근 B — 세션 transcript(JSONL) 읽기 (보강, P2 / FR-10)

Claude Code는 세션 원문을 다음 경로의 JSONL로 보존한다(관찰 결과).

```
~/.claude/projects/<cwd-인코딩>/<session-id>.jsonl
예) C:\Users\chewo 에서 연 세션
    → ~/.claude/projects/C--Users-chewo/f8cab555-....jsonl
```

- `<cwd-인코딩>`: 작업 디렉토리 경로의 `:` `\` `/` 등 비영숫자를 `-`로 치환한 형태로 관찰됨 (`C:\Users\chewo` → `C--Users-chewo`) — **(확인 필요: 정확한 인코딩 규칙)**.
- `<session-id>`: 현재 세션 UUID. Skill 실행 중 세션 ID를 얻는 방법 확인 필요. Claude Code 훅(SessionEnd 등)은 `transcript_path`를 넘겨주므로, 훅 연동이 가장 확실 — **(확인 필요)**.
- JSONL 각 줄은 한 메시지(역할·내용·툴 호출). `storage.py`가 파싱해 역할별 원문으로 복원한다.
- 장점: 압축과 무관하게 완전한 원문. SpecStory가 쓰는 방식과 동일 계열.
- 단점: 경로·세션 ID·포맷 파싱 필요. 포맷은 버전에 따라 바뀔 수 있어 방어적으로 읽는다.

**결정**: Pre-MVP P0는 접근 A로 가치를 먼저 검증한다. 접근 B는 "원문이 희미할 때"의 보강으로 FR-10(P2)에서 붙인다.

## 7. 정제(Distill) 파이프라인

```
원문(raw .md)
   │  모델이 SKILL.md 지침으로 추출
   ▼
카드 JSON (4.2 스키마)
   │  save_card.py
   ▼
core.models.validate()      # 필수 필드·타입 검증
   │
core.redact.scrub()         # 비밀값 마스킹 (8장)
   │
core.format.to_markdown()   # .md 렌더
   │
core.storage.write_card()   # .json + .md 저장, index 갱신(P2)
   ▼
저장 경로 반환 → 화면 출력
```

- 지능(요약·STAR 구성·도메인 판단)은 모델, 기계적 처리(검증·마스킹·직렬화·저장)는 `core/`. 경계가 명확해야 다음 단계 MCP에서 그대로 재사용된다.

## 8. 보안 · 데이터 취급

- **전송 없음**: Pre-MVP는 네트워크 호출을 하지 않는다. 모든 데이터는 로컬.
- **비밀값 마스킹(`redact.py`, FR-07)**: 카드/원문 저장 전에 패턴 검사 — API 키(`sk-`, `AKIA...` 등), 개인키 블록(`-----BEGIN ... PRIVATE KEY-----`), 주민등록번호 형식(`\d{6}-\d{7}`), 긴 Bearer 토큰. 발견 시 `***REDACTED***`로 치환하고 모델에 알린다.
- **원문 보관 주의**: raw는 대화 전체라 민감 내용이 섞일 수 있다. 저장 경로(`~/.experii/raw/`)를 사용자에게 명확히 알리고, 삭제는 사용자가 직접 파일을 지운다(Pre-MVP는 삭제 UI 없음).
- **지어내기 금지**: 세션에 없는 성과·수치를 카드에 넣지 않는다(SKILL.md 명시). 면접에서 거짓 경력이 되지 않게 한다.

## 9. 파일명 · ID 규칙 (`paths.py`)

- `id = {date}-{HHMMSS}-{slug}`. 예: `2026-10-23-143000-sqld-subquery`.
- `slug`: 도메인/주제에서 소문자·하이픈으로 생성, 영숫자와 하이픈만. 한글 주제는 로마자화 또는 태그 기반 축약 — **(확인 필요: 한글 slug 처리)**.
- 같은 세션에서 `Experii해줘`를 두 번 하면: 기본은 **새 카드** 생성(시각이 다르므로 id 충돌 없음). 중복 판단·갱신은 Pre-MVP 범위 밖(전체 MVP의 FR-07에서 다룸).

## 10. 에러 · 엣지 케이스

| 상황 | 처리 |
|---|---|
| 세션이 거의 비어 있음(공부 내용 없음) | 카드 생성 전에 "정리할 학습/작업 내용이 없다"고 알리고 중단 |
| 컨텍스트 압축으로 원문 희미 | 접근 B(transcript) 보강 시도. 실패 시 "요약본 기준으로 생성됨"을 카드 메타에 표시 |
| 비밀값 감지 | 마스킹 후 진행, 무엇을 가렸는지 사용자에게 보고 |
| `~/.experii/` 없음 | `storage.py`가 디렉토리를 생성 |
| 카드 JSON 스키마 위반 | `save_card.py`가 어떤 필드가 문제인지 반환, 모델이 교정 후 재호출 |
| 한글 slug 불가 문자 | 안전 문자로 치환, 원 주제는 `tags`/`summary`에 보존 |

## 11. 다음 단계: MCP 확장 설계 (범위 밖)

Pre-MVP 성공 시, `core/`를 건드리지 않고 다음을 추가한다.

```
~/.claude/skills/experii/
  mcp_server.py         # FastMCP. core/ 를 import
```

- 노출 도구(안):
  - `save_experience(card: dict) -> {id, path}` — Pre-MVP `save_card.py`와 동일 코어 호출.
  - `list_experiences(domain?, since?) -> [card]`
  - `combine_experiences(domain | tags) -> summary` — 여러 카드를 조합해 "이 사람의 X 경험" 상위 요약 생성 후 **유저 callback**(PRD 12장).
- 전송 방식: stdio(로컬 Desktop) 우선. 원격은 전체 MVP의 Streamable HTTP 설계([../TSD_MVP_V1.md](../TSD_MVP_V1.md))로 합류.
- 저장소 `~/.experii/`를 Skill과 MCP가 공유하므로, CLI로 쌓은 카드를 Desktop에서 조합할 수 있다.

## 12. 검증 방법 (도그푸딩 측정)

- **H1(캡처 성공률)**: `Experii해줘` 실행마다 raw/card 생성 성공을 로그. 실패 사유 분류.
- **H2(면접 유용성)**: 카드 `useful` 필드를 창업자가 채운다. 주간 비율 집계(수동 또는 `list_cards.py`).
- **H3(재열람)**: 카드를 다시 연 사건을 정성 기록.
- 2주 운영 → H2 ≥ 60%면 전체 MVP 전진, 미달이면 SKILL.md의 정제 지침·카드 포맷을 고쳐 재측정.

## 13. 확인 필요 항목 모음

| # | 항목 | 위치 |
|---|---|---|
| C1 | Skill 실행 중 현재 세션 ID / transcript 경로를 얻는 방법 | 6장 접근 B |
| C2 | `<cwd-인코딩>` 정확한 규칙 (치환 대상 문자) | 6장 |
| C3 | 세션 JSONL 한 줄의 스키마(역할·툴 호출 표현) | 6장 |
| C4 | Skill에서 스크립트로 긴 JSON 전달 방식(stdin vs 임시파일) | 5.3 |
| C5 | 한글 주제의 slug 생성 정책 | 9장 |
| C6 | `.md`를 사람이 고쳤을 때 `.json`과의 정본 처리 | 4.2 |

## 14. 구현 순서 (제안)

1. `core/`(models·storage·format·redact·paths) + 단위 테스트 — Skill·MCP 공용 기반.
2. `scripts/save_raw.py`, `save_card.py` — 코어를 호출하는 얇은 CLI.
3. `SKILL.md` — 트리거·절차·카드 포맷·지어내기 금지 규칙.
4. 접근 A로 end-to-end 1회 성공(실제 세션에서 `Experii해줘`).
5. 창업자 도그푸딩 2주 → H2 측정.
6. (성공 시) 접근 B 보강 → `mcp_server.py` → 다음 단계.
