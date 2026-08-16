import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetsDto } from './dto/filter-pets.dto';
import type { PetInactiveReason } from './pet.types';

const PETS_PAGE_SIZE = 20;

// Every pet gets this condition automatically so routine care (e.g. a
// heartworm preventative) has somewhere to attach without requiring a real
// diagnosed condition — see MedicationRecord.conditionId, which is required.
export const PREVENTATIVE_CARE_CONDITION_NAME = 'Preventative Care';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) { }

  create(dto: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        conditions: {
          create: { name: PREVENTATIVE_CARE_CONDITION_NAME, status: 'ACTIVE' },
        },
      },
    });
  }

  async findAll(filter: FilterPetsDto) {
    const where: Prisma.PetWhereInput = {
      isActive: true,
      species: filter.species,
      name: filter.name
        ? { contains: filter.name, mode: 'insensitive' }
        : undefined,
    };
    const page = filter.page ?? 1;

    const [data, total] = await Promise.all([
      this.prisma.pet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PETS_PAGE_SIZE,
        take: PETS_PAGE_SIZE,
      }),
      this.prisma.pet.count({ where }),
    ]);

    return {
      data,
      page,
      pageSize: PETS_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PETS_PAGE_SIZE),
    };
  }

  async findOne(id: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id } });
    if (!pet) {
      throw new NotFoundException(`Pet ${id} not found`);
    }
    return pet;
  }

  async update(id: string, dto: UpdatePetDto) {
    await this.findOne(id);
    const { dateOfBirth, ...rest } = dto;
    return this.prisma.pet.update({
      where: { id },
      data: {
        ...rest,
        // Omitted (undefined) leaves the existing value untouched; an
        // explicit null clears it, distinct from a falsy empty string.
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
      },
    });
  }

  async setPhoto(id: string, photoUrl: string) {
    await this.findOne(id);
    return this.prisma.pet.update({ where: { id }, data: { photoUrl } });
  }

  // Pets are never hard-deleted; marking one inactive keeps its medical
  // history intact and hides it from the default pet list. A reason is
  // optional.
  async deactivate(id: string, reason?: PetInactiveReason) {
    await this.findOne(id);
    await this.prisma.pet.update({
      where: { id },
      data: { isActive: false, inactiveReason: reason ?? null },
    });
  }
}
