import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { FilterPetsDto } from './dto/filter-pets.dto';
import { DeactivatePetDto } from './dto/deactivate-pet.dto';
import {
  PET_PHOTO_URL_PREFIX,
  petPhotoMulterOptions,
} from './pet-photo.storage';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  create(@Body() dto: CreatePetDto) {
    return this.petsService.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterPetsDto) {
    return this.petsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Body() dto: DeactivatePetDto) {
    return this.petsService.deactivate(id, dto.reason);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo', petPhotoMulterOptions))
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A photo file is required (field name "photo", PNG/JPEG/WEBP/GIF, max 5MB)',
      );
    }
    return this.petsService.setPhoto(
      id,
      `${PET_PHOTO_URL_PREFIX}/${file.filename}`,
    );
  }
}
