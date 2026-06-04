import { Injectable } from "@nestjs/common";
import type { Category as CategoryDto } from "@justdoit/contracts";
import { CategoriesRepository } from "./categories.repository";

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.categoriesRepository.findAll();
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));
  }
}
