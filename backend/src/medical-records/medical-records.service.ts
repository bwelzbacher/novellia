import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { FilterMedicalRecordsDto } from './dto/filter-medical-records.dto';
import { CreateAppointmentRecordDto } from './dto/create-appointment-record.dto';
import { CreateVaccineRecordDto } from './dto/create-vaccine-record.dto';
import { CreateMedicationRecordDto } from './dto/create-medication-record.dto';
import { SetMedicationConditionDto } from './dto/set-medication-condition.dto';
import { SetAppointmentConditionDto } from './dto/set-appointment-condition.dto';

const MEDICAL_RECORD_INCLUDE = {
  vetRecord: true,
  appointment: {
    include: { condition: true, notes: { where: { deleted: false } } },
  },
  vaccineRecords: { where: { deleted: false } },
  medicationRecords: {
    where: { deleted: false },
    include: { condition: true },
  },
} satisfies Prisma.MedicalRecordInclude;

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMedicalRecordDto) {
    await this.assertPetExists(dto.petId);
    if (dto.vetRecordId) {
      await this.assertVetRecordExists(dto.vetRecordId);
    }
    await this.assertConditionsBelongToPet(dto.petId, [
      ...(dto.appointment?.conditionId ? [dto.appointment.conditionId] : []),
      ...(dto.medicationRecords
        ?.map((m) => m.conditionId)
        .filter((id): id is string => !!id) ?? []),
    ]);

    return this.prisma.medicalRecord.create({
      data: {
        pet: { connect: { id: dto.petId } },
        vetRecord: dto.vetRecordId
          ? { connect: { id: dto.vetRecordId } }
          : undefined,
        date: new Date(dto.date),
        sourceSystem: dto.sourceSystem,
        appointment: dto.appointment
          ? { create: this.buildAppointmentCreateData(dto.appointment) }
          : undefined,
        vaccineRecords: dto.vaccineRecords
          ? { create: this.buildVaccineCreateData(dto.vaccineRecords) }
          : undefined,
        medicationRecords: dto.medicationRecords
          ? { create: this.buildMedicationCreateData(dto.medicationRecords) }
          : undefined,
      },
      include: MEDICAL_RECORD_INCLUDE,
    });
  }

  findAll(filter: FilterMedicalRecordsDto) {
    const where: Prisma.MedicalRecordWhereInput = {
      deleted: false,
      petId: filter.petId,
      vetRecordId: filter.vetRecordId,
      date:
        filter.dateFrom || filter.dateTo
          ? {
              gte: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
              lte: filter.dateTo ? new Date(filter.dateTo) : undefined,
            }
          : undefined,
      OR: filter.search
        ? [
            {
              vaccineRecords: {
                some: {
                  name: { contains: filter.search, mode: 'insensitive' },
                },
              },
            },
            {
              medicationRecords: {
                some: {
                  name: { contains: filter.search, mode: 'insensitive' },
                },
              },
            },
            {
              appointment: {
                reason: { contains: filter.search, mode: 'insensitive' },
              },
            },
          ]
        : undefined,
    };

    return this.prisma.medicalRecord.findMany({
      where,
      include: MEDICAL_RECORD_INCLUDE,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: MEDICAL_RECORD_INCLUDE,
    });
    if (!record || record.deleted) {
      throw new NotFoundException(`Medical record ${id} not found`);
    }
    return record;
  }

  // Nested arrays (vaccineRecords/medicationRecords/appointment.notes), when
  // provided, replace the full existing set for that relation rather than
  // merging into it. The appointment (1:1) is upserted in place.
  async update(id: string, dto: UpdateMedicalRecordDto) {
    const existing = await this.findOne(id);

    if (dto.vetRecordId) {
      await this.assertVetRecordExists(dto.vetRecordId);
    }
    await this.assertConditionsBelongToPet(existing.petId, [
      ...(dto.appointment?.conditionId ? [dto.appointment.conditionId] : []),
      ...(dto.medicationRecords
        ?.map((m) => m.conditionId)
        .filter((id): id is string => !!id) ?? []),
    ]);

    return this.prisma.medicalRecord.update({
      where: { id },
      data: {
        vetRecordId: dto.vetRecordId,
        date: dto.date ? new Date(dto.date) : undefined,
        sourceSystem: dto.sourceSystem,
        appointment: dto.appointment
          ? {
              upsert: {
                create: this.buildAppointmentCreateData(dto.appointment),
                update: this.buildAppointmentUpdateData(dto.appointment),
              },
            }
          : undefined,
        vaccineRecords: dto.vaccineRecords
          ? {
              updateMany: {
                where: { deleted: false },
                data: { deleted: true },
              },
              create: this.buildVaccineCreateData(dto.vaccineRecords),
            }
          : undefined,
        medicationRecords: dto.medicationRecords
          ? {
              updateMany: {
                where: { deleted: false },
                data: { deleted: true },
              },
              create: this.buildMedicationCreateData(dto.medicationRecords),
            }
          : undefined,
      },
      include: MEDICAL_RECORD_INCLUDE,
    });
  }

  // Soft-deletes the visit and cascades to everything exclusively owned by
  // it (its appointment's notes, its own vaccine/medication rows) — unlike
  // a Condition, none of these can be referenced by any other visit, so
  // it's safe to take them down with it.
  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.medicalRecord.update({
        where: { id },
        data: { deleted: true },
      }),
      this.prisma.vaccineRecord.updateMany({
        where: { medicalRecordId: id },
        data: { deleted: true },
      }),
      this.prisma.medicationRecord.updateMany({
        where: { medicalRecordId: id },
        data: { deleted: true },
      }),
      ...(existing.appointment
        ? [
            this.prisma.appointmentNote.updateMany({
              where: { appointmentRecordId: existing.appointment.id },
              data: { deleted: true },
            }),
          ]
        : []),
    ]);
  }

  // Unlinks an appointment/medication from whatever condition it currently
  // references, without deleting the appointment/medication itself — used
  // by the condition-detail page's "Remove" actions.
  async removeAppointmentCondition(appointmentId: string) {
    await this.assertAppointmentExists(appointmentId);
    return this.prisma.appointmentRecord.update({
      where: { id: appointmentId },
      data: { conditionId: null },
      include: { condition: true, notes: true },
    });
  }

  async removeMedicationCondition(medicationId: string) {
    await this.assertMedicationExists(medicationId);
    return this.prisma.medicationRecord.update({
      where: { id: medicationId },
      data: { conditionId: null },
      include: { condition: true },
    });
  }

  // Links an appointment to a condition — used by the condition-detail
  // page's "Add" action to associate an existing (possibly unlinked,
  // possibly linked-elsewhere) appointment with this condition.
  async setAppointmentCondition(
    appointmentId: string,
    dto: SetAppointmentConditionDto,
  ) {
    const appointment = await this.prisma.appointmentRecord.findUnique({
      where: { id: appointmentId },
      include: { medicalRecord: { select: { petId: true } } },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    await this.assertConditionsBelongToPet(appointment.medicalRecord.petId, [
      dto.conditionId,
    ]);

    return this.prisma.appointmentRecord.update({
      where: { id: appointmentId },
      data: { conditionId: dto.conditionId },
      include: { condition: true, notes: true },
    });
  }

  // Links a medication to a condition — used by the condition-detail page's
  // "Add" action to associate an existing (possibly unlinked, possibly
  // linked-elsewhere) medication with this condition.
  async setMedicationCondition(
    medicationId: string,
    dto: SetMedicationConditionDto,
  ) {
    const medication = await this.prisma.medicationRecord.findUnique({
      where: { id: medicationId },
      include: { medicalRecord: { select: { petId: true } } },
    });
    if (!medication) {
      throw new NotFoundException(`Medication ${medicationId} not found`);
    }
    await this.assertConditionsBelongToPet(medication.medicalRecord.petId, [
      dto.conditionId,
    ]);

    return this.prisma.medicationRecord.update({
      where: { id: medicationId },
      data: { conditionId: dto.conditionId },
      include: { condition: true },
    });
  }

  // Individual soft-deletes for a single vaccine/medication/note, without
  // touching the rest of their visit — used by each record type's own
  // "Delete" action.
  async removeVaccine(id: string) {
    await this.assertVaccineExists(id);
    await this.prisma.vaccineRecord.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async removeMedication(id: string) {
    await this.assertMedicationExists(id);
    await this.prisma.medicationRecord.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async removeAppointmentNote(id: string) {
    await this.assertAppointmentNoteExists(id);
    await this.prisma.appointmentNote.update({
      where: { id },
      data: { deleted: true },
    });
  }

  // Notes are create-only here (a fresh nested create — nothing to
  // replace yet).
  private buildAppointmentCreateData(appointment: CreateAppointmentRecordDto) {
    const { notes, ...rest } = appointment;
    return {
      ...rest,
      notes: notes ? { create: notes } : undefined,
    };
  }

  // Same shape as create, but notes replace the existing set rather than
  // appending — matches vaccineRecords/medicationRecords update semantics.
  private buildAppointmentUpdateData(appointment: CreateAppointmentRecordDto) {
    const { notes, ...rest } = appointment;
    return {
      ...rest,
      notes: notes
        ? {
            updateMany: { where: { deleted: false }, data: { deleted: true } },
            create: notes,
          }
        : undefined,
    };
  }

  private buildMedicationCreateData(medications: CreateMedicationRecordDto[]) {
    return medications.map((medication) => ({
      name: medication.name,
      dosage: medication.dosage,
      duration: medication.duration,
      prescriber: medication.prescriber,
      notes: medication.notes,
      conditionId: medication.conditionId,
      status: medication.status,
    }));
  }

  private buildVaccineCreateData(vaccines: CreateVaccineRecordDto[]) {
    return vaccines.map((vaccine) => ({
      name: vaccine.name,
      administeredDate: new Date(vaccine.administeredDate),
      nextDueDate: vaccine.nextDueDate
        ? new Date(vaccine.nextDueDate)
        : undefined,
      notes: vaccine.notes,
    }));
  }

  private async assertPetExists(petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new BadRequestException(`Pet ${petId} does not exist`);
    }
  }

  private async assertVetRecordExists(vetRecordId: string) {
    const vetRecord = await this.prisma.vetRecord.findUnique({
      where: { id: vetRecordId },
    });
    if (!vetRecord) {
      throw new BadRequestException(`Vet record ${vetRecordId} does not exist`);
    }
  }

  private async assertAppointmentExists(id: string) {
    const appointment = await this.prisma.appointmentRecord.findUnique({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
  }

  private async assertMedicationExists(id: string) {
    const medication = await this.prisma.medicationRecord.findUnique({
      where: { id },
    });
    if (!medication || medication.deleted) {
      throw new NotFoundException(`Medication ${id} not found`);
    }
  }

  private async assertVaccineExists(id: string) {
    const vaccine = await this.prisma.vaccineRecord.findUnique({
      where: { id },
    });
    if (!vaccine || vaccine.deleted) {
      throw new NotFoundException(`Vaccine ${id} not found`);
    }
  }

  private async assertAppointmentNoteExists(id: string) {
    const note = await this.prisma.appointmentNote.findUnique({
      where: { id },
    });
    if (!note || note.deleted) {
      throw new NotFoundException(`Appointment note ${id} not found`);
    }
  }

  private async assertConditionsBelongToPet(
    petId: string,
    conditionIds: string[],
  ) {
    const uniqueIds = [...new Set(conditionIds)];
    if (uniqueIds.length === 0) {
      return;
    }
    const found = await this.prisma.condition.findMany({
      where: { id: { in: uniqueIds }, petId },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more conditionId values do not exist for this pet',
      );
    }
  }
}
