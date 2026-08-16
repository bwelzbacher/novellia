import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';

describe('PetsService', () => {
  let service: PetsService;
  const prisma = {
    pet: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PetsService);
  });

  it('creates a pet, converting dateOfBirth to a Date', async () => {
    prisma.pet.create.mockResolvedValue({ id: '1' });

    const dto: CreatePetDto = {
      name: 'Rex',
      species: 'DOG',
      sex: 'MALE',
      ownerName: 'Alex',
      dateOfBirth: '2020-01-01',
    };
    await service.create(dto);

    expect(prisma.pet.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Rex',
        dateOfBirth: new Date('2020-01-01'),
      }),
    });
  });

  it('filters by species and case-insensitive name', async () => {
    prisma.pet.findMany.mockResolvedValue([]);
    prisma.pet.count.mockResolvedValue(0);

    await service.findAll({ species: 'CAT', name: 'whiskers' });

    expect(prisma.pet.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        species: 'CAT',
        name: { contains: 'whiskers', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 8,
    });
  });

  it('paginates results to 8 per page, defaulting to page 1', async () => {
    prisma.pet.findMany.mockResolvedValue([{ id: '1' }]);
    prisma.pet.count.mockResolvedValue(45);

    const result = await service.findAll({});

    expect(prisma.pet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 8 }),
    );
    expect(result).toEqual({
      data: [{ id: '1' }],
      page: 1,
      pageSize: 8,
      total: 45,
      totalPages: 6,
    });
  });

  it('offsets by page when requesting a later page', async () => {
    prisma.pet.findMany.mockResolvedValue([]);
    prisma.pet.count.mockResolvedValue(45);

    await service.findAll({ page: 3 });

    expect(prisma.pet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 16, take: 8 }),
    );
  });

  it('throws NotFoundException when a pet does not exist', async () => {
    prisma.pet.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('marks a pet inactive with a reason after confirming it exists', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: '1' });
    prisma.pet.update.mockResolvedValue({ id: '1' });

    await service.deactivate('1', 'DECEASED');

    expect(prisma.pet.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { isActive: false, inactiveReason: 'DECEASED' },
    });
  });

  it('marks a pet inactive with no reason when none is given', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: '1' });
    prisma.pet.update.mockResolvedValue({ id: '1' });

    await service.deactivate('1');

    expect(prisma.pet.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { isActive: false, inactiveReason: null },
    });
  });

  it('updates a pet, converting a provided dateOfBirth to a Date', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: '1' });
    prisma.pet.update.mockResolvedValue({ id: '1' });

    await service.update('1', { name: 'Rex', dateOfBirth: '2020-01-01' });

    expect(prisma.pet.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Rex', dateOfBirth: new Date('2020-01-01') },
    });
  });

  it('clears dateOfBirth when explicitly set to null', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: '1' });
    prisma.pet.update.mockResolvedValue({ id: '1' });

    await service.update('1', { name: 'Rex', dateOfBirth: null } as any);

    expect(prisma.pet.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Rex', dateOfBirth: null },
    });
  });

  it('leaves dateOfBirth untouched when omitted from the update', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: '1' });
    prisma.pet.update.mockResolvedValue({ id: '1' });

    await service.update('1', { name: 'Rex' });

    expect(prisma.pet.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Rex' },
    });
  });

  it('sets a photo URL after confirming the pet exists', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: '1' });
    prisma.pet.update.mockResolvedValue({ id: '1' });

    await service.setPhoto('1', '/uploads/pet-photos/abc.png');

    expect(prisma.pet.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { photoUrl: '/uploads/pet-photos/abc.png' },
    });
  });
});
