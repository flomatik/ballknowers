# Supabase Table Setup Guide

## Table Name
`2025_season`

## Table Structure

This table stores player selections (which NFL teams each player picked).

### Required Columns:
- `id` - Primary key (auto-increment)
- `username` - Player/team name (the name they entered)
- `team_1` - First NFL team abbreviation they selected (e.g., "KC", "BUF")
- `team_2` - Second NFL team (optional, for future use)
- `team_3` - Third NFL team (optional, for future use)

## SQL to Create Table

```sql
CREATE TABLE "2025_season" (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  team_1 TEXT,
  team_2 TEXT,
  team_3 TEXT
);
```

## Row Level Security (RLS)

Make sure to enable RLS and allow anonymous reads/writes:

```sql
-- Enable RLS
ALTER TABLE "2025_season" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read access" ON "2025_season"
  FOR SELECT
  USING (true);

-- Allow anonymous insert/update access
CREATE POLICY "Allow anonymous write access" ON "2025_season"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" ON "2025_season"
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous delete access" ON "2025_season"
  FOR DELETE
  USING (true);
```

## How It Works

1. **NFL Team Records**: Fetched automatically from ESPN API (updates every 4 hours)
2. **Player Selections**: Stored in your `2025_season` table
   - When a player selects a team, it's saved to `team_1`
   - The app auto-saves as selections are made
   - On page load, it loads existing selections from Supabase

## Example Data

```sql
INSERT INTO "2025_season" (username, team_1) VALUES
('John', 'KC'),
('Sarah', 'BUF'),
('Mike', 'BAL');
```

The app will automatically:
- Load these selections when you open it
- Update player records based on the NFL team's current record
- Save new selections as they're made
