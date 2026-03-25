import { useState, useEffect } from 'react';
import LandingPage from './features/game/LandingPage';
import GameRoom from './features/game/GameRoom';
import GameRoomPvE from './features/game/GameRoomPvE';
import { useGame } from './context/GameContext';

/**
 * Main App Orchestrator.
 * Dynamically switches between the Entry Lobby, Online PvP Battleground, and Offline PvE Cyber Match.
 */
function App() {
  const { roomId } = useGame();
  
  // Persist PvE mode across browser reloads
  const [isPvE, setIsPvE] = useState(() => sessionStorage.getItem('isPvE') === 'true');

  useEffect(() => {
      sessionStorage.setItem('isPvE', String(isPvE));
  }, [isPvE]);

  // If in PvE mode, render the offline cyber match.
  if (isPvE) {
      return (
          <div className="antialiased font-sans selection:bg-purple-500/30">
              <GameRoomPvE onExit={() => setIsPvE(false)} />
          </div>
      );
  }

  // Otherwise handle the standard online PvP flow.
  return (
    <div className="antialiased font-sans selection:bg-cyan-500/30">
      {roomId ? <GameRoom /> : <LandingPage onPlayVSComputer={() => setIsPvE(true)} />}
    </div>
  );
}

export default App;
