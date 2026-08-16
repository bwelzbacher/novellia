import { Module } from '@nestjs/common';
import { VetRecordsController } from './vet-records.controller';
import { VetRecordsService } from './vet-records.service';

@Module({
  controllers: [VetRecordsController],
  providers: [VetRecordsService],
})
export class VetRecordsModule {}
