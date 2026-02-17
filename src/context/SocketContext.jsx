import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join a game room
  const joinRoom = useCallback(
    (gameId) => {
      if (socket && isConnected) {
        socket.emit("join_room", { gameId });
        console.log("🎮 Joined room:", gameId);
      }
    },
    [socket, isConnected]
  );

  // Leave a game room
  const leaveRoom = useCallback(
    (gameId) => {
      if (socket && isConnected) {
        socket.emit("leave_room", { gameId });
        console.log("🎮 Left room:", gameId);
      }
    },
    [socket, isConnected]
  );

  // Send game action
  const sendGameAction = useCallback(
    (gameId, action, data) => {
      if (socket && isConnected) {
        socket.emit("game_action", { gameId, action, data });
      }
    },
    [socket, isConnected]
  );

  // Subscribe to events
  const on = useCallback(
    (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
      return () => {};
    },
    [socket]
  );

  // Emit event
  const emit = useCallback(
    (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    },
    [socket, isConnected]
  );

  const value = {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    leaveRoom,
    sendGameAction,
    on,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
