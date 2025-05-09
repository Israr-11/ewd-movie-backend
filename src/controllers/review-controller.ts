import { APIGatewayEvent } from 'aws-lambda';
import { ReviewService } from '../services/review-service';
import { TranslateService } from '../services/translate-service';

const reviewService = new ReviewService();

export const getMovieReviews = async (event: APIGatewayEvent) => {
    const userId = event.pathParameters?.userId;

    if (!userId) {
        const allReviews = await reviewService.getAllReviews();
        return { statusCode: 200, body: JSON.stringify(allReviews) };
    }

    const reviews = await reviewService.getReviewsByUserId(userId);
    return { statusCode: 200, body: JSON.stringify(reviews) };
};



export const addReview = async (event: APIGatewayEvent) => {
    const userEmail = event.requestContext.authorizer?.claims?.email;
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userEmail || !userId) return { statusCode: 401, body: 'Unauthorized' };
    const { review, movieId, rating } = JSON.parse(event.body || '{}');
    if (!review) return { statusCode: 400, body: 'Missing required fields' };

    const newReview = await reviewService.addReview(review, userEmail, userId, rating, movieId);
    return { statusCode: 201, body: JSON.stringify(newReview) };
};

export const updateReview = async (event: APIGatewayEvent) => {
    const movieId = Number(event.pathParameters?.movieId);
    const reviewId = Number(event.pathParameters?.reviewId);
    const { newContent } = JSON.parse(event.body || '{}');

    const userId = event.requestContext.authorizer?.claims?.sub;

    const reviews = await reviewService.getReviewsByMovieId(movieId);
    const review = reviews.find(r => r.ReviewId === reviewId);
    if (!review) {
        return { statusCode: 404, body: 'Review not found' };
    }

    if (review.UserId !== userId) {
        return { statusCode: 403, body: 'Not authorized to update this review' };
    }

    const updatedReview = await reviewService.updateReview(movieId, reviewId, newContent);
    return { statusCode: 200, body: JSON.stringify(updatedReview) };
};

export const getTranslation = async (event: APIGatewayEvent) => {
    const reviewId = Number(event.pathParameters?.reviewId);
    const movieId = Number(event.pathParameters?.movieId);
    const language = event.queryStringParameters?.language;

    if (!reviewId || !movieId || !language) {
        return { statusCode: 400, body: 'Missing required parameters' };
    }

    const translateService = new TranslateService();
    const translation = await translateService.getTranslation(reviewId, movieId, language);

    if (!translation) {
        return { statusCode: 404, body: 'Review not found' };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ translation })
    };
};

