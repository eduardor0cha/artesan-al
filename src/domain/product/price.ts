import { domainError, err, ok, type Result } from '../shared/result'

const MAX_CENTS = 100_000_000

/**
 * Stored in cents to keep money away from floating point arithmetic. Prices are optional in the
 * catalogue — plenty of artisans price by negotiation — but when present they must be sane.
 */
export class Price {
  private constructor(readonly cents: number) {}

  static create(cents: number): Result<Price> {
    if (!Number.isInteger(cents)) {
      return err(domainError('price.not_an_integer', 'O preço deve ser informado em centavos.'))
    }

    if (cents < 0 || cents > MAX_CENTS) {
      return err(domainError('price.out_of_range', 'O preço informado é inválido.'))
    }

    return ok(new Price(cents))
  }

  format(): string {
    return (this.cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
}
