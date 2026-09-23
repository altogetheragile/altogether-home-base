import { useState } from 'react';
import { colors as tokenColors } from '@altogether/ui/tokens';
import { resolveColors } from '@altogether/ui/brand';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RotateCcw, Check } from 'lucide-react';

// ============= The brand, editable =============
//
// Both apps render from CSS custom properties now, so a colour here reaches every page without a
// rebuild. Empty means "use the token", which is what altogetheragile.com wants: its brand IS the
// tokens, so this page should stay blank here and be filled in on a site that is not this one.
//
// Twelve fields rather than a theme editor on purpose. The palette is small and fixed, and the
// thing being configured is which twelve colours, not how they are combined.

/** What each colour is for, so somebody filling this in on a new site knows what they are
 *  choosing rather than guessing from a name. */
const MEANING: Record<string, string> = {
  white: 'Page background',
  skyTeal: 'The palest tint, for quiet panels',
  paleTeal: 'A tinted block, cards and callouts',
  lightTeal: 'Borders and text on dark bands',
  midTeal: 'Links, and the lighter of the two brand darks',
  deepTeal: 'Headings, and the darkest brand colour',
  heroTeal: 'The full-width bands behind headings',
  orange: 'The one thing you are being asked to do',
  orangeHover: 'That, hovered',
  body: 'Body text',
  muted: 'Secondary text',
  danger: 'Errors and destructive actions',
};

type Props = {
  value: { colors?: Record<string, unknown> | null } | null | undefined;
  onChange: (next: { colors: Record<string, string> }) => void;
};

export function BrandColours({ value, onChange }: Props) {
  const saved = (value?.colors ?? {}) as Record<string, string>;
  const [draft, setDraft] = useState<Record<string, string>>(saved);
  const resolved = resolveColors({ colors: draft });
  const names = Object.keys(tokenColors) as (keyof typeof tokenColors)[];

  const set = (name: string, hex: string) => {
    const next = { ...draft };
    if (!hex.trim()) delete next[name];
    else next[name] = hex.trim().toUpperCase();
    setDraft(next);
    onChange({ colors: next });
  };

  const invalid = (name: string) => {
    const v = draft[name];
    return !!v && !/^#[0-9a-fA-F]{6}$/.test(v);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Colours</CardTitle>
        <CardDescription>
          Leave a field empty to use the default. Changes reach both the public site and this app
          without a rebuild.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {names.map((name) => (
          <div key={name} className="flex items-center gap-4">
            <div
              className="h-10 w-10 shrink-0 rounded-md border"
              style={{ background: resolved[name] }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor={`brand-${name}`} className="text-sm font-medium">{name}</Label>
              <p className="truncate text-xs text-muted-foreground">{MEANING[name] ?? ''}</p>
            </div>
            <Input
              id={`brand-${name}`}
              value={draft[name] ?? ''}
              placeholder={tokenColors[name]}
              onChange={(e) => set(name, e.target.value)}
              className={`w-36 font-mono text-sm ${invalid(name) ? 'border-destructive' : ''}`}
              aria-invalid={invalid(name)}
            />
            {draft[name] && (
              <Button variant="ghost" size="sm" onClick={() => set(name, '')} title="Use the default">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground">
          {Object.keys(draft).length === 0
            ? <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Using the default brand throughout.</span>
            : `${Object.keys(draft).length} of ${names.length} changed. Anything not a six-digit hex is ignored, so a typo costs that colour and not the site.`}
        </p>
      </CardContent>
    </Card>
  );
}
