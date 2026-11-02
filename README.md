# Experii

Experii는 AI 에이전트와 공부하다가 중요한 메모나 모르는 지점을 원터치로 AI Board에 모으면, 에이전트가 보드를 정리하고 다음 학습을 추천하는 자율학습형 AI 에이전트다. 학습의 끝은 AI 면접관의 면접 질문에 답하는 일이고, 그렇게 쌓인 것이 면접과 실무에서 꺼내 쓸 경험이 된다. Windows 데스크톱 앱이다.

> 제품 기준은 [PRD.md](PRD.md) 하나다. 현재 단계는 단계 1(AI Board)이다. main에는 로그인, 대화, 경험 카드, 로드맵, 드래그 필기가 있고 창업자 PC에서 써 보는 중이다. 화면 캡처, 붙여넣기, 타이핑 메모, 자동 정리, 보드를 읽는 추천, AI 면접관은 아직 없다.

## 핵심 루프

1. **공부:** 왼쪽에서 학습 주제를 고르고 오른쪽 AI 에이전트와 대화한다.
2. **원터치 필기:** 중요한 것을 화면 캡처, 드래그, 붙여넣기, 타이핑으로 가운데 AI Board에 바로 남긴다.
3. **자동 정리와 다음 학습:** 에이전트가 보드를 정리하고, 읽은 내용으로 다음 학습 3가지를 추천한다.
4. **스스로 고르기:** 추천을 따라가거나 AI와 새 대화로 이어 간다.
5. **AI 면접 (프리미엄):** AI 면접관이 실제 면접 질문을 던지고 사용자가 답한다. 통과하면 학습이 완료되고 경험으로 쌓인다.

## 화면

| 왼쪽 | 가운데 (메인) | 오른쪽 |
|---|---|---|
| 학습 주제와 쌓인 경험 | AI Board | AI 에이전트 대화 |

## GPT 연결

- **Phase A (지금):** 내 ChatGPT Plus 계정으로 "Continue with ChatGPT" 로그인. 창업자 PC에서만 쓴다.
- **Phase B (만들지 않음):** 릴레이 서버 방식이다. 2026-11-02에 Phase C 승인을 기다리기로 했다.
- **Phase C (OpenAI 승인 뒤):** 사용자가 자기 ChatGPT 계정으로 로그인한다. 공개 출시는 이때 한다.

## 데이터

대화, 필기, 카드, 로드맵은 내 PC에만 저장된다. 지금은 Experii 서버가 없다. 대화 내용은 답을 받기 위해 OpenAI로만 전송된다. 에이전트가 보드를 읽게 되면 보드 내용도 함께 전송된다([PRD.md](PRD.md) 9장).

## 폴더

| 경로 | 내용 |
|---|---|
| `apps/desktop/` | 데스크톱 앱 (Electron + React + TypeScript) |
| `landing/` | 사전 신청 랜딩페이지 (Next.js). 곧 `apps/landing/`으로 옮긴다 |
| `docs/desktop/` | 데스크톱 앱 TSD(설계와 단계별 계획) |
| `docs/archive/` | 이전 자료. 보관만 하고 따르지 않는다 |
| `.agents/`, `scripts/agents/`, `.claude/`, `.github/` | 개발 하네스: 에이전트 운영 규칙, 게이트, CI |

## 실행

설치:

```bash
npm --prefix apps/desktop ci
```

실계정으로 실행(ChatGPT Plus·Pro 로그인):

```bash
npm --prefix apps/desktop start
```

로그인 없이 가짜 OpenAI 서버로 실행(QA용, 데이터는 `%APPDATA%/Experii-dev`):

```bash
npm --prefix apps/desktop run dev:mock
```

테스트:

```bash
npm --prefix apps/desktop test
```

- Node는 `.nvmrc`의 버전(22.18)을 쓴다.
- 설치와 설치 파일 만들기는 Claude 앱 안의 셸이 아니라 Terminal 패널이나 일반 터미널에서 실행한다. 앱 안의 셸로 하면 Electron 캐시가 숨겨진 폴더로 들어간다.
