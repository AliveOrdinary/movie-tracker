// src/modules/storage/storage.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { GraphQLScalarType } from 'graphql';
import { FirebaseStorageService } from './firebase-storage.service';
import { FileUploadInput, FileUploadResponse, FileDeleteInput, SignedUrlInput, UploadFolder } from './dto/file-upload.dto';
import { FileMetadata } from './interfaces/file-metadata.interface';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums';

@Resolver()
export class StorageResolver {
  constructor(private readonly storageService: FirebaseStorageService) {}

  /**
   * Upload a file to storage
   */
  @Mutation(() => FileUploadResponse)
  @UseGuards(AuthGuard)
  async uploadFile(
    @CurrentUser() user: User,
    @Args('file', { type: () => GraphQLUpload })
    { createReadStream, filename, mimetype }: FileUpload,
    @Args('input') input: FileUploadInput,
  ): Promise<FileUploadResponse> {
    // Read the file into a buffer
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream();

      stream.on('data', (chunk) => chunks.push(chunk as Buffer));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Use the actual filename from the upload if none specified in input
    const finalFilename = input.filename || filename;
    const finalContentType = input.contentType || mimetype;

    // Determine the folder based on user role and input
    // Cast the string back to UploadFolder enum for service compatibility
    let folder = (input.folder || UploadFolder.GENERAL) as UploadFolder;
    
    // Add additional metadata with user information
    const metadata = {
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      originalName: finalFilename,
    };

    // Upload the file
    const url = await this.storageService.uploadFileData(
      fileBuffer,
      finalFilename,
      finalContentType,
      folder,
      metadata
    );

    // Extract file path from URL
    const path = url.split('/').slice(-1)[0];

    // Get the metadata
    const fileMetadata = await this.storageService.getFileMetadata(
      `${folder}/${path}`
    );

    return {
      url,
      path: `${folder}/${path}`,
      filename: finalFilename,
      metadata: fileMetadata,
    };
  }

  /**
   * Delete a file from storage
   */
  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async deleteFile(
    @CurrentUser() user: User,
    @Args('input') input: FileDeleteInput,
  ): Promise<boolean> {
    await this.storageService.deleteFile(input.url);
    return true;
  }

  /**
   * Generate a signed URL for a file
   */
  @Query(() => String)
  @UseGuards(AuthGuard)
  async getSignedUrl(
    @CurrentUser() user: User,
    @Args('input') input: SignedUrlInput,
  ): Promise<string> {
    return this.storageService.generateSignedUrl(
      input.path, 
      input.expirationMinutes
    );
  }

  /**
   * Get file metadata
   */
  @Query(() => FileMetadata)
  @UseGuards(AuthGuard)
  async getFileMetadata(
    @CurrentUser() user: User,
    @Args('path') path: string,
  ): Promise<FileMetadata> {
    return this.storageService.getFileMetadata(path);
  }

  /**
   * List files in a folder
   */
  @Query(() => [String])
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listFiles(
    @Args('folder', { defaultValue: UploadFolder.GENERAL, type: () => String }) folder: string,
    @Args('prefix', { nullable: true }) prefix?: string,
    @Args('maxResults', { defaultValue: 100 }) maxResults?: number,
  ): Promise<string[]> {
    return this.storageService.listFiles(folder as UploadFolder, prefix, maxResults);
  }

  /**
   * Get a download URL for a file
   */
  @Query(() => String)
  @UseGuards(AuthGuard)
  async getDownloadUrl(
    @CurrentUser() user: User,
    @Args('path') path: string,
    @Args('filename', { nullable: true }) filename?: string,
    @Args('expirationMinutes', { defaultValue: 15 }) expirationMinutes?: number,
  ): Promise<string> {
    return this.storageService.getDownloadUrl(path, filename, expirationMinutes);
  }

  /**
   * Check if a file exists
   */
  @Query(() => Boolean)
  @UseGuards(AuthGuard)
  async fileExists(
    @CurrentUser() user: User,
    @Args('path') path: string,
  ): Promise<boolean> {
    return this.storageService.fileExists(path);
  }
}