export function normalizePublisherName(raw: string): string {
  return String(raw || "")
    .replace(/\s+Weekly Total\s*$/i, "")
    .trim();
}

export function slugifyPublisherName(name: string): string {
  return normalizePublisherName(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function publisherSlugMatches(slug: string, rawPublisher: string): boolean {
  return slugifyPublisherName(rawPublisher) === String(slug || "").trim().toLowerCase();
}

