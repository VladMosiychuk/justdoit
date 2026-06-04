"use client";

import { Button } from "@/components/ui/button";
import { ALL_CATEGORIES, useTodos } from "./todos-provider";

export function CategoryFilter() {
  const { state, actions } = useTodos();
  const options = [
    { label: "All", slug: ALL_CATEGORIES },
    ...state.categories.map((category) => ({
      label: category.name,
      slug: category.slug,
    })),
  ];
  const disabled = state.listFeedback.status === "loading";

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const active = state.categorySlug === option.slug;
        return (
          <Button
            key={option.slug}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => actions.changeCategory(option.slug)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
