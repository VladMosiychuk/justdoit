import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  createTodoSchema,
  todoQuerySchema,
  updateTodoSchema,
  type CreateTodoInput,
  type DeleteResponse,
  type Todo as TodoDto,
  type TodoQuery,
  type UpdateTodoInput,
} from "@justdoit/contracts";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { TodosService } from "./todos.service";

@Controller("todos")
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(todoQuerySchema)) query: TodoQuery,
  ): Promise<TodoDto[]> {
    return this.todosService.findAll(query.category);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createTodoSchema)) body: CreateTodoInput,
  ): Promise<TodoDto> {
    return this.todosService.create(body);
  }

  @Patch(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateTodoSchema)) body: UpdateTodoInput,
  ): Promise<TodoDto> {
    return this.todosService.update(id, body);
  }

  @Delete(":id")
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<DeleteResponse> {
    return this.todosService.remove(id);
  }
}
