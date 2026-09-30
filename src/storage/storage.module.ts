import { Module } from '@nestjs/common';
import { CloudinaryStorageService } from './cloudinary/cloudinary-storage.service';
import { STORAGE_SERVICE } from './storage.service';

@Module({
  providers: [
    /**
     * Swap this binding later to switch storage providers (e.g., AWS S3):
     * - Create `S3StorageService` implementing `StorageService`
     * - Replace `useClass: CloudinaryStorageService` with `useClass: S3StorageService`
     */
    { provide: STORAGE_SERVICE, useClass: CloudinaryStorageService },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}

