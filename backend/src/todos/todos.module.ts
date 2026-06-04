import { Module } from "@nestjs/common";
import { CategoriesModule } from "../categories/categories.module";
import { TodosController } from "./todos.controller";
import { TodosService } from "./todos.service";
import { TodosRepository } from "./todos.repository";

@Module({
  imports: [CategoriesModule],
  controllers: [TodosController],
  providers: [TodosService, TodosRepository],
})
export class TodosModule {}
