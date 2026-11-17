# Supabase setup for the KSafaris office dashboard

The dashboard (`/office`) uses Supabase for staff sign-in and for storing guests,
bookings, trips and payments. The project belongs to KSafaris (created on the
client's Supabase account) so they own their data.

## 1. Create the project

1. In Supabase, create a new project. Pick the region closest to Kenya (for
   example Frankfurt, or South Africa if offered).
2. Save the database password in the client's password manager. It is not
   needed in this code.
3. Invite the developer as a project member (Project settings, Team).

## 2. Create the tables

Open **SQL Editor**, paste the whole of
[`migrations/20261117000000_dashboard.sql`](migrations/20261117000000_dashboard.sql)
and run it once. It creates the tables and turns on the security rules (only
signed-in staff can see or change anything).

## 3. Sign-in settings

In **Authentication, Sign In / Providers**:

- Keep **Email** on, with password sign-in.
- Turn **off** "Allow new users to sign up". Staff accounts are only created by
  an admin, never by visitors.

## 4. Add each staff member

1. **Authentication, Users, Add user**: enter their email and a temporary
   password (tick "Auto confirm").
2. Copy the new user's ID, then in **SQL Editor** run:

   ```sql
   insert into public.staff (id, name, role)
   values ('PASTE-USER-ID-HERE', 'Kevin', 'admin');
   ```

   Use `'admin'` for the owner and `'staff'` for everyone else. A person who can
   sign in but is not in this table sees nothing.

## 5. Connect the website

In **Project settings, API**, copy:

| Setting | Goes in | Safe to share? |
|---|---|---|
| Project URL | `PUBLIC_SUPABASE_URL` | Yes |
| anon / publishable key | `PUBLIC_SUPABASE_ANON_KEY` | Yes |
| service_role / secret key | `SUPABASE_SERVICE_ROLE_KEY` | **No.** Only in `.env` and the host's settings, never in chat or git |

Put them in a `.env` file at the project root (see `.env.example`) and in the
hosting provider's environment settings, then restart the site.
