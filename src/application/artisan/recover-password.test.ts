import { describe, expect, it } from 'vitest'

import { FakeArtisanAccountGateway } from '../testing/fake-repositories'
import { RequestPasswordOtp, ResetPasswordWithOtp } from './recover-password'

describe('RequestPasswordOtp', () => {
  it('sends the code to the number the artisan typed', async () => {
    const accounts = new FakeArtisanAccountGateway()

    const result = await new RequestPasswordOtp(accounts).execute({ phone: '(82) 99912-0001' })

    expect(result.ok).toBe(true)
    expect(accounts.otpsSentTo).toEqual(['82999120001'])
  })

  it('rejects a number that could not receive a code', async () => {
    const accounts = new FakeArtisanAccountGateway()

    const result = await new RequestPasswordOtp(accounts).execute({ phone: '9991' })

    expect(!result.ok && result.error.code).toBe('phone.invalid_length')
    expect(accounts.otpsSentTo).toHaveLength(0)
  })
})

describe('ResetPasswordWithOtp', () => {
  const validReset = {
    phone: '(82) 99912-0001',
    otp: '123 456',
    newPassword: 'nova-senha-1',
  }

  it('passes the code and the new password on, with the number normalised', async () => {
    const accounts = new FakeArtisanAccountGateway()

    const result = await new ResetPasswordWithOtp(accounts).execute(validReset)

    expect(result.ok).toBe(true)
    expect(accounts.resets[0]?.phone.digits).toBe('82999120001')
    expect(accounts.resets[0]?.otp).toBe('123456')
  })

  it('rejects a code of the wrong size before spending an attempt', async () => {
    const accounts = new FakeArtisanAccountGateway()

    const result = await new ResetPasswordWithOtp(accounts).execute({ ...validReset, otp: '12' })

    expect(!result.ok && result.error.code).toBe('otp.invalid_length')
    expect(accounts.resets).toHaveLength(0)
  })

  it('rejects a new password the provider would refuse', async () => {
    const accounts = new FakeArtisanAccountGateway()

    const result = await new ResetPasswordWithOtp(accounts).execute({
      ...validReset,
      newPassword: 'curta',
    })

    expect(!result.ok && result.error.code).toBe('artisan.password_too_short')
    expect(accounts.resets).toHaveLength(0)
  })

  it('reports back what the account provider refused', async () => {
    const accounts = new FakeArtisanAccountGateway('O código não confere.')

    const result = await new ResetPasswordWithOtp(accounts).execute(validReset)

    expect(!result.ok && result.error.message).toBe('O código não confere.')
  })
})
