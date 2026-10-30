export function dayLabel(at: number, now = Date.now()): string {
  const d = new Date(at);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return '오늘';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function rateLabel(useful: boolean | null): string {
  if (useful === null) return '평가 전';
  return useful ? '쓸 만해요' : '아니에요';
}

export const SUBJECT_COLORS = ['#3d5a99', '#2f6f5e', '#a3325c', '#9a5b13'];
