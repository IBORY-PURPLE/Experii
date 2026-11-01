import { describe, expect, it } from 'vitest';
import { CONTEXT_VERSION, appContext } from '../../src/main/context';

describe('appContext', () => {
  it('names the subject, the model and where to change it, and ends with its version', () => {
    const lines = appContext({
      subject: 'SQLD',
      model: 'gpt-6.1-sol',
      modelName: 'GPT-6.1 Sol',
      toolsOn: true,
    }).split('\n');
    expect(lines).toContain('지금 과목: SQLD');
    const model = lines.find((l) => l.startsWith('지금 모델'))!;
    expect(model).toContain('GPT-6.1 Sol (gpt-6.1-sol)');
    expect(model).toContain('입력창 아래');
    expect(lines.join('\n')).toContain('search_experience_cards');
    expect(lines.join('\n')).toContain('웹 검색');
    expect(lines.at(-1)).toBe(`맥락 버전: ${CONTEXT_VERSION}`);
    expect(lines.length).toBeLessThanOrEqual(16);
  });

  it('offers no tool when tools are off and does not repeat a bare slug', () => {
    const text = appContext({
      subject: 'SQLD',
      model: 'gpt-x',
      modelName: 'gpt-x',
      toolsOn: false,
    });
    expect(text).not.toContain('search_experience_cards');
    expect(text).toContain('지금 모델: gpt-x.');
  });
});
