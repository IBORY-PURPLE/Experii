import type { CardBody } from '../../src/shared/card';

export function cardBody(overrides: Partial<CardBody> = {}): CardBody {
  return {
    title: 'SQL 조인 순서를 실행 계획으로 확인했다',
    summary: 'INNER JOIN과 LEFT JOIN의 결과 차이를 예제 테이블로 비교했다.',
    interview_line:
      '조인 결과가 예상과 달라 실행 계획을 열어 원인을 찾았습니다.',
    star: {
      situation: 'SQLD 기출에서 LEFT JOIN 결과 행 수가 헷갈렸다.',
      task: '왜 NULL 행이 생기는지 설명할 수 있어야 했다.',
      action: '작은 테이블 두 개로 직접 쿼리를 돌려 비교했다.',
      result: null,
    },
    concepts: ['INNER JOIN', 'LEFT JOIN'],
    next_steps: 'OUTER JOIN에서 WHERE와 ON 조건의 차이를 정리한다.',
    recommended_next: [
      {
        title: 'ON과 WHERE 조건 차이',
        reason: '대화 끝에서 조건 위치가 헷갈린다고 했다.',
      },
    ],
    ...overrides,
  };
}
