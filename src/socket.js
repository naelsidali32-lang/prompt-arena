import { io } from "socket.io-client";

// In dev mode: Vite proxy forwards /socket.io to localhost:3001
// In production: Express serves everything on the same port
export const socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
});