// Hands the browser the Supabase URL and public (anon/publishable) key.
// These are safe to expose: the database only allows reading and adding scores.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    url: process.env.SUPABASE_URL || null,
    key: process.env.SUPABASE_ANON_KEY || null,
  });
}
