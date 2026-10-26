# 랜딩페이지 밤샘 실행 계획 (2026-10-26)

## ★ 23:4x 추가: 꼭 수정해야 할 것 (창업자 지시, 브리프 "필수 수정" M1~M5)

- [ ] **M1** 히어로를 Aside식으로: 가운데 제목 + `Windows 앱 다운로드` + 가운데 **Experii 데스크톱 앱 창**. 창 안에서 SQLD 질문 타이핑 → 대화 → 과제 → **커서가 움직여 보기를 누름** → 경험 카드 → 1·7·30일 알림 → 같은 카드 다시 열림을 자동 재생(일시정지·다시 보기). 관찰 노트: `landing/research/11-aside-hero-motion.md`
- [ ] **M2** 다운로드 버튼(히어로·헤더): 앱이 없으므로 정직한 가짜 문 — 클릭률은 `download_click` 이벤트로 재고, 누르면 "출시 전, 사전 신청하면 링크를 보내 드려요" 안내 + 신청으로 연결
- [ ] **M3** 폰 목업 제거 → 섹션 4도 같은 데스크톱 앱 창으로
- [ ] **M4** 데스크톱 화면(1440·1280)만 완성 기준. 모바일은 깨지지만 않게
- [ ] **M5** 중단된 루프 결함 8개 마감(M3로 사라지는 것은 로그에 표시)

바뀐 운영 결정: 다른 세션이 이 폴더에서 돌고 있지 않아 worktree 대신 **현재 체크아웃에 `landing-overnight` 브랜치**를 만든다(3000번 dev 서버가 그대로 따라온다). 실행은 이 세션에서 pstack poteto-mode 원칙 + 내장 `/loop`(자기 페이스)로, 무거운 작업은 `pstack:poteto-agent` 서브에이전트에게 맡긴다.

인터뷰로 확정한 것: 목표는 **검증까지 끝난 완성본**, 방식은 **pstack poteto-mode + /loop**, 반복마다 **커밋**(push 없음), **새 브랜치**에서 작업, 막히면 **3회 연속 실패 시 중단**, 아침에 **결정 로그 + 요약 + 주의 항목**. 기준선은 지금 미커밋 상태 전부를 커밋해서 만든다.

에이전트가 읽을 브리프: [.agents/briefs/landing-overnight.md](../.agents/briefs/landing-overnight.md)

## 0. 지금 상태 (사실)

| 항목 | 상태 |
|---|---|
| 정적 섹션 6개, 사전 신청 폼, 처리방침, OG 이미지 | 구현 완료. 단위 23개·E2E 18개 통과(18:40 기준) |
| 섹션 4 루프(GPT 학습 화면) | 빌드 완료, 독립 검증에서 결함 8개 발견(중요 2: 칩 앵커 위치, 맥락 요소 대비). **수정 에이전트는 19:36에 중단됨**(사용자 인터럽트). 어디까지 고쳤는지 미확인 |
| git | `landing/`, `.agents/`, `scripts/`, `reports/`, `research_notes/` 전부 미커밋. worktree는 main 하나 |
| 실행 환경 | Codex(GPT) 로그인됨, Playwright msedge 동작, gstack browse 동작. `/pstack:poteto-mode`가 이 세션에서 호출되는지는 **미확인** |

## 1. 밤샘 계약 (pstack 07-overnight의 네 줄)

| 줄 | 이 작업에서 |
|---|---|
| 세션 오버라이드 | "자러 간다. 묻지 말고 계속 간다" |
| 완료 조건 | 브리프의 체크 8개. 전부 명령으로 통과/실패 판정 가능 |
| 격리 | `main`에서 `landing-overnight` 브랜치 + worktree. dev 서버는 3100 포트 |
| 권한 | 반복마다 커밋. push·PR·병합·패키지 변경·PRD/TSD 수정·외부 서비스 연결 금지 |
| 탈출구 | 같은 검사 3회 연속 실패 → 중단 + `BLOCKED.md` |

## 2. 시작 전 체크리스트 (사람이 자기 전에, 약 30분)

| # | 할 일 | 누가 | 왜 |
|---|---|---|---|
| P1 | 죽은 루프 워크플로를 정리하고, `components/loop/*` 현재 상태로 `tsc`·`vitest`·`playwright`를 한 번 돌려 **기준선**을 잰다 | Claude | 루프가 "이미 통과한 지점"에서 출발해야 진전/후퇴를 판정할 수 있다 |
| P2 | 미커밋 파일 전부를 main에 커밋 (작성자 Claude, 공동 작성자 본인) | Claude | worktree는 커밋된 기준에서만 만들어진다 |
| P3 | `landing-overnight` 브랜치·worktree 생성 (`EnterWorktree`) | Claude | main 체크아웃과 3000번 dev 서버를 그대로 둔다 |
| P4 | `/pstack:poteto-mode`가 호출되는지 확인. 안 되면 대체: 같은 계약을 이 세션의 워크플로 + 내장 `/loop`(ScheduleWakeup)로 돌린다 | Claude | 방식 선택이 성립하는지 |
| P5 | **첫 반복 1회를 지켜본다**(약 10~15분): 검사 → 변경 → 검증 → 커밋 → 로그 한 줄이 실제로 돈 뒤에 자리를 뜬다 | 본인 | pstack 원칙: 직접 본 적 없는 루프는 혼자 두지 않는다 |
| P6 | 아침 알림은 없음(요청 안 함). 깨면 `/pstack:show-me-your-work`나 요약 파일을 연다 | 본인 | — |

## 3. 루프 한 바퀴 (예상 5~7바퀴)

```
[A] 완료 조건 8개 전부 실행 → 실패 목록 만들기
      └ 전부 통과 → 종료 (요약 작성)
[B] 실패 중 하나를 고른다 (중요도 순: 빌드 > 테스트 > 재현된 결함 > 넘침·글자)
[C] 증거가 정당화하는 가장 작은 변경
[D] 그 검사만 다시 → 통과하면 커밋, 아니면 되돌림
[E] .audit TSV 한 줄 (ts, phase, decision, why, evidence, result)
      └ 같은 검사 3회 연속 실패 → BLOCKED.md, 중단
→ [A]
```

단계별 예상 순서:
1. **루프 결함 마감**: 검증자가 남긴 8개(앵커 오프셋, `.ctx` 대비, 모바일 눈금 자, 1024px 폰 삐져나옴, 이어 보기 종료 상태, ③ 조각 조기 표시, 320px 표, 모바일 포커스 순서)를 재현해 고친다
2. **E2E 보강**: DESIGN.md 7장 V-3~V-26을 테스트로 옮긴다(루프 상태별 넘침, 키보드, no-JS 탭 역할 없음, 이어 보기 10초 시점). 완료 조건 6·7이 이걸 요구한다
3. **프로덕션 빌드** 3100 포트 기동
4. **검증 에이전트 2개**: 로렌 탄 시각(pstack 원칙 + `verify-this`), Cursor 개발자 시각(코드 리뷰 + CPU 4배 스로틀 성능 측정 + Codex GPT 교차 리뷰). 준비된 스크립트: `scratchpad/verify-workflow.js`
5. **재현 판정**: 지적마다 반박 에이전트가 재현 시도. 재현된 것만 결함으로 남긴다
6. 확정 결함 수정 → [A]로

## 4. 안전장치

- 반복마다 커밋이 되돌릴 지점이다. 실패한 변경은 `git checkout -- .`으로 버린다
- `--dangerously-skip-permissions`류 플래그는 쓰지 않는다. Codex는 `-s read-only`로만 부른다
- 파일 범위 밖(PRD·TSD·DESIGN·research·supabase·dependencies)은 건드리지 않는다. 문서와 어긋나는 점을 발견하면 고치지 말고 요약의 주의 항목에 적는다
- 타이머·브라우저 프로세스는 반복이 끝날 때 정리한다(gstack browse, playwright 잔존 프로세스)
- 비용: 이 세션은 대화형 Claude Code라 Agent SDK 별도 크레딧 대상이 아니다(ralphex README의 2026-06-15 변경은 `claude -p`에 해당). Codex 호출은 반복당 1~2회로 제한

## 5. 밤에 못 하는 것 (아침에 본인이)

- 카카오톡·인스타그램 인앱, iOS Safari, Android Chrome 실기기 확인 (TSD 15.2)
- 도메인 `experii.app` 구매, Vercel·Supabase 프로젝트 연결, 환경 변수 (TSD 14)
- 처리방침·광고 표기 법률 검토 (TSD 17.3 C5·C6·C9)
- `landing-overnight` 브랜치 검토와 main 병합
- DESIGN.md 8장 "창업자가 확인할 것" 5개 (히어로 서브 문구, 섹션 6 카드 ① 문구, 세트 B·C 파생 문자열, 문의 이메일, TickNav)

## 6. 시작 프롬프트 (P1~P5가 끝난 뒤 그대로 입력)

```text
/pstack:poteto-mode 자러 간다. .agents/briefs/landing-overnight.md 를 읽고 완료 조건 8개가 전부 통과할 때까지 수행해.
worktree는 landing-overnight, 커밋은 묻지 말고 반복마다. push·PR·병합·패키지 변경·PRD/TSD 수정은 하지 마.
결정 로그는 .audit/landing-overnight.tsv. 같은 검사가 3회 연속 실패하면 멈추고 BLOCKED.md에 이유를 써.
/loop until done.
```

P4에서 `/pstack:poteto-mode`가 안 되면 같은 문장을 `/loop`만 붙여 이 세션에 주면 된다. 계약 내용은 동일하다.

## 7. 아침에 읽는 순서

1. `landing/reports/overnight-summary.md`의 **주의 항목**부터
2. `.audit/landing-overnight.tsv`에서 `result`가 `reverted`·`INCONCLUSIVE`·`open`인 줄
3. `BLOCKED.md`가 있으면 그것
4. `git log landing-overnight` 과 3100 포트 미리보기(또는 `npm run build && npm start`)
5. 5장의 실기기 확인
