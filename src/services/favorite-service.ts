import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { Favorite } from '../models/favorite-model';

export class FavoriteService {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.FAVORITES_TABLE || 'UserFavorites';
    }

    async addFavorite(userId: string, movieId: number): Promise<Favorite> {
        const currentFavorites = await this.getUserFavorites(userId);
        const maxOrder = currentFavorites.length > 0
            ? Math.max(...currentFavorites.map(f => f.Order))
            : 0;

        const now = new Date();
        const favorite: Favorite = {
            UserId: userId,
            MovieId: movieId,
            AddedDate: now.toISOString().split('T')[0],
            Order: maxOrder + 1
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: favorite,
            ConditionExpression: 'attribute_not_exists(UserId) OR attribute_not_exists(MovieId)'
        });

        try {
            await this.docClient.send(command);
            return favorite;
        } catch (error: any) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw new Error('Movie already in favorites');
            }
            throw error;
        }
    }
    async removeFavorite(userId: string, movieId: number): Promise<void> {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: {
                UserId: userId,
                MovieId: Number(movieId)
            }
        });

        await this.docClient.send(command);

        await this.reorderFavorites(userId);
    }

    async getUserFavorites(userId: string): Promise<Favorite[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: { ':userId': userId }
        });

        const result = await this.docClient.send(command);
        const favorites = result.Items as Favorite[] || [];

        return favorites.sort((a, b) => a.Order - b.Order);
    }

    async reorderFavorites(userId: string, newOrder?: { movieId: number, order: number }[]): Promise<Favorite[]> {
        const favorites = await this.getUserFavorites(userId);

        if (newOrder) {
            const updates = [];

            for (const item of newOrder) {
                const favorite = favorites.find(f => f.MovieId === item.movieId);
                if (favorite) {
                    updates.push({
                        PutRequest: {
                            Item: {
                                ...favorite,
                                Order: item.order
                            }
                        }
                    });
                }
            }

            if (updates.length > 0) {
                const command = new BatchWriteCommand({
                    RequestItems: {
                        [this.tableName]: updates
                    }
                });

                await this.docClient.send(command);
            }
        } else {
            const updates = favorites.map((fav, index) => ({
                PutRequest: {
                    Item: {
                        ...fav,
                        Order: index + 1
                    }
                }
            }));

            if (updates.length > 0) {
                const command = new BatchWriteCommand({
                    RequestItems: {
                        [this.tableName]: updates
                    }
                });

                await this.docClient.send(command);
            }
        }

        return this.getUserFavorites(userId);
    }
}
