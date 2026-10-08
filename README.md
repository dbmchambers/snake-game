# Snake

A simple Snake game. Pick a username, play, and your score is saved to Supabase and shown on a public leaderboard.

- `index.html`, `game.js`, `style.css`: the game
- `api/config.js`: gives the browser the Supabase URL and public key (from Vercel env vars `SUPABASE_URL` and `SUPABASE_ANON_KEY`)
- `supabase/schema.sql`: the scores table and its access rules
