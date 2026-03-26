import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './features/game/LandingPage';
import GameRoom from './features/game/GameRoom';
import GameRoomPvE from './features/game/GameRoomPvE';
import { useGame } from './context/GameContext';

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

  return (
    <div className="antialiased font-sans selection:bg-cyan-500/30">
      <Routes>
        <Route 
          path="/" 
          element={roomId ? <Navigate to={`/room/${roomId}`} replace /> : <LandingPage onPlayVSComputer={() => setIsPvE(true)} />} 
        />
        <Route 
          path="/room/:id" 
          element={
            <RoomRedirectWrapper />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/**
 * A helper component that handles the logic for landing on /room/:id
 */
function RoomRedirectWrapper() {
  const { roomId } = useGame();
  const { id } = useParams();

  if (roomId) {
    return <GameRoom />;
  }

  // If we land here from a link but don't have a session, 
  // redirect to home with the room detected.
  return <Navigate to={`/?room=${id}`} replace />;
}

export default App;
