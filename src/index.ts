// import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
//   return {
//     statusCode: 200,
//     body: JSON.stringify({ message: 'API is working!' }),
//   };
// };

import { APIGatewayEvent } from 'aws-lambda';
import { getMovieReviews, addReview, deleteReview, updateReview } from './controllers/review-controller';

export const handler = async (event: APIGatewayEvent) => {
  try {
    if (event.httpMethod === 'GET' && event.path.includes('/reviews/')) {
      return await getMovieReviews(event);
    }

    if (event.httpMethod === 'POST' && event.path.includes('/reviews/')) {
      return await addReview(event);
    }

    if (event.httpMethod === 'DELETE' && event.path.includes('/reviews/')) {
      return await deleteReview(event);
    }

    if (event.httpMethod === 'PUT' && event.path.includes('/reviews/')) {
      return await updateReview(event);
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error }) };
  }
};
