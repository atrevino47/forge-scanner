-- Create public.users table for OAuth-linked scan ownership.
-- The auth/link-scan route upserts to this table when a user signs in
-- via Google OAuth to claim their scan results.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  lead_id uuid REFERENCES leads (id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_lead_id ON users (lead_id) WHERE lead_id IS NOT NULL;

-- RLS: users can read their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());
