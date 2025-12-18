import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env. VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay:  1000,
    });
  }
  return socket;
};

export const joinEvent = (eventId: number) => {
  getSocket().emit('join: event', eventId);
};

export const leaveEvent = (eventId: number) => {
  getSocket().emit('leave:event', eventId);
};

export const emitCategoryChange = (eventId: number, category: any) => {
  getSocket().emit('category:change', { eventId, category });
};

export const emitDrawingStart = (eventId:  number, category: any) => {
  getSocket().emit('drawing:start', { eventId, category });
};

export const emitDrawingRoll = (eventId: number, participants: any[]) => {
  getSocket().emit('drawing:roll', { eventId, participants });
};

export const emitDrawingStop = (eventId:  number) => {
  getSocket().emit('drawing:stop', { eventId });
};

export const emitWinnerSelected = (eventId:  number, categoryId: number, winners: any[]) => {
  getSocket().emit('winner:selected', { eventId, categoryId, winners });
};

export const emitCategoryReset = (eventId: number, categoryId: number) => {
  getSocket().emit('category:reset', { eventId, categoryId });
};