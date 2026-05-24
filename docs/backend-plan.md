# ECS Backend Plan

This is the server path for turning the current static prototype into a real ECS website.

## Data Ownership

- `players`: one row per community member.
- `player_identities`: linked accounts such as Epic, Steam, Twitch, YouTube, TikTok and Discord.
- `tournaments`: CS2 and Fortnite events.
- `registrations`: players registered for tournaments.
- `custom_codes`: Fortnite island codes or CS2 room codes, shown only after registration/check-in.
- `teams` and `team_members`: 2v2 CS2 teams and future Fortnite duos/squads.
- `matches_2v2`: editable bracket matches.
- `match_player_stats`: per-player CS2 match stats.
- `leaderboard_points`: source of truth for ECS rating/points.
- `external_stats_snapshots`: cached FortniteTracker/Epic/Steam-style payloads when an API is available.

## MVP API Routes

When the project moves to Next.js, replace `data/mock-api.js` with these routes:

- `GET /api/me`
- `GET /api/players?query=`
- `GET /api/players/:id`
- `GET /api/tournaments?game=cs2|fortnite`
- `POST /api/tournaments/:id/register`
- `GET /api/tournaments/:id/code`
- `GET /api/leaderboard?game=cs2|fortnite&season=`
- `GET /api/matches?game=cs2`
- `PATCH /api/admin/tournaments/:id/code`
- `PATCH /api/admin/matches/:id`

## Access Rules

- Players can read public player cards, tournaments, leaderboard and match brackets.
- Players can register only themselves.
- Codes are returned only if the requester is registered or is an admin.
- Admins can create tournaments, edit codes, edit match scores and award points.
- External stats are cached snapshots, not the primary ranking source.

## Next Step

Create a Next.js app and wire the current UI to `data/mock-api.js` first. After the screens still work, replace the mock API with Supabase queries route by route.
