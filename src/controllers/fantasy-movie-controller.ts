import { APIGatewayEvent } from 'aws-lambda';
import { FantasyMovieService } from '../services/fantasy-movie-service';

const fantasyMovieService = new FantasyMovieService();

export const createFantasyMovie = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        // Parse the request body
        const movieData = JSON.parse(event.body || '{}');
        
        // The PosterUrl should already be provided in the request
        // after the client has uploaded the image to S3 using the presigned URL
        
        const fantasyMovie = await fantasyMovieService.createFantasyMovie(movieData, userId);
        
        return {
            statusCode: 201,
            body: JSON.stringify(fantasyMovie)
        };
    } catch (error:any) {
        console.error('Error creating fantasy movie:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating fantasy movie', error: error.message })
        };
    }
};

export const getUserFantasyMovies = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const movies = await fantasyMovieService.getUserFantasyMovies(userId);
        
        return {
            statusCode: 200,
            body: JSON.stringify(movies)
        };
    } catch (error:any) {
        console.error('Error getting fantasy movies:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error getting fantasy movies', error: error.message })
        };
    }
};

export const deleteFantasyMovie = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const id = Number(event.pathParameters?.id);
        if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Movie ID is required' }) };
        
        try {
            const success = await fantasyMovieService.deleteFantasyMovie(id, userId);
            
            if (success) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Fantasy movie deleted successfully' })
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Fantasy movie not found' })
                };
            }
        } catch (error:any) {
            if (error.message === 'Not authorized to delete this fantasy movie') {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ message: error.message })
                };
            }
            throw error;
        }
    } catch (error:any) {
        console.error('Error deleting fantasy movie:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting fantasy movie', error: error.message })
        };
    }
};

export const addCastMember = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const id = Number(event.pathParameters?.id);
        if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Movie ID is required' }) };
        
        const castMember = JSON.parse(event.body || '{}');
        if (!castMember.Name || !castMember.Role) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Name and Role are required for cast members' }) 
            };
        }
        
        try {
            const updatedMovie = await fantasyMovieService.addCastMember(id, userId, castMember);
            
            if (updatedMovie) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(updatedMovie)
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Fantasy movie not found' })
                };
            }
        } catch (error:any) {
            if (error.message === 'Not authorized to update this fantasy movie') {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ message: error.message })
                };
            }
            throw error;
        }
    } catch (error:any) {
        console.error('Error adding cast member:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error adding cast member', error: error.message })
        };
    }
};
