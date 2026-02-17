import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import GameRoom from "./pages/GameRoom";

function GameRoomWrapper() {
  const { gameId } = useParams();

  if (!gameId) {
    // No game ID, redirect to main site
    window.location.href = import.meta.env.VITE_APP_URL || "https://fightforcrypto.com";
    return null;
  }

  return <GameRoom gameId={gameId} />;
}

function RedirectToMain() {
  window.location.href = import.meta.env.VITE_APP_URL || "https://fightforcrypto.com";
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/game/:gameId" element={<GameRoomWrapper />} />
          <Route path="*" element={<RedirectToMain />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
