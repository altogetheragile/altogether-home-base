import { ItemRows } from './ItemRows';
import { PictureBox } from './PictureBox';
import { IconPicker } from './IconPicker';
import { ColourBox } from './ColourBox';
import { SectionOrder } from './SectionOrder';
import { SECTIONS_FOR_PAGE } from './sections';
import type { CopyField } from './store';

// ============= The right control for one field =============
//
// Pulled out of the drawer so the setup wizard can render the same boxes. Two places drawing a
// colour picker two ways is how a site ends up with two editors again, which is the thing this
// whole editor exists to have one of.
//
// The drawer and the wizard differ in what they ask you to look at, not in what a field is.

export function FieldControl({
  field,
  value,
  page,
  onChange,
  upload,
}: {
  field: CopyField;
  value: string;
  /** Which registry this field belongs to. Only the section order needs it, to know what the
   *  sections of that page are called. */
  page: string;
  onChange: (next: string) => void;
  upload: (file: File) => Promise<string>;
}) {
  const set = (next: string) => onChange(next);

  if (field.type === 'sections') {
    return <SectionOrder value={value} choices={SECTIONS_FOR_PAGE[page] ?? []} onChange={set} />;
  }
  if (field.type === 'items' && field.fields) {
    return <ItemRows value={value} fields={field.fields} onChange={set} upload={upload} />;
  }
  if (field.type === 'image') {
    return <PictureBox value={value} onChange={set} upload={upload} />;
  }
  if (field.type === 'icon') {
    return <IconPicker value={value} onChange={set} />;
  }
  if (field.type === 'colour') {
    return <ColourBox value={value} onChange={set} />;
  }
  if (field.type === 'switch') {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === 'on'}
          onChange={(e) => set(e.target.checked ? 'on' : '')}
          className="h-4 w-4 rounded border-border"
        />
        {/* A status, not a label for the box. "Hidden" beside an unticked box reads as
            "hidden: no" to about half the people who see it.

            Not every switch decides visibility. One that picks a style says its own words, and
            says them in plain type: amber is for a page the public cannot see, not for a choice
            somebody has made. */}
        <span className={value === 'on' || field.says ? '' : 'font-medium text-amber-700'}>
          {value === 'on'
            ? (field.says?.on ?? 'Visible to everyone')
            : (field.says?.off ?? 'Hidden from visitors')}
        </span>
      </label>
    );
  }
  return (
    <textarea
      id={field.key}
      rows={rowsFor(field, value)}
      value={value}
      onChange={(e) => set(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

/** Tall enough for what is in it, so a paragraph is not edited through a slot.
 *
 *  Not exported: a non-component export from a .tsx file trips react-refresh and the lint gate
 *  is at its ceiling. */
function rowsFor(field: CopyField, value: string): number {
  if (field.type === 'text') return 1;
  return Math.min(12, Math.max(2, Math.ceil((value.length || 1) / 60) + (value.match(/\n/g)?.length ?? 0)));
}
