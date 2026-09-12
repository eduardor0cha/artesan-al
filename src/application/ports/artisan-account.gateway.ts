import type { Cpf } from '@/domain/artisan/cpf'
import type { PhoneNumber } from '@/domain/artisan/phone'
import type { Result } from '@/domain/shared/result'

/** The credential account behind a profile, identified by whatever the auth provider issues. */
export type AccountId = string

export type ArtisanAccountRegistration = {
  /** The login identifier (ADR 0005). Never rendered, never logged. */
  cpf: Cpf
  name: string
  /** Recovery channel: the only way back into an account for someone with no email. */
  phone: PhoneNumber
  password: string
}

export type PasswordReset = {
  phone: PhoneNumber
  otp: string
  newPassword: string
}

/**
 * Credentials, sessions and password recovery, kept behind a port so that the use cases do not
 * know which library holds them. What is stored here never reaches a public page: the profile the
 * visitor reads lives in `ArtisanRepository`, and the CPF stays on this side of the line.
 */
export interface ArtisanAccountGateway {
  register(registration: ArtisanAccountRegistration): Promise<Result<AccountId>>

  /**
   * Sends the recovery code. It resolves the same way for a number with no account, so that
   * asking is not a way to find out who is registered.
   */
  sendPasswordResetOtp(phone: PhoneNumber): Promise<void>

  resetPassword(reset: PasswordReset): Promise<Result<void>>
}
