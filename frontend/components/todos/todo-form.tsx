"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, Plus } from "lucide-react";
import {
  createTodoSchema,
  TODO_TEXT_MAX,
  type CreateTodoInput,
} from "@justdoit/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTodos } from "./todos-provider";

export function TodoForm() {
  const { state, actions } = useTodos();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { text: "", categoryId: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await actions.createTodo(values);
      reset({ text: "", categoryId: "" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create the task. Please try again.",
      );
    }
  });

  const categories = state.categories;
  const noCategories = categories.length === 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem_auto]">
        <div className="space-y-1.5">
          <div className="flex h-5 items-center">
            <Label htmlFor="text">Task</Label>
          </div>
          <Input
            id="text"
            placeholder="e.g. Buy milk"
            maxLength={TODO_TEXT_MAX}
            aria-invalid={Boolean(errors.text)}
            className="border-input bg-background"
            {...register("text")}
          />
          {errors.text ? (
            <p className="text-sm text-destructive">{errors.text.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex h-5 items-center gap-1.5">
            <Label htmlFor="categoryId">Category</Label>
            <TooltipProvider delay={150}>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  aria-label="Category task limit"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  Each category can hold up to 5 tasks.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
                disabled={noCategories}
              >
                <SelectTrigger
                  id="categoryId"
                  aria-invalid={Boolean(errors.categoryId)}
                  className="w-full border-input bg-background"
                >
                  <SelectValue>
                    {(value) =>
                      categories.find((category) => category.id === value)
                        ?.name ?? "Select a category"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId ? (
            <p className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="hidden h-5 sm:block" aria-hidden />
          <Button
            type="submit"
            size="icon"
            aria-label="Add task"
            title="Add task"
            disabled={isSubmitting || noCategories}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>
      </div>

      {submitError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
