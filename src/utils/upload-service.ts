import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({});
    this.bucketName = process.env.UPLOADS_BUCKET_NAME || '';
  }

  async getPresignedUrl(fileType: string, folder: string = 'posters'): Promise<{ url: string, key: string }> {
    if (!fileType) {
      throw new Error('File type is required');
    }

    // Extract file extension from MIME type
    const extension = fileType.split('/')[1] || 'jpg';
    
    // Generate a unique key for the file
    const key = `${folder}/${uuidv4()}.${extension}`;
    
    // Create the command for putting an object in S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType
    });
    
    // Generate a pre-signed URL that expires in 5 minutes
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    
    return {
      url,
      key
    };
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
