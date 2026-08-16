import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConditionsService } from './conditions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConditionsService', () => {
  let service: ConditionsService;
  const prisma = {
    pet: {
      findUnique: jest.fn(),
    },
    condition: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    appointmentRecord: {
      updateMany: jest.fn(),
    },
    medicationRecord: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConditionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ConditionsService);
  });

  it('rejects creating a condition for a pet that does not exist', async () => {
    prisma.pet.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        petId: 'pet-1',
        name: 'Ear Infection',
        status: 'ACTIVE',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.condition.create).not.toHaveBeenCalled();
  });

  it('creates a condition for an existing pet', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.condition.create.mockResolvedValue({ id: 'condition-1' });

    await service.create({
      petId: 'pet-1',
      name: 'Ear Infection',
      status: 'ACTIVE',
    });

    expect(prisma.condition.create).toHaveBeenCalledWith({
      data: { petId: 'pet-1', name: 'Ear Infection', status: 'ACTIVE' },
    });
  });

  it('filters by petId, status, and case-insensitive name search', async () => {
    prisma.condition.findMany.mockResolvedValue([]);

    await service.findAll({
      petId: 'pet-1',
      status: 'CHRONIC',
      search: 'arthritis',
    });

    expect(prisma.condition.findMany).toHaveBeenCalledWith({
      where: {
        deleted: false,
        petId: 'pet-1',
        status: 'CHRONIC',
        name: { contains: 'arthritis', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('throws NotFoundException when a condition does not exist', async () => {
    prisma.condition.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when a condition is soft-deleted', async () => {
    prisma.condition.findUnique.mockResolvedValue({
      id: 'condition-1',
      deleted: true,
    });

    await expect(service.findOne('condition-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('includes aggregated appointments and medications when finding one', async () => {
    prisma.condition.findUnique.mockResolvedValue({
      id: 'condition-1',
      deleted: false,
    });

    await service.findOne('condition-1');

    expect(prisma.condition.findUnique).toHaveBeenCalledWith({
      where: { id: 'condition-1' },
      include: {
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
      },
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the condition does not exist', async () => {
      prisma.condition.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.condition.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the condition and unlinks referencing appointments/medications', async () => {
      prisma.condition.findUnique.mockResolvedValue({
        id: 'condition-1',
        deleted: false,
      });

      await service.remove('condition-1');

      expect(prisma.condition.update).toHaveBeenCalledWith({
        where: { id: 'condition-1' },
        data: { deleted: true },
      });
      expect(prisma.appointmentRecord.updateMany).toHaveBeenCalledWith({
        where: { conditionId: 'condition-1' },
        data: { conditionId: null },
      });
      expect(prisma.medicationRecord.updateMany).toHaveBeenCalledWith({
        where: { conditionId: 'condition-1' },
        data: { conditionId: null },
      });
    });
  });
});
