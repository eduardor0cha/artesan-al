import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const reportTargetEnum = pgEnum('report_target', ['artisan', 'sales_point', 'product'])

export const reportStatusEnum = pgEnum('report_status', ['open', 'upheld', 'dismissed'])

/**
 * Moderation is reactive: content is published immediately and reviewed only when someone reports
 * it. This table is the queue the admin works through.
 *
 * `targetId` is deliberately not a foreign key — a report must survive the removal of the content
 * it refers to, otherwise the moderation trail disappears exactly when it matters.
 */
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    targetType: reportTargetEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    /** Optional: visitors can report without an account. */
    reporterContact: text('reporter_contact'),
    status: reportStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: text('reviewed_by'),
  },
  (table) => [index('reports_status_idx').on(table.status, table.createdAt)],
)
