import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import {
  DraftCondition,
  DraftMedicationRecord,
  DraftVetRecord,
  ExtractedVetOffice,
  ExtractionResult,
  RECORD_EXTRACTION_PROMPT,
  RECORD_EXTRACTION_SCHEMA,
  RecordExtractionDraft,
  ResolvedReference,
} from './record-extraction.types';

const EXTRACTION_MODEL = 'claude-haiku-4-5';

@Injectable()
export class RecordExtractionService {
  private readonly anthropic = new Anthropic();

  constructor(private readonly prisma: PrismaService) {}

  async extract(
    petId: string,
    file: Express.Multer.File,
  ): Promise<RecordExtractionDraft> {
    await this.assertPetExists(petId);
    const extracted = await this.callExtractionModel(file);
    return this.resolveDraft(petId, extracted);
  }

  private async callExtractionModel(
    file: Express.Multer.File,
  ): Promise<ExtractionResult> {
    const data = file.buffer.toString('base64');
    const documentBlock: Anthropic.ContentBlockParam =
      file.mimetype === 'application/pdf'
        ? {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data },
          }
        : {
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.mimetype as
                'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
              data,
            },
          };

    const response = await this.anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 2048,
      output_config: {
        format: { type: 'json_schema', schema: RECORD_EXTRACTION_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            documentBlock,
            { type: 'text', text: RECORD_EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new BadGatewayException(
        'The extraction model did not return any output for this document',
      );
    }

    return JSON.parse(textBlock.text) as ExtractionResult;
  }

  private async resolveDraft(
    petId: string,
    extracted: ExtractionResult,
  ): Promise<RecordExtractionDraft> {
    const vetRecord = await this.resolveVetRecord(extracted.vetOffice);

    const conditionNames = [
      ...extracted.conditionsReferenced.map((c) => c.name),
      ...extracted.medicationRecords
        .map((m) => m.conditionName)
        .filter((name): name is string => !!name),
    ];
    const conditions = await this.resolveConditions(petId, conditionNames);

    const medicationRecords: DraftMedicationRecord[] =
      extracted.medicationRecords.map((medication) => ({
        ...medication,
        condition: medication.conditionName
          ? (conditions.get(this.normalize(medication.conditionName)) ?? null)
          : null,
      }));

    const conditionsReferenced: DraftCondition[] =
      extracted.conditionsReferenced.map((condition) => ({
        ...condition,
        resolved: conditions.get(this.normalize(condition.name))!,
      }));

    const warnings: string[] = [];
    if (!extracted.date) {
      warnings.push('No visit date found — required before this can be saved.');
    }
    if (!vetRecord) {
      warnings.push(
        'No vet office detected — select or add one before saving.',
      );
    }

    return {
      petId,
      vetRecord: vetRecord ?? {
        id: null,
        name: '',
        isNew: true,
        address: '',
        phone: '',
      },
      date: extracted.date,
      appointment: extracted.appointment,
      vaccineRecords: extracted.vaccineRecords,
      medicationRecords,
      conditionsReferenced,
      warnings,
    };
  }

  // Matching is a simple case/whitespace-insensitive comparison against
  // existing rows, not fuzzy string matching — good enough to catch "Same
  // clinic, typed slightly differently" without a new dependency, and any
  // miss just falls through to "create new," which the review step surfaces
  // for the owner to confirm anyway.
  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private async resolveVetRecord(
    vetOffice: ExtractedVetOffice,
  ): Promise<DraftVetRecord | null> {
    if (!vetOffice.name) {
      return null;
    }
    const normalized = this.normalize(vetOffice.name);
    const vetRecords = await this.prisma.vetRecord.findMany();
    const match = vetRecords.find(
      (v) => this.normalize(v.officeName) === normalized,
    );
    return {
      id: match?.id ?? null,
      name: vetOffice.name,
      isNew: !match,
      address: vetOffice.address,
      phone: vetOffice.phone,
    };
  }

  private async resolveConditions(
    petId: string,
    names: string[],
  ): Promise<Map<string, ResolvedReference>> {
    const uniqueNames = [...new Set(names)];
    const resolved = new Map<string, ResolvedReference>();
    if (uniqueNames.length === 0) {
      return resolved;
    }

    const existing = await this.prisma.condition.findMany({
      where: { petId },
    });
    for (const name of uniqueNames) {
      const normalized = this.normalize(name);
      const match = existing.find((c) => this.normalize(c.name) === normalized);
      resolved.set(normalized, { id: match?.id ?? null, name, isNew: !match });
    }
    return resolved;
  }

  private async assertPetExists(petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new BadRequestException(`Pet ${petId} does not exist`);
    }
  }
}
