import { APIGatewayEvent } from 'aws-lambda';
import { FavoriteService } from '../services/favorite-service';

const favoriteService = new FavoriteService();

export const addFavorite = async (event: APIGatewayEvent) => {
    // Get user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return { statusCode: 401, body: 'Unauthorized' };
    
    const { movieId } = JSON.parse(event.body || '{}');
    if (!movieId) return { statusCode: 400, body: JSON.stringify({ message: 'MovieId is required' }) };
    
    try {
        const favorite = await favoriteService.addFavorite(userId, Number(movieId));
        return { statusCode: 201, body: JSON.stringify(favorite) };
    } catch (error:any) {
        if (error.message === 'Movie already in favorites') {
            return { statusCode: 409, body: JSON.stringify({ message: error.message }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: 'Error adding favorite', error }) };
    }
};

export const removeFavorite = async (event: APIGatewayEvent) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return { statusCode: 401, body: 'Unauthorized' };
    
    const movieId = event.pathParameters?.movieId;
    if (!movieId) return { statusCode: 400, body: JSON.stringify({ message: 'MovieId is required' }) };
    
    try {
        await favoriteService.removeFavorite(userId, Number(movieId));
        return { statusCode: 200, body: JSON.stringify({ message: 'Favorite removed successfully' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Error removing favorite', error }) };
    }
};

export const getUserFavorites = async (event: APIGatewayEvent) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return { statusCode: 401, body: 'Unauthorized' };
    
    try {
        const favorites = await favoriteService.getUserFavorites(userId);
        return { statusCode: 200, body: JSON.stringify(favorites) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Error getting favorites', error }) };
    }
};

export const reorderFavorites = async (event: APIGatewayEvent) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return { statusCode: 401, body: 'Unauthorized' };
    
    const { newOrder } = JSON.parse(event.body || '{}');
    if (!newOrder || !Array.isArray(newOrder)) {
        return { statusCode: 400, body: JSON.stringify({ message: 'newOrder array is required' }) };
    }
    
    try {
        const favorites = await favoriteService.reorderFavorites(userId, newOrder);
        return { statusCode: 200, body: JSON.stringify(favorites) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Error reordering favorites', error }) };
    }
};
