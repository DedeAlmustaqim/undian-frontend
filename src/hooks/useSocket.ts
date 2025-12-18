import { useEffect, useState } from 'react';
import { getSocket, joinEvent, leaveEvent } from '../services/socket';
import type { PrizeCategory, RollingParticipant, Winner } from '../types';

interface SocketState {
  isConnected: boolean;
  isDrawing: boolean;
  currentCategory: PrizeCategory | null;
  rollingParticipants: RollingParticipant[];
  winners: Winner[];
}

export function useSocket(eventId: number | null) {
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isDrawing: false,
    currentCategory: null,
    rollingParticipants: [],
    winners: [],
  });

  useEffect(() => {
    if (! eventId) return;

    const socket = getSocket();

    const onConnect = () => {
      setState(prev => ({ ... prev, isConnected: true }));
      joinEvent(eventId);
    };

    const onDisconnect = () => {
      setState(prev => ({ ...prev, isConnected: false }));
    };

    const onCategoryChanged = (data: { category: PrizeCategory | null }) => {
      setState(prev => ({
        ...prev,
        currentCategory:  data.category,
        isDrawing: false,
        rollingParticipants: [],
        winners: data.category?. winners || [],
      }));
    };

    const onDrawingStarted = (data:  { category: PrizeCategory }) => {
      setState(prev => ({
        ...prev,
        isDrawing: true,
        currentCategory: data. category,
        winners: [],
      }));
    };

    const onDrawingStopped = () => {
      setState(prev => ({ ...prev, isDrawing: false }));
    };

    const onParticipantRolling = (data: { participants: RollingParticipant[] }) => {
      setState(prev => ({ ...prev, rollingParticipants:  data.participants }));
    };

    const onWinnerAnnounced = (data: { winners: Winner[] }) => {
      setState(prev => ({
        ...prev,
        isDrawing: false,
        winners: data.winners,
        rollingParticipants: [],
      }));
    };

    const onWinnerRerolled = (data: { winnerIndex: number; newWinner: Winner }) => {
      setState(prev => {
        const newWinners = [...prev.winners];
        newWinners[data.winnerIndex] = data.newWinner;
        return { ...prev, winners: newWinners };
      });
    };

    const onCategoryResetted = () => {
      setState(prev => ({ ...prev, winners: [], isDrawing: false }));
    };

    const onSyncState = (data: any) => {
      if (data) {
        setState(prev => ({
          ...prev,
          isDrawing: data.isDrawing || false,
          currentCategory: data.currentCategory || null,
          rollingParticipants: data.rollingParticipants || [],
          winners: data.winners || [],
        }));
      }
    };

    socket. on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('category:changed', onCategoryChanged);
    socket.on('drawing:started', onDrawingStarted);
    socket.on('drawing:stopped', onDrawingStopped);
    socket.on('participant:rolling', onParticipantRolling);
    socket.on('winner:announced', onWinnerAnnounced);
    socket.on('winner:rerolled', onWinnerRerolled);
    socket.on('category:resetted', onCategoryResetted);
    socket.on('sync:state', onSyncState);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('category:changed', onCategoryChanged);
      socket.off('drawing:started', onDrawingStarted);
      socket.off('drawing:stopped', onDrawingStopped);
      socket.off('participant:rolling', onParticipantRolling);
      socket.off('winner:announced', onWinnerAnnounced);
      socket.off('winner:rerolled', onWinnerRerolled);
      socket.off('category:resetted', onCategoryResetted);
      socket.off('sync:state', onSyncState);
      leaveEvent(eventId);
    };
  }, [eventId]);

  return state;
}