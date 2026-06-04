import { Controller, Get } from "@nestjs/common";
import type { Category as CategoryDto } from "@justdoit/contracts";
import { CategoriesService } from "./categories.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<CategoryDto[]> {
    return this.categoriesService.findAll();
  }
}
