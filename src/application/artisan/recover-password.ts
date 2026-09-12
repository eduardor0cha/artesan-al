import { PhoneNumber } from '@/domain/artisan/phone'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanAccountGateway } from '../ports/artisan-account.gateway'

const OTP_LENGTH = 6
const MIN_PASSWORD_LENGTH = 8

/**
 * There is no curator to reset a password for anyone (ADR 0004), and most artisans have no active
 * email, so the phone is the whole recovery path (ADR 0005).
 */
export class RequestPasswordOtp {
  constructor(private readonly accounts: ArtisanAccountGateway) {}

  /**
   * Succeeds even when the number has no account. Saying "this number is not registered" would
   * turn the screen into a way of checking who is on the platform.
   */
  async execute(input: { phone: string }): Promise<Result<void>> {
    const phone = PhoneNumber.create(input.phone)
    if (!phone.ok) return phone

    await this.accounts.sendPasswordResetOtp(phone.value)

    return ok(undefined)
  }
}

export type ResetPasswordInput = {
  phone: string
  otp: string
  newPassword: string
}

export class ResetPasswordWithOtp {
  constructor(private readonly accounts: ArtisanAccountGateway) {}

  async execute(input: ResetPasswordInput): Promise<Result<void>> {
    const phone = PhoneNumber.create(input.phone)
    if (!phone.ok) return phone

    const otp = input.otp.replace(/\D/g, '')

    if (otp.length !== OTP_LENGTH) {
      return err(
        domainError(
          'otp.invalid_length',
          `O código tem ${OTP_LENGTH} números. Confira e digite de novo.`,
        ),
      )
    }

    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      return err(
        domainError(
          'artisan.password_too_short',
          `A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} letras ou números.`,
        ),
      )
    }

    return this.accounts.resetPassword({
      phone: phone.value,
      otp,
      newPassword: input.newPassword,
    })
  }
}
