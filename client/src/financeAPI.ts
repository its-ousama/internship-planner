import axios from "axios";
import type {
  FinanceCategory, FinanceTransaction, FinanceRecurring,
  FinanceGoal, FinanceMonthlySummary, FinanceCategorySpending
} from "./types";

const F = "http://localhost:3001/api/finance";

// Config / PIN
export const getFinanceStatus = () =>
  axios.get<{ configured: boolean }>(`${F}/config/status`).then(r => r.data);

export const setupFinancePin = (pin: string) =>
  axios.post(`${F}/config/setup`, { pin }).then(r => r.data);

export const verifyFinancePin = (pin: string) =>
  axios.post<{ success: boolean }>(`${F}/config/verify`, { pin }).then(r => r.data);

// Categories
export const getCategories = () =>
  axios.get<FinanceCategory[]>(`${F}/categories`).then(r => r.data);

export const createCategory = (data: Omit<FinanceCategory, "id" | "created_at">) =>
  axios.post<FinanceCategory>(`${F}/categories`, data).then(r => r.data);

export const updateCategory = (id: number, data: Omit<FinanceCategory, "id" | "created_at">) =>
  axios.put<FinanceCategory>(`${F}/categories/${id}`, data).then(r => r.data);

export const deleteCategory = (id: number) =>
  axios.delete(`${F}/categories/${id}`).then(r => r.data);

// Transactions
export const getTransactions = (month?: string, category_id?: number) =>
  axios.get<FinanceTransaction[]>(`${F}/transactions`, { params: { month, category_id } }).then(r => r.data);

export const createTransaction = (data: {
  amount: number;
  type: string;
  category_id?: number | null;
  date: string;
  note?: string;
  is_recurring?: boolean;
  recurring_id?: number | null;
  is_goal?: boolean;
}) => axios.post<FinanceTransaction>(`${F}/transactions`, data).then(r => r.data);

export const updateTransaction = (id: number, data: any) =>
  axios.put<FinanceTransaction>(`${F}/transactions/${id}`, data).then(r => r.data);

export const deleteTransaction = (id: number) =>
  axios.delete(`${F}/transactions/${id}`).then(r => r.data);

// Recurring
export const getRecurring = () =>
  axios.get<FinanceRecurring[]>(`${F}/recurring`).then(r => r.data);

export const getPendingRecurring = (month: string) =>
  axios.get<FinanceRecurring[]>(`${F}/recurring/pending/${month}`).then(r => r.data);

export const createRecurring = (data: any) =>
  axios.post<FinanceRecurring>(`${F}/recurring`, data).then(r => r.data);

export const skipRecurring = (recurring_id: number, month: string) =>
  axios.post(`${F}/recurring/skip`, { recurring_id, month }).then(r => r.data);

export const deleteRecurring = (id: number) =>
  axios.delete(`${F}/recurring/${id}`).then(r => r.data);

// Goals
export const getGoals = () =>
  axios.get<FinanceGoal[]>(`${F}/goals`).then(r => r.data);

export const createGoal = (data: any) =>
  axios.post<FinanceGoal>(`${F}/goals`, data).then(r => r.data);

export const contributeToGoal = (id: number, amount: number) =>
  axios.patch<FinanceGoal>(`${F}/goals/${id}/contribute`, { amount }).then(r => r.data);

export const updateGoal = (id: number, data: any) =>
  axios.put<FinanceGoal>(`${F}/goals/${id}`, data).then(r => r.data);

export const deleteGoal = (id: number) =>
  axios.delete(`${F}/goals/${id}`).then(r => r.data);

// Summary & spending
export const getMonthlySummary = (month: string) =>
  axios.get<FinanceMonthlySummary>(`${F}/summary/${month}`).then(r => r.data);

export const getCategorySpending = (month: string) =>
  axios.get<FinanceCategorySpending[]>(`${F}/spending/${month}`).then(r => r.data);