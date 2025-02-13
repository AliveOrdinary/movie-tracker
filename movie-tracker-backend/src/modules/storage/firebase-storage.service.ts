// src/modules/storage/firebase-storage.service.ts
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../firebase/firebase.service';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {
    this.bucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET') || '';
    if (!this.bucket) {
      throw new Error('FIREBASE_STORAGE_BUCKET is not configured');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<string> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuid()}${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      // Get bucket reference
      const bucketRef = this.firebaseService.storage.bucket(this.bucket);
      const fileRef = bucketRef.file(filePath);

      // Create write stream
      return new Promise((resolve, reject) => {
        const stream = fileRef.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
          public: true,
        });

        stream.on('error', (error) => {
          this.logger.error(`Upload failed: ${error.message}`);
          reject(new InternalServerErrorException('Upload failed'));
        });

        stream.on('finish', async () => {
          try {
            // Make the file publicly accessible
            await fileRef.makePublic();
            
            const publicUrl = `https://storage.googleapis.com/${this.bucket}/${filePath}`;
            this.logger.log(`File uploaded successfully: ${filePath}`);
            resolve(publicUrl);
          } catch (error) {
            reject(new InternalServerErrorException('Failed to make file public'));
          }
        });

        stream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('File upload failed:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const filePathMatch = fileUrl.match(`https://storage.googleapis.com/${this.bucket}/(.+)`);
      if (!filePathMatch) {
        throw new BadRequestException('Invalid file URL');
      }

      const filePath = filePathMatch[1];
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('File not found');
      }

      await file.delete();
      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async generateSignedUrl(
    filePath: string,
    expirationMinutes = 60,
  ): Promise<string> {
    try {
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('File not found');
      }

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error('Failed to generate signed URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }
}