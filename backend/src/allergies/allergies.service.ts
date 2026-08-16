import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { FilterAllergiesDto } from './dto/filter-allergies.dto';

@Injectable()
export class AllergiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAllergyDto) {
    await this.assertPetExists(dto.petId);
    return this.prisma.allergy.create({ data: dto });
  }

  findAll(filter: FilterAllergiesDto) {
    const where: Prisma.AllergyWhereInput = {
      deleted: false,
      petId: filter.petId,
      severity: filter.severity,
      allergen: filter.search
        ? { contains: filter.search, mode: 'insensitive' }
        : undefined,
    };

    return this.prisma.allergy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const allergy = await this.prisma.allergy.findUnique({ where: { id } });
    if (!allergy || allergy.deleted) {
      throw new NotFoundException(`Allergy ${id} not found`);
    }
    return allergy;
  }

  async update(id: string, dto: UpdateAllergyDto) {
    await this.assertExists(id);
    return this.prisma.allergy.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.allergy.update({
      where: { id },
      data: { deleted: true },
    });
  }

  private async assertExists(id: string) {
    const allergy = await this.prisma.allergy.findUnique({ where: { id } });
    if (!allergy || allergy.deleted) {
      throw new NotFoundException(`Allergy ${id} not found`);
    }
  }

  private async assertPetExists(petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new BadRequestException(`Pet ${petId} does not exist`);
    }
  }
}
