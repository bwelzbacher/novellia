import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PetsModule } from './pets/pets.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { VetRecordsModule } from './vet-records/vet-records.module';
import { ConditionsModule } from './conditions/conditions.module';
import { RecordExtractionModule } from './record-extraction/record-extraction.module';
import { AllergiesModule } from './allergies/allergies.module';

@Module({
  imports: [
    PrismaModule,
    PetsModule,
    VetRecordsModule,
    ConditionsModule,
    MedicalRecordsModule,
    RecordExtractionModule,
    AllergiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
