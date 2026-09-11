import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { user } from './auth'

/**
 * The artisan's public profile. Credentials live in Better Auth's `user` table — CPF is the login
 * identifier there and never appears in this table, which is the one read by public pages.
 */
export const artisans = pgTable(
  'artisans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Used in the public URL, e.g. /artesaos/maria-do-barro. */
    slug: text('slug').notNull(),
    /** Contact shown to visitors. May differ from the recovery number held by Better Auth. */
    publicPhone: text('public_phone').notNull(),
    story: text('story'),
    craft: text('craft'),
    city: text('city'),
    /**
     * SICAB register, optional and self-declared. Displayed as information only — the platform
     * verifies nothing, so it never becomes a badge (ADR 0012). As a civil identifier it follows
     * the CPF's LGPD rule for logging.
     */
    sicabNumber: text('sicab_number'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('artisans_user_id_key').on(table.userId),
    uniqueIndex('artisans_slug_key').on(table.slug),
  ],
)
