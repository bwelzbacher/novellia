import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordExtractionService } from './record-extraction.service';
import { ExtractRecordQueryDto } from './dto/extract-record-query.dto';
import { recordDocumentMulterOptions } from './record-document.upload-options';

@Controller('record-extraction')
export class RecordExtractionController {
  constructor(
    private readonly recordExtractionService: RecordExtractionService,
  ) {}

  // Extracts a draft record from an uploaded document — does not persist
  // anything. The client reviews/edits the draft, then submits it through
  // the existing POST /medical-records and POST /conditions endpoints.
  @Post()
  @UseInterceptors(FileInterceptor('document', recordDocumentMulterOptions))
  extract(
    @Query() query: ExtractRecordQueryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A document file is required (field name "document", PNG/JPEG/WEBP/GIF/PDF, max 10MB)',
      );
    }
    return this.recordExtractionService.extract(query.petId, file);
  }
}
