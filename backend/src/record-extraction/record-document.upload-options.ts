import { FileFilterCallback } from 'multer';
import type { Request } from 'express';

// No `storage` option — multer defaults to in-memory storage, which is what
// we want here: the file only needs to reach the Claude API as bytes, not
// persist on disk the way pet photos do (see pet-photo.storage.ts).
export const MAX_RECORD_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const recordDocumentMulterOptions = {
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    callback(null, ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype));
  },
  limits: { fileSize: MAX_RECORD_DOCUMENT_SIZE_BYTES },
};
