import axios from "axios";
import type { Task, Priority, Topic, Journal, JournalTheme } from "./types";

const BASE = "http://localhost:3001/api/tasks";

export const getTasks = (date: string) =>
  axios.get<Task[]>(BASE, { params: { date } }).then(r => r.data);

export const createTask = (data: {
  title: string;
  date: string;
  priority: Priority;
  color: string;
}) => axios.post<Task>(BASE, data).then(r => r.data);

export const updateStatus = (id: number, status: string) =>
  axios.patch<Task>(`${BASE}/${id}/status`, { status }).then(r => r.data);

export const deleteTask = (id: number) =>
  axios.delete(`${BASE}/${id}`).then(r => r.data);

const TOPICS = "http://localhost:3001/api/topics";

export const getTopics = () =>
  axios.get<Topic[]>(TOPICS).then(r => r.data);

export const createTopic = (data: Omit<Topic, "id">) =>
  axios.post<Topic>(TOPICS, data).then(r => r.data);

export const updateTopic = (id: number, data: Omit<Topic, "id">) =>
  axios.put<Topic>(`${TOPICS}/${id}`, data).then(r => r.data);

export const deleteTopic = (id: number) =>
  axios.delete(`${TOPICS}/${id}`).then(r => r.data);

// ── Journal ──────────────────────────────────────────────────────────────────

const JOURNALS = "http://localhost:3001/api/journals";

export const getJournalStatus = () =>
  axios.get<{ configured: boolean }>(`${JOURNALS}/config/status`).then(r => r.data);

export const setupJournal = (data: { password: string; answer: string; number: string }) =>
  axios.post(`${JOURNALS}/config/setup`, data).then(r => r.data);

export const verifyJournal = (data: { password: string; answer: string; number: string }) =>
  axios.post<{ success: boolean }>(`${JOURNALS}/config/verify`, data).then(r => r.data);

export const getJournals = () =>
  axios.get<Journal[]>(JOURNALS).then(r => r.data);

export const getJournal = (id: number) =>
  axios.get<Journal>(`${JOURNALS}/${id}`).then(r => r.data);

export const createJournal = (name: string) =>
  axios.post<Journal>(JOURNALS, { name }).then(r => r.data);

export const saveJournalContent = (id: number, content: any) =>
  axios.put<Journal>(`${JOURNALS}/${id}`, { content }).then(r => r.data);

export const updateJournalTheme = (id: number, theme: JournalTheme) =>
  axios.patch<Journal>(`${JOURNALS}/${id}/theme`, { theme }).then(r => r.data);

export const renameJournal = (id: number, name: string) =>
  axios.patch<Journal>(`${JOURNALS}/${id}`, { name }).then(r => r.data);

export const deleteJournal = (id: number) =>
  axios.delete(`${JOURNALS}/${id}`).then(r => r.data);