/**
 * Infer an appropriate icon for a knowledge item based on its name and category
 */
export function inferIconForItem(name: string, category?: string): string {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  const has = (s: string) => n.includes(s) || c.includes(s);

  if (has("canvas") || has("story")) return "FileText";
  if (has("experiment") || has("a/b") || has("ab test")) return "TrendingUp";
  if (has("5 whys") || has("five whys") || has("why")) return "Lightbulb";
  
  return "BookOpen"; // sensible default
}
