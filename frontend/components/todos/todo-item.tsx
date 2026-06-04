"use client";

import { X } from "lucide-react";
import type { Todo } from "@justdoit/contracts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTodos } from "./todos-provider";

interface TodoItemProps {
  todo: Todo;
}

function TodoContent({ todo }: { todo: Todo }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      <p
        className={cn(
          "min-w-0 flex-1 break-words text-sm font-medium leading-5",
          todo.completed && "text-muted-foreground line-through",
        )}
        title={todo.text}
      >
        {todo.text}
      </p>
      <span className="inline-flex shrink-0 items-center rounded-full border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
        {todo.category.name}
      </span>
    </div>
  );
}

export function SelectableTodoItem({ todo }: TodoItemProps) {
  const { actions, meta } = useTodos();
  const selectable = !todo.completed;
  const selected = meta.selectedIds.has(todo.id);

  return (
    <li>
      <label
        className={cn(
          "flex items-center gap-3 rounded-lg border p-2.5 transition-colors sm:p-3",
          selectable
            ? "cursor-pointer hover:bg-accent/50"
            : "cursor-not-allowed opacity-60",
          selected && "border-primary bg-accent/60",
        )}
      >
        <Checkbox
          checked={selected}
          disabled={!selectable}
          onCheckedChange={(value) =>
            actions.toggleSelected(todo.id, value === true)
          }
          aria-label={`Select task: ${todo.text}`}
          className="size-5 [&_svg]:size-4!"
        />
        <TodoContent todo={todo} />
      </label>
    </li>
  );
}

export function TodoItem({ todo }: TodoItemProps) {
  const { actions } = useTodos();

  return (
    <li className="group flex items-center gap-3 rounded-lg border bg-card p-2.5 sm:p-3">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(value) =>
          actions.toggleCompleted(todo, value === true)
        }
        aria-label={
          todo.completed
            ? `Mark "${todo.text}" as not done`
            : `Mark "${todo.text}" as done`
        }
        className="size-5 [&_svg]:size-4!"
      />

      <TodoContent todo={todo} />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => actions.deleteTodo(todo)}
        aria-label={`Delete task: ${todo.text}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <X />
      </Button>
    </li>
  );
}
