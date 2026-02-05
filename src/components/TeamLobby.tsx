import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase, createTeam, joinTeam, getTeamMembers, startTeam, type Team, type TeamMember } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Copy, Play, Loader2 } from 'lucide-react';

interface TeamLobbyProps {
  onGameStart: (teamId: string, playerName: string, isLeader: boolean) => void;
}

const TeamLobby = ({ onGameStart }: TeamLobbyProps) => {
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby'>('menu');
  const [leaderName, setLeaderName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentTeam) return;

    const fetchMembers = async () => {
      try {
        const members = await getTeamMembers(currentTeam.id);
        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();

    const channel = supabase
      .channel(`team:${currentTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${currentTeam.id}`
        },
        () => {
          fetchMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${currentTeam.id}`
        },
        (payload) => {
          const updatedTeam = payload.new as Team;
          setCurrentTeam(updatedTeam);
          if (updatedTeam.status === 'playing') {
            const member = teamMembers.find(m => m.name === playerName || m.name === leaderName);
            if (member) {
              onGameStart(currentTeam.id, member.name, member.is_leader);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTeam, onGameStart, playerName, leaderName, teamMembers]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const team = await createTeam(leaderName.trim());
      setCurrentTeam(team);
      setIsLeader(true);
      setView('lobby');
      toast.success('Team created successfully!');
    } catch (error) {
      toast.error('Failed to create team. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !teamCode.trim()) {
      toast.error('Please enter both name and team code');
      return;
    }

    setLoading(true);
    try {
      const team = await joinTeam(teamCode.trim(), playerName.trim());
      setCurrentTeam(team);
      setIsLeader(false);
      setView('lobby');
      toast.success('Joined team successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join team');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentTeam || !isLeader) return;

    if (teamMembers.length < 2) {
      toast.error('Need at least 2 players to start');
      return;
    }

    setLoading(true);
    try {
      await startTeam(currentTeam.id);
    } catch (error) {
      toast.error('Failed to start game');
      console.error(error);
      setLoading(false);
    }
  };

  const copyTeamCode = () => {
    if (currentTeam) {
      navigator.clipboard.writeText(currentTeam.code);
      toast.success('Team code copied!');
    }
  };

  if (view === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md glass-panel border-glow-cyan">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="w-16 h-16 text-neon-cyan" />
            </div>
            <CardTitle className="text-3xl font-cyber neon-cyan">Team Game</CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a team or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setView('create')}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 border-glow-cyan"
              size="lg"
            >
              Create New Team
            </Button>
            <Button
              onClick={() => setView('join')}
              className="w-full h-12 text-lg"
              variant="outline"
              size="lg"
            >
              Join Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md glass-panel border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-2xl font-cyber neon-cyan">Create Team</CardTitle>
            <CardDescription>Enter your name to create a team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaderName" className="text-foreground">Your Name</Label>
                <Input
                  id="leaderName"
                  placeholder="Enter your name"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  maxLength={20}
                  className="h-11"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView('menu')}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Team'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md glass-panel border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-2xl font-cyber neon-cyan">Join Team</CardTitle>
            <CardDescription>Enter team code and your name</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamCode" className="text-foreground">Team Code</Label>
                <Input
                  id="teamCode"
                  placeholder="Enter 6-digit code"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="h-11 font-mono text-lg tracking-widest"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playerName" className="text-foreground">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  className="h-11"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView('menu')}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Team'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'lobby' && currentTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl glass-panel border-glow-cyan">
          <CardHeader>
            <CardTitle className="text-3xl font-cyber neon-cyan text-center">Team Lobby</CardTitle>
            <CardDescription className="text-center">
              {isLeader ? 'Share the code with your team members' : 'Waiting for team leader to start'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-3 p-6 bg-card/50 rounded-lg border border-primary/30">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Team Code</p>
                <p className="text-4xl font-mono font-bold tracking-widest neon-cyan">
                  {currentTeam.code}
                </p>
              </div>
              <Button
                onClick={copyTeamCode}
                variant="outline"
                size="icon"
                className="border-primary/50 hover:border-primary"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <Separator className="bg-border/50" />

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Members ({teamMembers.length})
              </h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-card/30 rounded-lg border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                      <span className="font-bold text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      {member.is_leader && (
                        <p className="text-xs text-primary">Team Leader</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isLeader && (
              <Button
                onClick={handleStartGame}
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 border-glow-cyan"
                size="lg"
                disabled={loading || teamMembers.length < 2}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            )}

            {!isLeader && (
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border/50">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Waiting for team leader to start the game...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default TeamLobby;
