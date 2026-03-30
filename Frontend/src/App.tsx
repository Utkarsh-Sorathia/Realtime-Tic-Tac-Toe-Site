import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useGame } from './context/GameContext';
import { Loader2 } from 'lucide-react';

// Lazy loading core components for performance
// Self-healing lazy loading: If a chunk fails (due to a NEW deployment), force a page reload
const LandingPage = lazy(() => import('./features/game/LandingPage'));
const GameRoom = lazy(() => import('./features/game/GameRoom').catch(() => { window.location.reload(); return { default: () => null } }));
const GameRoomPvE = lazy(() => import('./features/game/GameRoomPvE'));
const NotFound = lazy(() => import('./features/error/NotFound'));

/**
 * A sleek, centered performance-optimized fallback loader
 */
const PageLoader = () => (
  <div className="h-dvh w-full bg-[#0f172a] flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-[#22d3ee] animate-spin opacity-50" />
  </div>
);

function App() {
  const { roomId } = useGame();
  
  // Persist PvE mode across browser reloads
  const [isPvE, setIsPvE] = useState(() => sessionStorage.getItem('isPvE') === 'true');

  useEffect(() => {
      sessionStorage.setItem('isPvE', String(isPvE));
  }, [isPvE]);

  return (
    <div className="antialiased font-sans selection:bg-(--primary-cyan)/30 selection:text-white">
      <Suspense fallback={<PageLoader />}>
        {isPvE ? (
             <GameRoomPvE onExit={() => setIsPvE(false)} />
        ) : (
          <Routes>
            <Route 
              path="/" 
              element={roomId ? <Navigate to={`/room/${roomId}`} replace /> : <LandingPage onPlayVSComputer={() => setIsPvE(true)} />} 
            />
            <Route 
              path="/room/:id" 
              element={<RoomRedirectWrapper />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </Suspense>
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
