import axios, { AxiosError } from "axios";
import type {
  Category,
  CreateTodoInput,
  DeleteResponse,
  ErrorResponse,
  Todo,
  UpdateTodoInput,
} from "@justdoit/contracts";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Browser-side Axios instance. Used by client components for all mutations. */
export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Extracts a human-readable message from an Axios error, preferring the
 * backend's structured `message` field (e.g. the 5-task limit error).
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const data = axiosError.response?.data;
    if (data?.message) return data.message;
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function getTodos(categorySlug?: string): Promise<Todo[]> {
  const { data } = await apiClient.get<Todo[]>("/todos", {
    params: categorySlug ? { category: categorySlug } : undefined,
  });
  return data;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const { data } = await apiClient.post<Todo>("/todos", input);
  return data;
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  const { data } = await apiClient.patch<Todo>(`/todos/${id}`, input);
  return data;
}

export async function deleteTodo(id: string): Promise<DeleteResponse> {
  const { data } = await apiClient.delete<DeleteResponse>(`/todos/${id}`);
  return data;
}
