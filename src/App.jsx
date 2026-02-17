import { Web3Provider } from "./context/Web3Context";
import { SocketProvider } from "./context/SocketContext";
import Lobby from "./pages/Lobby";

function App() {
  return (
    <Web3Provider>
      <SocketProvider>
        <Lobby />
      </SocketProvider>
    </Web3Provider>
  );
}

export default App;
