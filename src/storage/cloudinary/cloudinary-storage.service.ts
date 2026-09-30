import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';
import type { UploadApiResponse } from 'cloudinary';
import { StorageService } from '../storage.service';

@Injectable()
export class CloudinaryStorageService implements StorageService {
  constructor() {
    // Reads from process.env (ConfigModule is already global in your app).
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private async resolveResourceType(publicId: string): Promise<'image' | 'raw'> {
    // Cloudinary can store PDFs as `image` resources (common), or as `raw` files.
    // If DB doesn't have resourceType for older rows, detect it.
    try {
      await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'authenticated' });
      return 'image';
    } catch {
      // If not found as image, assume raw (or will throw later at access time).
      return 'raw';
    }
  }

  async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ publicId: string; resourceType: UploadApiResponse['resource_type']; format?: string; version?: number }> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const desiredResourceType: UploadApiResponse['resource_type'] =
          mimeType === 'application/pdf' ? 'raw' : 'auto';
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            type: 'authenticated',
            resource_type: desiredResourceType,
            filename_override: originalName,
            use_filename: true,
            unique_filename: true,
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error('Cloudinary upload failed'));
              return;
            }
            resolve(uploadResult);
          },
        );

        const passthrough = new PassThrough();
        passthrough.end(fileBuffer);
        passthrough.pipe(uploadStream);
      });

      return {
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        version: result.version,
      };
    } catch (e) {
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getSignedUrl(
    publicId: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  async getSignedUrl(
    publicId: string,
    opts?: {
      expiresInSeconds?: number;
      resourceType?: UploadApiResponse['resource_type'];
      format?: string;
      version?: number;
    },
  ): Promise<string>;
  async getSignedUrl(
    publicId: string,
    arg?:
      | number
      | {
          expiresInSeconds?: number;
          resourceType?: UploadApiResponse['resource_type'];
          format?: string;
          version?: number;
        },
  ): Promise<string> {
    const opts = typeof arg === 'number' ? { expiresInSeconds: arg } : arg;
    const expiresInSeconds = opts?.expiresInSeconds ?? 300;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const resourceType =
      (opts?.resourceType as 'image' | 'raw' | 'video' | 'auto' | undefined) ?? (await this.resolveResourceType(publicId));

    return cloudinary.url(publicId, {
      type: 'authenticated',
      resource_type: resourceType,
      format: opts?.format,
      version: opts?.version,
      secure: true,
      sign_url: true,
      expires_at: expiresAt,
    });
  }

  async delete(publicId: string, resourceType: UploadApiResponse['resource_type'] = 'raw'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { type: 'authenticated', resource_type: resourceType });
    } catch {
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}