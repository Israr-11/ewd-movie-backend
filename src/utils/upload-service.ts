import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

    const extension = fileType.split('/')[1] || 'jpg';

    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const key = `${folder}/${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType
    });

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
