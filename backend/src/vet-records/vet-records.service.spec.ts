import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VetRecordsService } from './vet-records.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VetRecordsService', () => {
  let service: VetRecordsService;
  const prisma = {
    vetRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VetRecordsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(VetRecordsService);
  });

  it('creates a vet record', async () => {
    prisma.vetRecord.create.mockResolvedValue({ id: '1' });

    await service.create({ officeName: 'Riverside Animal Hospital' });

    expect(prisma.vetRecord.create).toHaveBeenCalledWith({
      data: { officeName: 'Riverside Animal Hospital' },
    });
  });

  it('filters by office name, case-insensitive', async () => {
    prisma.vetRecord.findMany.mockResolvedValue([]);

    await service.findAll({ officeName: 'riverside' });

    expect(prisma.vetRecord.findMany).toHaveBeenCalledWith({
      where: { officeName: { contains: 'riverside', mode: 'insensitive' } },
      orderBy: { officeName: 'asc' },
    });
  });

  it('throws NotFoundException when a vet record does not exist', async () => {
    prisma.vetRecord.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('translates a foreign-key violation on delete into a ConflictException', async () => {
    prisma.vetRecord.findUnique.mockResolvedValue({ id: '1' });
    prisma.vetRecord.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK violation', {
        code: 'P2003',
        clientVersion: '6.19.3',
      }),
    );

    await expect(service.remove('1')).rejects.toThrow(ConflictException);
  });
});
