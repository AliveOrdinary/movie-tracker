// src/modules/storage/interfaces/storage-service.interface.ts
import { FileMetadata } from './file-metadata.interface';

/**
 * Storage service interface defining the methods
 * that any storage implementation should provide
 */
export interface StorageService {
  /**
   * Upload a file to storage
   * @param file The file to upload
   * @param folder Optional folder path within storage
   * @param metadata Optional metadata for the file
   * @returns URL to access the uploaded file
   */
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
    metadata?: Record<string, any>
  ): Promise<string>;

  /**
   * Upload a file with file data
   * @param fileData Buffer containing file data
   * @param fileName Original file name
   * @param mimeType File mime type
   * @param folder Destination folder
   * @param metadata Optional metadata
   */
  uploadFileData(
    fileData: Buffer,
    fileName: string,
    mimeType: string,
    folder?: string,
    metadata?: Record<string, any>
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param fileUrl URL of the file to delete
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Generate a signed URL for temporary access to a file
   * @param filePath Path to the file within storage
   * @param expirationMinutes Minutes until the URL expires
   * @returns Signed URL for accessing the file
   */
  generateSignedUrl(
    filePath: string,
    expirationMinutes?: number
  ): Promise<string>;

  /**
   * Get file metadata
   * @param filePath Path to the file
   * @returns File metadata
   */
  getFileMetadata(filePath: string): Promise<FileMetadata>;

  /**
   * Check if a file exists
   * @param filePath Path to check
   * @returns Whether the file exists
   */
  fileExists(filePath: string): Promise<boolean>;

  /**
   * List files in a directory
   * @param folderPath Path to the folder
   * @param prefix Optional prefix to filter files
   * @param maxResults Maximum number of results to return
   * @returns Array of file paths
   */
  listFiles(
    folderPath: string,
    prefix?: string,
    maxResults?: number
  ): Promise<string[]>;

  /**
   * Move or copy a file
   * @param sourcePath Source file path
   * @param destinationPath Destination file path
   * @param copy Whether to copy instead of move
   */
  moveFile(
    sourcePath: string,
    destinationPath: string,
    copy?: boolean
  ): Promise<void>;

  /**
   * Get a direct file download URL
   * @param filePath Path to the file
   * @param fileName Suggested filename for download
   * @param expirationMinutes Minutes until URL expires
   */
  getDownloadUrl(
    filePath: string,
    fileName?: string,
    expirationMinutes?: number
  ): Promise<string>;
}