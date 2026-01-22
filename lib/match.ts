function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

const ALIASES: Record<string, string[]> = {
  "coca cola": ["coke", "coca-cola", "cocacola"],
  "pepsi": ["pepsi cola"],
};

export function buildQueryVariants(rawQuery: string) {
  const q = normalize(rawQuery);
  const variants = new Set<string>([q]);

  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    const c = normalize(canonical);
    const a = aliases.map(normalize);

    if (q === c) a.forEach(v => variants.add(v));
    if (a.includes(q)) variants.add(c);
  }

  return [...variants].filter(Boolean);
}

export function isMatch(label: string, queryVariants: string[]) {
  const l = normalize(label);

  if (queryVariants.includes(l)) return true;

  return queryVariants.some(v => l.includes(v) || v.includes(l));
}
