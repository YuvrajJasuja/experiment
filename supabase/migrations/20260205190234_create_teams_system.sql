/*
  # Team System for Multiplayer Game

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `code` (text, unique) - 6-character team code
      - `leader_name` (text) - Name of team leader
      - `status` (text) - 'waiting', 'playing', 'finished'
      - `created_at` (timestamptz)
      - `started_at` (timestamptz, nullable)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `name` (text) - Player name
      - `is_leader` (boolean) - Whether this is the team leader
      - `joined_at` (timestamptz)
      - `last_active` (timestamptz) - For presence tracking

  2. Security
    - Enable RLS on both tables
    - Allow public read access to teams and team_members (game lobby needs this)
    - Allow public insert/update for joining teams
    
  3. Indexes
    - Index on team code for fast lookups
    - Index on team_id for member queries
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  leader_name text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'playing', 'finished'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_leader boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(team_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create teams"
  ON teams FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update teams"
  ON teams FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can join teams"
  ON team_members FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update their presence"
  ON team_members FOR UPDATE
  TO public
  USING (true);
