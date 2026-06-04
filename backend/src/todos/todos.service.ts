import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  MAX_TODOS_PER_CATEGORY,
  type CreateTodoInput,
  type Todo as TodoDto,
  type UpdateTodoInput,
} from "@justdoit/contracts";
import { CategoriesRepository } from "../categories/categories.repository";
import { TodosRepository, type TodoWithCategory } from "./todos.repository";

@Injectable()
export class TodosService {
  constructor(
    private readonly todosRepository: TodosRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async findAll(categorySlug?: string): Promise<TodoDto[]> {
    if (categorySlug) {
      const category = await this.categoriesRepository.findBySlug(categorySlug);
      if (!category) {
        throw new NotFoundException(`Category "${categorySlug}" not found`);
      }
    }
    const todos = await this.todosRepository.findMany(categorySlug);
    return todos.map(toTodoDto);
  }

  async create(input: CreateTodoInput): Promise<TodoDto> {
    // Business rule: category must exist.
    const category = await this.categoriesRepository.findById(input.categoryId);
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    // Business rule: a category may contain at most 5 tasks. Completed tasks
    // still count while persisted (during the undo window).
    const count = await this.todosRepository.countByCategoryId(input.categoryId);
    if (count >= MAX_TODOS_PER_CATEGORY) {
      throw new BadRequestException(
        `Category "${category.name}" already has the maximum of ${MAX_TODOS_PER_CATEGORY} tasks`,
      );
    }

    const todo = await this.todosRepository.create({
      text: input.text,
      categoryId: input.categoryId,
    });
    return toTodoDto(todo);
  }

  async update(id: string, input: UpdateTodoInput): Promise<TodoDto> {
    await this.ensureExists(id);
    const todo = await this.todosRepository.update(id, {
      ...(input.completed !== undefined ? { completed: input.completed } : {}),
      ...(input.text !== undefined ? { text: input.text } : {}),
    });
    return toTodoDto(todo);
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.ensureExists(id);
    await this.todosRepository.delete(id);
    return { success: true };
  }

  private async ensureExists(id: string): Promise<void> {
    const existing = await this.todosRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Todo "${id}" not found`);
    }
  }
}

function toTodoDto(todo: TodoWithCategory): TodoDto {
  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    category: {
      id: todo.category.id,
      name: todo.category.name,
      slug: todo.category.slug,
    },
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}
