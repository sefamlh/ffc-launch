import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import Lobby from "./pages/Lobby";
import GameRoom from "./pages/GameRoom";

function GameRoomWrapper() {
  const { gameId } = useParams();
  return <GameRoom gameId={gameId} />;
}

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/game/:gameId" element={<GameRoomWrapper />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
