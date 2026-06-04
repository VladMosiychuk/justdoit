import "server-only";
import type { Category, Todo } from "@justdoit/contracts";

/**
 * Server-side data fetching for SSR. Next.js server components call the NestJS
 * API over HTTP using the internal URL. Next.js never touches the database
 * directly — NestJS remains the source of truth for business logic.
 */
const internalBaseUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export interface InitialTodosData {
  categories: Category[];
  todos: Todo[];
  error: string | null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${internalBaseUrl}${path}`, {
    // Always fetch fresh data on each request for the initial load.
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Fetches the data needed for the initial render. Resilient by design: if the
 * backend is unreachable during SSR, the page still renders and the client can
 * recover (retry) instead of crashing the whole route.
 */
export async function getInitialTodosData(
  categorySlug?: string,
): Promise<InitialTodosData> {
  try {
    const [categories, todos] = await Promise.all([
      fetchJson<Category[]>("/categories"),
      fetchJson<Todo[]>(
        categorySlug
          ? `/todos?category=${encodeURIComponent(categorySlug)}`
          : "/todos",
      ),
    ]);
    return { categories, todos, error: null };
  } catch (error) {
    return {
      categories: [],
      todos: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load data from the API",
    };
  }
}
