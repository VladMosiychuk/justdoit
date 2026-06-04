"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Category, CreateTodoInput, Todo } from "@justdoit/contracts";
import {
  createTodo as createTodoRequest,
  deleteTodo as deleteTodoRequest,
  getApiErrorMessage,
  getCategories,
  getTodos,
  updateTodo,
} from "@/lib/api-client";

export const ALL_CATEGORIES = "all";

const UNDO_WINDOW_MS = 5000;
const EMPTY_SELECTED_IDS: ReadonlySet<string> = new Set<string>();

type ListFeedback =
  | { status: "ready" }
  | { status: "loading" }
  | { status: "error"; message: string };

type SelectionState =
  | { status: "inactive" }
  | { status: "active"; selectedIds: ReadonlySet<string> };

interface TodosState {
  categories: Category[];
  todos: Todo[];
  categorySlug: string;
  listFeedback: ListFeedback;
  selection: SelectionState;
}

interface TodosActions {
  changeCategory: (slug: string) => void;
  retry: () => Promise<void>;
  createTodo: (input: CreateTodoInput) => Promise<void>;
  enterSelection: () => void;
  exitSelection: () => void;
  toggleSelected: (id: string, selected: boolean) => void;
  toggleSelectAll: (selectAll: boolean) => void;
  markSelectedDone: () => void;
  deleteSelected: () => void;
  toggleCompleted: (todo: Todo, completed: boolean) => void;
  deleteTodo: (todo: Todo) => void;
}

interface TodosMeta {
  selectableTodos: Todo[];
  selectedIds: ReadonlySet<string>;
  selectedCount: number;
  allSelected: boolean;
}

interface TodosContextValue {
  state: TodosState;
  actions: TodosActions;
  meta: TodosMeta;
}

interface TodosProviderProps {
  initialCategories: Category[];
  initialTodos: Todo[];
  initialError: string | null;
  children: ReactNode;
}

type CompletionFeedback = "toast" | "silent";

const TodosContext = createContext<TodosContextValue | null>(null);

function insertSorted(list: Todo[], todo: Todo): Todo[] {
  if (list.some((t) => t.id === todo.id)) return list;
  return [...list, todo].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

function getSelectedIds(selection: SelectionState): ReadonlySet<string> {
  return selection.status === "active"
    ? selection.selectedIds
    : EMPTY_SELECTED_IDS;
}

export function TodosProvider({
  initialCategories,
  initialTodos,
  initialError,
  children,
}: TodosProviderProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [categorySlug, setCategorySlug] = useState<string>(ALL_CATEGORIES);
  const [listFeedback, setListFeedback] = useState<ListFeedback>(
    initialError
      ? { status: "error", message: initialError }
      : { status: "ready" },
  );
  const [selection, setSelection] = useState<SelectionState>({
    status: "inactive",
  });

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const exitSelection = useCallback(() => {
    setSelection({ status: "inactive" });
  }, []);

  const deselect = useCallback((id: string) => {
    setSelection((current) => {
      if (current.status !== "active" || !current.selectedIds.has(id)) {
        return current;
      }

      const selectedIds = new Set(current.selectedIds);
      selectedIds.delete(id);
      return { status: "active", selectedIds };
    });
  }, []);

  const loadTodos = useCallback(
    async (slug: string) => {
      setListFeedback({ status: "loading" });
      try {
        const fetched = await getTodos(
          slug === ALL_CATEGORIES ? undefined : slug,
        );
        setTodos(fetched);
        setListFeedback({ status: "ready" });
        exitSelection();
      } catch (err) {
        setListFeedback({
          status: "error",
          message: getApiErrorMessage(err, "Failed to load tasks."),
        });
      }
    },
    [exitSelection],
  );

  const changeCategory = useCallback(
    (slug: string) => {
      setCategorySlug(slug);
      void loadTodos(slug);
    },
    [loadTodos],
  );

  const retry = useCallback(async () => {
    setListFeedback({ status: "loading" });
    try {
      const [cats, fetched] = await Promise.all([
        getCategories(),
        getTodos(categorySlug === ALL_CATEGORIES ? undefined : categorySlug),
      ]);
      setCategories(cats);
      setTodos(fetched);
      setListFeedback({ status: "ready" });
      exitSelection();
    } catch (err) {
      setListFeedback({
        status: "error",
        message: getApiErrorMessage(err, "Failed to load tasks."),
      });
    }
  }, [categorySlug, exitSelection]);

  const createTodo = useCallback(
    async (input: CreateTodoInput) => {
      try {
        const created = await createTodoRequest(input);
        const matchesFilter =
          categorySlug === ALL_CATEGORIES ||
          created.category.slug === categorySlug;
        if (matchesFilter) {
          setTodos((current) => [created, ...current]);
        }
      } catch (err) {
        throw new Error(getApiErrorMessage(err));
      }
    },
    [categorySlug],
  );

  const finalizeComplete = useCallback((id: string) => {
    timers.current.delete(id);
    setTodos((current) => current.filter((todo) => todo.id !== id));
    void deleteTodoRequest(id).catch(() => {
      /* already hidden; nothing the user can do here */
    });
  }, []);

  const undoComplete = useCallback(
    (todo: Todo) => {
      if (!timers.current.has(todo.id)) return;
      clearTimer(todo.id);
      setTodos((current) =>
        current.map((item) =>
          item.id === todo.id ? { ...item, completed: false } : item,
        ),
      );
      void updateTodo(todo.id, { completed: false }).catch(() => {
        toast.error("Failed to restore the task.");
      });
    },
    [clearTimer],
  );

  const startComplete = useCallback(
    async (todo: Todo, feedback: CompletionFeedback) => {
      clearTimer(todo.id);
      deselect(todo.id);
      setTodos((current) =>
        current.map((item) =>
          item.id === todo.id ? { ...item, completed: true } : item,
        ),
      );

      try {
        await updateTodo(todo.id, { completed: true });
      } catch (err) {
        setTodos((current) =>
          current.map((item) =>
            item.id === todo.id ? { ...item, completed: false } : item,
          ),
        );
        toast.error(getApiErrorMessage(err, "Failed to complete the task."));
        return;
      }

      const timer = setTimeout(
        () => finalizeComplete(todo.id),
        UNDO_WINDOW_MS,
      );
      timers.current.set(todo.id, timer);

      if (feedback === "toast") {
        toast("Task completed", {
          description: todo.text,
          duration: UNDO_WINDOW_MS,
          action: { label: "Undo", onClick: () => undoComplete(todo) },
        });
      }
    },
    [clearTimer, deselect, finalizeComplete, undoComplete],
  );

  const toggleCompleted = useCallback(
    (todo: Todo, completed: boolean) => {
      if (completed) {
        void startComplete(todo, "toast");
        return;
      }

      undoComplete(todo);
    },
    [startComplete, undoComplete],
  );

  const finalizeDelete = useCallback((todo: Todo) => {
    timers.current.delete(todo.id);
    void deleteTodoRequest(todo.id).catch((err) => {
      setTodos((current) => insertSorted(current, todo));
      toast.error(getApiErrorMessage(err, "Failed to delete the task."));
    });
  }, []);

  const undoDelete = useCallback(
    (todo: Todo) => {
      clearTimer(todo.id);
      setTodos((current) => insertSorted(current, todo));
    },
    [clearTimer],
  );

  const deleteTodo = useCallback(
    (todo: Todo) => {
      clearTimer(todo.id);
      deselect(todo.id);
      setTodos((current) => current.filter((item) => item.id !== todo.id));

      const timer = setTimeout(() => finalizeDelete(todo), UNDO_WINDOW_MS);
      timers.current.set(todo.id, timer);

      toast("Task deleted", {
        description: todo.text,
        duration: UNDO_WINDOW_MS,
        action: { label: "Undo", onClick: () => undoDelete(todo) },
      });
    },
    [clearTimer, deselect, finalizeDelete, undoDelete],
  );

  const selectableTodos = useMemo(
    () => todos.filter((todo) => !todo.completed),
    [todos],
  );

  const selectedIds = getSelectedIds(selection);

  const allSelected =
    selectableTodos.length > 0 &&
    selectableTodos.every((todo) => selectedIds.has(todo.id));

  const enterSelection = useCallback(() => {
    setSelection({ status: "active", selectedIds: new Set() });
  }, []);

  const toggleSelected = useCallback((id: string, selected: boolean) => {
    setSelection((current) => {
      if (current.status !== "active") return current;

      const selectedIds = new Set(current.selectedIds);
      if (selected) {
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      return { status: "active", selectedIds };
    });
  }, []);

  const toggleSelectAll = useCallback(
    (selectAll: boolean) => {
      setSelection((current) => {
        if (current.status !== "active") return current;

        return {
          status: "active",
          selectedIds: selectAll
            ? new Set(selectableTodos.map((todo) => todo.id))
            : new Set(),
        };
      });
    },
    [selectableTodos],
  );

  const markSelectedDone = useCallback(() => {
    if (selection.status !== "active") return;

    const toComplete = todos.filter(
      (todo) => selection.selectedIds.has(todo.id) && !todo.completed,
    );
    if (toComplete.length === 0) return;

    exitSelection();
    toComplete.forEach((todo) => void startComplete(todo, "silent"));

    toast(
      `${toComplete.length} task${toComplete.length > 1 ? "s" : ""} completed`,
      {
        duration: UNDO_WINDOW_MS,
        action: {
          label: "Undo",
          onClick: () => toComplete.forEach((todo) => undoComplete(todo)),
        },
      },
    );
  }, [todos, selection, exitSelection, startComplete, undoComplete]);

  const deleteSelected = useCallback(() => {
    if (selection.status !== "active") return;

    const toDelete = todos.filter((todo) => selection.selectedIds.has(todo.id));
    if (toDelete.length === 0) return;

    const ids = new Set(toDelete.map((todo) => todo.id));
    exitSelection();
    setTodos((current) => current.filter((todo) => !ids.has(todo.id)));
    toDelete.forEach((todo) => {
      clearTimer(todo.id);
      const timer = setTimeout(() => finalizeDelete(todo), UNDO_WINDOW_MS);
      timers.current.set(todo.id, timer);
    });

    toast(
      `${toDelete.length} task${toDelete.length > 1 ? "s" : ""} deleted`,
      {
        duration: UNDO_WINDOW_MS,
        action: {
          label: "Undo",
          onClick: () => toDelete.forEach((todo) => undoDelete(todo)),
        },
      },
    );
  }, [todos, selection, exitSelection, clearTimer, finalizeDelete, undoDelete]);

  useEffect(() => {
    if (selection.status === "active" && selectableTodos.length === 0) {
      exitSelection();
    }
  }, [selection.status, selectableTodos.length, exitSelection]);

  const state = useMemo<TodosState>(
    () => ({
      categories,
      todos,
      categorySlug,
      listFeedback,
      selection,
    }),
    [categories, todos, categorySlug, listFeedback, selection],
  );

  const actions = useMemo<TodosActions>(
    () => ({
      changeCategory,
      retry,
      createTodo,
      enterSelection,
      exitSelection,
      toggleSelected,
      toggleSelectAll,
      markSelectedDone,
      deleteSelected,
      toggleCompleted,
      deleteTodo,
    }),
    [
      changeCategory,
      retry,
      createTodo,
      enterSelection,
      exitSelection,
      toggleSelected,
      toggleSelectAll,
      markSelectedDone,
      deleteSelected,
      toggleCompleted,
      deleteTodo,
    ],
  );

  const meta = useMemo<TodosMeta>(
    () => ({
      selectableTodos,
      selectedIds,
      selectedCount: selectedIds.size,
      allSelected,
    }),
    [selectableTodos, selectedIds, allSelected],
  );

  const value = useMemo<TodosContextValue>(
    () => ({ state, actions, meta }),
    [state, actions, meta],
  );

  return (
    <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
  );
}

export function useTodos(): TodosContextValue {
  const context = useContext(TodosContext);
  if (!context) {
    throw new Error("useTodos must be used within TodosProvider.");
  }
  return context;
}
