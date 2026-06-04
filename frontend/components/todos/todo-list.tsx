"use client";

import { ClipboardList } from "lucide-react";
import type { Todo } from "@justdoit/contracts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectableTodoItem, TodoItem } from "./todo-item";
import { useTodos } from "./todos-provider";

const TODO_SKELETON_ROWS = [
  { text: "w-4/5", detail: "w-2/5", category: "w-16" },
  { text: "w-3/5", detail: "w-1/3", category: "w-20" },
  { text: "w-11/12", detail: "w-1/2", category: "w-14" },
];

export function TodoList() {
  const { state } = useTodos();

  if (state.listFeedback.status === "loading") {
    return <TodoListLoading />;
  }

  if (state.listFeedback.status === "error") {
    return <TodoListError message={state.listFeedback.message} />;
  }

  if (state.todos.length === 0) {
    return <TodoListEmpty />;
  }

  if (state.selection.status === "active") {
    return <SelectableTodoListItems todos={state.todos} />;
  }

  return <TodoListItems todos={state.todos} />;
}

function TodoListLoading() {
  return (
    <ul
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      {TODO_SKELETON_ROWS.map((row, index) => (
        <li
          key={index}
          className="flex items-start gap-3 rounded-lg border bg-card p-2.5 sm:p-3"
        >
          <Skeleton className="mt-0.5 size-5 rounded-[5px]" />

          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="min-w-0 flex-1 space-y-2 py-0.5">
              <Skeleton className={`h-4 max-w-full ${row.text}`} />
            </div>
            <Skeleton className={`h-5 shrink-0 rounded-full ${row.category}`} />
          </div>

          <Skeleton className="size-5 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function TodoListError({ message }: { message: string }) {
  const { actions } = useTodos();

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center"
    >
      <p className="text-sm font-medium text-destructive">{message}</p>
      <Button variant="outline" onClick={() => void actions.retry()}>
        Try again
      </Button>
    </div>
  );
}

function TodoListEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
      <ClipboardList className="h-10 w-10 text-muted-foreground" />
      <p className="text-base font-medium">No tasks</p>
      <p className="text-sm text-muted-foreground">
        Create a task below to get started.
      </p>
    </div>
  );
}

function SelectableTodoListItems({ todos }: { todos: Todo[] }) {
  return (
    <ul className="space-y-3">
      {todos.map((todo) => (
        <SelectableTodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoListItems({ todos }: { todos: Todo[] }) {
  return (
    <ul className="space-y-3">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
