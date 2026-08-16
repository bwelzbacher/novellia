import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVetRecordDto } from './dto/create-vet-record.dto';
import { UpdateVetRecordDto } from './dto/update-vet-record.dto';
import { FilterVetRecordsDto } from './dto/filter-vet-records.dto';

@Injectable()
export class VetRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateVetRecordDto) {
    return this.prisma.vetRecord.create({ data: dto });
  }

  findAll(filter: FilterVetRecordsDto) {
    const where: Prisma.VetRecordWhereInput = {
      officeName: filter.officeName
        ? { contains: filter.officeName, mode: 'insensitive' }
        : undefined,
    };

    return this.prisma.vetRecord.findMany({
      where,
      orderBy: { officeName: 'asc' },
    });
  }

  async findOne(id: string) {
    const vetRecord = await this.prisma.vetRecord.findUnique({
      where: { id },
    });
    if (!vetRecord) {
      throw new NotFoundException(`Vet record ${id} not found`);
    }
    return vetRecord;
  }

  async update(id: string, dto: UpdateVetRecordDto) {
    await this.findOne(id);
    return this.prisma.vetRecord.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.vetRecord.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          `Vet record ${id} is still referenced by existing medical records`,
        );
      }
      throw error;
    }
  }
}
