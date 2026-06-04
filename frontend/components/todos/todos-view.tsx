"use client";

import { ListChecks, X } from "lucide-react";
import type { Category, Todo } from "@justdoit/contracts";
import { Button } from "@/components/ui/button";
import { BulkActions } from "./bulk-actions";
import { CategoryFilter } from "./category-filter";
import { TodoForm } from "./todo-form";
import { TodoList } from "./todo-list";
import { TodosProvider, useTodos } from "./todos-provider";

interface TodosViewProps {
  initialCategories: Category[];
  initialTodos: Todo[];
  initialError: string | null;
}

export function TodosView(props: TodosViewProps) {
  return (
    <TodosProvider {...props}>
      <TodosWorkspace />
    </TodosProvider>
  );
}

function TodosWorkspace() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <TodosToolbar />
        <SelectionActions />
        <TodoList />
      </div>

      <TodoForm />
    </div>
  );
}

function TodosToolbar() {
  const { state, actions, meta } = useTodos();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <CategoryFilter />

      {meta.selectableTodos.length > 0 ? (
        state.selection.status === "active" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={actions.exitSelection}
          >
            <X />
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={actions.enterSelection}
          >
            <ListChecks />
            Select
          </Button>
        )
      ) : null}
    </div>
  );
}

function SelectionActions() {
  const { state } = useTodos();

  if (state.selection.status !== "active") {
    return null;
  }

  return <BulkActions />;
}
