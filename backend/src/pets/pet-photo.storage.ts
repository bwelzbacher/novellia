import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { diskStorage, FileFilterCallback } from 'multer';
import type { Request } from 'express';

export const UPLOADS_ROOT_DIR = join(process.cwd(), 'uploads');
export const PET_PHOTO_UPLOAD_DIR = join(UPLOADS_ROOT_DIR, 'pet-photos');
export const PET_PHOTO_URL_PREFIX = '/uploads/pet-photos';

export const MAX_PET_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export const petPhotoMulterOptions = {
  storage: diskStorage({
    destination: PET_PHOTO_UPLOAD_DIR,
    filename: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    callback(null, ALLOWED_PHOTO_MIME_TYPES.has(file.mimetype));
  },
  limits: { fileSize: MAX_PET_PHOTO_SIZE_BYTES },
};
