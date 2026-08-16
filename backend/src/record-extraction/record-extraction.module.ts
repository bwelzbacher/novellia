import { Module } from '@nestjs/common';
import { RecordExtractionController } from './record-extraction.controller';
import { RecordExtractionService } from './record-extraction.service';

@Module({
  controllers: [RecordExtractionController],
  providers: [RecordExtractionService],
})
export class RecordExtractionModule {}
