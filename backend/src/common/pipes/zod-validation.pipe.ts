import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Validates and parses incoming request data (body / query / params) against a
 * shared Zod schema from `@justdoit/contracts`. On failure it throws a
 * `400 Bad Request` with structured field details.
 *
 * Usage:
 *   @Body(new ZodValidationPipe(createTodoSchema)) body: CreateTodoInput
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Validation failed",
        details: result.error.flatten(),
      });
    }

    return result.data;
  }
}
