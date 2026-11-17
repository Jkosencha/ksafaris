# KSafaris Website + Dashboard: Project Guide (Astro / Node / Drizzle)

> **Decisions recorded (17 Nov 2026)**
> - Auth: **custom sessions** (not Better Auth). argon2id passwords, 32-byte random tokens stored as SHA-256 hashes, httpOnly + secure + sameSite=lax cookies, 7-day sliding expiry, login rate limiting stored in the database.
> - Dashboard path stays **`/office`**. Wherever this guide says `/dashboard`, read `/office`.
> - DB driver: **postgres** (postgres.js). Validation: **zod via `astro/zod`** (already part of Astro, no new dependency).
> - Vitest approved as a dev dependency.
> - Supabase was prepared but never connected, so there is no Supabase data to migrate.

> This is the source of truth for the project. Read it fully before writing code.
> **This is an existing project.** Keep the current Astro site, dashboard screens and folder layout. Extend and rework; do not rebuild from scratch, and do not rename existing folders without asking.
> Work **phase by phase** (Section 13). After each phase, stop, summarise what changed, and wait for review.

---

## 1. Project Overview

A website and private staff dashboard for **KSafaris**, a tour agency in Kenya.

1. **Public website**: visitors browse tours, destinations and itineraries, read about the agency, send enquiries, and request and pay for bookings.
2. **Staff dashboard**: staff log in to:
   - Edit website content (tours, destinations, pages, FAQs, testimonials, site settings, photos)
   - Manage **itineraries** (day-by-day plans per tour)
   - Manage **bookings** (confirm, cancel, notes, status history)
   - Track **payments** (deposits, balances, M-Pesa, card, cash, bank transfer)
   - Handle the **Inbox** (website enquiries, replies, convert to booking)

The client is non-technical. The dashboard must be simple, clear and hard to break.

---

## 2. Tech Stack

| Layer | Choice | Status |
|---|---|---|
| Framework | Astro (existing) with `@astrojs/node` adapter | Existing |
| Language | TypeScript, strict mode | Existing |
| Database | PostgreSQL on **Neon** | Approved |
| DB driver | `postgres` (postgres.js) or `pg` | Approved, pick one and use it everywhere |
| ORM / migrations | `drizzle-orm` + `drizzle-kit` | Approved |
| Password hashing | `@node-rs/argon2` (argon2id) | Approved |
| Auth / sessions | Better Auth **or** custom sessions (decide in Phase 1, see Section 5) | Pending decision |
| Validation | `zod` | Ask first if not already installed |
| Email | Resend (or Brevo / Postmark) | Ask first |
| Images | Cloudinary or Cloudflare R2 | Ask first |
| Bot protection | Cloudflare Turnstile (only if spam becomes a problem) | Ask first |
| Tests | Vitest | Ask first |
| Hosting | Render or Railway (Node server) | Decide at deploy |

**Rule:** Do not add any dependency marked "Ask first", or any that is not listed, without asking.

**Removing Supabase:** Supabase Auth and the Supabase client are replaced by our own database and login. Remove the Supabase packages and env vars **only after** the new database and login are working and existing data has been migrated (Phase 1).

---

## 3. Project Structure (target)

Adapt to the existing layout. This shows where *new* things should go:

```
src/
├── pages/
│   ├── (public pages: index, tours/, destinations/, about, contact, faq, [slug])
│   ├── dashboard/          # existing staff screens
│   └── api/
│       ├── auth/           # login, logout
│       ├── forms/          # enquiry + booking request endpoints
│       └── payments/       # mpesa/stk, mpesa/callback, card/webhook
├── lib/
│   ├── db/
│   │   ├── client.ts       # single Drizzle client
│   │   ├── schema/         # one file per area: auth, content, tours, bookings, payments, inbox
│   │   └── seed.ts
│   ├── auth/               # session handling, password hashing, requireRole()
│   ├── services/           # business logic: bookings, payments, inbox, emails
│   ├── payments/           # mpesa.ts, pesapal.ts (gateway clients only)
│   ├── email/              # send helper + templates
│   └── money.ts            # money helpers (see 4.0)
├── middleware.ts           # loads session, protects /dashboard and dashboard APIs
drizzle/                    # generated migrations (committed)
drizzle.config.ts
tests/
.env.example
```

**Rules:**
- Pages and API routes stay thin. They validate input, call a service, and return a result.
- All database access goes through `lib/db/client.ts`. Never create ad-hoc connections.
- Business rules (status changes, payment processing, emails) live in `lib/services/`.

---

## 4. Data Model (Drizzle schema)

### 4.0 Rules for all tables
- Primary keys: `uuid` with `defaultRandom()` (or keep the existing ID style if tables already exist).
- Every table has `createdAt` and `updatedAt` (`timestamp with time zone`, default now).
- **Money is stored as integers in minor units** (cents), e.g. `amountMinor: integer`. Never use floats. Postgres `numeric` comes back as strings in JS, so integers keep the maths safe. Convert only for display, in `lib/money.ts`.
- Every money amount has a `currency` column (`'KES' | 'USD'`), as a Postgres enum.
- Status fields are Postgres enums (`pgEnum`).
- Anything with a public URL has a unique `slug`.
- Anything shown publicly has `isPublished` (boolean, default false).
- All timestamps are stored in UTC (`timestamptz`) and **displayed in Africa/Nairobi time**.
- Add indexes for foreign keys and for columns used in filters (status, dates, slug).

Example style:

```ts
export const bookingStatus = pgEnum('booking_status',
  ['pending', 'confirmed', 'cancelled', 'completed']);

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: text('reference').notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  tourId: uuid('tour_id').references(() => tours.id),
  status: bookingStatus('status').notNull().default('pending'),
  totalMinor: integer('total_minor').notNull(),
  currency: currency('currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 4.1 Auth and roles

**users**: `id`, `email` (unique, lowercase), `name`, `phone`, `passwordHash`, `role`, `isActive`, `lastLoginAt`
**sessions**: `id`, `userId`, `tokenHash`, `expiresAt`, `createdAt`, `ipAddress`, `userAgent` (if custom sessions; Better Auth brings its own tables)

**Roles** (enum `user_role`), replacing the current "admin" and "staff":

| Area | Owner | Manager | Booking Agent | Content Editor |
|---|---|---|---|---|
| Users & roles | ✅ | ❌ | ❌ | ❌ |
| Site settings | ✅ | ❌ | ❌ | ❌ |
| Tours, destinations, pages, FAQs, testimonials | ✅ | ✅ | 👁 view | ✅ |
| Bookings & customers | ✅ | ✅ | ✅ | ❌ |
| Payments (view / record manual) | ✅ | ✅ | ✅ | ❌ |
| Inbox | ✅ | ✅ | ✅ | ❌ |
| Reports & CSV export | ✅ | ✅ | ❌ | ❌ |

- Define this once as a permission map in `lib/auth/permissions.ts`.
- Enforce it **on the server** in every dashboard page and API route (`requireRole` / `can(user, 'payments:view')`). Hiding a menu item is not security.
- Migrate existing users: `admin` → `owner`, `staff` → `manager` (confirm with the developer).

### 4.2 Site content

**siteSettings** (single row): `agencyName`, `logoUrl`, `tagline`, `email`, `phone`, `whatsappNumber`, `address`, `facebookUrl`, `instagramUrl`, `tiktokUrl`, `tripadvisorUrl`, `defaultCurrency`, `depositPercentage` (integer, e.g. 30), `bookingTerms`, `cancellationPolicy`
- Replaces every hard-coded contact detail and setting in the code.

**pages**: `title`, `slug`, `content` (rich text / markdown), `isPublished`, `seoTitle`, `seoDescription` (About, Terms, Privacy)
**faqs**: `question`, `answer`, `sortOrder`, `isPublished`
**testimonials**: `customerName`, `country`, `photoUrl`, `content`, `rating` (1–5), `tourId` (nullable), `isFeatured`, `isPublished`

### 4.3 Tours

**destinations**: `name`, `slug`, `country`, `description`, `coverImageUrl`, `isFeatured`, `isPublished`
**tourCategories**: `name`, `slug`, e.g. Safari, Beach, Cultural, Climbing, Day Trips
**tours**: `title`, `slug`, `summary`, `description`, `categoryId`, `durationDays`, `durationNights`, `priceFromMinor`, `currency`, `priceNotes` (e.g. "per person sharing"), `minGroupSize`, `maxGroupSize`, `difficulty` (enum: easy / moderate / challenging), `inclusions` (text[]), `exclusions` (text[]), `coverImageUrl`, `isFeatured`, `isPublished`, `seoTitle`, `seoDescription`
**tourDestinations**: join table (`tourId`, `destinationId`)
**tourImages**: `tourId`, `url`, `caption`, `sortOrder`
**itineraryDays**: `tourId`, `dayNumber`, `title`, `description`, `activities`, `meals`, `accommodation`. Unique (`tourId`, `dayNumber`).
**tourDepartures** (optional, only if KSafaris runs fixed-date group tours): `tourId`, `startDate`, `endDate`, `priceMinor` (nullable, overrides `priceFromMinor`), `capacity`, `isOpen`. Seats left = capacity − travellers on non-cancelled bookings.

**Moving content into the database:** Tours, destinations and pages currently live in files. In Phase 3, write a one-off import script that reads the existing files and inserts them into the new tables. Keep the files until the import has been checked, then remove them.

### 4.4 Bookings

**customers**: `firstName`, `lastName`, `email`, `phone`, `country`, `notes`
- **Do not merge customers by email automatically.** Each booking request creates a new customer row unless staff pick an existing one. (This changes the current form-saving code.) Staff merging comes later.

**bookings**:
- `reference`: unique, human-friendly, e.g. `KS-2026-00042` (generated from a DB sequence, not random, not count+1)
- `customerId`, `tourId`, `departureId` (nullable)
- `startDate`, `endDate`, `adults`, `children`
- `totalMinor`, `currency`
- `status` (enum): `pending`, `confirmed`, `cancelled`, `completed`
- `source` (enum): `website`, `phone`, `whatsapp`, `email`, `walk_in`, `agent`
- `specialRequests` (from the guest), `internalNotes` (staff only, never shown to the guest)
- `assignedToUserId` (nullable)
- `messageId` (nullable, set when converted from an Inbox enquiry)

**Derived, not stored** (computed in `lib/services/bookings.ts`):
- `paidMinor` = sum of payments with status `completed` (minus `refunded`)
- `balanceMinor` = `totalMinor − paidMinor`
- `depositMinor` = `totalMinor × depositPercentage / 100` (rounded up)
- `paymentStatus`: `unpaid` | `deposit_paid` | `fully_paid` | `refunded`
- This **replaces** the current "Paid" stage on the Bookings board. Payment status is shown as a badge, and the board columns follow `status`.

**bookingStatusHistory**: `bookingId`, `fromStatus`, `toStatus`, `changedByUserId` (nullable = system), `note`, `createdAt`
- Every status change goes through one service function, `changeBookingStatus()`, which updates the booking and writes history **in the same transaction**.

### 4.5 Payments

**payments**: `bookingId`, `amountMinor`, `currency`, `method` (enum: `mpesa`, `card`, `bank_transfer`, `cash`, `other`), `status` (enum: `pending`, `completed`, `failed`, `refunded`), `reference` (M-Pesa receipt, gateway ID, bank ref), `recordedByUserId` (null = automatic), `paidAt`, `notes`

**gatewayTransactions**: `paymentId` (nullable), `gateway` (enum: `mpesa`, `pesapal`, `flutterwave`), `externalId` (e.g. M-Pesa `CheckoutRequestID`), `requestPayload` (jsonb), `responsePayload` (jsonb), `callbackPayload` (jsonb), `status`, `processedAt`
- Unique (`gateway`, `externalId`). This is what prevents double-counting.

### 4.6 Inbox

**messages**: `name`, `email`, `phone`, `subject`, `body`, `tourId` (nullable), `preferredTravelDate`, `groupSize`, `status` (enum: `new`, `read`, `replied`, `archived`), `assignedToUserId`, `bookingId` (nullable, set on conversion)
**messageReplies**: `messageId`, `body`, `sentByUserId`, `sentAt`, `emailSent` (boolean)

- Website enquiries go to the **Inbox**, not the Bookings board.
- "Convert to booking" creates a customer + booking (status `pending`) prefilled from the message, and links both ways.
- Booking request forms (with dates and travellers) still create a booking directly.

---

## 5. Authentication

Decide in Phase 1: **Better Auth** (with Drizzle adapter) or **custom sessions**. Either way:

- Passwords hashed with **argon2id** (`@node-rs/argon2`). Never store or log plain passwords.
- Session token: random (≥ 32 bytes), stored **hashed** in the database. Cookie: `httpOnly`, `secure` (in production), `sameSite=lax`, path `/`.
- Session expiry (e.g. 7 days) with sliding renewal. Log out deletes the session row.
- `src/middleware.ts` loads the user from the cookie and sets `Astro.locals.user`. All `/dashboard/*` pages and dashboard API routes require a logged-in, active user and the right role.
- Login is rate limited (e.g. 5 attempts per 15 min per IP + email), with the same error message for wrong email and wrong password.
- CSRF: state-changing dashboard requests are POST with a same-origin check (Astro `security.checkOrigin`, or an equivalent check).
- Staff accounts are created by the Owner from the dashboard. There is no public sign-up.
- Provide a CLI script to create the first Owner account (`npm run create-owner`).

---

## 6. Public Website

- **Rendering:** tour, destination, page, FAQ and home pages read from the database, so they must be **server-rendered on request** (`export const prerender = false`, or `output: 'server'`). Dashboard edits must appear on the site immediately. Add short HTTP cache headers if performance needs it.
- **Pages:** Home (featured tours, destinations, testimonials), Tours list, Tour detail (gallery, itinerary, inclusions/exclusions, price, forms), Destinations list + detail, About, Contact, FAQ, Terms, Privacy.
- **Tours list filters:** category, destination, duration, price range, using URL query params so filtered views can be shared and indexed.
- **Only `isPublished = true` content is ever shown publicly**, including inside lists, sitemaps and related-tour blocks.
- **SEO:** unique title + meta description per page (from `seoTitle` / `seoDescription`, with sensible fallbacks), Open Graph tags, `sitemap.xml` generated from the database, `robots.txt`.
- **WhatsApp button** using `siteSettings.whatsappNumber`.
- Mobile-first and fast. Most visitors use phones.

**Forms** (enquiry + booking request):
- Validate with zod on the server. Never trust the client.
- Keep the existing hidden-field spam trap, add rate limiting per IP, and add Turnstile only if spam continues.
- Enquiry creates an Inbox message and sends an email to the office.
- Booking request creates a customer + booking (`pending`), emails the guest and the office, then offers payment.

---

## 7. Payments

### 7.1 Principles
- **Never trust the browser.** A payment becomes `completed` only after the provider confirms it (callback/webhook **plus** a server-side verification or status query).
- **Idempotency.** The same callback may arrive more than once. Look up `gatewayTransactions` by (`gateway`, `externalId`), and if it is already processed, return success and do nothing.
- **Check the amount.** The confirmed amount must match the expected payment. Mismatches are logged and flagged for staff, not auto-completed.
- Log every request, response and callback in `gatewayTransactions`.
- Gateway HTTP clients live in `lib/payments/`. The logic that updates payments and bookings lives in `lib/services/payments.ts` and runs in a DB transaction.
- Sandbox credentials only until Phase 7.

### 7.2 M-Pesa (Daraja STK Push)
1. Guest enters a phone number. Normalise it to `2547XXXXXXXX` / `2541XXXXXXXX`.
2. Server gets an OAuth token (cache it until expiry), then sends the STK Push with the amount (whole KES), the booking reference as `AccountReference`, and `CallBackURL`.
3. Create a `payments` row (`pending`) and a `gatewayTransactions` row with the `CheckoutRequestID`.
4. Guest approves on their phone.
5. Safaricom POSTs to `/api/payments/mpesa/callback`. If `ResultCode === 0`, set the payment to `completed`, save `MpesaReceiptNumber` as `reference`, and set `paidAt`. Any other code sets it to `failed`.
6. Fallback: a status query for transactions still pending after a few minutes (button in the dashboard + a scheduled check).
7. The callback endpoint is public. It must not require a session, but it must validate the payload and match a known `CheckoutRequestID`.

The callback URL must be public HTTPS. Use ngrok or Cloudflare Tunnel in development.

### 7.3 Cards (Pesapal or Flutterwave, to be decided with the client)
- Hosted checkout / redirect flow.
- Confirm through the IPN/webhook **and** a server-side verify call, never the redirect alone. Verify signatures where supported.

### 7.4 Manual payments
- Staff record cash / bank transfer from the booking screen (`recordedByUserId` set, status `completed`).
- Gateway payments are read-only in the dashboard.

### 7.5 After a completed payment
- Email a receipt to the guest.
- If the booking is `pending` and `paidMinor ≥ depositMinor`, call `changeBookingStatus(→ confirmed)` (system user, history written).

---

## 8. Emails

One helper, `lib/email/send.ts`. In development, log emails to the console instead of sending.

| Email | To |
|---|---|
| Booking request received | Guest |
| New booking | Office |
| Booking confirmed | Guest |
| Payment receipt | Guest |
| New enquiry | Office |
| Enquiry reply (sent from Inbox) | Enquirer |

- HTML + plain-text versions. Agency name, logo and contact details come from `siteSettings`.
- Sending failures are logged and must not break the request that triggered them (booking still saves).

---

## 9. Dashboard

Keep the existing screens and extend them:

- **Home:** stat cards: new Inbox messages, pending bookings, departures in the next 30 days, payments received this month, total outstanding balances.
- **Website editor:** site settings, pages, FAQs, testimonials, destinations, tours (with gallery upload, itinerary day editor, publish switch, SEO fields, preview link).
- **Bookings:** board by `status`, with a payment-status badge. Booking detail shows the guest, the tour, payments (with a "Record payment" form), status history, internal notes, and buttons **Confirm**, **Cancel** (with a reason), **Send confirmation email**.
- **Inbox:** list with unread count and status filters. Message view with a reply form, assign, archive and **Convert to booking**.
- **Payments:** list with filters (method, status, date). M-Pesa "check status" for stuck pending payments.
- **Reports (Phase 6):** CSV export of bookings and payments, and a monthly revenue summary per currency.
- **Users (Owner only):** create staff, set role, deactivate.

Every screen and action checks permissions on the server (Section 4.1).

---

## 10. Environment Variables

`.env.example` lists every variable, with no real values:

```
# Neon: pooled URL for the app, direct URL for migrations
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require

SITE_URL=http://localhost:4321
SESSION_SECRET=
# BETTER_AUTH_SECRET= / BETTER_AUTH_URL=   (if Better Auth is chosen)

# Email
RESEND_API_KEY=
EMAIL_FROM=
OFFICE_NOTIFICATION_EMAIL=

# Images
CLOUDINARY_URL=

# M-Pesa (Daraja)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=

# Card gateway
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=

# Spam protection (optional)
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- Validate env vars at startup (zod schema in `src/env.ts`), and fail fast if a required one is missing.
- Never commit `.env`. Never expose secrets to client-side code. Only `PUBLIC_`-prefixed vars reach the browser.

**Neon notes:**
- Keep `sslmode=require`.
- The app uses the pooled URL. `drizzle-kit` uses `DATABASE_URL_DIRECT`.
- The free tier sleeps when idle, so the first request can be slow. Use a paid plan for the live site.
- Use a Neon **branch** to test risky migrations before running them on the main database.

---

## 11. Conventions

- **Migrations:** `drizzle-kit generate` then `drizzle-kit migrate`. Commit every migration file. **Never use `drizzle-kit push` against the production database.** One logical change per migration.
- **Transactions:** anything that touches bookings + payments, or status + history, runs in `db.transaction()`.
- **Queries:** avoid N+1. Use joins or Drizzle relational queries for lists.
- **Validation:** every API route validates its input with zod and returns clear errors.
- **Errors:** never leak stack traces or SQL errors to the browser. Log them on the server.
- **Dates:** store UTC, display Africa/Nairobi, and format in one shared helper.
- **Money:** only through `lib/money.ts` (format, convert to/from minor units, deposit maths).
- **Style:** existing formatter/linter config. TypeScript strict, and no `any` without a comment explaining why.

---

## 12. Testing (Vitest)

Use a separate test database (a Neon branch or local Postgres). Mock Daraja, Pesapal and email.

Must be covered:
- Booking reference generation (unique, correct format)
- `paidMinor`, `balanceMinor`, `depositMinor`, `paymentStatus`, including multiple payments, failed payments and refunds
- `changeBookingStatus()` writes history in the same transaction
- M-Pesa callback: success, failure, **duplicate callback**, amount mismatch, unknown `CheckoutRequestID`
- Auto-confirm when the deposit is covered
- Public queries return only published content
- Role permissions (e.g. a Content Editor gets 403 on payments APIs)
- Login: wrong password, inactive user, rate limit

---

## 13. Build Plan

At the end of each phase: run type-check, lint and tests, summarise changes, and **stop for review**.

**Phase 1: Own database + login**
- Neon connection, Drizzle client and config, migration setup
- Recreate the existing tables in Drizzle schema (keep the current table design where possible)
- Migrate existing data out of Supabase (export, import, verify row counts)
- Auth (Better Auth or custom, as decided), middleware, protected dashboard, `create-owner` script
- Replace Supabase in the form-saving endpoint. Stop auto-merging customers by email.
- Remove Supabase packages and env vars once everything works

**Phase 2: Roles + site settings**
- Role enum, permission map, server-side checks, Users screen
- `siteSettings` table + editor. Replace hard-coded contact details everywhere.

**Phase 3: Content in the database**
- Pages, FAQs, testimonials, destinations, categories, tours (new fields), images, itinerary days (activities), departures (if used)
- Import script from the existing content files
- Public pages server-rendered from the database, tour filters, SEO, sitemap
- Image uploads to Cloudinary/R2

**Phase 4: Bookings, Inbox, emails**
- Booking fields (end date, cancelled, internal notes, source), status history, derived payment status (replaces the "Paid" stage)
- Inbox tables + screens, reply by email, Convert to booking
- Email provider + all templates in Section 8
- Rate limiting on forms

**Phase 5: Payments**
- Payments + gateway transactions tables, manual payment recording
- M-Pesa STK Push + callback + status query (sandbox)
- Card gateway (once the client decides)
- Receipts and auto-confirm

**Phase 6: Dashboard polish**
- Home stats, Confirm/Cancel/Send email buttons, CSV export, monthly revenue report

**Phase 7: Deploy**
- Render/Railway, domain + HTTPS, production env vars, live payment credentials
- Security headers, backups (Neon point-in-time restore + scheduled `pg_dump`), error monitoring (e.g. Sentry)

---

## 14. Open Questions (for the client, needed before Phases 4–5)

- Payment methods at launch: M-Pesa only, or cards too?
- Fixed-date group departures, private custom tours, or both?
- Prices in USD, KES or both? Per person or per group?
- Deposit percentage, and the cancellation and refund policy?
- How many staff will use the dashboard, and in which roles?
- Does the website need more than one language?
- Inbox: website enquiries only, or also their existing email account? (Default: website enquiries only.)
