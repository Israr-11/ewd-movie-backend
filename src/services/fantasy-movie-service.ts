import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { FantasyMovie, CastMember } from '../models/fantasy-movie-model';

export class FantasyMovieService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.FANTASY_MOVIES_TABLE || 'FantasyMovies';
    }

    async createFantasyMovie(movieData: Omit<FantasyMovie, 'Id' | 'CreatedDate'>, userId: string): Promise<FantasyMovie> {
        const now = new Date();
        
        const fantasyMovie: FantasyMovie = {
            Id: Math.floor(now.getTime() / 1000),
            UserId: userId,
            Title: movieData.Title,
            Overview: movieData.Overview,
            Genres: movieData.Genres || [],
            ReleaseDate: movieData.ReleaseDate,
            Runtime: movieData.Runtime,
            ProductionCompanies: movieData.ProductionCompanies || [],
            PosterUrl: movieData.PosterUrl || '',
            Cast: movieData.Cast || [],
            CreatedDate: now.toISOString().split('T')[0]
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: fantasyMovie
        });

        await this.docClient.send(command);
        return fantasyMovie;
    }

    async getUserFantasyMovies(userId: string): Promise<FantasyMovie[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'UserIdIndex', // You'll need to create this GSI
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: { ':userId': userId }
        });

        const result = await this.docClient.send(command);
        return result.Items as FantasyMovie[] || [];
    }

    async getFantasyMovieById(id: number): Promise<FantasyMovie | null> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { Id: id }
        });

        const result = await this.docClient.send(command);
        return result.Item as FantasyMovie || null;
    }

    async deleteFantasyMovie(id: number, userId: string): Promise<boolean> {
        // First verify the movie belongs to the user
        const movie = await this.getFantasyMovieById(id);
        
        if (!movie) {
            return false;
        }
        
        if (movie.UserId !== userId) {
            throw new Error('Not authorized to delete this fantasy movie');
        }
        
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: { Id: id }
        });

        await this.docClient.send(command);
        return true;
    }

    async addCastMember(id: number, userId: string, castMember: CastMember): Promise<FantasyMovie | null> {
        // First verify the movie belongs to the user
        const movie = await this.getFantasyMovieById(id);
        
        if (!movie) {
            return null;
        }
        
        if (movie.UserId !== userId) {
            throw new Error('Not authorized to update this fantasy movie');
        }
        
        const updatedCast = [...movie.Cast, castMember];
        
        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { Id: id },
            UpdateExpression: 'SET #castAttr = :cast',
            ExpressionAttributeNames: { '#castAttr': 'Cast' },
            ExpressionAttributeValues: { ':cast': updatedCast },
            ReturnValues: 'ALL_NEW'
        });
        
        const result = await this.docClient.send(command);
        return result.Attributes as FantasyMovie;
    }
}
