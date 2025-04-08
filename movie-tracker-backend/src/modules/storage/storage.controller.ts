// src/modules/storage/storage.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  Param,
  Query,
  BadRequestException,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express';
// import { AuthGuard } from '@nestjs/passport';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums';
import { FirebaseStorageService } from './firebase-storage.service';
import { UploadFolder } from './dto/file-upload.dto';

/**
 * Controller for file storage operations using RESTful endpoints
 */
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: FirebaseStorageService) {}

  /**
   * Upload a file
   */
  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: UploadFolder = UploadFolder.GENERAL,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Add metadata with user information
    const metadata = {
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
    };

    const url = await this.storageService.uploadFile(file, folder, metadata);
    
    // Get path from URL
    const pathMatch = url.match(/\/([^\/]+\/[^\/]+)$/);
    const path = pathMatch ? pathMatch[1] : '';
    
    // Get metadata
    const fileMetadata = await this.storageService.getFileMetadata(`${folder}/${path}`);

    return {
      url,
      path: `${folder}/${path}`,
      filename: file.originalname,
      metadata: fileMetadata,
    };
  }

  /**
   * Download a file by path
   */
  @Get('download/:folder/:filename')
  @UseGuards(AuthGuard)
  async downloadFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = `${folder}/${filename}`;
    
    // Check if file exists
    const exists = await this.storageService.fileExists(filePath);
    if (!exists) {
      throw new BadRequestException('File not found');
    }
    
    // Get download URL
    const downloadUrl = await this.storageService.getDownloadUrl(filePath);
    
    // Redirect to the download URL
    return res.redirect(downloadUrl);
  }

  /**
   * Delete a file
   */
  @Delete(':folder/:filename')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
  ) {
    const filePath = `${folder}/${filename}`;
    
    // Create a mock URL to delete
    let fileUrl: string;
    
    // Check if using emulator
    const useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true';
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    
    if (useEmulator) {
      fileUrl = `http://localhost:9199/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    } else {
      fileUrl = `https://storage.googleapis.com/${bucket}/${filePath}`;
    }
    
    await this.storageService.deleteFile(fileUrl);
    return { success: true };
  }

  /**
   * List files in a folder
   */
  @Get('list/:folder')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listFiles(
    @Param('folder') folder: string,
    @Query('prefix') prefix?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    const files = await this.storageService.listFiles(
      folder,
      prefix,
      maxResults ? parseInt(maxResults.toString(), 10) : 100
    );
    
    return { files };
  }

  /**
   * Get file metadata
   */
  @Get('metadata/:folder/:filename')
  @UseGuards(AuthGuard)
  async getFileMetadata(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
  ) {
    const filePath = `${folder}/${filename}`;
    const metadata = await this.storageService.getFileMetadata(filePath);
    
    return { metadata };
  }
}