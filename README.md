# Elegant Layers

Internal web app for a cake shop: billing (POS), inventory, production, cake
orders and finance. It is a staff tool, not an online shop.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on
Base UI, PostgreSQL, Prisma 7, Better Auth (email and password), Cloudinary
(cake photos), pnpm. Hosted on Vercel with a Neon database.

## Running it locally

1. Install dependencies: `pnpm install` (this also generates the Prisma client).
2. Copy `.env.example` to `.env` and fill in the values (see below).
3. Apply the database structure: `pnpm exec prisma migrate deploy`
4. Create the product categories: `pnpm exec prisma db seed`
5. Start the app: `pnpm dev`, then open http://localhost:3000

`compose.yaml` and the `Dockerfile` are for local development with Docker.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection used by the app, the seed and scripts (on Neon, the pooled URL) |
| `DIRECT_URL` | Direct (non-pooled) connection, used only by Prisma migrations |
| `BETTER_AUTH_SECRET` | Signs login sessions. Long random string, different in every environment |
| `BETTER_AUTH_URL` | The public address of the app, exactly as typed in the browser |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary account used for cake photos |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned Cloudinary upload preset |

Never commit `.env`. Vercel does not run migrations: set these variables in the
Vercel project settings, and apply database changes yourself (see below).

## Database and migrations

The structure of every database comes only from the folders in
`prisma/migrations`, so all databases stay identical. Never change a live
database by hand.

- Prisma commands: `pnpm exec prisma ...` (not `pnpm dlx`).
- After any change to `prisma/schema.prisma`: run `pnpm exec prisma migrate dev`,
  then `pnpm exec prisma generate`, then fully restart `pnpm dev`.
- The generated client in `generated/prisma` is committed to git. Commit the
  changed generated files together with the schema and the migration.
- Every Prisma command prints a **Datasource** line. Read it before anything
  that writes, to be sure which database you are about to change.
- To run a command against another database, export `DATABASE_URL` and
  `DIRECT_URL` in the shell for that command only, then `unset` them. Do not
  edit `.env` for this.
- Product categories (Whole Cakes, Cake Pieces, Tea, Coffee, Soft Drinks,
  Snacks, Cake Base, Icing) are created only by `prisma/seed.ts`. It is safe to
  run again. Never empty the Category table.

## Releasing a change

1. Build and test locally. If the schema changed, create the migration with
   `migrate dev`.
2. Run `NODE_ENV=production pnpm run build` and fix any errors.
3. Commit the schema, migration, generated client and code together.
4. Apply the migration to the live database with
   `pnpm exec prisma migrate deploy` (read the Datasource line first).
5. Push to `main`. Vercel deploys from `main`.

The database must be migrated **before** the new code goes live, otherwise the
new pages fail on the missing column.

To check that two databases have the same structure, run
`pnpm exec prisma migrate status` against each. Both should report the same
migrations and "Database schema is up to date".

## Scripts

- `scripts/create-users.ts`: creates users. Read it before running.
- `scripts/import-phase1.ts`: go-live import of ingredients, supplies, opening
  stock and fixed assets. It is a dry run unless you pass `--apply` and
  `--expect-host=<part of the database host>`, and it skips items that exist.
- `scripts/seed-demo-catalog.ts`: adds demo products. **Never run it on the
  live database.**

## Business rules (do not change without agreement)

- Profit is on a cash basis: income, minus purchases (counted when stock is
  bought), minus active expenses. Depreciation is shown on its own line.
- `lib/income.ts` is the single source of truth for income. It feeds the Income
  page, the Dashboard and Reports.
- Income comes from: completed POS bills (after discount); cake order advances;
  the balance when a cake order is collected; and a kept advance on a cancelled
  order. Refunded advances never count.
- Cake order totals: the customer pays the price after discount plus the
  delivery charge. Delivery is not a separate income entry: it counts inside
  the advance, or in the balance when the order is collected.
- Expenses are never edited, only voided with a reason. Waste and stock
  adjustments never change income or profit.
- Supplies (boxes, boards, candles) are stock items bought through Purchases,
  never expenses. Equipment is a fixed asset.
- Cake orders are custom cakes: they use a one-off ingredient list when baking
  starts, and can take icing from stock. They never use product recipes.
- Productions cannot be edited or voided. Corrections are separate movements.
- Roles: ADMIN sees money, expenses, reports, purchases, inventory, production,
  users and settings. CASHIER uses POS and cake orders. Only ADMIN cancels cake
  orders and voids sales.