import type { TemplateType, FileFormat } from '@/types/template';

export type UploadFileType = 'pdf' | 'document' | 'image';

/** Maps file extensions to the upload file type category. */
export const FILE_EXTENSION_TYPE_MAP: Record<string, UploadFileType> = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  svg: 'image',
  docx: 'document',
  pptx: 'document',
  xlsx: 'document',
  doc: 'document',
  ppt: 'document',
  xls: 'document',
};

/** Accepted file-input strings per upload file type. */
const ACCEPTED_FILE_TYPES: Record<UploadFileType, string> = {
  pdf: '.pdf',
  image: '.png,.jpg,.jpeg,.webp,.svg',
  document: '.docx,.pptx,.xlsx,.doc,.ppt,.xls',
};

/** Maximum file size in MB per upload file type. */
const MAX_FILE_SIZE_MB: Record<UploadFileType, number> = {
  pdf: 50,
  document: 25,
  image: 10,
};

export function getAcceptedFileTypes(fileType: UploadFileType): string {
  return ACCEPTED_FILE_TYPES[fileType] ?? '*/*';
}

export function getMaxFileSize(fileType: UploadFileType): number {
  return MAX_FILE_SIZE_MB[fileType] ?? 50;
}

/**
 * Detect the UploadFileType from a file extension string (without the dot).
 * Returns undefined when the extension is unrecognised.
 */
export function detectUploadFileType(extension: string): UploadFileType | undefined {
  return FILE_EXTENSION_TYPE_MAP[extension.toLowerCase()];
}

/** Map an upload file type to the logical template type stored in the DB. */
export function toTemplateType(fileType: UploadFileType): TemplateType {
  switch (fileType) {
    case 'pdf': return 'worksheet';
    case 'document': return 'form';
    case 'image': return 'canvas';
    default: return 'worksheet';
  }
}

/** Map an upload file type to the canonical file format stored in the DB. */
export function toFileFormat(fileType: UploadFileType): FileFormat {
  switch (fileType) {
    case 'pdf': return 'pdf';
    case 'document': return 'docx';
    case 'image': return 'png';
    default: return 'pdf';
  }
}
