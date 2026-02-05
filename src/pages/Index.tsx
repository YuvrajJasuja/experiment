import { useState } from 'react';
import GameComponent from '@/game/GameComponent';
import TeamLobby from '@/components/TeamLobby';

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [teamData, setTeamData] = useState<{
    teamId: string;
    playerName: string;
    isLeader: boolean;
  } | null>(null);

  const handleGameStart = (teamId: string, playerName: string, isLeader: boolean) => {
    setTeamData({ teamId, playerName, isLeader });
    setGameStarted(true);
  };

  if (!gameStarted) {
    return <TeamLobby onGameStart={handleGameStart} />;
  }

  return <GameComponent teamData={teamData} />;
};

export default Index;
