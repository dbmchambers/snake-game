-- Scores table for the Snake game
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  username text not null check (char_length(username) between 1 and 20),
  score integer not null check (score >= 0 and score <= 10000),
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc);

alter table public.scores enable row level security;

-- Anyone can read the leaderboard
drop policy if exists "Public can read scores" on public.scores;
create policy "Public can read scores" on public.scores
  for select to anon, authenticated using (true);

-- Anyone can submit a score (no updates or deletes allowed)
drop policy if exists "Public can insert scores" on public.scores;
create policy "Public can insert scores" on public.scores
  for insert to anon, authenticated with check (true);

grant select, insert on public.scores to anon, authenticated;
