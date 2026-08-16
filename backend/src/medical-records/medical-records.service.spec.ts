import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;
  const prisma = {
    pet: {
      findUnique: jest.fn(),
    },
    vetRecord: {
      findUnique: jest.fn(),
    },
    condition: {
      findMany: jest.fn(),
    },
    medicalRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointmentRecord: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    medicationRecord: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    vaccineRecord: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    appointmentNote: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(MedicalRecordsService);
  });

  const baseDto: CreateMedicalRecordDto = {
    petId: 'pet-1',
    vetRecordId: 'vet-1',
    date: '2025-01-01',
  };

  it('rejects creating a record for a pet that does not exist', async () => {
    prisma.pet.findUnique.mockResolvedValue(null);

    await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
    expect(prisma.medicalRecord.create).not.toHaveBeenCalled();
  });

  it('rejects creating a record for a vet record that does not exist', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.vetRecord.findUnique.mockResolvedValue(null);

    await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
    expect(prisma.medicalRecord.create).not.toHaveBeenCalled();
  });

  it('rejects a medication referencing a condition that does not belong to the pet', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.vetRecord.findUnique.mockResolvedValue({ id: 'vet-1' });
    prisma.condition.findMany.mockResolvedValue([]);

    await expect(
      service.create({
        ...baseDto,
        medicationRecords: [
          { name: 'Amoxicillin', conditionId: 'condition-1' },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.medicalRecord.create).not.toHaveBeenCalled();
  });

  it('creates a record with a medication referencing a valid condition', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.vetRecord.findUnique.mockResolvedValue({ id: 'vet-1' });
    prisma.condition.findMany.mockResolvedValue([{ id: 'condition-1' }]);
    prisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

    await service.create({
      ...baseDto,
      medicationRecords: [{ name: 'Ear Drops', conditionId: 'condition-1' }],
    });

    expect(prisma.medicalRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pet: { connect: { id: 'pet-1' } },
        vetRecord: { connect: { id: 'vet-1' } },
        date: new Date('2025-01-01'),
        medicationRecords: {
          create: [{ name: 'Ear Drops', conditionId: 'condition-1' }],
        },
      }),
      include: expect.any(Object),
    });
  });

  it('creates a medication with no condition reference', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.vetRecord.findUnique.mockResolvedValue({ id: 'vet-1' });
    prisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

    await service.create({
      ...baseDto,
      medicationRecords: [{ name: 'Apoquel' }],
    });

    expect(prisma.condition.findMany).not.toHaveBeenCalled();
    expect(prisma.medicalRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        medicationRecords: {
          create: [{ name: 'Apoquel' }],
        },
      }),
      include: expect.any(Object),
    });
  });

  it('creates a visit with a medication and no vet office', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

    await service.create({
      petId: 'pet-1',
      date: '2025-01-01',
      medicationRecords: [{ name: 'Apoquel' }],
    });

    expect(prisma.vetRecord.findUnique).not.toHaveBeenCalled();
    expect(prisma.medicalRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vetRecord: undefined,
      }),
      include: expect.any(Object),
    });
  });

  it('creates an appointment with no vet name', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

    await service.create({
      petId: 'pet-1',
      date: '2025-01-01',
      appointment: { time: '10:00', reason: 'Checkup' },
    });

    expect(prisma.medicalRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointment: {
          create: expect.objectContaining({ time: '10:00', reason: 'Checkup' }),
        },
      }),
      include: expect.anything(),
    });
    const createCall = prisma.medicalRecord.create.mock.calls[0][0];
    expect(createCall.data.appointment.create).not.toHaveProperty('vet');
  });

  it('throws NotFoundException when a record does not exist', async () => {
    prisma.medicalRecord.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('builds a filter with date range and search across sub-records', async () => {
    prisma.medicalRecord.findMany.mockResolvedValue([]);

    await service.findAll({
      petId: 'pet-1',
      dateFrom: '2025-01-01',
      dateTo: '2025-06-01',
      search: 'rabies',
    });

    expect(prisma.medicalRecord.findMany).toHaveBeenCalledWith({
      where: {
        deleted: false,
        petId: 'pet-1',
        vetRecordId: undefined,
        date: {
          gte: new Date('2025-01-01'),
          lte: new Date('2025-06-01'),
        },
        OR: [
          {
            vaccineRecords: {
              some: { name: { contains: 'rabies', mode: 'insensitive' } },
            },
          },
          {
            medicationRecords: {
              some: { name: { contains: 'rabies', mode: 'insensitive' } },
            },
          },
          {
            appointment: {
              reason: { contains: 'rabies', mode: 'insensitive' },
            },
          },
        ],
      },
      include: expect.any(Object),
      orderBy: { date: 'desc' },
    });
  });

  it('rejects an update whose appointment references a condition belonging to a different pet', async () => {
    prisma.medicalRecord.findUnique.mockResolvedValue({
      id: 'record-1',
      petId: 'pet-1',
    });
    prisma.condition.findMany.mockResolvedValue([]);

    await expect(
      service.update('record-1', {
        appointment: {
          time: '10:00',
          vet: 'Dr. Lee',
          reason: 'Follow-up',
          conditionId: 'other-pet-condition',
        },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.medicalRecord.update).not.toHaveBeenCalled();
  });

  it('allows an update whose appointment references a condition belonging to the same pet', async () => {
    prisma.medicalRecord.findUnique.mockResolvedValue({
      id: 'record-1',
      petId: 'pet-1',
    });
    prisma.condition.findMany.mockResolvedValue([{ id: 'condition-1' }]);
    prisma.medicalRecord.update.mockResolvedValue({ id: 'record-1' });

    await service.update('record-1', {
      appointment: {
        time: '10:00',
        vet: 'Dr. Lee',
        reason: 'Follow-up',
        conditionId: 'condition-1',
      },
    });

    expect(prisma.medicalRecord.update).toHaveBeenCalled();
  });

  it('creates an appointment with notes, weight, and temperature', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.vetRecord.findUnique.mockResolvedValue({ id: 'vet-1' });
    prisma.condition.findMany.mockResolvedValue([]);
    prisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

    await service.create({
      ...baseDto,
      appointment: {
        time: '10:00',
        vet: 'Dr. Lee',
        reason: 'Checkup',
        weightLbs: 42.5,
        temperatureF: 101.2,
        notes: [
          { type: 'STAFF', text: 'Patient calm and cooperative.' },
          { type: 'DISCHARGE', text: 'Recheck in two weeks.' },
        ],
      },
    });

    expect(prisma.medicalRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointment: {
          create: expect.objectContaining({
            time: '10:00',
            vet: 'Dr. Lee',
            reason: 'Checkup',
            weightLbs: 42.5,
            temperatureF: 101.2,
            notes: {
              create: [
                { type: 'STAFF', text: 'Patient calm and cooperative.' },
                { type: 'DISCHARGE', text: 'Recheck in two weeks.' },
              ],
            },
          }),
        },
      }),
      include: expect.any(Object),
    });
  });

  it('replaces appointment notes on update rather than appending', async () => {
    prisma.medicalRecord.findUnique.mockResolvedValue({
      id: 'record-1',
      petId: 'pet-1',
    });
    prisma.condition.findMany.mockResolvedValue([]);
    prisma.medicalRecord.update.mockResolvedValue({ id: 'record-1' });

    await service.update('record-1', {
      appointment: {
        time: '10:00',
        vet: 'Dr. Lee',
        reason: 'Follow-up',
        notes: [{ type: 'OTHER', text: 'Updated note.' }],
      },
    });

    expect(prisma.medicalRecord.update).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: expect.objectContaining({
        appointment: {
          upsert: expect.objectContaining({
            update: expect.objectContaining({
              notes: {
                updateMany: {
                  where: { deleted: false },
                  data: { deleted: true },
                },
                create: [{ type: 'OTHER', text: 'Updated note.' }],
              },
            }),
          }),
        },
      }),
      include: expect.any(Object),
    });
  });

  it('converts vaccine administeredDate and nextDueDate to Date objects', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 'pet-1' });
    prisma.vetRecord.findUnique.mockResolvedValue({ id: 'vet-1' });
    prisma.condition.findMany.mockResolvedValue([]);
    prisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

    await service.create({
      ...baseDto,
      vaccineRecords: [
        {
          name: 'Rabies',
          administeredDate: '2025-01-01',
          nextDueDate: '2026-01-01',
        },
      ],
    });

    expect(prisma.medicalRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vaccineRecords: {
          create: [
            expect.objectContaining({
              name: 'Rabies',
              administeredDate: new Date('2025-01-01'),
              nextDueDate: new Date('2026-01-01'),
            }),
          ],
        },
      }),
      include: expect.any(Object),
    });
  });

  describe('removeAppointmentCondition', () => {
    it('throws NotFoundException when the appointment does not exist', async () => {
      prisma.appointmentRecord.findUnique.mockResolvedValue(null);

      await expect(
        service.removeAppointmentCondition('missing'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.appointmentRecord.update).not.toHaveBeenCalled();
    });

    it('sets the appointment conditionId to null', async () => {
      prisma.appointmentRecord.findUnique.mockResolvedValue({ id: 'apt-1' });
      prisma.appointmentRecord.update.mockResolvedValue({ id: 'apt-1' });

      await service.removeAppointmentCondition('apt-1');

      expect(prisma.appointmentRecord.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { conditionId: null },
        include: { condition: true, notes: true },
      });
    });
  });

  describe('removeMedicationCondition', () => {
    it('throws NotFoundException when the medication does not exist', async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMedicationCondition('missing'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.medicationRecord.update).not.toHaveBeenCalled();
    });

    it('sets the medication conditionId to null', async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue({ id: 'med-1' });
      prisma.medicationRecord.update.mockResolvedValue({ id: 'med-1' });

      await service.removeMedicationCondition('med-1');

      expect(prisma.medicationRecord.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { conditionId: null },
        include: { condition: true },
      });
    });
  });

  describe('setMedicationCondition', () => {
    it('throws NotFoundException when the medication does not exist', async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue(null);

      await expect(
        service.setMedicationCondition('missing', { conditionId: 'cond-1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.medicationRecord.update).not.toHaveBeenCalled();
    });

    it("rejects a condition that does not belong to the medication's pet", async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue({
        id: 'med-1',
        medicalRecord: { petId: 'pet-1' },
      });
      prisma.condition.findMany.mockResolvedValue([]);

      await expect(
        service.setMedicationCondition('med-1', { conditionId: 'cond-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.medicationRecord.update).not.toHaveBeenCalled();
    });

    it('sets the medication conditionId', async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue({
        id: 'med-1',
        medicalRecord: { petId: 'pet-1' },
      });
      prisma.condition.findMany.mockResolvedValue([{ id: 'cond-1' }]);
      prisma.medicationRecord.update.mockResolvedValue({ id: 'med-1' });

      await service.setMedicationCondition('med-1', { conditionId: 'cond-1' });

      expect(prisma.medicationRecord.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { conditionId: 'cond-1' },
        include: { condition: true },
      });
    });
  });

  describe('setAppointmentCondition', () => {
    it('throws NotFoundException when the appointment does not exist', async () => {
      prisma.appointmentRecord.findUnique.mockResolvedValue(null);

      await expect(
        service.setAppointmentCondition('missing', { conditionId: 'cond-1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.appointmentRecord.update).not.toHaveBeenCalled();
    });

    it("rejects a condition that does not belong to the appointment's pet", async () => {
      prisma.appointmentRecord.findUnique.mockResolvedValue({
        id: 'apt-1',
        medicalRecord: { petId: 'pet-1' },
      });
      prisma.condition.findMany.mockResolvedValue([]);

      await expect(
        service.setAppointmentCondition('apt-1', { conditionId: 'cond-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.appointmentRecord.update).not.toHaveBeenCalled();
    });

    it('sets the appointment conditionId', async () => {
      prisma.appointmentRecord.findUnique.mockResolvedValue({
        id: 'apt-1',
        medicalRecord: { petId: 'pet-1' },
      });
      prisma.condition.findMany.mockResolvedValue([{ id: 'cond-1' }]);
      prisma.appointmentRecord.update.mockResolvedValue({ id: 'apt-1' });

      await service.setAppointmentCondition('apt-1', { conditionId: 'cond-1' });

      expect(prisma.appointmentRecord.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { conditionId: 'cond-1' },
        include: { condition: true, notes: true },
      });
    });
  });

  describe('remove', () => {
    it('soft-deletes the visit and cascades to its owned vaccines/medications/notes', async () => {
      prisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'record-1',
        deleted: false,
        appointment: { id: 'apt-1' },
      });

      await service.remove('record-1');

      expect(prisma.medicalRecord.update).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        data: { deleted: true },
      });
      expect(prisma.vaccineRecord.updateMany).toHaveBeenCalledWith({
        where: { medicalRecordId: 'record-1' },
        data: { deleted: true },
      });
      expect(prisma.medicationRecord.updateMany).toHaveBeenCalledWith({
        where: { medicalRecordId: 'record-1' },
        data: { deleted: true },
      });
      expect(prisma.appointmentNote.updateMany).toHaveBeenCalledWith({
        where: { appointmentRecordId: 'apt-1' },
        data: { deleted: true },
      });
    });

    it('skips the note cascade when the visit has no appointment', async () => {
      prisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'record-1',
        deleted: false,
        appointment: null,
      });

      await service.remove('record-1');

      expect(prisma.appointmentNote.updateMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the visit is already deleted', async () => {
      prisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'record-1',
        deleted: true,
      });

      await expect(service.remove('record-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.medicalRecord.update).not.toHaveBeenCalled();
    });
  });

  describe('removeVaccine', () => {
    it('throws NotFoundException when the vaccine does not exist', async () => {
      prisma.vaccineRecord.findUnique.mockResolvedValue(null);

      await expect(service.removeVaccine('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.vaccineRecord.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the vaccine', async () => {
      prisma.vaccineRecord.findUnique.mockResolvedValue({
        id: 'vac-1',
        deleted: false,
      });

      await service.removeVaccine('vac-1');

      expect(prisma.vaccineRecord.update).toHaveBeenCalledWith({
        where: { id: 'vac-1' },
        data: { deleted: true },
      });
    });
  });

  describe('removeMedication', () => {
    it('throws NotFoundException when the medication does not exist', async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue(null);

      await expect(service.removeMedication('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.medicationRecord.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the medication', async () => {
      prisma.medicationRecord.findUnique.mockResolvedValue({
        id: 'med-1',
        deleted: false,
      });

      await service.removeMedication('med-1');

      expect(prisma.medicationRecord.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { deleted: true },
      });
    });
  });

  describe('removeAppointmentNote', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      prisma.appointmentNote.findUnique.mockResolvedValue(null);

      await expect(service.removeAppointmentNote('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.appointmentNote.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the note', async () => {
      prisma.appointmentNote.findUnique.mockResolvedValue({
        id: 'note-1',
        deleted: false,
      });

      await service.removeAppointmentNote('note-1');

      expect(prisma.appointmentNote.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: { deleted: true },
      });
    });
  });
});
