import { domainError, err, ok, type Result } from '../shared/result'

const CPF_LENGTH = 11

/**
 * The artisan's login identifier. It is personal data under the LGPD: never render it on a public
 * page, never put it in a URL, and never write it to a log — use `masked` when a human needs to
 * recognise their own document.
 */
export class Cpf {
  private constructor(readonly digits: string) {}

  static create(raw: string): Result<Cpf> {
    const digits = raw.replace(/\D/g, '')

    if (digits.length !== CPF_LENGTH) {
      return err(domainError('cpf.invalid_length', 'O CPF deve ter 11 dígitos.'))
    }

    // Repeated digits (111.111.111-11 and friends) satisfy the check-digit maths but are not
    // valid documents, so they need an explicit guard.
    if (/^(\d)\1{10}$/.test(digits)) {
      return err(domainError('cpf.repeated_digits', 'Este CPF não é válido.'))
    }

    if (!hasValidCheckDigits(digits)) {
      return err(domainError('cpf.invalid_check_digits', 'Este CPF não é válido.'))
    }

    return ok(new Cpf(digits))
  }

  get masked(): string {
    return `***.${this.digits.slice(3, 6)}.${this.digits.slice(6, 9)}-**`
  }

  equals(other: Cpf): boolean {
    return this.digits === other.digits
  }
}

function hasValidCheckDigits(digits: string): boolean {
  return (
    checkDigit(digits, 9) === Number(digits[9]) && checkDigit(digits, 10) === Number(digits[10])
  )
}

function checkDigit(digits: string, upTo: number): number {
  let sum = 0
  for (let i = 0; i < upTo; i += 1) {
    sum += Number(digits[i]) * (upTo + 1 - i)
  }
  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}
