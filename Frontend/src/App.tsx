import LandingPage from './features/game/LandingPage';
import GameRoom from './features/game/GameRoom';
import { useGame } from './context/GameContext';

/**
 * Main App Orchestrator.
 * Dynamically switches between the Entry Lobby and the Game Battleground.
 */
function App() {
  const { roomId } = useGame();

  // If we have a roomId, we're in a session! Show the Game Room.
  // Otherwise, let the user create or join one from the Landing Page.
  return (
    <div className="antialiased font-sans selection:bg-cyan-500/30">
      {roomId ? <GameRoom /> : <LandingPage />}
    </div>
  );
}

export default App;
