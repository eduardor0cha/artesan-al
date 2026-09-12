import { APIError } from 'better-auth/api'

import type {
  AccountId,
  ArtisanAccountGateway,
  ArtisanAccountRegistration,
  PasswordReset,
} from '@/application/ports/artisan-account.gateway'
import type { Cpf } from '@/domain/artisan/cpf'
import type { PhoneNumber } from '@/domain/artisan/phone'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import { auth } from './better-auth'

/**
 * Better Auth's core requires a unique email, and most artisans have no active address. Sign-up
 * synthesises one from the CPF and never displays it; a real address replaces it if the artisan
 * ever gives one (ADR 0005).
 */
const SYNTHETIC_EMAIL_DOMAIN = 'local.artesanal'

/** Better Auth error codes, mapped to what the artisan should read instead. */
const MESSAGE_BY_CODE: Record<string, string> = {
  USER_ALREADY_EXISTS: 'Este CPF já tem uma conta.',
  USERNAME_IS_ALREADY_TAKEN: 'Este CPF já tem uma conta.',
  PHONE_NUMBER_IS_ALREADY_TAKEN: 'Este celular já está em outra conta.',
  INVALID_OTP: 'O código não confere. Confira e digite de novo.',
  OTP_EXPIRED: 'Este código venceu. Peça outro.',
  OTP_NOT_FOUND: 'Nenhum código foi pedido para este celular.',
  PASSWORD_TOO_SHORT: 'A senha é curta demais.',
}

export class BetterAuthArtisanAccountGateway implements ArtisanAccountGateway {
  async register(registration: ArtisanAccountRegistration): Promise<Result<AccountId>> {
    const { cpf, name, phone, password } = registration

    try {
      const created = await auth.api.signUpEmail({
        body: {
          name,
          email: syntheticEmail(cpf),
          password,
          username: cpf.digits,
          phoneNumber: phone.digits,
        },
      })

      return ok(created.user.id)
    } catch (error) {
      return err(toDomainError(error, 'account.register_failed'))
    }
  }

  async sendPasswordResetOtp(phone: PhoneNumber): Promise<void> {
    // Better Auth answers the same way for a number with no account, so nothing here reveals who
    // is registered. A provider failure must not either, hence the swallowed error.
    try {
      await auth.api.requestPasswordResetPhoneNumber({ body: { phoneNumber: phone.digits } })
    } catch (error) {
      console.error('[auth] falha ao enviar o código de recuperação', error)
    }
  }

  async resetPassword(reset: PasswordReset): Promise<Result<void>> {
    try {
      await auth.api.resetPasswordPhoneNumber({
        body: {
          phoneNumber: reset.phone.digits,
          otp: reset.otp,
          newPassword: reset.newPassword,
        },
      })

      return ok(undefined)
    } catch (error) {
      return err(toDomainError(error, 'account.reset_failed'))
    }
  }
}

function syntheticEmail(cpf: Cpf): string {
  return `${cpf.digits}@${SYNTHETIC_EMAIL_DOMAIN}`
}

/**
 * Better Auth reports failures by throwing, and its messages are in English. Anything unmapped
 * becomes one plain sentence: the artisan can act on "tente de novo", not on a provider code.
 */
function toDomainError(error: unknown, fallbackCode: string) {
  if (error instanceof APIError) {
    const code = typeof error.body?.code === 'string' ? error.body.code : null
    const message = code ? MESSAGE_BY_CODE[code] : undefined

    if (message) return domainError(`account.${code!.toLowerCase()}`, message)
  }

  console.error('[auth] falha inesperada do provedor de contas', error)

  return domainError(fallbackCode, 'Não conseguimos concluir agora. Tente de novo.')
}
