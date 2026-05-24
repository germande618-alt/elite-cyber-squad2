-- ECS / Elite Cyber Squad initial Supabase schema.
-- Run this in the Supabase SQL editor after creating a project.

create extension if not exists pgcrypto;

create type public.game_type as enum ('cs2', 'fortnite');
create type public.tournament_status as enum ('draft', 'open', 'live', 'finished', 'cancelled');
create type public.registration_status as enum ('registered', 'checked_in', 'cancelled', 'disqualified');
create type public.match_status as enum ('scheduled', 'live', 'finished', 'cancelled');
create type public.team_role as enum ('captain', 'player', 'substitute');
create type public.user_role as enum ('player', 'admin', 'owner');
create type public.external_provider as enum ('telegram', 'epic', 'steam', 'twitch', 'youtube', 'tiktok', 'discord', 'fortnitetracker');

create table public.players (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique,
  telegram_username text,
  display_name text not null,
  avatar_url text,
  region text default 'EU',
  role public.user_role not null default 'player',
  level integer not null default 1,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_identities (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  provider public.external_provider not null,
  external_id text,
  username text not null,
  profile_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, username),
  unique (player_id, provider)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete set null,
  game public.game_type not null,
  name text not null,
  mode text not null,
  status public.tournament_status not null default 'draft',
  starts_at timestamptz not null,
  prize text,
  max_slots integer,
  image_url text,
  rules_url text,
  created_by uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custom_codes (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  code text not null,
  visible_from timestamptz,
  visible_to timestamptz,
  created_by uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status public.registration_status not null default 'registered',
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tournament_id, player_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  game public.game_type not null,
  name text not null,
  captain_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role public.team_role not null default 'player',
  joined_at timestamptz not null default now(),
  unique (team_id, player_id)
);

create table public.matches_2v2 (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_name text not null,
  sort_order integer not null default 0,
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  score_a integer not null default 0,
  score_b integer not null default 0,
  status public.match_status not null default 'scheduled',
  winner_team_id uuid references public.teams(id) on delete set null,
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches_2v2(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  kills integer not null default 0,
  deaths integer not null default 0,
  assists integer not null default 0,
  adr numeric(6, 2),
  headshot_rate numeric(5, 2),
  mvp_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table public.leaderboard_points (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete set null,
  player_id uuid not null references public.players(id) on delete cascade,
  game public.game_type not null,
  points integer not null,
  reason text not null,
  created_by uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.external_stats_snapshots (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  provider public.external_provider not null,
  game public.game_type,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

create index players_telegram_username_idx on public.players (telegram_username);
create index tournaments_game_status_idx on public.tournaments (game, status);
create index registrations_player_idx on public.registrations (player_id);
create index leaderboard_game_player_idx on public.leaderboard_points (game, player_id);
create index matches_tournament_order_idx on public.matches_2v2 (tournament_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

create trigger tournaments_set_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

create trigger matches_2v2_set_updated_at
before update on public.matches_2v2
for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.player_identities enable row level security;
alter table public.seasons enable row level security;
alter table public.tournaments enable row level security;
alter table public.custom_codes enable row level security;
alter table public.registrations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.matches_2v2 enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.leaderboard_points enable row level security;
alter table public.external_stats_snapshots enable row level security;

-- Temporary read policies for MVP. Tighten before production launch.
create policy "Public player profiles are readable" on public.players for select using (true);
create policy "Public identities are readable" on public.player_identities for select using (true);
create policy "Seasons are readable" on public.seasons for select using (true);
create policy "Tournaments are readable" on public.tournaments for select using (true);
create policy "Teams are readable" on public.teams for select using (true);
create policy "Team members are readable" on public.team_members for select using (true);
create policy "Matches are readable" on public.matches_2v2 for select using (true);
create policy "Match stats are readable" on public.match_player_stats for select using (true);
create policy "Leaderboard is readable" on public.leaderboard_points for select using (true);

-- Custom codes and registrations should be exposed through server-side checks,
-- not directly through public client policies.
