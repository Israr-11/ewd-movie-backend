import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Review } from '../models/review-model';


export class ReviewService {
    private docClient: DynamoDBDocumentClient;
    private dbClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        this.dbClient = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(this.dbClient, {
            marshallOptions: {
                convertEmptyValues: true,
                removeUndefinedValues: true,
                convertClassInstanceToMap: true
            },
            unmarshallOptions: {
                wrapNumbers: false
            }
        });
        this.tableName = process.env.REVIEWS_TABLE || 'MovieReviews';
    }

    async getReview(movieId: number, reviewId: number): Promise<Review | null> {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'MovieId = :movieId AND ReviewId = :reviewId',
            ExpressionAttributeValues: {
                ':movieId': movieId,
                ':reviewId': reviewId
            }
        });

        const result = await this.docClient.send(command);
        const items = result.Items as Review[];
        return items && items.length > 0 ? items[0] : null;
    }

    private async getNextId(): Promise<number> {
        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: {
                Id: 0,
                ReviewId: 0
            },
            UpdateExpression: 'SET #counter = if_not_exists(#counter, :start) + :increment',
            ExpressionAttributeNames: {
                '#counter': 'Counter'
            },
            ExpressionAttributeValues: {
                ':start': 1,
                ':increment': 1
            },
            ReturnValues: 'UPDATED_NEW'
        });

        const result = await this.docClient.send(command);
        return result.Attributes?.Counter;
    }


    async getAllReviews(): Promise<Review[]> {
        try {
            const command = new ScanCommand({
                TableName: this.tableName
            });

            const result = await this.dbClient.send(command);

            if (result.Items && result.Items.length > 0) {
                return result.Items.map(item => ({
                    MovieId: Number(item.MovieId?.N || 0),
                    ReviewId: Number(item.ReviewId?.N || 0),
                    Content: item.Content?.S || '',
                    ReviewDate: item.ReviewDate?.S || new Date().toISOString().split('T')[0],
                    Rating: Number(item.Rating?.N || 0),
                    UserId: item.UserId?.S || '',
                    ReviewerEmail: item.ReviewerEmail?.S || ''
                }));
            }

            return [];
        } catch (error) {
            console.error('Error in getAllReviews:', error);
            return [];
        }
    }



    async getReviewsByMovieId(movieId: number): Promise<Review[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'MovieId = :movieId',
            ExpressionAttributeValues: { ':movieId': movieId }
        });

        const result = await this.docClient.send(command);
        return result.Items as Review[] || [];
    }

    async getReviewsByUserId(userId: string): Promise<Review[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'UserId = :userId',
            ExpressionAttributeValues: { ':userId': userId }
        });

        const result = await this.docClient.send(command);
        return result.Items as Review[] || [];
    }

    async addReview(review: string, userEmail: string, userId: string, rating: number, movieId: number): Promise<Review> {
        const now = new Date();

        const newReview: Review = {
            MovieId: movieId,
            ReviewId: Math.floor(now.getTime() / 1000),
            ReviewerEmail: userEmail,
            UserId: userId,
            Rating: rating,
            Content: review,
            ReviewDate: now.toISOString().split('T')[0]
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: newReview
        });

        await this.docClient.send(command);
        return newReview;
    }

    async updateReview(movieId: number, reviewId: number, newContent: string) {
        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { MovieId: movieId, ReviewId: reviewId },
            UpdateExpression: 'SET Content = :newContent',
            ExpressionAttributeValues: { ':newContent': newContent },
            ReturnValues: 'UPDATED_NEW'
        });

        const result = await this.docClient.send(command);
        return result.Attributes;
    }
}
