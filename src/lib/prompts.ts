export function fillTemplate(
  template: string,
  inputs: Record<string, string>
): string {
  return template.replace(/\[([^\]]+)\]/g, (match, key) => inputs[key] ?? match)
}

export function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(/\[([^\]]+)\]/g)
  const seen = new Set<string>()
  for (const match of matches) seen.add(match[1])
  return Array.from(seen)
}
