import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin, phoneNumber, username } from 'better-auth/plugins'

import { db } from '../db/client'
import { serverEnv } from '../config/env'

const env = serverEnv()

/**
 * Artisans sign up on their own with CPF + password.
 *
 * - `username` holds the CPF, normalised to digits only. It is the login identifier because it
 *   never changes, unlike a phone number tied to a SIM card.
 * - `phoneNumber` is the account recovery channel: an OTP is the only path back into an account
 *   for someone with no active email address.
 * - `admin` gives the research team the reactive moderation powers (review, ban) without a
 *   separate back office.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // Email is optional for artisans, so it cannot gate access to the account.
    requireEmailVerification: false,
  },
  plugins: [
    username(),
    phoneNumber({
      sendOTP: async ({ phoneNumber: destination, code }) => {
        logOtp(destination, code)
      },
      sendPasswordResetOTP: async ({ phoneNumber: destination, code }) => {
        logOtp(destination, code)
      },
    }),
    admin(),
    // Applies the Set-Cookie headers of `auth.api` calls made from a Server Action, which is how
    // every screen in this app signs in and out. It has to stay last in the list.
    nextCookies(),
  ],
})

/**
 * No SMS/WhatsApp provider is wired up yet: the code goes to the server log, and a provider is
 * plugged into `sendOTP` when there is budget for one. The number is truncated because a log is
 * the one place personal data leaks by accident.
 */
function logOtp(destination: string, code: string): void {
  console.info(`[auth] código ${code} para o celular final ${destination.slice(-4)}`)
}
