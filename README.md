# Experii

Experii는 공부한 과정을 면접에서 쓸 수 있는 경험으로 쌓아 주는 Windows 데스크톱 앱이다. 앱 안에서 GPT와 대화하며 공부하고, 대화가 끝나면 버튼 한 번으로 그 공부를 경험 카드로 남긴다. 카드는 과목별 로드맵에 칸으로 쌓이고, 칸을 누르면 그때의 대화를 다시 열어 이어서 공부할 수 있다.

> 현재 단계: 데스크톱 MVP v1. 로그인, 대화, 경험 카드, 로드맵이 main에 있고 창업자 PC에서 써 보는 중이다. 2026-10-30에 핵심 루프를 v2(필기 페이지)로 넓혔다. 기준 문서는 [PRD.md](PRD.md) 색인과 [docs/desktop/](docs/desktop/prd.md)이다.

## 핵심 루프 (v2)

1. **공부:** 오른쪽 GPT 패널에서 과목을 골라 대화한다.
2. **필기:** GPT 답에서 남길 부분을 드래그해 가운데 필기 페이지에 놓는다. 대화 하나에 필기 페이지가 하나다.
3. **경험으로 남기기:** 버튼을 누르면 카드(한 줄 요약, 면접 한 마디, STAR, 배운 개념, 다음 할 일)가 생긴다. 카드는 필기 페이지의 요약이다.
4. **로드맵:** 가운데 과목별 세로 경로에 칸이 생기고, 그 뒤에 추천한 다음 칸이 잠긴 채 붙는다.
5. **다시 보기·이어 하기:** 칸이나 카드를 누르면 필기 페이지가 열리고, 오른쪽에서 그 대화를 이어 간다.

## 화면

| 왼쪽 사이드바 | 가운데 | 오른쪽 |
|---|---|---|
| 과목과 쌓인 경험 | 듀오링고식 로드맵과 필기 페이지 | GPT 대화 |

## GPT 연결

- **Phase A (지금):** 내 ChatGPT Plus 계정으로 "Continue with ChatGPT" 로그인. 창업자 PC에서만 쓴다.
- **Phase B (상업 출시 초기):** Experii 릴레이 서버를 거쳐 GPT를 쓰고 비용은 Experii가 낸다.
- **Phase C (OpenAI 승인 뒤):** 사용자가 자기 ChatGPT 계정으로 로그인한다.

## 데이터

대화, 카드, 로드맵은 내 PC에만 저장된다. Experii 서버는 없다. 대화 내용은 답을 받기 위해 OpenAI로만 전송된다.

## 폴더

| 경로 | 내용 |
|---|---|
| `apps/desktop/` | 데스크톱 앱 (Electron + React + TypeScript) |
| `landing/` | 사전 신청 랜딩페이지 (Next.js). 곧 `apps/landing/`으로 옮긴다 |
| `docs/desktop/` | 데스크톱 앱 PRD와 TSD(설계와 단계별 계획) |
| `docs/archive/` | 이전 자료. 보관만 하고 따르지 않는다 |
| `.agents/`, `scripts/agents/`, `.claude/`, `.github/` | 개발 하네스: 에이전트 운영 규칙, 게이트, CI |

## 실행
fgff
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
