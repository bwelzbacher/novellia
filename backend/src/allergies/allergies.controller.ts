import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { FilterAllergiesDto } from './dto/filter-allergies.dto';

@Controller('allergies')
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @Post()
  create(@Body() dto: CreateAllergyDto) {
    return this.allergiesService.create(dto);
  }

  // GET /allergies?petId=...&severity=SEVERE&search=chicken
  @Get()
  findAll(@Query() filter: FilterAllergiesDto) {
    return this.allergiesService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allergiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAllergyDto) {
    return this.allergiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.allergiesService.remove(id);
  }
}
