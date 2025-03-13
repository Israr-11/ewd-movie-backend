import { APIGatewayEvent } from 'aws-lambda';
import { getMovieReviews, addReview, updateReview, getTranslation } from './controllers/review-controller';
import {signOut, signIn, signUp} from './controllers/auth-controller';

export const handler = async (event: APIGatewayEvent) => {
  try {
    // GET /movies/reviews/[movieId]
    if (event.httpMethod === 'GET' && event.path.match(/\/movies\/reviews\/\d+$/)) {
      return await getMovieReviews(event);
    }

    // POST /movies/reviews
    if (event.httpMethod === 'POST' && event.path === '/movies/reviews') {
      return await addReview(event);
    }

    // PUT /movies/{movieId}/reviews/{reviewId}
    if (event.httpMethod === 'PUT' && event.path.match(/\/movies\/\d+\/reviews\/\d+$/)) {
      return await updateReview(event);
    }

    // GET /reviews/{reviewId}/{movieId}/translation
    if (event.httpMethod === 'GET' && event.path.match(/\/reviews\/\d+\/\d+\/translation$/)) {
      return await getTranslation(event);
    }

    if (event.path === '/auth/register' && event.httpMethod === 'POST') {
      return await signUp(event);
    }
    
    if (event.path === '/auth/login' && event.httpMethod === 'POST') {
      return await signIn(event);
    }
    
    if (event.path === '/auth/logout' && event.httpMethod === 'POST') {
      return await signOut(event);
    }
    

    return { statusCode: 404, body: 'Not Found' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error }) };
  }
};
