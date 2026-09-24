/** A colour, as a swatch you click and a value you can paste.
 *
 *  Both, because these get chosen two ways: picked by eye when somebody is designing, and pasted
 *  when a brand guideline already says what the hex is. */
export function ColourBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  /** What empty means here. An unset colour draws a black swatch, because that is what a colour
   *  input does with no value, and black is a claim: it reads as "this card is black" when it
   *  actually means "use the one the site ships". The box says so instead. */
  placeholder?: string;
}) {
  const valid = /^#[0-9a-f]{6}$/i.test(value.trim());
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Pick a colour"
        value={valid ? value.trim() : '#000000'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        title={valid ? value.trim() : placeholder || 'No colour set'}
        className={`h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5 ${valid ? '' : 'opacity-40'}`}
      />
      <input
        value={value}
        placeholder={placeholder || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border border-border bg-background px-2 py-1.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {value.trim() && !valid && (
        <span className="shrink-0 text-xs text-destructive">needs six digits</span>
      )}
    </div>
  );
}
