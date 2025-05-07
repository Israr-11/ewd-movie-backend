import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Review } from '../models/review-model';


export class ReviewService {
    getReview(movieId: number, reviewId: number) {
        throw new Error('Method not implemented.');
    }
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.TABLE_NAME || 'MovieReviews';
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


    async getReviewsByMovieId(movieId: number): Promise<Review[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'MovieId = :movieId',
            ExpressionAttributeValues: { ':movieId': movieId }
        });

        const result = await this.docClient.send(command);
        return result.Items as Review[] || [];
    }

    async addReview(review: string, userEmail: string, userId:string, rating:number, movieId:number): Promise<Review> {

        //const id = await this.getNextId();
        const now = new Date();

        const newReview: Review = {
            // Id:id,
            MovieId: movieId,
            ReviewId: Math.floor(now.getTime() / 1000),
            ReviewerEmail: userEmail,
            UserId:userId,
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
