import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { FilterConditionsDto } from './dto/filter-conditions.dto';

// Aggregates every appointment and medication that references this
// condition, across all of the pet's visits — not just one MedicalRecord.
// AppointmentRecord has no deleted column of its own (it's deleted via its
// parent MedicalRecord being soft-deleted, which the cascade in remove()
// on MedicalRecordsService keeps in sync with its medications' own
// deleted flag) — so appointments are filtered through their parent visit.
const RELATED_INCLUDE = {
  appointments: {
    where: { medicalRecord: { deleted: false } },
    include: {
      medicalRecord: { include: { vetRecord: true } },
      notes: { where: { deleted: false } },
    },
  },
  medications: {
    where: { deleted: false },
    include: { medicalRecord: { include: { vetRecord: true } } },
  },
} satisfies Prisma.ConditionInclude;

@Injectable()
export class ConditionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConditionDto) {
    await this.assertPetExists(dto.petId);
    return this.prisma.condition.create({ data: dto });
  }

  findAll(filter: FilterConditionsDto) {
    const where: Prisma.ConditionWhereInput = {
      deleted: false,
      petId: filter.petId,
      status: filter.status,
      name: filter.search
        ? { contains: filter.search, mode: 'insensitive' }
        : undefined,
    };

    return this.prisma.condition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const condition = await this.prisma.condition.findUnique({
      where: { id },
      include: RELATED_INCLUDE,
    });
    if (!condition || condition.deleted) {
      throw new NotFoundException(`Condition ${id} not found`);
    }
    return condition;
  }

  async update(id: string, dto: UpdateConditionDto) {
    await this.assertExists(id);
    return this.prisma.condition.update({ where: { id }, data: dto });
  }

  // Soft-deletes the condition and unlinks it from any appointment/
  // medication currently referencing it (a condition can be referenced
  // across many visits, so those records aren't touched beyond that —
  // only the condition itself disappears).
  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.$transaction([
      this.prisma.condition.update({
        where: { id },
        data: { deleted: true },
      }),
      this.prisma.appointmentRecord.updateMany({
        where: { conditionId: id },
        data: { conditionId: null },
      }),
      this.prisma.medicationRecord.updateMany({
        where: { conditionId: id },
        data: { conditionId: null },
      }),
    ]);
  }

  private async assertExists(id: string) {
    const condition = await this.prisma.condition.findUnique({
      where: { id },
    });
    if (!condition || condition.deleted) {
      throw new NotFoundException(`Condition ${id} not found`);
    }
  }

  private async assertPetExists(petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new BadRequestException(`Pet ${petId} does not exist`);
    }
  }
}
