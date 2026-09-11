const BRAZIL_COUNTRY_CODE = '55'

/** A Brazilian mobile number is 11 digits with the area code; anything longer already has 55. */
const NATIONAL_NUMBER_LENGTH = 11

/**
 * Builds the `wa.me` link that opens a conversation with the message already written. Artisans
 * type their number the way they say it — area code plus line — so the country code is added here
 * rather than demanded from them at sign-up.
 */
export function buildWhatsAppHref(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const international =
    digits.length > NATIONAL_NUMBER_LENGTH ? digits : `${BRAZIL_COUNTRY_CODE}${digits}`

  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}
