type Option = { readonly value: string; readonly label: string };

export function ChoiceChips({
  name,
  legend,
  hint,
  type,
  options,
  selected,
  onToggle,
  error,
}: {
  name: string;
  legend: string;
  hint?: string;
  type: 'radio' | 'checkbox';
  options: readonly Option[];
  selected: readonly string[];
  onToggle: (value: string, checked: boolean) => void;
  error?: string;
}) {
  const errorId = `e-${name}`;
  return (
    <fieldset className="field" data-invalid={error ? '' : undefined} aria-describedby={error ? errorId : undefined}>
      <legend>
        {legend}
        {hint ? <small>{hint}</small> : null}
      </legend>
      <div className="chips">
        {options.map((o) => (
          <label className="chip" key={o.value}>
            <input
              type={type}
              name={name}
              value={o.value}
              checked={selected.includes(o.value)}
              onChange={(e) => onToggle(o.value, e.target.checked)}
              aria-invalid={error ? true : undefined}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="err" id={errorId}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
