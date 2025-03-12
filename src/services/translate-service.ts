import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Review } from '../models/review-model';

export class TranslateService {
    private translateClient: TranslateClient;
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.translateClient = new TranslateClient({});
        this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
        this.tableName = process.env.TABLE_NAME || 'MovieReviews';
    }

    private async getCachedTranslation(reviewId: number, language: string) {
        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'TranslationsIndex',
            KeyConditionExpression: 'ReviewId = :reviewId AND Language = :language',
            ExpressionAttributeValues: {
                ':reviewId': reviewId,
                ':language': language
            }
        });
        const result = await this.docClient.send(command);
        return result.Items?.[0]?.TranslatedContent;
    }

    private async getReview(movieId: number, reviewId: number): Promise<Review | null> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                MovieId: movieId,
                ReviewId: reviewId
            }
        });
        const result = await this.docClient.send(command);
        return result.Item as Review || null;
    }

    async getTranslation(reviewId: number, movieId: number, targetLanguage: string) {
        if (!targetLanguage) {
            throw new Error('Target language is required');
        }

        const cachedTranslation = await this.getCachedTranslation(reviewId, targetLanguage);
        if (cachedTranslation) return cachedTranslation;

        const review = await this.getReview(movieId, reviewId);
        if (!review) return null;

        const translated = await this.translateText(review.Content, targetLanguage);
        await this.cacheTranslation(reviewId, movieId, targetLanguage, translated);

        return translated;
    }

    private async translateText(text: string, targetLanguage: string) {
        const command = new TranslateTextCommand({
            Text: text,
            SourceLanguageCode: 'auto',
            TargetLanguageCode: targetLanguage
        });
        const response = await this.translateClient.send(command);
        return response.TranslatedText || '';
    }

    private async cacheTranslation(reviewId: number, movieId: number, language: string, translation: string) {
        await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: {
                ReviewId: reviewId,
                MovieId: movieId,
                Language: language,
                TranslatedContent: translation
            }
        }));
    }
}
