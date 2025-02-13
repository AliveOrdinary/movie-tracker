// src/modules/storage/interfaces/file-metadata.interface.ts
export interface FileMetadata {
    name: string;
    bucket: string;
    generation: string;
    metageneration: string;
    contentType: string;
    timeCreated: string;
    updated: string;
    storageClass: string;
    size: string;
    md5Hash: string;
    contentEncoding: string;
    contentDisposition: string;
    mediaLink: string;
  }