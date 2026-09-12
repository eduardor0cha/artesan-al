import { domainError, err, ok, type Result } from '../shared/result'

const MAX_LENGTH = 60

/**
 * The artisan's segment in the public URL, derived from their name. It is content the visitor
 * reads and shares (ADR 0010), which is why it carries the name instead of an identifier — and
 * because two artisans may be called the same, whoever creates one has to check it is still free.
 */
export class Slug {
  private constructor(readonly value: string) {}

  static create(value: string): Result<Slug> {
    if (value.length > MAX_LENGTH || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return err(domainError('slug.invalid_format', 'Este endereço de página não é válido.'))
    }

    return ok(new Slug(value))
  }

  static fromName(name: string): Result<Slug> {
    const value = trimHyphens(
      name
        // Decomposing first splits "ç" into "c" plus a combining mark, so the accents can be
        // dropped as marks and the letter underneath survives.
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, MAX_LENGTH),
    )

    if (value === '') {
      return err(domainError('slug.empty', 'Escreva seu nome com letras.'))
    }

    return ok(new Slug(value))
  }

  /** The next candidate when the name is taken: maria-do-barro, maria-do-barro-2, and so on. */
  withSuffix(suffix: number): Slug {
    const tail = `-${suffix}`
    const head = trimHyphens(this.value.slice(0, MAX_LENGTH - tail.length))

    return new Slug(`${head}${tail}`)
  }
}

function trimHyphens(value: string): string {
  return value.replace(/^-+|-+$/g, '')
}
