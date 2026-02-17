import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import { SocketProvider } from "./context/SocketContext";
import Lobby from "./pages/Lobby";
import GameRoom from "./pages/GameRoom";

function GameRoomWrapper() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  return (
    <GameRoom 
      gameId={gameId} 
      onLeave={() => navigate("/")} 
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Web3Provider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/game/:gameId" element={<GameRoomWrapper />} />
          </Routes>
        </SocketProvider>
      </Web3Provider>
    </BrowserRouter>
  );
}

export default App;
