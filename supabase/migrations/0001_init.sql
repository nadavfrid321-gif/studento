-- Studento — initial schema
-- Run via: supabase db push   (after `supabase link --project-ref <ref>`)

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  create type faculty as enum ('law', 'economics');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_type as enum ('reading', 'assignment', 'exam', 'quiz', 'event');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending', 'in_progress', 'done', 'late');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  year int default 3,
  seeded boolean default false,
  created_at timestamptz default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  code text,
  faculty faculty not null,
  color text default '#0d1c32',
  icon text default 'folder',
  professor text,
  semester text,
  created_at timestamptz default now()
);
create index if not exists courses_user_id_idx on courses(user_id);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  type task_type not null,
  title text not null,
  description text,
  due_date timestamptz,
  weight numeric,
  status task_status default 'pending',
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_course_id_idx on tasks(course_id);
create index if not exists tasks_due_date_idx on tasks(due_date);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  task_id uuid references tasks on delete set null,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);
create index if not exists files_course_id_idx on files(course_id);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  title text,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists notes_course_id_idx on notes(course_id);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
create index if not exists push_subs_user_id_idx on push_subscriptions(user_id);

create table if not exists reminders_sent (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks on delete cascade,
  offset_days int not null,
  sent_at timestamptz default now(),
  unique (task_id, offset_days)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table tasks enable row level security;
alter table files enable row level security;
alter table notes enable row level security;
alter table push_subscriptions enable row level security;
alter table reminders_sent enable row level security;

-- profiles
drop policy if exists "own profile select" on profiles;
create policy "own profile select" on profiles for select using (auth.uid() = id);
drop policy if exists "own profile insert" on profiles;
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on profiles;
create policy "own profile update" on profiles for update using (auth.uid() = id);

-- courses
drop policy if exists "own courses all" on courses;
create policy "own courses all" on courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
drop policy if exists "own tasks all" on tasks;
create policy "own tasks all" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- files
drop policy if exists "own files all" on files;
create policy "own files all" on files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notes
drop policy if exists "own notes all" on notes;
create policy "own notes all" on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- push_subscriptions
drop policy if exists "own push all" on push_subscriptions;
create policy "own push all" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reminders_sent — read-only for owner, edge function inserts as service role
drop policy if exists "own reminders read" on reminders_sent;
create policy "own reminders read" on reminders_sent for select
  using (exists (select 1 from tasks t where t.id = reminders_sent.task_id and t.user_id = auth.uid()));

-- ============================================================
-- Auto-update timestamp trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists notes_set_updated_at on notes;
create trigger notes_set_updated_at before update on notes
  for each row execute function set_updated_at();

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Mark overdue tasks as 'late' (called by edge function or trigger)
-- ============================================================
create or replace function mark_overdue_tasks()
returns void language sql as $$
  update tasks
  set status = 'late'
  where status = 'pending'
    and due_date is not null
    and due_date < now();
$$;

-- ============================================================
-- Storage bucket for course files
-- ============================================================
insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', false)
on conflict (id) do nothing;

drop policy if exists "own files read" on storage.objects;
create policy "own files read" on storage.objects for select
  using (bucket_id = 'course-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "own files insert" on storage.objects;
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'course-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "own files delete" on storage.objects;
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'course-files' and auth.uid()::text = (storage.foldername(name))[1]);
