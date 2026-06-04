import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MAX_TODOS_PER_CATEGORY } from "@justdoit/contracts";
import { CategoriesRepository } from "../categories/categories.repository";
import { TodosService } from "./todos.service";
import { TodosRepository, type TodoWithCategory } from "./todos.repository";

const category = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Work",
  slug: "work",
  createdAt: new Date("2026-06-04T12:00:00.000Z"),
  updatedAt: new Date("2026-06-04T12:00:00.000Z"),
};

function makeTodo(overrides: Partial<TodoWithCategory> = {}): TodoWithCategory {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    text: "Finish PRD",
    completed: false,
    categoryId: category.id,
    category,
    createdAt: new Date("2026-06-04T12:00:00.000Z"),
    updatedAt: new Date("2026-06-04T12:00:00.000Z"),
    ...overrides,
  };
}

describe("TodosService", () => {
  let service: TodosService;
  let todosRepository: jest.Mocked<TodosRepository>;
  let categoriesRepository: jest.Mocked<CategoriesRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: TodosRepository,
          useValue: {
            findMany: jest.fn(),
            findById: jest.fn(),
            countByCategoryId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CategoriesRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TodosService);
    todosRepository = moduleRef.get(TodosRepository);
    categoriesRepository = moduleRef.get(CategoriesRepository);
  });

  describe("create", () => {
    it("creates a todo successfully", async () => {
      categoriesRepository.findById.mockResolvedValue(category);
      todosRepository.countByCategoryId.mockResolvedValue(0);
      todosRepository.create.mockResolvedValue(makeTodo());

      const result = await service.create({
        text: "Finish PRD",
        categoryId: category.id,
      });

      expect(todosRepository.create).toHaveBeenCalledWith({
        text: "Finish PRD",
        categoryId: category.id,
      });
      expect(result).toMatchObject({
        id: makeTodo().id,
        text: "Finish PRD",
        completed: false,
        category: { id: category.id, name: "Work", slug: "work" },
      });
      expect(result.createdAt).toBe("2026-06-04T12:00:00.000Z");
    });

    it("rejects the 6th todo in a category with 400", async () => {
      categoriesRepository.findById.mockResolvedValue(category);
      todosRepository.countByCategoryId.mockResolvedValue(MAX_TODOS_PER_CATEGORY);

      await expect(
        service.create({ text: "Too many", categoryId: category.id }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(todosRepository.create).not.toHaveBeenCalled();
    });

    it("returns 404 when the category does not exist", async () => {
      categoriesRepository.findById.mockResolvedValue(null);

      await expect(
        service.create({ text: "Orphan", categoryId: category.id }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(todosRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("lists all todos", async () => {
      todosRepository.findMany.mockResolvedValue([makeTodo()]);

      const result = await service.findAll();

      expect(todosRepository.findMany).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it("filters todos by category slug", async () => {
      categoriesRepository.findBySlug.mockResolvedValue(category);
      todosRepository.findMany.mockResolvedValue([makeTodo()]);

      const result = await service.findAll("work");

      expect(categoriesRepository.findBySlug).toHaveBeenCalledWith("work");
      expect(todosRepository.findMany).toHaveBeenCalledWith("work");
      expect(result).toHaveLength(1);
    });

    it("returns 404 when filtering by an unknown category", async () => {
      categoriesRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findAll("nope")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates a todo to completed", async () => {
      todosRepository.findById.mockResolvedValue(makeTodo());
      todosRepository.update.mockResolvedValue(makeTodo({ completed: true }));

      const result = await service.update(makeTodo().id, { completed: true });

      expect(todosRepository.update).toHaveBeenCalledWith(makeTodo().id, {
        completed: true,
      });
      expect(result.completed).toBe(true);
    });

    it("updates a todo back to not completed", async () => {
      todosRepository.findById.mockResolvedValue(makeTodo({ completed: true }));
      todosRepository.update.mockResolvedValue(makeTodo({ completed: false }));

      const result = await service.update(makeTodo().id, { completed: false });

      expect(todosRepository.update).toHaveBeenCalledWith(makeTodo().id, {
        completed: false,
      });
      expect(result.completed).toBe(false);
    });

    it("returns 404 when updating a missing todo", async () => {
      todosRepository.findById.mockResolvedValue(null);

      await expect(
        service.update("33333333-3333-3333-3333-333333333333", {
          completed: true,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(todosRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes a todo", async () => {
      todosRepository.findById.mockResolvedValue(makeTodo());
      todosRepository.delete.mockResolvedValue(undefined);

      const result = await service.remove(makeTodo().id);

      expect(todosRepository.delete).toHaveBeenCalledWith(makeTodo().id);
      expect(result).toEqual({ success: true });
    });

    it("returns 404 when deleting a missing todo", async () => {
      todosRepository.findById.mockResolvedValue(null);

      await expect(
        service.remove("33333333-3333-3333-3333-333333333333"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(todosRepository.delete).not.toHaveBeenCalled();
    });
  });
});
