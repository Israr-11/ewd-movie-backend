import { DynamoDB } from 'aws-sdk';
import { Review } from '../models/review-model';

export class ReviewService {
    private db: DynamoDB.DocumentClient;
    private tableName: string;

    constructor() {
        this.db = new DynamoDB.DocumentClient();
        this.tableName = process.env.TABLE_NAME || 'MovieReviews';
    }

    async getReviewsByMovieId(movieId: number): Promise<Review[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'MovieId = :movieId',
            ExpressionAttributeValues: { ':movieId': movieId }
        };

        const result = await this.db.query(params).promise();
        return result.Items as Review[] || [];
    }

    async addReview(movieId: number, review: string, email: string): Promise<Review> {
        const newReview: Review = {
            MovieId: movieId,
            ReviewId: Date.now().toString(),
            ReviewerId: email,
            Content: review,
            ReviewDate: new Date().toISOString()
        };

        const params = { TableName: this.tableName, Item: newReview };
        await this.db.put(params).promise();
        return newReview;
    }

    async deleteReview(movieId: number, reviewId: string) {
        const params = {
            TableName: this.tableName,
            Key: { MovieId: movieId, ReviewId: reviewId }
        };
        await this.db.delete(params).promise();
        return { message: 'Review deleted' };
    }

    async updateReview(movieId: number, reviewId: string, newContent: string) {
        const params = {
            TableName: this.tableName,
            Key: { MovieId: movieId, ReviewId: reviewId },
            UpdateExpression: 'SET Content = :newContent',
            ExpressionAttributeValues: { ':newContent': newContent },
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await this.db.update(params).promise();
        return result.Attributes;
    }
}
