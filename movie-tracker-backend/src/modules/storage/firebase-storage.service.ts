// src/modules/storage/firebase-storage.service.ts
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../common/services/cache.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { FileMetadata } from './interfaces/file-metadata.interface';
import { StorageService } from './interfaces/storage-service.interface';
import { UploadFolder } from './dto/file-upload.dto';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Allowed file extensions and their corresponding MIME types
 */
const ALLOWED_FILE_TYPES = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  
  // Other
  '.json': 'application/json',
  '.csv': 'text/csv',
};

/**
 * Maximum file size in bytes (10 MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class FirebaseStorageService implements StorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private readonly bucket: string;
  private readonly useEmulator: boolean;
  private readonly allowedFolders: string[];
  
  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
    private readonly cacheService: CacheService,
  ) {
    this.bucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET', '');
    this.useEmulator = this.configService.get<string>('FIREBASE_USE_EMULATOR', 'false') === 'true';
    
    if (!this.bucket && !this.useEmulator) {
      throw new Error('FIREBASE_STORAGE_BUCKET is required when not using the emulator');
    }
    
    // Get allowed folders from config or use default values
    this.allowedFolders = Object.values(UploadFolder);
    this.logger.log(`Initialized with bucket: ${this.bucket}, emulator: ${this.useEmulator}`);
    this.logger.log(`Allowed folders: ${this.allowedFolders.join(', ')}`);
  }

  /**
   * Validate a file before upload
   */
  private validateFile(file: Express.Multer.File | { buffer: Buffer, originalname: string, mimetype: string }): void {
    // Check file size
    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024} MB)`);
    }
    
    // Check file type
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(fileExt)) {
      throw new BadRequestException(`File type ${fileExt} is not allowed`);
    }
    
    // Verify that the content type matches the file extension
    const expectedMimeType = ALLOWED_FILE_TYPES[fileExt];
    if (file.mimetype !== expectedMimeType) {
      throw new BadRequestException(
        `File mime type (${file.mimetype}) does not match expected type for extension ${fileExt} (${expectedMimeType})`
      );
    }
  }

  /**
   * Generate a unique filename
   */
  private generateUniqueFilename(originalFilename: string): string {
    const fileExt = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, fileExt)
      .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric with hyphens
      .toLowerCase();
    
    // Generate hash based on filename and current timestamp
    const hash = crypto
      .createHash('md5')
      .update(`${baseName}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .slice(0, 8);
    
    return `${baseName}-${hash}${fileExt}`;
  }

  /**
   * Check if folder is valid
   */
  private validateFolder(folder: string): string {
    // If no folder specified, use the general uploads folder
    if (!folder) {
      return UploadFolder.GENERAL;
    }
    
    // Make sure folder is in the allowed list
    const normalizedFolder = folder.toLowerCase().trim();
    if (!this.allowedFolders.includes(normalizedFolder)) {
      throw new BadRequestException(
        `Folder "${folder}" is not allowed. Allowed folders: ${this.allowedFolders.join(', ')}`
      );
    }
    
    return normalizedFolder;
  }

  /**
   * Extract file path from URL
   */
  private getFilePathFromUrl(fileUrl: string): string {
    if (this.useEmulator) {
      // Extract path from emulator URL format
      const match = fileUrl.match(/\/storage\/.*\/o\/(.+?)(?:\?|$)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } else {
      // Extract path from production URL format
      const bucketUrlPrefix = `https://storage.googleapis.com/${this.bucket}/`;
      if (fileUrl.startsWith(bucketUrlPrefix)) {
        return fileUrl.substring(bucketUrlPrefix.length);
      }
    }
    throw new BadRequestException('Invalid file URL format');
  }

  /**
   * Build a cache key for a file path
   */
  private getCacheKey(operation: string, path: string): string {
    return `storage:${operation}:${path}`;
  }

  /**
   * Upload a file
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = UploadFolder.GENERAL,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Validate the file
      this.validateFile(file);
      
      // Validate and normalize the folder
      const normalizedFolder = this.validateFolder(folder);
      
      // Generate a unique filename
      const fileName = this.generateUniqueFilename(file.originalname);
      const filePath = `${normalizedFolder}/${fileName}`;
      
      // Get bucket reference
      const bucketRef = this.firebaseService.storage.bucket(this.bucket);
      const fileRef = bucketRef.file(filePath);
      
      // Combine provided metadata with default metadata
      const fullMetadata = {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          ...metadata
        }
      };
      
      // Create write stream
      return new Promise((resolve, reject) => {
        const stream = fileRef.createWriteStream({
          metadata: fullMetadata,
          public: true,
        });
        
        stream.on('error', (error) => {
          this.logger.error(`Upload failed: ${error.message}`, error.stack);
          reject(new InternalServerErrorException('Upload failed'));
        });
        
        stream.on('finish', async () => {
          try {
            // Make the file publicly accessible
            await fileRef.makePublic();
            
            let publicUrl: string;
            if (this.useEmulator) {
              publicUrl = `http://localhost:9199/v0/b/${this.bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
            } else {
              publicUrl = `https://storage.googleapis.com/${this.bucket}/${filePath}`;
            }
            
            this.logger.log(`File uploaded successfully: ${filePath}`);
            resolve(publicUrl);
          } catch (error) {
            this.logger.error('Failed to make file public:', error);
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

  /**
   * Upload file from a buffer
   */
  async uploadFileData(
    fileData: Buffer,
    fileName: string,
    mimeType: string,
    folder = UploadFolder.GENERAL,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    // Create a file-like object from the buffer
    const file = {
      buffer: fileData,
      originalname: fileName,
      mimetype: mimeType,
    };
    
    // Use the existing uploadFile method
    return this.uploadFile(file as Express.Multer.File, folder, metadata);
  }

  /**
   * Delete a file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const filePath = this.getFilePathFromUrl(fileUrl);
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('File not found');
      }
      
      // Delete the file
      await file.delete();
      
      // Clear any cached URLs or metadata for this file
      await this.cacheService.invalidatePattern(`storage:*:${filePath}`);
      
      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async generateSignedUrl(
    filePath: string,
    expirationMinutes = 60
  ): Promise<string> {
    try {
      // Check if we already have a cached URL for this path
      const cacheKey = this.getCacheKey('signed', filePath);
      const cachedUrl = await this.cacheService.get<string>(cacheKey);
      if (cachedUrl) {
        return cachedUrl;
      }
      
      // Get file reference
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('File not found');
      }
      
      // Generate signed URL
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });
      
      // Cache the signed URL for half the expiration time
      // This ensures we don't serve URLs that are about to expire
      const cacheTtl = Math.floor(expirationMinutes * 30);
      await this.cacheService.set(cacheKey, signedUrl, cacheTtl);
      
      return signedUrl;
    } catch (error) {
      this.logger.error('Failed to generate signed URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
      // Check for cached metadata
      const cacheKey = this.getCacheKey('metadata', filePath);
      const cachedMetadata = await this.cacheService.get<FileMetadata>(cacheKey);
      if (cachedMetadata) {
        return cachedMetadata;
      }
      
      // Get file reference
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('File not found');
      }
      
      // Get metadata
      const [metadata] = await file.getMetadata();
      
      // Generate URLs
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });
      
      let publicUrl: string;
      if (this.useEmulator) {
        publicUrl = `http://localhost:9199/v0/b/${this.bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
      } else {
        publicUrl = `https://storage.googleapis.com/${this.bucket}/${filePath}`;
      }
      
      // Build metadata object
      const fileMetadata: FileMetadata = {
        name: path.basename(filePath),
        bucket: this.bucket,
        path: filePath,
        fullPath: `${this.bucket}/${filePath}`,
        contentType: metadata.contentType || 'application/octet-stream',
        timeCreated: metadata.timeCreated || new Date().toISOString(),
        updated: metadata.updated || new Date().toISOString(),
        size: metadata.size ? parseInt(metadata.size.toString(), 10) : 0,
        generation: metadata.generation ? metadata.generation.toString() : undefined,
        metageneration: metadata.metageneration ? metadata.metageneration.toString() : undefined,
        md5Hash: metadata.md5Hash,
        contentEncoding: metadata.contentEncoding,
        contentDisposition: metadata.contentDisposition,
        storageClass: metadata.storageClass,
        downloadUrl: signedUrl,
        publicUrl: publicUrl,
        isPublic: !!metadata.acl?.some(acl => acl.entity === 'allUsers'),
        cacheControl: metadata.cacheControl,
        customMetadata: metadata.metadata ? Object.entries(metadata.metadata).map(([k, v]) => `${k}: ${v}`) : [],
      };
      
      // Cache metadata for 15 minutes
      await this.cacheService.set(cacheKey, fileMetadata, 15 * 60);
      
      return fileMetadata;
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${filePath}:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get file metadata');
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check if file exists: ${filePath}`, error);
      return false;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    folderPath: string,
    prefix?: string,
    maxResults: number = 100
  ): Promise<string[]> {
    try {
      // Validate folder
      const normalizedFolder = this.validateFolder(folderPath);
      
      // Create options for listing files
      const options: any = {
        prefix: prefix ? `${normalizedFolder}/${prefix}` : normalizedFolder,
        maxResults,
      };
      
      // Get files
      const [files] = await this.firebaseService.storage.bucket(this.bucket).getFiles(options);
      
      // Extract and return file paths
      return files.map(file => file.name);
    } catch (error) {
      this.logger.error(`Failed to list files in folder ${folderPath}:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to list files');
    }
  }

  /**
   * Move or copy a file
   */
  async moveFile(
    sourcePath: string,
    destinationPath: string,
    copy: boolean = false
  ): Promise<void> {
    try {
      // Get file references
      const sourceFile = this.firebaseService.storage.bucket(this.bucket).file(sourcePath);
      
      // Check if source file exists
      const [exists] = await sourceFile.exists();
      if (!exists) {
        throw new BadRequestException('Source file not found');
      }
      
      if (copy) {
        // Copy the file
        await sourceFile.copy(destinationPath);
      } else {
        // Move the file
        await sourceFile.move(destinationPath);
      }
      
      // Clear cache for both paths
      await Promise.all([
        this.cacheService.invalidatePattern(`storage:*:${sourcePath}`),
        this.cacheService.invalidatePattern(`storage:*:${destinationPath}`)
      ]);
      
      this.logger.log(`File ${copy ? 'copied' : 'moved'} from ${sourcePath} to ${destinationPath}`);
    } catch (error) {
      this.logger.error(`Failed to ${copy ? 'copy' : 'move'} file:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to ${copy ? 'copy' : 'move'} file`);
    }
  }

  /**
   * Get a download URL for a file
   */
  async getDownloadUrl(
    filePath: string,
    fileName?: string,
    expirationMinutes: number = 15
  ): Promise<string> {
    try {
      // Get file reference
      const file = this.firebaseService.storage.bucket(this.bucket).file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('File not found');
      }
      
      // Generate signed URL with content-disposition for download
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
        promptSaveAs: fileName || path.basename(filePath),
        responseDisposition: `attachment; filename="${fileName || path.basename(filePath)}"`,
      });
      
      return signedUrl;
    } catch (error) {
      this.logger.error('Failed to generate download URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}