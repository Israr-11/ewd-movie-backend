import { APIGatewayEvent } from 'aws-lambda';
import { ReviewService } from '../services/review-service';
import { TranslateService } from '../services/translate-service';

const reviewService = new ReviewService();

export const getMovieReviews = async (event: APIGatewayEvent) => {
    const movieId = Number(event.pathParameters?.movieId);
    const reviewId = event.queryStringParameters?.reviewId ? 
                    Number(event.queryStringParameters.reviewId) : undefined;
    const reviewerEmail = event.queryStringParameters?.reviewerName;

    if (!movieId) return { statusCode: 400, body: 'Movie ID is required' };

    const reviews = await reviewService.getReviewsByMovieId(movieId);
    
    let filteredReviews = reviews;
    if (reviewId) {
        filteredReviews = reviews.filter(r => r.ReviewId === reviewId);
    }
    if (reviewerEmail) {
        filteredReviews = reviews.filter(r => r.ReviewerId === reviewerEmail);
    }

    return { statusCode: 200, body: JSON.stringify(filteredReviews) };
};

export const addReview = async (event: APIGatewayEvent) => {
    
    const { review, email } = JSON.parse(event.body || '{}');
    if (!review || !email) return { statusCode: 400, body: 'Missing required fields' };

    const newReview = await reviewService.addReview(review, email);
    return { statusCode: 201, body: JSON.stringify(newReview) };
};

export const updateReview = async (event: APIGatewayEvent) => {
    const movieId = Number(event.pathParameters?.movieId);
    const reviewId = Number(event.pathParameters?.reviewId);
    const { newContent } = JSON.parse(event.body || '{}');
    if (!movieId || !reviewId || !newContent) return { statusCode: 400, body: 'Missing fields' };

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

