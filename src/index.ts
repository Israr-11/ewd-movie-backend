import { APIGatewayEvent } from 'aws-lambda';
import { getMovieReviews, addReview, updateReview, getTranslation } from './controllers/review-controller';
import { signOut, signIn, signUp } from './controllers/auth-controller';
import { addFavorite, removeFavorite, getUserFavorites, reorderFavorites } from './controllers/favorite-controller';
import { createFantasyMovie, getUserFantasyMovies, deleteFantasyMovie, addCastMember } from './controllers/fantasy-movie-controller';
import { getPresignedUrl } from './controllers/upload-controller';
import { createPlaylist, getUserPlaylists, deletePlaylist, addMovieToPlaylist, removeMovieFromPlaylist } from './controllers/playlist-controller';


// CORS headers to add to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
  'Access-Control-Allow-Credentials': 'true'
};

// Helper function to add CORS headers to responses
const addCorsHeaders = (response: any) => {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...corsHeaders
    }
  };
};

export const handler = async (event: APIGatewayEvent) => {
  try {
    // Handle OPTIONS requests for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    let response;

    // GET /movies/reviews (get all reviews) or GET /movies/reviews/{movieId} (get reviews for specific movie)
    if (event.httpMethod === 'GET' &&
      (event.path === '/movies/reviews' || event.path.match(/\/movies\/reviews\/\d+$/))) {
      response = await getMovieReviews(event);
      return addCorsHeaders(response);
    }


    // POST /movies/reviews
    if (event.httpMethod === 'POST' && event.path === '/movies/reviews') {
      response = await addReview(event);
      return addCorsHeaders(response);
    }

    // PUT /movies/{movieId}/reviews/{reviewId}
    if (event.httpMethod === 'PUT' && event.path.match(/\/movies\/\d+\/reviews\/\d+$/)) {
      response = await updateReview(event);
      return addCorsHeaders(response);
    }

    // GET /reviews/{reviewId}/{movieId}/translation
    if (event.httpMethod === 'GET' && event.path.match(/\/reviews\/\d+\/\d+\/translation$/)) {
      response = await getTranslation(event);
      return addCorsHeaders(response);
    }

    // Auth endpoints
    if (event.path === '/auth/register' && event.httpMethod === 'POST') {
      response = await signUp(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/auth/login' && event.httpMethod === 'POST') {
      response = await signIn(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/auth/logout' && event.httpMethod === 'POST') {
      response = await signOut(event);
      return addCorsHeaders(response);
    }

    // Favorites endpoints
    if (event.path === '/api/favorites' && event.httpMethod === 'POST') {
      response = await addFavorite(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/api/favorites' && event.httpMethod === 'GET') {
      response = await getUserFavorites(event);
      return addCorsHeaders(response);
    }

    if (event.path.match(/\/api\/favorites\/\d+$/) && event.httpMethod === 'DELETE') {
      response = await removeFavorite(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/api/favorites/reorder' && event.httpMethod === 'PUT') {
      response = await reorderFavorites(event);
      return addCorsHeaders(response);
    }

    // Fantasy movie endpoints
    if (event.path === '/api/fantasy-movies' && event.httpMethod === 'POST') {
      response = await createFantasyMovie(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/api/fantasy-movies' && event.httpMethod === 'GET') {
      response = await getUserFantasyMovies(event);
      return addCorsHeaders(response);
    }

    if (event.path.match(/\/api\/fantasy-movies\/\d+$/) && event.httpMethod === 'DELETE') {
      response = await deleteFantasyMovie(event);
      return addCorsHeaders(response);
    }

    if (event.path.match(/\/api\/fantasy-movies\/\d+\/cast$/) && event.httpMethod === 'POST') {
      response = await addCastMember(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/api/uploads/presigned-url' && event.httpMethod === 'POST') {
      response = await getPresignedUrl(event);
      return addCorsHeaders(response);
    }

    // Playlist endpoints
    // Add these handlers to your existing handler function
    // Playlist endpoints
    if (event.path === '/api/playlists' && event.httpMethod === 'POST') {
      response = await createPlaylist(event);
      return addCorsHeaders(response);
    }

    if (event.path === '/api/playlists' && event.httpMethod === 'GET') {
      response = await getUserPlaylists(event);
      return addCorsHeaders(response);
    }

    if (event.path.match(/\/api\/playlists\/\d+$/) && event.httpMethod === 'DELETE') {
      response = await deletePlaylist(event);
      return addCorsHeaders(response);
    }

    if (event.path.match(/\/api\/playlists\/\d+\/movies$/) && event.httpMethod === 'POST') {
      response = await addMovieToPlaylist(event);
      return addCorsHeaders(response);
    }

    if (event.path.match(/\/api\/playlists\/\d+\/movies\/\d+$/) && event.httpMethod === 'DELETE') {
      response = await removeMovieFromPlaylist(event);
      return addCorsHeaders(response);
    }

    // Not found response
    return addCorsHeaders({ statusCode: 404, body: 'Not Found' });
  } catch (error) {
    // Error response
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error })
    });
  }
};
