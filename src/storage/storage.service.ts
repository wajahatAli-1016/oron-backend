export type StorageUploadResult = {
  publicId: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  version?: number;
};

export type StorageSignedUrlOptions = {
  expiresInSeconds?: number;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  version?: number;
};

/**
 * StorageService (abstract)
 *
 * Cloudinary is the current implementation. To switch to AWS S3 later,
 * create another provider that implements this interface and swap the
 * binding in `StorageModule` (see `src/storage/storage.module.ts`).
 */
export interface StorageService {
  upload(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<StorageUploadResult>;
  getSignedUrl(publicId: string, expiresInSeconds?: number): Promise<string>;
  getSignedUrl(publicId: string, opts?: StorageSignedUrlOptions): Promise<string>;
  delete(publicId: string, resourceType?: 'image' | 'video' | 'raw' | 'auto'): Promise<void>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

