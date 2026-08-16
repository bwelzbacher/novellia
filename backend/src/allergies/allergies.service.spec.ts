import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AllergiesService } from './allergies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AllergiesService', () => {
  let service: AllergiesService;
  const prisma = {
    pet: {
      findUnique: jest.fn(),
    },
    allergy: {
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
        AllergiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AllergiesService);
  });

  it('rejects creating an allergy for a pet that does not exist', async () => {
    prisma.pet.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        petId: 'pet-1',
        allergen: 'Chicken',
        severity: 'MODERATE',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.allergy.create).not.toHaveBeenCalled();
  });

  it('creates an allergy for an existing pet', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.allergy.create.mockResolvedValue({ id: 'allergy-1' });

    await service.create({
      petId: 'pet-1',
      allergen: 'Chicken',
      severity: 'MODERATE',
    });

    expect(prisma.allergy.create).toHaveBeenCalledWith({
      data: { petId: 'pet-1', allergen: 'Chicken', severity: 'MODERATE' },
    });
  });

  it('filters by petId, severity, and case-insensitive allergen search', async () => {
    prisma.allergy.findMany.mockResolvedValue([]);

    await service.findAll({
      petId: 'pet-1',
      severity: 'SEVERE',
      search: 'peni',
    });

    expect(prisma.allergy.findMany).toHaveBeenCalledWith({
      where: {
        deleted: false,
        petId: 'pet-1',
        severity: 'SEVERE',
        allergen: { contains: 'peni', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('throws NotFoundException when an allergy does not exist', async () => {
    prisma.allergy.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects updating an allergy that does not exist', async () => {
    prisma.allergy.findUnique.mockResolvedValue(null);

    await expect(
      service.update('missing', { severity: 'SEVERE' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.allergy.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when an allergy is soft-deleted', async () => {
    prisma.allergy.findUnique.mockResolvedValue({
      id: 'allergy-1',
      deleted: true,
    });

    await expect(service.findOne('allergy-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('soft-deletes an existing allergy', async () => {
    prisma.allergy.findUnique.mockResolvedValue({
      id: 'allergy-1',
      deleted: false,
    });
    prisma.allergy.update.mockResolvedValue({ id: 'allergy-1', deleted: true });

    await service.remove('allergy-1');

    expect(prisma.allergy.update).toHaveBeenCalledWith({
      where: { id: 'allergy-1' },
      data: { deleted: true },
    });
  });
});
