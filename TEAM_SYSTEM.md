# Team Multiplayer System

This application now includes a team-based multiplayer system using Supabase as the backend database.

## Features

### Team Creation
- Team leaders can create a new team by entering their name
- A unique 6-character team code is automatically generated
- The code can be shared with other players

### Team Joining
- Players can join an existing team using the team code
- Each player enters their name (must be unique within the team)
- Players see real-time updates as others join

### Team Lobby
- Real-time display of all team members
- Team leader is highlighted
- Copy team code button for easy sharing
- Only the team leader can start the game
- Minimum 2 players required to start

### Game Start
- When the leader starts the game, all team members automatically enter
- Player name and role (leader/member) are displayed during gameplay
- Team data is available to the game for future multiplayer features

## Database Schema

### Teams Table
- `id`: Unique team identifier
- `code`: 6-character team code (unique)
- `leader_name`: Name of team leader
- `status`: Current status (waiting/playing/finished)
- `created_at`: Team creation timestamp
- `started_at`: Game start timestamp

### Team Members Table
- `id`: Unique member identifier
- `team_id`: Reference to team
- `name`: Player name (unique per team)
- `is_leader`: Boolean flag for team leader
- `joined_at`: Join timestamp
- `last_active`: Last activity timestamp

## How It Works

1. **Create Team Flow**:
   - Leader enters name → Team created → Unique code generated → Waiting in lobby

2. **Join Team Flow**:
   - Player enters code and name → Validates team exists and is waiting → Joins lobby

3. **Game Start Flow**:
   - Leader clicks "Start Game" → Team status updated to "playing" → All members enter game

4. **Real-time Updates**:
   - Uses Supabase Realtime to sync member list and game status
   - All players see updates immediately without refreshing

## Technical Implementation

- **Frontend**: React with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **UI Components**: shadcn/ui with Tailwind CSS
- **Game Engine**: Phaser 3

## Security

- Row Level Security (RLS) enabled on all tables
- Public access allowed for game lobby functionality
- Team codes are randomly generated to prevent guessing
- Names must be unique within each team

## Future Enhancements

- Add player position synchronization in-game
- Team chat functionality
- Spectator mode
- Team statistics and leaderboards
- Reconnection handling for disconnected players
