import axios from 'axios';
import type { Event, Participant, PrizeCategory, Winner } from '../types';

const API_URL = import.meta.env. VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Events
export const eventApi = {
  getAll: () => api.get<Event[]>('/events'),
  getById: (id: number) => api.get<Event>(`/events/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/events', data),
  update: (id:  number, data:  Partial<Event>) => api.put<Event>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};

// Participants
export const participantApi = {
  getAll: (eventId: number) => api.get<Participant[]>(`/events/${eventId}/participants`),
  getEligible: (eventId: number) => api.get<Participant[]>(`/events/${eventId}/participants/eligible`),
  create: (eventId: number, data: Partial<Participant>) =>
    api.post<Participant>(`/events/${eventId}/participants`, data),
  import: (eventId:  number, file: File) => {
    const formData = new FormData();
    formData. append('file', file);
    return api.post(`/events/${eventId}/import/participants`, formData, {
      headers:  { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Categories
export const categoryApi = {
  getAll: (eventId: number) => api.get<PrizeCategory[]>(`/events/${eventId}/categories`),
  getById: (eventId: number, id: number) => api.get<PrizeCategory>(`/events/${eventId}/categories/${id}`),
  create: (eventId: number, data: Partial<PrizeCategory>) =>
    api. post<PrizeCategory>(`/events/${eventId}/categories`, data),
  update: (eventId: number, id:  number, data:  Partial<PrizeCategory>) =>
    api.put<PrizeCategory>(`/events/${eventId}/categories/${id}`, data),
};

// Drawing
export const drawingApi = {
  getEligible: (eventId: number, categoryId: number) =>
    api.get<Participant[]>(`/events/${eventId}/categories/${categoryId}/eligible`),
  roll: (eventId:  number, categoryId:  number) =>
    api. post(`/events/${eventId}/categories/${categoryId}/roll`),
  selectWinners: (eventId: number, categoryId: number) =>
    api.post<Winner[]>(`/events/${eventId}/categories/${categoryId}/select-winners`),
  reroll: (eventId: number, categoryId: number, winnerId: number) =>
    api.post(`/events/${eventId}/categories/${categoryId}/winners/${winnerId}/reroll`),
  reset: (eventId:  number, categoryId:  number) =>
    api.post(`/events/${eventId}/categories/${categoryId}/reset`),
};

// History
export const historyApi = {
  getWinners: (eventId: number) => api.get<Winner[]>(`/events/${eventId}/winners`),
};

export default api;