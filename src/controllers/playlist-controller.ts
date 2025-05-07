import { APIGatewayEvent } from 'aws-lambda';
import { PlaylistService } from '../services/playlist-service';

const playlistService = new PlaylistService();

export const createPlaylist = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const playlistData = JSON.parse(event.body || '{}');
        
        if (!playlistData.Title) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Title is required' })
            };
        }
        
        const playlist = await playlistService.createPlaylist(playlistData, userId);
        
        return {
            statusCode: 201,
            body: JSON.stringify(playlist)
        };
    } catch (error:any) {
        console.error('Error creating playlist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating playlist', error: error.message })
        };
    }
};

export const getUserPlaylists = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const playlists = await playlistService.getUserPlaylists(userId);
        
        return {
            statusCode: 200,
            body: JSON.stringify(playlists)
        };
    } catch (error:any) {
        console.error('Error getting playlists:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error getting playlists', error: error.message })
        };
    }
};

export const deletePlaylist = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const id = Number(event.pathParameters?.id);
        if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Playlist ID is required' }) };
        
        try {
            const success = await playlistService.deletePlaylist(id, userId);
            
            if (success) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Playlist deleted successfully' })
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Playlist not found' })
                };
            }
        } catch (error:any) {
            if (error.message === 'Not authorized to delete this playlist') {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ message: error.message })
                };
            }
            throw error;
        }
    } catch (error:any) {
        console.error('Error deleting playlist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting playlist', error: error.message })
        };
    }
};

export const addMovieToPlaylist = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const id = Number(event.pathParameters?.id);
        if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Playlist ID is required' }) };
        
        const { movieId } = JSON.parse(event.body || '{}');
        if (!movieId) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Movie ID is required' }) 
            };
        }
        
        try {
            const updatedPlaylist = await playlistService.addMovieToPlaylist(id, userId, movieId);
            
            if (updatedPlaylist) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(updatedPlaylist)
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Playlist not found' })
                };
            }
        } catch (error:any) {
            if (error.message === 'Not authorized to update this playlist') {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ message: error.message })
                };
            }
            throw error;
        }
    } catch (error:any) {
        console.error('Error adding movie to playlist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error adding movie to playlist', error: error.message })
        };
    }
};

export const removeMovieFromPlaylist = async (event: APIGatewayEvent) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
        
        const id = Number(event.pathParameters?.id);
        if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Playlist ID is required' }) };
        
        const movieId = Number(event.pathParameters?.movieId);
        if (!movieId) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ message: 'Movie ID is required' }) 
            };
        }
        
        try {
            const updatedPlaylist = await playlistService.removeMovieFromPlaylist(id, userId, movieId);
            
            if (updatedPlaylist) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(updatedPlaylist)
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Playlist not found' })
                };
            }
        } catch (error:any) {
            if (error.message === 'Not authorized to update this playlist') {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ message: error.message })
                };
            }
            throw error;
        }
    } catch (error:any) {
        console.error('Error removing movie from playlist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error removing movie from playlist', error: error.message })
        };
    }
};
