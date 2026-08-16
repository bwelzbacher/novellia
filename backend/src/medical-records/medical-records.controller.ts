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
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { FilterMedicalRecordsDto } from './dto/filter-medical-records.dto';
import { SetMedicationConditionDto } from './dto/set-medication-condition.dto';
import { SetAppointmentConditionDto } from './dto/set-appointment-condition.dto';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(dto);
  }

  // Supports filtering via query params, e.g.
  // GET /medical-records?petId=...&dateFrom=2025-01-01&search=rabies
  @Get()
  findAll(@Query() filter: FilterMedicalRecordsDto) {
    return this.medicalRecordsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(id, dto);
  }

  // Unlinks an appointment/medication from its condition without deleting
  // it — used by the condition-detail page's "Remove" actions.
  @Patch('appointments/:id/remove-condition')
  removeAppointmentCondition(@Param('id') id: string) {
    return this.medicalRecordsService.removeAppointmentCondition(id);
  }

  @Patch('medications/:id/remove-condition')
  removeMedicationCondition(@Param('id') id: string) {
    return this.medicalRecordsService.removeMedicationCondition(id);
  }

  @Patch('appointments/:id/set-condition')
  setAppointmentCondition(
    @Param('id') id: string,
    @Body() dto: SetAppointmentConditionDto,
  ) {
    return this.medicalRecordsService.setAppointmentCondition(id, dto);
  }

  @Patch('medications/:id/set-condition')
  setMedicationCondition(
    @Param('id') id: string,
    @Body() dto: SetMedicationConditionDto,
  ) {
    return this.medicalRecordsService.setMedicationCondition(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(id);
  }

  @Delete('vaccines/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeVaccine(@Param('id') id: string) {
    return this.medicalRecordsService.removeVaccine(id);
  }

  @Delete('medications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMedication(@Param('id') id: string) {
    return this.medicalRecordsService.removeMedication(id);
  }

  @Delete('notes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAppointmentNote(@Param('id') id: string) {
    return this.medicalRecordsService.removeAppointmentNote(id);
  }
}
