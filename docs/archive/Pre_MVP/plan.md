# Experii Pre-MVP 개발 계획

| 항목 | 내용 |
|---|---|
| 기준 문서 | [prd.md](prd.md) · [tsd.md](tsd.md) |
| 작성일 | 2026-10-25 |
| 범위 | prd.md의 P0 + P1(FR-01~08). P2(FR-09 목록, FR-10 보강)는 아래 "결정 필요 1"에 따라 일부 앞당김 |
| 완료 조건 | 실제 세션에서 `Experii해줘` 한 번으로 raw + card(.md/.json)가 생성되고, 2주 도그푸딩으로 H2를 잴 수 있는 상태 |

## 0. 결정 필요 (구현 전에 확정)

| # | 결정 | 권장 | 근거 |
|---|---|---|---|
| 1 | 원문 캡처 기본 방식 (tsd D1) | **접근 B(transcript JSONL 복사)를 P0으로 앞당긴다.** 접근 A는 실패 시 대체 경로로만 쓴다 | A는 모델이 대화 전체를 다시 타이핑하므로 토큰이 많이 들고 원문이 아니라 재구성본이 된다. 2026-10-25 확인 결과 세션 JSONL은 `~/.claude/projects/<cwd 인코딩>/<session-id>.jsonl`에 실시간으로 쌓인다. 세션 ID만 얻으면 Python이 결정적으로 복사한다. H1(캡처 95%)에 유리하다 |
| 2 | 카드 정본 (tsd C6, D4) | `.json`은 생성 시점 스냅샷, `useful` 평가와 사람 수정은 `.md` 프런트매터에 한다. 측정은 `.md`를 읽는다 | 창업자는 `.md`만 열어 본다. 재동기화 로직이 필요 없다 |
| 3 | 한글 slug (tsd C5) | 모델이 카드 JSON에 영문 `slug`를 직접 넣는다. 비어 있거나 형식이 틀리면 `card` 고정 | 로마자화 라이브러리가 필요 없다. 원래 주제는 `tags`/`summary`에 남는다 |
| 4 | 코드 위치 | 소스는 이 레포 `skill/experii/`에 두고, `~/.claude/skills/experii`에 디렉토리 정션으로 연결 | 공부는 다른 폴더에서 하므로 user 스코프 Skill이어야 한다. 버전 관리는 레포에서 한다 |
| 5 | 루트 `PRD.md` 부재 | CLAUDE.md·AGENTS.md가 `PRD.md`를 가리키는데 파일이 없다. `Pre_MVP/prd.md`를 현재 단계 PRD로 본다는 한 줄을 CLAUDE.md에 추가할지 결정 | 다음 세션들이 PRD를 못 찾고 멈추는 것을 막는다 |

## 1. 마일스톤

각 단계는 독립적으로 검증 가능한 단위다. 앞 단계의 검증이 통과해야 다음으로 간다.

### M0 · 스파이크 (반나절)

미확인 전제를 코드 짜기 전에 실험으로 확정한다.

| 확인 | 방법 | 통과 기준 |
|---|---|---|
| Skill에서 세션 ID 얻기 (tsd C1) | 테스트 SKILL.md 본문에 `${CLAUDE_SESSION_ID}`를 넣고 호출 | 현재 세션 UUID가 치환되어 보인다. 안 되면 `~/.claude/projects/<cwd>/`에서 가장 최근 수정된 JSONL을 쓰는 대체 경로로 간다 |
| cwd 인코딩 (tsd C2) | 공백·한글이 들어간 폴더에서 세션을 열고 생성된 디렉토리 이름 확인 | 인코딩 함수가 실제 디렉토리 이름과 일치한다 |
| Windows 실행 | Skill에서 `python` / `py -3` 호출, 한글 stdout | 한글이 깨지지 않는다(`PYTHONUTF8=1` 또는 `sys.stdout.reconfigure`) |
| 긴 JSON 전달 (tsd C4) | 모델이 Write로 임시 파일을 쓰고 경로를 인자로 넘김 | stdin 없이 동작한다 |

### M1 · `core/` + 단위 테스트 (1~2일)

표준 라이브러리만 쓴다(dataclass, json, re, pathlib). 테스트는 pytest.

| 모듈 | 책임 | 핵심 테스트 |
|---|---|---|
| `paths.py` | `~/.experii/` 루트, `id = {date}-{HHMMSS}-{slug}`, slug 정규화, cwd 인코딩 | slug 비정상 입력 → `card`, 인코딩이 M0 관찰값과 일치 |
| `models.py` | `ExperienceCard`·`RawCapture` 스키마와 검증. 필드별 오류 목록 반환 | 필수 필드 누락·타입 오류가 필드명과 함께 보고된다 |
| `redact.py` | API 키(`sk-`, `AKIA`), 개인키 블록, 주민번호, 긴 Bearer 토큰 → `***REDACTED***`, 가린 종류 반환 | 패턴별 양성·음성 사례, 일반 SQL·코드가 오탐되지 않는다 |
| `transcript.py` | JSONL → 역할별 원문. `user`/`assistant`만 남기고 `isSidechain`·`thinking`·메타 이벤트는 버린다. `tool_use`는 한 줄 요약, 도구 결과는 길이를 잘라 남긴다. 모르는 줄은 건너뛴다 | 실제 세션 JSONL 픽스처(민감값을 지운 사본)로 복원 결과 확인, 깨진 줄에서도 죽지 않는다 |
| `format.py` | 카드 dict → `.md`(prd 10장 포맷), `.json` 직렬화 | 렌더 결과가 prd 10장 골격과 같다 |
| `storage.py` | 디렉토리 생성, raw/card 쓰기, 같은 id 쌍 보장 | 임시 홈에서 쓰고 다시 읽기 |

### M2 · 스크립트 (반나절)

`core/`를 부르는 얇은 CLI. 판단 로직을 넣지 않는다.

- `save_raw.py --session-id <id> [--cwd <path>]` → transcript를 찾아 redact 후 `raw/{id}.md` 저장, `{id, path, redacted}` JSON 출력. 찾지 못하면 실패 사유를 출력하고 종료 코드 1(SKILL.md가 접근 A로 넘어간다).
- `save_card.py --file <card.json> --raw-id <id>` → 검증 → redact → `.md`/`.json` 저장, 경로 출력. 스키마 위반이면 필드별 오류를 출력해 모델이 고쳐서 다시 호출한다.

### M3 · `SKILL.md` (반나절)

- 트리거: "Experii해줘", "경험 정리해줘", `/experii`. 뒤에 붙은 문구를 주제·태그·`learning_id` 힌트로 쓴다(FR-06, FR-08).
- 절차: ① `save_raw.py` → ② raw를 읽고 카드 JSON 작성 → ③ `save_card.py` → ④ 한 줄 요약·면접 한 마디·경로를 보여 주고, `.md`의 `useful`을 채워 달라고 요청한다.
- 규칙: 세션에 없는 성과·수치를 지어내지 않는다. 공부 내용이 없는 세션이면 중단한다. 가린 비밀값의 종류를 보고한다.

### M4 · E2E 검증 (반나절)

- 정션 설치 후 **다른 폴더**에서 실제 공부 세션을 열고 `Experii해줘`를 실행한다.
- 확인: raw에 원문이 빠짐없이 들어갔는가, 카드가 prd 10장 포맷인가, 의도적으로 넣은 가짜 키가 가려졌는가.
- 컨텍스트 압축이 일어난 긴 세션에서도 한 번 실행한다(접근 B의 장점을 실제로 확인).

### M5 · 도그푸딩 2주

- 매 세션 `Experii해줘`. 실패하면 사유를 기록한다(H1).
- 카드마다 `useful: true/false`를 채운다(H2 ≥ 60%).
- 2주 뒤 카드를 면접 준비에 다시 쓴 경험을 정성 기록한다(H3).
- 집계는 `.md` 프런트매터를 읽는 일회성 스크립트로 한다(FR-09 목록 기능은 만들지 않는다).

## 2. 레포 구조 (목표)

```
Experii/
  skill/experii/
    SKILL.md
    scripts/  save_raw.py  save_card.py
    core/     __init__.py paths.py models.py redact.py transcript.py format.py storage.py
    tests/    test_*.py  fixtures/
  Pre_MVP/  prd.md  tsd.md  plan.md
```

## 3. 범위 밖 (이번 계획에서 만들지 않음)

MCP 서버, 웹 UI, 카드 목록 명령(FR-09), 카드 조합·callback, 학습 ID 채번, 중복 판정.

## 4. 리스크

| 리스크 | 대응 |
|---|---|
| `${CLAUDE_SESSION_ID}`가 Skill에서 치환되지 않음 | 최근 수정 JSONL로 대체하되, cwd가 일치하는지 확인해 다른 세션을 잘못 잡지 않게 한다 |
| JSONL 포맷이 Claude Code 버전에 따라 바뀜 | 모르는 이벤트는 건너뛰는 방어적 파서, 실제 픽스처 테스트. 실패하면 접근 A로 대체 |
| raw에 민감한 대화가 남음 | 저장 전 redact, 저장 경로를 매번 안내, `.experii/`는 레포에 올리지 않는다(.gitignore) |
| 카드가 면접용으로 부족함(H2 미달) | SKILL.md 지침과 카드 포맷만 고쳐 재측정한다. 코어는 바꾸지 않는다 |
