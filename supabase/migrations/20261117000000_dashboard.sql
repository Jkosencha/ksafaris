-- KSafaris office: database for the staff dashboard.
-- Run once in the Supabase SQL editor (or with `supabase db push`).
--
-- Security model: Row Level Security is on for every table. Only signed-in
-- people listed in `staff` can read or change anything. The public website
-- never talks to these tables directly: its forms post to the site's own
-- server, which validates them and saves with the secret service key.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.booking_stage as enum ('new', 'quoted', 'awaiting', 'confirmed', 'paid', 'completed', 'cancelled');
create type public.booking_kind as enum ('booking', 'enquiry');

-- ---------------------------------------------------------------------------
-- Staff: people who can sign in to the dashboard
-- ---------------------------------------------------------------------------
create table public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- True when the signed-in user is on the staff list. Used by every policy.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  country text,
  nationality text,
  -- "Good to know": food, rooms, loves, favourite guide, special dates
  preferences jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index guests_email_idx on public.guests (lower(email));

-- ---------------------------------------------------------------------------
-- Bookings and enquiries
-- ---------------------------------------------------------------------------
create sequence public.booking_ref_seq;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique
    default ('KS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.booking_ref_seq')::text, 4, '0')),
  guest_id uuid not null references public.guests (id) on delete restrict,
  kind public.booking_kind not null,
  stage public.booking_stage not null default 'new',
  tour_slug text,
  tour_title text not null,
  start_date date,
  travel_month text,
  date_flexibility text,
  adults integer not null default 2 check (adults >= 0),
  children integer not null default 0 check (children >= 0),
  children_ages text,
  rooms text,
  accommodation text,
  flights text,
  travel_type text,
  special_requests text,
  source text not null default 'website',
  heard_from text,
  owner_id uuid references public.staff (id) on delete set null,
  quote_total numeric(12, 2),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_stage_idx on public.bookings (stage);
create index bookings_guest_idx on public.bookings (guest_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- Messages to the guest and notes for the team, newest last
create table public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  author_id uuid references public.staff (id) on delete set null, -- null when it came from the guest
  kind text not null check (kind in ('guest', 'email', 'note')),
  body text not null,
  created_at timestamptz not null default now()
);
create index booking_messages_booking_idx on public.booking_messages (booking_id, created_at);

-- Lines on a quote
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  position integer not null default 0,
  item text not null,
  note text,
  qty integer not null default 1 check (qty > 0),
  unit_price numeric(12, 2) not null default 0
);

-- ---------------------------------------------------------------------------
-- Operations: guides, vehicles, trips, payments
-- ---------------------------------------------------------------------------
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  active boolean not null default true
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  seats integer,
  next_service date,
  active boolean not null default true
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  guide_id uuid references public.guides (id) on delete set null,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  notes text,
  check (end_date >= start_date)
);
create index trips_dates_idx on public.trips (start_date, end_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'balance', 'other')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  due_date date,
  received_at timestamptz,
  method text,
  reference text
);
create index payments_due_idx on public.payments (due_date) where received_at is null;

-- ---------------------------------------------------------------------------
-- Row Level Security: staff only
-- ---------------------------------------------------------------------------
alter table public.staff enable row level security;
alter table public.guests enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_messages enable row level security;
alter table public.quote_items enable row level security;
alter table public.guides enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.payments enable row level security;

-- Staff can see the staff list. Adding or removing staff is done by an admin
-- in the Supabase dashboard (see supabase/README.md).
create policy "staff read staff" on public.staff
  for select to authenticated using (public.is_staff());

create policy "staff manage guests" on public.guests
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage bookings" on public.bookings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage booking messages" on public.booking_messages
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage quote items" on public.quote_items
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage guides" on public.guides
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage vehicles" on public.vehicles
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage trips" on public.trips
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage payments" on public.payments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
