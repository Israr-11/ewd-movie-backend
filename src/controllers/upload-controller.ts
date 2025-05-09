import { APIGatewayEvent } from 'aws-lambda';
import { UploadService } from '../utils/upload-service';

const uploadService = new UploadService();

export const getPresignedUrl = async (event: APIGatewayEvent) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

    const { fileType } = JSON.parse(event.body || '{}');
    if (!fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'fileType is required' })
      };
    }

    const { url, key } = await uploadService.getPresignedUrl(fileType, 'posters');

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: url,
        key,
        publicUrl: uploadService.getPublicUrl(key)
      })
    };
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error generating presigned URL', error: error.message })
    };
  }
};
