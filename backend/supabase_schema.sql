-- ═══════════════════════════════════════════════════════════
-- INTOIT Learning — Supabase Schema
-- Run in Supabase SQL editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users (extends Supabase auth.users) ──────────────────
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  display_name  text not null default 'Learner',
  avatar_url    text,
  level         integer not null default 1,
  xp            integer not null default 0,
  streak        integer not null default 0,
  last_active   date,
  selected_track text not null default 'foundations',
  difficulty    text not null default 'beginner',
  theme         text not null default 'void',
  forge_score   integer not null default 0,
  lab_score     integer not null default 0,
  reduced_motion boolean not null default false,
  photosensitivity boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "New profile on signup" on public.profiles for insert with check (auth.uid() = id);

-- ── Concept progress ──────────────────────────────────────
create table if not exists public.concept_progress (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  concept_id  text not null,
  completed   boolean not null default false,
  xp_earned   integer not null default 0,
  last_seen   timestamptz not null default now(),
  unique(user_id, concept_id)
);

alter table public.concept_progress enable row level security;
create policy "Own progress" on public.concept_progress for all using (auth.uid() = user_id);

-- ── Flash cards (SM-2 state) ─────────────────────────────
create table if not exists public.flash_cards (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  concept_id    text not null,
  card_type     text not null,
  front         text not null,
  back          text not null,
  ease_factor   float not null default 2.5,
  interval_days integer not null default 1,
  repetitions   integer not null default 0,
  next_review   timestamptz not null default now(),
  xp_reward     integer not null default 2,
  created_at    timestamptz not null default now()
);

alter table public.flash_cards enable row level security;
create policy "Own cards" on public.flash_cards for all using (auth.uid() = user_id);

-- ── Quiz answers (for analytics) ─────────────────────────
create table if not exists public.quiz_answers (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  concept_id    text,
  category      text,
  difficulty    integer not null,
  correct       boolean not null,
  time_taken_ms integer,
  created_at    timestamptz not null default now()
);

alter table public.quiz_answers enable row level security;
create policy "Own answers" on public.quiz_answers for all using (auth.uid() = user_id);

-- ── Forge sessions ────────────────────────────────────────
create table if not exists public.forge_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  discipline  text not null,
  score       integer not null default 0,
  max_score   integer not null default 100,
  answers     jsonb,
  started_at  timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.forge_sessions enable row level security;
create policy "Own forge sessions" on public.forge_sessions for all using (auth.uid() = user_id);

-- ── Lab sessions ──────────────────────────────────────────
create table if not exists public.lab_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  paradigm    text not null,
  concept_id  text,
  score       integer not null default 0,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.lab_sessions enable row level security;
create policy "Own lab sessions" on public.lab_sessions for all using (auth.uid() = user_id);

-- ── Badges ───────────────────────────────────────────────
create table if not exists public.badges (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  badge_id    text not null,
  name        text not null,
  icon        text,
  description text,
  earned_at   timestamptz not null default now(),
  unique(user_id, badge_id)
);

alter table public.badges enable row level security;
create policy "Own badges" on public.badges for all using (auth.uid() = user_id);

-- ── Trigger: auto-create profile on auth signup ───────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Learner'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Updated_at trigger ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
