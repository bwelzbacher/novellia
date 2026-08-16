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
import { ConditionsService } from './conditions.service';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { FilterConditionsDto } from './dto/filter-conditions.dto';

@Controller('conditions')
export class ConditionsController {
  constructor(private readonly conditionsService: ConditionsService) {}

  @Post()
  create(@Body() dto: CreateConditionDto) {
    return this.conditionsService.create(dto);
  }

  // GET /conditions?petId=...&status=ACTIVE&search=allerg
  @Get()
  findAll(@Query() filter: FilterConditionsDto) {
    return this.conditionsService.findAll(filter);
  }

  // Includes every appointment and medication that references this
  // condition, aggregated across all of the pet's visits.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conditionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConditionDto) {
    return this.conditionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.conditionsService.remove(id);
  }
}
