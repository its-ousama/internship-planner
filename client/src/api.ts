import axios from "axios";
import type { Task, Priority } from "./types";
import type { Topic } from "./types";

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