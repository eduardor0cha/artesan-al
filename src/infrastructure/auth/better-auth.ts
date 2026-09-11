import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
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
        // No SMS/WhatsApp provider is wired up yet: in development the code goes to the server
        // log, and a provider is plugged in here when there is budget for one.
        console.info(`[auth] OTP ${code} para ${destination}`)
      },
    }),
    admin(),
  ],
})
