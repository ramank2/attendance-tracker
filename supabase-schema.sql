-- Attendance Tracker - Supabase schema
-- Run this entire script in Supabase SQL Editor.

create table if not exists public.employees (
  emp_id text primary key,
  name text not null default '',
  designation text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  emp_id text not null references public.employees(emp_id) on delete cascade,
  attendance_date date not null,
  status_code text not null,
  updated_at timestamptz not null default now(),
  primary key (emp_id, attendance_date)
);

create table if not exists public.holidays (
  holiday_date date primary key,
  holiday_type text not null check (holiday_type in ('NH','FL')),
  name text not null default '',
  locked boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.holidays enable row level security;

drop policy if exists "authenticated users can read employees" on public.employees;
drop policy if exists "authenticated users can insert employees" on public.employees;
drop policy if exists "authenticated users can update employees" on public.employees;
drop policy if exists "authenticated users can delete employees" on public.employees;

create policy "authenticated users can read employees"
on public.employees for select to authenticated using (true);
create policy "authenticated users can insert employees"
on public.employees for insert to authenticated with check (true);
create policy "authenticated users can update employees"
on public.employees for update to authenticated using (true) with check (true);
create policy "authenticated users can delete employees"
on public.employees for delete to authenticated using (true);

drop policy if exists "authenticated users can read attendance" on public.attendance;
drop policy if exists "authenticated users can insert attendance" on public.attendance;
drop policy if exists "authenticated users can update attendance" on public.attendance;
drop policy if exists "authenticated users can delete attendance" on public.attendance;

create policy "authenticated users can read attendance"
on public.attendance for select to authenticated using (true);
create policy "authenticated users can insert attendance"
on public.attendance for insert to authenticated with check (true);
create policy "authenticated users can update attendance"
on public.attendance for update to authenticated using (true) with check (true);
create policy "authenticated users can delete attendance"
on public.attendance for delete to authenticated using (true);

drop policy if exists "authenticated users can read holidays" on public.holidays;
drop policy if exists "authenticated users can insert holidays" on public.holidays;
drop policy if exists "authenticated users can update holidays" on public.holidays;
drop policy if exists "authenticated users can delete holidays" on public.holidays;

create policy "authenticated users can read holidays"
on public.holidays for select to authenticated using (true);
create policy "authenticated users can insert holidays"
on public.holidays for insert to authenticated with check (true);
create policy "authenticated users can update holidays"
on public.holidays for update to authenticated using (true) with check (true);
create policy "authenticated users can delete holidays"
on public.holidays for delete to authenticated using (true);

create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists attendance_emp_idx on public.attendance(emp_id);
