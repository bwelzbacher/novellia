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
import { VetRecordsService } from './vet-records.service';
import { CreateVetRecordDto } from './dto/create-vet-record.dto';
import { UpdateVetRecordDto } from './dto/update-vet-record.dto';
import { FilterVetRecordsDto } from './dto/filter-vet-records.dto';

@Controller('vet-records')
export class VetRecordsController {
  constructor(private readonly vetRecordsService: VetRecordsService) {}

  @Post()
  create(@Body() dto: CreateVetRecordDto) {
    return this.vetRecordsService.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterVetRecordsDto) {
    return this.vetRecordsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vetRecordsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVetRecordDto) {
    return this.vetRecordsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.vetRecordsService.remove(id);
  }
}
