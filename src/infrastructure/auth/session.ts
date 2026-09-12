import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from './better-auth'

export type ArtisanSession = {
  /** The Better Auth account id; the panel turns it into a profile through the repository. */
  readonly userId: string
  readonly name: string
}

/**
 * Reading the session in a Server Component. It is called on every request of every panel screen —
 * and again inside every Server Action, because an action is reachable by a direct POST and the
 * screen that renders it is no barrier (ADR 0009).
 */
export async function currentSession(): Promise<ArtisanSession | null> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) return null

  return { userId: session.user.id, name: session.user.name }
}

/**
 * The same reading, for whoever has nothing to show a visitor who is not signed in. The path is a
 * parameter because the public URLs are written in pt-BR and belong to the presentation layer,
 * which this one must not import.
 */
export async function requireSession(signInPath: string): Promise<ArtisanSession> {
  const session = await currentSession()

  if (!session) redirect(signInPath)

  return session
}

/**
 * Signs in with the CPF, which Better Auth holds as the username. Only callable from a Server
 * Action or a Route Handler: the session cookie is written by the `nextCookies` plugin, and
 * nothing may write a cookie while rendering.
 */
export async function signInWithCpf(cpfDigits: string, password: string): Promise<boolean> {
  try {
    await auth.api.signInUsername({
      body: { username: cpfDigits, password },
      headers: await headers(),
    })

    return true
  } catch {
    // Which half of the pair was wrong is deliberately not reported back: it would turn the
    // sign-in screen into a way of checking which CPFs have an account.
    return false
  }
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() })
}
