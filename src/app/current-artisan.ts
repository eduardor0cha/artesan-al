import { redirect } from 'next/navigation'
import { cache } from 'react'

import type { Artisan } from '@/domain/artisan/artisan'
import { requireSession } from '@/infrastructure/auth/session'
import { routes } from '@/presentation/lib/routes'

import { findArtisanOfAccount } from './composition'

/**
 * Who is acting, for the panel screens and for every action they contain. A Server Action is
 * reachable by a direct POST, so it calls this too rather than trusting the screen that rendered
 * its form (ADR 0009).
 *
 * Cached per request: a page and the action it renders both ask, and one request should not become
 * two round trips to the session store.
 */
export const requireArtisan = cache(async (): Promise<Artisan> => {
  const session = await requireSession(routes.signIn)
  const artisan = await findArtisanOfAccount(session.userId)

  // An account with no profile means sign-up stopped between its two writes. Sending the person
  // back to sign-up is the only move that can finish it.
  if (!artisan) redirect(routes.signUp)

  return artisan
})
