import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useCollaboration(onMessage: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000"); // Change to your backend URL in production

    socketRef.current.on("mindmap-change", onMessage);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [onMessage]);

  const send = (data: any) => {
    socketRef.current?.emit("mindmap-change", data);
  };

  return { send };
}