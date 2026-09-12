import { tintKey, type Tint } from './tint';

/** The filters themselves, one per distinct tint in use. */
export function TintDefs({ where, tints }: { where: string; tints: Iterable<Tint> }) {
  const seen = new Map<string, Tint>();
  for (const t of tints) seen.set(tintKey(t), t);
  if (!seen.size) return null;
  return (
    <defs>
      {[...seen].map(([key, t]) => (
        // sRGB rather than the default linearRGB: the CSS shorthand this replaces works in sRGB, and
        // in linear space the same numbers come out visibly paler.
        <filter key={key} id={`${where}-${key}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="hueRotate" values={`${t.hue}`} />
          <feColorMatrix type="saturate" values={`${t.sat.toFixed(3)}`} />
          <feComponentTransfer>
            <feFuncR type="linear" slope={t.bright.toFixed(3)} />
            <feFuncG type="linear" slope={t.bright.toFixed(3)} />
            <feFuncB type="linear" slope={t.bright.toFixed(3)} />
          </feComponentTransfer>
        </filter>
      ))}
    </defs>
  );
}
