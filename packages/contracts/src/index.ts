import { z } from "zod";

/**
 * Shared API contracts for Just Do It.
 *
 * These Zod schemas are the single source of truth for request/response shapes.
 * - The frontend uses them with React Hook Form (`@hookform/resolvers/zod`).
 * - The backend uses them through a NestJS Zod validation pipe.
 *
 * Keep this package free of any runtime dependency other than `zod` so it can
 * be imported by both the Next.js (browser + server) and NestJS environments.
 */

export const TODO_TEXT_MIN = 1;
export const TODO_TEXT_MAX = 200;

/** Maximum number of todos allowed per category (business rule lives in the backend). */
export const MAX_TODOS_PER_CATEGORY = 5;

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoryListSchema = z.array(categorySchema);

// ---------------------------------------------------------------------------
// Todo response DTO
// ---------------------------------------------------------------------------

export const todoSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  completed: z.boolean(),
  category: categorySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Todo = z.infer<typeof todoSchema>;

export const todoListSchema = z.array(todoSchema);

// ---------------------------------------------------------------------------
// Create todo request
// ---------------------------------------------------------------------------

export const createTodoSchema = z.object({
  text: z
    .string({ required_error: "Task text is required" })
    .trim()
    .min(TODO_TEXT_MIN, "Task text is required")
    .max(TODO_TEXT_MAX, `Task text must be ${TODO_TEXT_MAX} characters or fewer`),
  categoryId: z
    .string({ required_error: "Category is required" })
    .uuid("A valid category must be selected"),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

// ---------------------------------------------------------------------------
// Update todo request
// ---------------------------------------------------------------------------

export const updateTodoSchema = z
  .object({
    completed: z.boolean().optional(),
    text: z.string().trim().min(TODO_TEXT_MIN).max(TODO_TEXT_MAX).optional(),
  })
  .refine((data) => data.completed !== undefined || data.text !== undefined, {
    message: "At least one updatable field must be provided",
  });

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

// ---------------------------------------------------------------------------
// List todos query
// ---------------------------------------------------------------------------

export const todoQuerySchema = z.object({
  /** Optional category slug used for readable filter URLs (e.g. ?category=work). */
  category: z.string().trim().min(1).optional(),
});

export type TodoQuery = z.infer<typeof todoQuerySchema>;

// ---------------------------------------------------------------------------
// Delete response
// ---------------------------------------------------------------------------

export const deleteResponseSchema = z.object({
  success: z.literal(true),
});

export type DeleteResponse = z.infer<typeof deleteResponseSchema>;

// ---------------------------------------------------------------------------
// Error response shape (matches the NestJS exception filter output)
// ---------------------------------------------------------------------------

export const errorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
