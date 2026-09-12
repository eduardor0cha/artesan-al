/**
 * The one account in the seed anyone can actually sign in to. It exists so that the artisan's side
 * of the app can be demonstrated — in an evaluation, in the screenshots for the paper — without
 * the demonstrator first having to create a profile, mark a sales point and publish a piece.
 *
 * It belongs to Maria do Barro, the artisan every other fixture is built around: signing in shows
 * a panel with somewhere to sell and a catalogue already in it.
 *
 * These credentials are public on purpose and are only ever written by `pnpm db:seed`, which runs
 * against a development or CI database. Nothing here may be used in a deployed environment.
 */
export const DEMO_ARTISAN = {
  /** The CPF everyone in Brazil uses as a test document. Valid check digits, no real holder. */
  cpf: '11144477735',
  password: 'artesanal123',
  slug: 'maria-do-barro',
  name: 'Maria do Barro',
} as const
