import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"], // Force websocket si possible
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return socket;
}
