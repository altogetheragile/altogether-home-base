import { createClient } from '@/lib/supabase/server';
import { BOARD_PAGES, type BoardPage } from './boardPages';
import { BOARD_INPUTS, BOARD_OUTPUTS, BOARD_DESC, type BoardChip } from './boardLabels';

// The board's words, with whatever a trainer has changed laid over them.
//
// Shipped defaults are generated into this app alongside the App's copy of them, from the same
// design file. Overrides live in `zoo_copy`, which is where the game's copy editor writes - so a
// sentence polished at 9pm from inside the game reaches the public page too, without a deploy and
// without a second place to edit.
//
// Read-only here: the Site shows this page, it does not offer to change it. The editor is in the
// game, beside the thing it is editing.

export interface BoardContent {
  pages: BoardPage[];
  inputs: BoardChip[][];
  outputs: BoardChip[][];
  desc: [string, string][];
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Everything on the board, overrides applied. Falls back to the shipped wording if the database
 *  cannot be reached: a reference page is better out of date than missing. */
export async function boardContent(): Promise<BoardContent> {
  const out: BoardContent = {
    pages: clone(BOARD_PAGES),
    inputs: clone(BOARD_INPUTS),
    outputs: clone(BOARD_OUTPUTS),
    desc: clone(BOARD_DESC),
  };

  let saved: Record<string, string> = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('zoo_copy').select('key, value').like('key', 'board.%');
    saved = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    /* shipped wording it is */
  }
  if (!Object.keys(saved).length) return out;

  // The keys are the ones `src/components/zooGame/copy.ts` registers. Read here rather than
  // shared, because the two apps cannot import from each other - and held to it by a test that
  // walks the App's own registry and checks every key it issues is one this understands.
  const chips = (list: BoardChip[][], kind: string) => list.forEach((col, c) => col.forEach((chip, i) => {
    const v = saved[`board.${kind}.${c}.${i}`];
    if (v !== undefined) chip.t = v;
  }));
  chips(out.inputs, 'inspects');
  chips(out.outputs, 'produces');
  out.desc.forEach((pair, i) => {
    for (const j of [0, 1] as const) {
      const v = saved[`board.desc.${i}.${j}`];
      if (v !== undefined) pair[j] = v;
    }
  });

  for (const page of out.pages) {
    const at = (k: string) => saved[`board.${page.id}.${k}`];
    page.title = at('title') ?? page.title;
    page.lede = at('lede') ?? page.lede;
    page.facts.forEach((fact, i) => {
      fact[0] = at(`fact.${i}.k`) ?? fact[0];
      fact[1] = at(`fact.${i}.v`) ?? fact[1];
    });
    page.secs.forEach((sec, i) => {
      sec[0] = at(`sec.${i}.h`) ?? sec[0];
      sec[1] = at(`sec.${i}.b`) ?? sec[1];
    });
  }
  return out;
}

export const pageIn = (c: BoardContent, id: string) => c.pages.find((p) => p.id === id);
