import type { ModelList, ModelOption } from '../shared/ipc';

type Choice = { options: ModelOption[]; value: string; locked: boolean };

// Without the account's list only the conversation's model shows, and with nothing to choose from the select locks.
export function modelChoice(
  list: ModelList | null,
  model: string | null,
): Choice {
  const value = model ?? list?.current ?? '';
  const options = [...(list?.models ?? [])];
  if (value && !options.some((m) => m.slug === value))
    options.push({ slug: value, displayName: value });
  return {
    options: options.length
      ? options
      : [{ slug: '', displayName: '기본 모델' }],
    value,
    locked: options.length < 2,
  };
}

export function ModelSelect(p: {
  list: ModelList | null;
  model: string | null;
  busy: boolean;
  onPick(slug: string): void;
}) {
  const { options, value, locked } = modelChoice(p.list, p.model);
  const name = options.find((m) => m.slug === value)?.displayName ?? value;
  return (
    <select
      className="model-select"
      aria-label="모델"
      title={value ? `모델: ${name} (${value})` : '모델'}
      value={value}
      disabled={p.busy || locked}
      onChange={(e) => p.onPick(e.target.value)}
    >
      {options.map((m) => (
        <option key={m.slug} value={m.slug}>
          {m.displayName}
        </option>
      ))}
    </select>
  );
}
