import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SupplierEvaluationsService } from './supplier-evaluations.service';
import { CreateSupplierEvaluationDto, UpdateSupplierEvaluationDto, SupplierEvaluationQueryDto } from './dto/supplier-evaluation.dto';

@Controller('supplier-evaluations')
export class SupplierEvaluationsController {
  constructor(private readonly evaluationsService: SupplierEvaluationsService) {}

  @Post()
  create(@Body() createDto: CreateSupplierEvaluationDto) {
    return this.evaluationsService.create(createDto);
  }

  @Get()
  findAll(@Query() query: SupplierEvaluationQueryDto) {
    return this.evaluationsService.findAll(query);
  }

  @Get('supplier/:supplierId')
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.evaluationsService.findBySupplier(supplierId);
  }

  @Get('supplier/:supplierId/stats')
  getSupplierStats(@Param('supplierId') supplierId: string) {
    return this.evaluationsService.getSupplierStats(supplierId);
  }

  @Get('comparison')
  getComparisonData(@Query('category') category?: string) {
    return this.evaluationsService.getComparisonData(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSupplierEvaluationDto) {
    return this.evaluationsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evaluationsService.remove(id);
  }
}
