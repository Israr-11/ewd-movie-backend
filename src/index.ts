import { APIGatewayEvent } from 'aws-lambda';
import { getMovieReviews, addReview, updateReview, getTranslation } from './controllers/review-controller';

export const handler = async (event: APIGatewayEvent) => {
  try {
    // GET /movies/reviews/{movieId}
    if (event.httpMethod === 'GET' && event.path.match(/\/movies\/reviews\/\d+$/)) {
      return await getMovieReviews(event);
    }

    // POST /movies/reviews
    if (event.httpMethod === 'POST' && event.path === '/movies/reviews') {
      return await addReview(event);
    }

    // PUT /movies/reviews/{movieId}/{reviewId}
    if (event.httpMethod === 'PUT' && event.path.match(/\/movies\/reviews\/\d+\/\w+$/)) {
      return await updateReview(event);
    }

    if (event.httpMethod === 'GET' && event.path.match(/\/reviews\/\d+\/\d+\/translation$/)) {
      return await getTranslation(event);
  }
  

    return { statusCode: 404, body: 'Not Found' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error }) };
  }
};
