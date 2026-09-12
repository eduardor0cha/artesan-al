import { domainError, err, ok, type Result } from '../shared/result'

const COUNTRY_CODE = '55'
const NATIONAL_LENGTH = 11
const FIRST_AREA_CODE = 11
const LAST_AREA_CODE = 99

/**
 * A Brazilian mobile number with its area code. Only mobiles are accepted because both uses the
 * platform has for a number need one: the recovery code arrives by message, and the visitor talks
 * to the artisan on WhatsApp.
 */
export class PhoneNumber {
  private constructor(readonly digits: string) {}

  static create(raw: string): Result<PhoneNumber> {
    const digits = stripCountryCode(raw.replace(/\D/g, ''))

    if (digits.length !== NATIONAL_LENGTH) {
      return err(
        domainError('phone.invalid_length', 'Escreva o celular com DDD, como em (82) 99999-9999.'),
      )
    }

    const areaCode = Number(digits.slice(0, 2))

    if (areaCode < FIRST_AREA_CODE || areaCode > LAST_AREA_CODE) {
      return err(domainError('phone.invalid_area_code', 'Este DDD não existe.'))
    }

    // Every Brazilian mobile gained a leading 9 in 2016; a number without it is a landline, which
    // receives neither the recovery code nor a WhatsApp message.
    if (digits[2] !== '9') {
      return err(domainError('phone.not_a_mobile', 'Informe um número de celular.'))
    }

    return ok(new PhoneNumber(digits))
  }

  /** How the artisan says it: (82) 99999-9999. */
  get formatted(): string {
    return `(${this.digits.slice(0, 2)}) ${this.digits.slice(2, 7)}-${this.digits.slice(7)}`
  }

  /** With the country code, the shape wa.me and a message provider expect. */
  get international(): string {
    return `${COUNTRY_CODE}${this.digits}`
  }

  equals(other: PhoneNumber): boolean {
    return this.digits === other.digits
  }
}

/**
 * Area code 55 is a real one (Santa Maria, RS), so a leading 55 only means Brazil when what is
 * left is exactly a national number.
 */
function stripCountryCode(digits: string): string {
  return digits.length === NATIONAL_LENGTH + COUNTRY_CODE.length && digits.startsWith(COUNTRY_CODE)
    ? digits.slice(COUNTRY_CODE.length)
    : digits
}
