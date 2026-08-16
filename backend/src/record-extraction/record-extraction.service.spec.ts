import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { RecordExtractionService } from './record-extraction.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractionResult } from './record-extraction.types';

const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
);

describe('RecordExtractionService', () => {
  let service: RecordExtractionService;
  const prisma = {
    pet: { findUnique: jest.fn() },
    vetRecord: { findMany: jest.fn() },
    condition: { findMany: jest.fn() },
  };

  const file = {
    buffer: Buffer.from('fake-bytes'),
    mimetype: 'image/png',
    originalname: 'vaccine-cert.png',
  } as Express.Multer.File;

  function mockExtraction(overrides: Partial<ExtractionResult> = {}) {
    const result: ExtractionResult = {
      vetOffice: { name: '', address: '', phone: '' },
      date: '',
      appointment: {
        time: '',
        vet: '',
        reason: '',
        summaryNotes: '',
        weight: '',
        temperature: '',
      },
      vaccineRecords: [],
      medicationRecords: [],
      conditionsReferenced: [],
      ...overrides,
    };
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(result) }],
    });
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordExtractionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(RecordExtractionService);
  });

  it('rejects extraction for a pet that does not exist', async () => {
    prisma.pet.findUnique.mockResolvedValue(null);

    await expect(service.extract('missing-pet', file)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws BadGatewayException when the model returns no text block', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    mockCreate.mockResolvedValue({ content: [] });

    await expect(service.extract('pet-1', file)).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('flags a missing date and vet office as warnings', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    mockExtraction();
    prisma.vetRecord.findMany.mockResolvedValue([]);
    prisma.condition.findMany.mockResolvedValue([]);

    const draft = await service.extract('pet-1', file);

    expect(draft.warnings).toEqual([
      'No visit date found — required before this can be saved.',
      'No vet office detected — select or add one before saving.',
    ]);
    expect(draft.vetRecord).toEqual({
      id: null,
      name: '',
      isNew: true,
      address: '',
      phone: '',
    });
  });

  it('resolves a vet office to an existing VetRecord case-insensitively, keeping the extracted address/phone', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    mockExtraction({
      vetOffice: {
        name: '  Maple Street Vet  ',
        address: '12 Maple St',
        phone: '555-0100',
      },
      date: '2026-01-01',
    });
    prisma.vetRecord.findMany.mockResolvedValue([
      { id: 'vet-1', officeName: 'maple street vet' },
    ]);
    prisma.condition.findMany.mockResolvedValue([]);

    const draft = await service.extract('pet-1', file);

    expect(draft.vetRecord).toEqual({
      id: 'vet-1',
      name: '  Maple Street Vet  ',
      isNew: false,
      address: '12 Maple St',
      phone: '555-0100',
    });
    expect(draft.warnings).toHaveLength(0);
  });

  it('resolves a medication conditionName against an existing condition for the pet', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    mockExtraction({
      date: '2026-01-01',
      medicationRecords: [
        {
          name: 'Apoquel',
          dosage: '16mg',
          duration: '14 days',
          prescriber: '',
          notes: '',
          conditionName: 'Seasonal Allergies',
        },
      ],
    });
    prisma.vetRecord.findMany.mockResolvedValue([]);
    prisma.condition.findMany.mockResolvedValue([
      { id: 'condition-1', name: 'seasonal allergies' },
    ]);

    const draft = await service.extract('pet-1', file);

    expect(draft.medicationRecords[0].condition).toEqual({
      id: 'condition-1',
      name: 'Seasonal Allergies',
      isNew: false,
    });
  });

  it('marks a referenced condition with no existing match as new', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    mockExtraction({
      date: '2026-01-01',
      conditionsReferenced: [
        {
          name: 'Ear Infection',
          status: 'ACTIVE',
          diagnosingPhysician: '',
          notes: '',
        },
      ],
    });
    prisma.vetRecord.findMany.mockResolvedValue([]);
    prisma.condition.findMany.mockResolvedValue([]);

    const draft = await service.extract('pet-1', file);

    expect(draft.conditionsReferenced[0].resolved).toEqual({
      id: null,
      name: 'Ear Infection',
      isNew: true,
    });
  });
});
