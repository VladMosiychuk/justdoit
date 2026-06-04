import { CheckCircle2 } from "lucide-react";
import { getInitialTodosData } from "@/lib/server-api";
import { TodosView } from "@/components/todos/todos-view";
import { ThemeToggle } from "@/components/theme-toggle";

// Always render fresh on each request (SSR initial load via the NestJS API).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, todos, error } = await getInitialTodosData();

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10 sm:py-16">
      <header className="mb-8 flex items-center gap-3">
        <CheckCircle2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Just Do It</h1>
        <ThemeToggle className="ml-auto" />
      </header>

      <TodosView
        initialCategories={categories}
        initialTodos={todos}
        initialError={error}
      />
    </main>
  );
}
