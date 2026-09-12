/**
 * Reading and writing a price the way the artisan types it. Money is stored in cents, but nobody
 * types cents: what arrives is "85", "85,50" or "R$ 1.200,00", and what goes back into the field
 * on an edit has to look the same as what was typed.
 */

/** Blank means "a combinar"; `undefined` means what was typed is not a price at all. */
export function parsePriceInput(value: string): number | null | undefined {
  const raw = value.trim()

  if (raw === '') return null

  // Brazilian notation: the comma separates the cents and the dot groups the thousands.
  const digits = raw
    .replace(/^R\$\s*/i, '')
    .replace(/\./g, '')
    .replace(',', '.')

  if (!/^\d+(\.\d{1,2})?$/.test(digits)) return undefined

  return Math.round(Number(digits) * 100)
}

/** The value for the field of a piece already published — no currency sign, which is not typed. */
export function formatPriceInput(cents: number | null): string {
  if (cents === null) return ''

  return (cents / 100).toFixed(2).replace('.', ',')
}
