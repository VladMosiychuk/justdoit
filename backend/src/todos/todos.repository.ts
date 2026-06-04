import { Injectable } from "@nestjs/common";
import type { Category, Todo } from "@justdoit/database";
import { PrismaService } from "../prisma/prisma.service";

/** A Todo row with its related Category eagerly loaded. */
export type TodoWithCategory = Todo & { category: Category };

const includeCategory = { category: true } as const;

@Injectable()
export class TodosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(categorySlug?: string): Promise<TodoWithCategory[]> {
    return this.prisma.todo.findMany({
      where: categorySlug ? { category: { slug: categorySlug } } : undefined,
      include: includeCategory,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<TodoWithCategory | null> {
    return this.prisma.todo.findUnique({
      where: { id },
      include: includeCategory,
    });
  }

  countByCategoryId(categoryId: string): Promise<number> {
    return this.prisma.todo.count({ where: { categoryId } });
  }

  create(data: { text: string; categoryId: string }): Promise<TodoWithCategory> {
    return this.prisma.todo.create({
      data,
      include: includeCategory,
    });
  }

  update(
    id: string,
    data: { text?: string; completed?: boolean },
  ): Promise<TodoWithCategory> {
    return this.prisma.todo.update({
      where: { id },
      data,
      include: includeCategory,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.todo.delete({ where: { id } });
  }
}
