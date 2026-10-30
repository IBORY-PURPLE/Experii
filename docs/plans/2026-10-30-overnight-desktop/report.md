# 10월 30일 밤 보고

> 오케스트레이터가 밤새 고쳐 쓴다. 마지막 갱신: 2026-10-30 22:38.

## 아침에 먼저 볼 것

(작업이 끝나면 채운다)

## 세션별 결과

| 세션 | PR | 상태 | 검사 | 메모 |
|---|---|---|---|---|
| ① 문서 | (이 PR) | 열림 | 문서만 | |
| ③ 대화 두뇌 | [#13](https://github.com/IBORY-PURPLE/Experii/pull/13) | 열림 (20:50) | typecheck, 단위 167, oxlint, oxfmt(LF), package, e2e 21 통과(세션 보고) | 맥락 메시지 `ctx-v1`, `models:list`·`conversations:setModel`, 도구 `search_experience_cards`(namespace → additional_tools → 평면 → 끔, `settings.tools_enabled=0`으로 끔), `chat:tool`, MCP 설계 메모. #10·#11·#12를 품음 |
| ④ 카드 속도 | [#11](https://github.com/IBORY-PURPLE/Experii/pull/11) | 열림 (20:40) | typecheck, 단위 141, oxlint, oxfmt(LF), package, e2e 17 통과. 오케스트레이터가 단위·typecheck 다시 돌려 확인 | 진행 이벤트 `cards:event`, 추론 low(거부되면 끔), `[cards]` 시간 로그, `card-v1.1`. e2e 4번 중 2번은 PC 부하(node 46개)로 Electron 켜기·닫기 30초 초과 |
| ⑤a 화면 A | [#14](https://github.com/IBORY-PURPLE/Experii/pull/14) | 열림 (20:58) | typecheck, 단위 175, oxlint, oxfmt(LF), package, e2e 28 통과(세션 보고). 오케스트레이터가 이 브랜치에서 단위 175·typecheck 다시 통과 확인 | `remark-gfm` 4.0.1, 표 가로 스크롤·NULL 회색, 좌우 접기(`Panes.tsx`, localStorage `experii.layout.v1`, Ctrl+B·Ctrl+Shift+B), 스크린샷 3장. #10~#13을 품음 |
| 설계서 | [#12](https://github.com/IBORY-PURPLE/Experii/pull/12) | 열림 (20:47) | 문서만. Mermaid 8개 렌더 확인 | `flow-v2.md`. 시안 선택 대기 상태로 세 방향을 모두 적음. 추천안 표와 창업자가 정할 것 5개 |
| 리서치 | [#15](https://github.com/IBORY-PURPLE/Experii/pull/15) | 열림 (21:19) | 문서만. 출처 117개를 원문에서 확인했다고 보고 | 결론 "지도·점검·설명": SQLD 출제기준 칸 지도 + 회상 점검·복습 일정(FSRS)이 후보를 내고 GPT는 후보 안에서 고르고 근거를 단다. 창업자가 정할 것 4개. 문서 하나라 다른 PR과 겹치지 않음 |
| ⑥ 필기 페이지 | | 시안 선택 대기 (22:25에 A·B·C 캡처 전달, 추천 A) | | 23:30까지 답이 없으면 아침으로 넘김(ai.md 5장) |
| ⑤b 화면 B | [#16](https://github.com/IBORY-PURPLE/Experii/pull/16) | 열림 (22:05) | typecheck, 단위 196, oxlint, oxfmt(LF), package, e2e 33 통과(작업자 보고). 오케스트레이터가 단위 196·typecheck 다시 통과 확인 | 모델 드롭다운(`ModelSelect.tsx`), 도구 호출 줄(`ToolLines.tsx`), `unsupported`·`tool_limit` 배너("다시 보내기"가 질문을 두 번 보이던 기존 버그도 고침), 카드 점진 표시. e2e는 PC 부하로 4번 연속 Electron 켜기·닫기 30초 초과 → 부하가 내려간 뒤 33/33. 백그라운드 작업자로 돌림. #10~#15를 품음 |

## 밤에 정한 것

- 진행 방식: 예약 점검(30분마다) 턴과 Remote Control에서 온 메시지로는 앱이 새 세션을 띄우지 않는다. 그래서 ⑤b부터는 오케스트레이터 세션 안의 백그라운드 작업자로 돌린다. 규칙(ai.md 3.0)은 같다.
- PR이 쌓이는 모양: 나중에 연 PR이 앞 PR을 모두 품는다(#13은 #10·#11·#12, #14는 #10~#13). 그래서 열린 순서대로 병합하면 충돌이 없고, 맨 위 PR 하나만 병합해도 앞 PR들이 함께 들어간다.

- ④: 진행 중 글에도 비밀 가리기 적용, reasoning 거부는 `error.param`이 `reasoning`으로 시작할 때만, `card_reasoning=off` 되돌리는 화면 없음(settings 행 삭제), `dev:mock` 카드 속도는 `MOCK_CARD_DELAY`(기본 0). 자세히는 #11 본문.

## 못 한 것

## 병합 순서

PR이 열린 순서대로, "Create a merge commit"으로 병합한다.
