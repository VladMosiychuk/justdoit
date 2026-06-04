"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTodos } from "./todos-provider";

/**
 * The action bar shown while the list is in selection mode. Selection itself
 * happens on the rows; this bar drives "select all" and the bulk actions.
 */
export function BulkActions() {
  const { actions, meta } = useTodos();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={meta.allSelected}
          onCheckedChange={(value) => actions.toggleSelectAll(value === true)}
          aria-label="Select all tasks"
        />
        Select all
      </label>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {meta.selectedCount} selected
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={actions.deleteSelected}
          disabled={meta.selectedCount === 0}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
          Delete
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={actions.markSelectedDone}
          disabled={meta.selectedCount === 0}
        >
          <CheckCheck />
          Mark done
        </Button>
      </div>
    </div>
  );
}
