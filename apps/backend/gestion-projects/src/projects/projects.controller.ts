import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from "./dto/project.dto";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() filter: ProjectFilterDto) {
    return this.projectsService.findAll(filter);
  }

  @Get("with-sites")
  async findAllWithSites() {
    return this.projectsService.findAllWithSites();
  }

  @Get("export-pdf")
  async exportPdf(
    @Query() filter: ProjectFilterDto,
    @Res() res: Response,
  ) {
    const buffer = await this.projectsService.exportPdf(filter);
    
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="projects-${Date.now()}.pdf"`,
      "Content-Length": buffer.length,
    });
    
    res.end(buffer);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.projectsService.remove(id);
  }
}
