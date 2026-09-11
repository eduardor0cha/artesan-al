import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { artisans } from './artisans'

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    artisanId: uuid('artisan_id')
      .notNull()
      .references(() => artisans.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    /** Cents, nullable: many artisans price by negotiation rather than by tag. */
    priceCents: integer('price_cents'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('products_artisan_idx').on(table.artisanId)],
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    /** Key inside the bucket. The public URL is derived from storage config, never stored. */
    storageKey: text('storage_key').notNull(),
    /** Required: a photo with no alternative text fails the accessibility budget. */
    alt: text('alt').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('product_images_product_idx').on(table.productId)],
)
