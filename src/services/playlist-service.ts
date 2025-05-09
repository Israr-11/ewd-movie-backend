import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Playlist, PlaylistMovie } from '../models/playlist-model';

export class PlaylistService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.PLAYLISTS_TABLE || 'Playlists';
    }

    async createPlaylist(playlistData: Omit<Playlist, 'Id' | 'CreatedDate' | 'UpdatedDate' | 'Movies'>, userId: string): Promise<Playlist> {
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0];

        const playlist: Playlist = {
            Id: Math.floor(now.getTime() / 1000),
            UserId: userId,
            Title: playlistData.Title,
            Description: playlistData.Description || '',
            Movies: [],
            CreatedDate: timestamp,
            UpdatedDate: timestamp
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: playlist
        });

        await this.docClient.send(command);
        return playlist;
    }

    async getUserPlaylists(userId: string): Promise<Playlist[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: { ':userId': userId }
        });

        const result = await this.docClient.send(command);
        return result.Items as Playlist[] || [];
    }

    async getPlaylistById(id: number): Promise<Playlist | null> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { Id: id }
        });

        const result = await this.docClient.send(command);
        return result.Item as Playlist || null;
    }

    async deletePlaylist(id: number, userId: string): Promise<boolean> {
        const playlist = await this.getPlaylistById(id);

        if (!playlist) {
            return false;
        }

        if (playlist.UserId !== userId) {
            throw new Error('Not authorized to delete this playlist');
        }

        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { Id: id }
        });

        await this.docClient.send(command);
        return true;
    }

    async addMovieToPlaylist(id: number, userId: string, movieId: number): Promise<Playlist | null> {
        const playlist = await this.getPlaylistById(id);

        if (!playlist) {
            return null;
        }

        if (playlist.UserId !== userId) {
            throw new Error('Not authorized to update this playlist');
        }

        const existingMovie = playlist.Movies.find(m => m.MovieId === movieId);
        if (existingMovie) {
            return playlist;
        }

        const now = new Date();
        const timestamp = now.toISOString().split('T')[0];

        const maxOrder = playlist.Movies.length > 0
            ? Math.max(...playlist.Movies.map(m => m.Order))
            : 0;

        const newMovie: PlaylistMovie = {
            MovieId: movieId,
            AddedDate: timestamp,
            Order: maxOrder + 1
        };

        const updatedMovies = [...playlist.Movies, newMovie];

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { Id: id },
            UpdateExpression: 'SET Movies = :movies, UpdatedDate = :updatedDate',
            ExpressionAttributeValues: {
                ':movies': updatedMovies,
                ':updatedDate': timestamp
            },
            ReturnValues: 'ALL_NEW'
        });

        const result = await this.docClient.send(command);
        return result.Attributes as Playlist;
    }

    async removeMovieFromPlaylist(id: number, userId: string, movieId: number): Promise<Playlist | null> {
        const playlist = await this.getPlaylistById(id);

        if (!playlist) {
            return null;
        }

        if (playlist.UserId !== userId) {
            throw new Error('Not authorized to update this playlist');
        }

        const updatedMovies = playlist.Movies.filter(m => m.MovieId !== movieId);

        if (updatedMovies.length === playlist.Movies.length) {
            return playlist;
        }

        const now = new Date();
        const timestamp = now.toISOString().split('T')[0];

        const reorderedMovies = updatedMovies.map((movie, index) => ({
            ...movie,
            Order: index + 1
        }));

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { Id: id },
            UpdateExpression: 'SET Movies = :movies, UpdatedDate = :updatedDate',
            ExpressionAttributeValues: {
                ':movies': reorderedMovies,
                ':updatedDate': timestamp
            },
            ReturnValues: 'ALL_NEW'
        });

        const result = await this.docClient.send(command);
        return result.Attributes as Playlist;
    }
}
