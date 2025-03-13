import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Review } from '../models/review-model';

export class TranslateService {
    private translateClient: TranslateClient;
    private docClient: DynamoDBDocumentClient;
    private reviewsTable: string;
    private translationsTable: string;

    constructor() {
        this.translateClient = new TranslateClient({});
        this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
        this.reviewsTable = process.env.REVIEWS_TABLE || 'MovieReviews';
        this.translationsTable = process.env.TRANSLATIONS_TABLE || 'ReviewTranslations';
    }

    private async getCachedTranslation(reviewId: number, movieId: number, language: string) {
        const command = new GetCommand({
            TableName: this.translationsTable,
            Key: {
                ReviewId: reviewId,
                Language: language
            }
        });
        const result = await this.docClient.send(command);
        return result.Item?.TranslatedContent;
    }

    private async getReview(movieId: number, reviewId: number): Promise<Review | null> {
        const command = new GetCommand({
            TableName: this.reviewsTable,
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

        // Check translation cache first
        const cachedTranslation = await this.getCachedTranslation(reviewId, movieId, targetLanguage);
        if (cachedTranslation) {
            return {
                reviewId,
                movieId,
                language: targetLanguage,
                content: cachedTranslation
            };
        }

        // Get original review if no cached translation
        const review = await this.getReview(movieId, reviewId);
        if (!review) return null;

        // Translate and cache
        const translated = await this.translateText(review.Content, targetLanguage);
        await this.cacheTranslation(reviewId, movieId, targetLanguage, translated);

        return {
            reviewId,
            movieId,
            language: targetLanguage,
            content: translated
        };
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
            TableName: this.translationsTable,
            Item: {
                ReviewId: reviewId,
                MovieId: movieId,
                Language: language,
                TranslatedContent: translation,
                CreatedAt: new Date().toISOString()
            }
        }));
    }
}
