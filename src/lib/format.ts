export function formatPrice(amount?: number) {
  if (!amount) return 'Price on request';
  return `From US$${amount.toLocaleString('en-US')} pp`;
}

/** Split a multi-paragraph string from the content collections into paragraphs. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
