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
  total_correct integer not null default 0,
  total_wrong   integer not null default 0,
  accuracy_rate float not null default 0.0,
  total_time_spent integer not null default 0,
  recent_wrong_per_topic jsonb default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "New profile on signup" on public.profiles for insert with check (auth.uid() = id);

-- ── Topics and Courses ─────────────────────────────────────
create table if not exists public.topics (
  id            uuid primary key default uuid_generate_v4(),
  topic_id      text unique not null,
  name          text not null,
  category      text not null,
  description   text,
  difficulty_level text not null default 'medium',
  estimated_time_minutes integer,
  prerequisites  text[] default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.courses (
  id            uuid primary key default uuid_generate_v4(),
  course_id     text unique not null,
  name          text not null,
  description   text,
  total_modules integer not null default 0,
  estimated_time_minutes integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.course_modules (
  id            uuid primary key default uuid_generate_v4(),
  course_id     text references public.courses(course_id) on delete cascade not null,
  module_id     text not null,
  name          text not null,
  description   text,
  order_index   integer not null,
  topics        text[] default '{}',
  estimated_time_minutes integer,
  created_at    timestamptz not null default now()
);

-- ── Topic progress ────────────────────────────────────────────
create table if not exists public.topic_progress (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  topic_id     text not null,
  completed   boolean not null default false,
  xp_earned   integer not null default 0,
  last_seen   timestamptz not null default now(),
  time_spent_minutes integer not null default 0,
  attempts    integer not null default 0,
  best_score  float not null default 0.0,
  difficulty_level text not null default 'medium',
  unique(user_id, topic_id)
);

alter table public.topic_progress enable row level security;
create policy "Own progress" on public.topic_progress for all using (auth.uid() = user_id);

-- ── Flash cards (SM-2 state) ─────────────────────────────
create table if not exists public.flash_cards (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  topic_id       text not null,
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
  topic_id       text,
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
  topic_id    text,
  score       integer not null default 0,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.lab_sessions enable row level security;
create policy "Own lab sessions" on public.lab_sessions for all using (auth.uid() = user_id);

-- ── Lesson progress ─────────────────────────────────────────
create table if not exists public.lesson_progress (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  lesson_id         text not null,
  quiz_score        float,
  time_spent_minutes integer,
  completed         boolean not null default false,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;
create policy "Own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id);

-- ── Generated content cache ───────────────────────────────────
create table if not exists public.generated_content (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  content_type text not null check (content_type in ('quiz', 'flashcard', 'explanation')),
  topic       text not null,
  difficulty  text,
  parameters  jsonb,
  content     jsonb not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz default (now() + interval '7 days')
);

alter table public.generated_content enable row level security;
create policy "Own generated content" on public.generated_content for all using (auth.uid() = user_id);

-- ── Chat sessions ────────────────────────────────────────────
create table if not exists public.chat_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  session_type text not null default 'live_chat',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  duration_seconds integer,
  message_count integer default 0,
  created_at  timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;
create policy "Own chat sessions" on public.chat_sessions for all using (auth.uid() = user_id);

-- ── Progress Reports ─────────────────────────────────────────
create table if not exists public.progress_reports (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  report_date timestamptz not null default now(),
  course_id   text,
  time_range_days integer not null default 30,
  include_recommendations boolean not null default true,
  report_data jsonb not null,
  created_at  timestamptz not null default now()
);

-- RLS for new tables
alter table public.topics enable row level security;
create policy "Everyone can view topics" on public.topics for select using (true);

alter table public.courses enable row level security;
create policy "Everyone can view courses" on public.courses for select using (true);

alter table public.course_modules enable row level security;
create policy "Everyone can view course modules" on public.course_modules for select using (true);

alter table public.progress_reports enable row level security;
create policy "Own progress reports" on public.progress_reports for all using (auth.uid() = user_id);

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

create trigger lesson_progress_updated_at before update on public.lesson_progress
  for each row execute procedure public.set_updated_at();

-- ── Performance indexes ─────────────────────────────────────
create index if not exists idx_topic_progress_user_id on public.topic_progress(user_id);
create index if not exists idx_flash_cards_user_id_next_review on public.flash_cards(user_id, next_review);
create index if not exists idx_quiz_answers_user_id_created_at on public.quiz_answers(user_id, created_at);
create index if not exists idx_lesson_progress_user_id_lesson_id on public.lesson_progress(user_id, lesson_id);
create index if not exists idx_generated_content_user_id_type on public.generated_content(user_id, content_type);
create index if not exists idx_chat_sessions_user_id_started_at on public.chat_sessions(user_id, started_at);

-- Indexes for new tables
create index if not exists idx_topics_category on public.topics(category);
create index if not exists idx_topics_difficulty on public.topics(difficulty_level);
create index if not exists idx_courses_modules on public.courses(course_id);
create index if not exists idx_course_modules_course_id on public.course_modules(course_id);
create index if not exists idx_progress_reports_user_id_date on public.progress_reports(user_id, report_date);
create index if not exists idx_badges_user_id on public.badges(user_id);

-- ── Course Files (file storage metadata) ─────────────────────
create table if not exists public.course_files (
  id            uuid primary key default uuid_generate_v4(),
  course_id     text not null references public.courses(course_id) on delete cascade,
  filename      text not null,
  file_type     text not null,
  size_bytes    integer not null,
  storage_path  text not null unique,
  extracted_content text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS for course files
alter table public.course_files enable row level security;
create policy "Everyone can view course files" on public.course_files for select using (true);
create policy "Authenticated users can upload course files" on public.course_files for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update course files" on public.course_files for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete course files" on public.course_files for delete using (auth.role() = 'authenticated');

-- Trigger for course_files updated_at
create trigger course_files_updated_at before update on public.course_files
  for each row execute procedure public.set_updated_at();

-- Index for course files
create index if not exists idx_course_files_course_id on public.course_files(course_id);
create index if not exists idx_course_files_file_type on public.course_files(file_type);

-- ── Auto-generated file content ───────────────────────────────

-- Link topics back to the source file that generated them
alter table public.topics add column if not exists source_file_id uuid references public.course_files(id) on delete set null;
create index if not exists idx_topics_source_file_id on public.topics(source_file_id);

-- Pre-generated quizzes per file/topic (created automatically on file upload)
create table if not exists public.file_quizzes (
  id          uuid primary key default uuid_generate_v4(),
  file_id     uuid not null references public.course_files(id) on delete cascade,
  topic_id    text not null,
  topic_name  text not null,
  quiz_data   jsonb not null,
  difficulty  text not null default 'medium',
  created_at  timestamptz not null default now()
);

alter table public.file_quizzes enable row level security;
create policy "Everyone can view file quizzes" on public.file_quizzes for select using (true);
create policy "Service role can insert file quizzes" on public.file_quizzes for insert with check (auth.role() = 'authenticated');

create index if not exists idx_file_quizzes_file_id on public.file_quizzes(file_id);
create index if not exists idx_file_quizzes_topic_id on public.file_quizzes(topic_id);

-- ═══════════════════════════════════════════════════════════
-- BKT + Knowledge Graph Tables
-- ═══════════════════════════════════════════════════════════

-- ── BKT state — per-user mastery estimate per topic ───────
create table if not exists public.bkt_state (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete cascade not null,
  topic_id       text not null,
  p_know         float not null default 0.0,
  p_transit      float not null default 0.10,
  p_slip         float not null default 0.10,
  p_guess        float not null default 0.20,
  attempts       integer not null default 0,
  mastery_level  text not null default 'untouched'
                   check (mastery_level in ('untouched','struggling','learning','mastered')),
  common_mistake text,
  last_updated   timestamptz not null default now(),
  unique(user_id, topic_id)
);

alter table public.bkt_state enable row level security;
create policy "Own bkt state" on public.bkt_state for all using (auth.uid() = user_id);

-- ── Quiz events — per-answer BKT event log ────────────────
create table if not exists public.quiz_events (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  topic_id      text not null,
  question      text,
  correct       boolean not null,
  time_taken_ms integer,
  p_know_before float,
  p_know_after  float,
  created_at    timestamptz not null default now()
);

alter table public.quiz_events enable row level security;
create policy "Own quiz events" on public.quiz_events for all using (auth.uid() = user_id);

-- ── Knowledge graph edges — prerequisite relationships ────
create table if not exists public.kg_edges (
  id         uuid primary key default uuid_generate_v4(),
  from_topic text not null,
  to_topic   text not null,
  weight     float not null default 1.0,
  unique(from_topic, to_topic)
);

alter table public.kg_edges enable row level security;
create policy "Everyone can view kg edges" on public.kg_edges for select using (true);
create policy "Authenticated users can manage kg edges" on public.kg_edges
  for all using (auth.role() = 'authenticated');

-- ── BKT / KG indexes ──────────────────────────────────────
create index if not exists idx_bkt_state_user_id      on public.bkt_state(user_id);
create index if not exists idx_bkt_state_mastery       on public.bkt_state(user_id, mastery_level);
create index if not exists idx_quiz_events_user_topic  on public.quiz_events(user_id, topic_id, created_at desc);
create index if not exists idx_kg_edges_from           on public.kg_edges(from_topic);
create index if not exists idx_kg_edges_to             on public.kg_edges(to_topic);
