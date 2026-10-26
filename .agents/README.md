# Experii 에이전트 작업 환경

Lauren Tan(pstack 작성자)의 3층 구조를 Claude Code로 옮긴 것이다.

| 층 | 하는 일 | 여기서 쓰는 것 |
|---|---|---|
| Outer loop | 매일 아침 레포 상태를 읽고 "오늘 병렬로 돌릴 일" 브리프 초안을 만든다 | 예약 작업 `experii-chief-of-staff` (평일 09:00) → `reports/daily/YYYY-MM-DD.md` |
| Inner loop | 브리프 하나 = 백그라운드 에이전트 하나 = worktree 하나 | `scripts/agents/spawn.ps1` → `claude --bg -w` |
| 검증 | 완료 조건을 매 반복 확인하고, 결정 로그를 남긴다 | `/pstack:poteto-mode`, `.audit/<slug>.tsv` |

## 하루 흐름

1. 아침: `reports/daily/<오늘>.md`를 읽는다. 초안 브리프는 `.agents/briefs/draft-*.md`로 생긴다.
2. 고를 브리프의 `draft-` 접두사를 떼고 완료 조건을 다듬는다. 서로 같은 파일을 건드리는 브리프는 같이 돌리지 않는다.
3. 띄운다.
   ```powershell
   .\scripts\agents\spawn.ps1 -Brief .agents\briefs\m1-redact.md, .agents\briefs\m1-paths.md
   ```
4. 지켜본다.
   ```powershell
   claude agents              # 목록·상태
   claude logs <id>           # 최근 출력
   claude attach <id>         # 들어가서 직접 대화
   ```
5. 검토: 각 worktree의 `.audit/<slug>.tsv`와 커밋을 본다. 끝난 세션에서 `/pstack:show-me-your-work` 또는 `/pstack:ketchup`으로 요약을 받는다.
6. 병합은 사람이 한다. 끝나면 `claude rm <id>`로 세션과 worktree를 정리한다.

## 규칙 (pstack 원칙에서 가져옴)

- 완료 조건은 통과/실패로 판정할 수 있어야 한다. 기간("4시간 동안")은 완료 조건이 아니다.
- 한 브리프는 다른 브리프와 파일이 겹치지 않는다.
- 사람이 직접 한 번 해 보거나 지켜본 종류의 일만 무인으로 돌린다.
- 같은 실패가 반복되면 브리프 템플릿·CLAUDE.md·스킬에 규칙으로 박는다.
- 처음엔 2~3개만 병렬로. 검토할 수 있는 양이 상한이다.
