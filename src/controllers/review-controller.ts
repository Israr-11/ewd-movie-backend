import { APIGatewayEvent } from 'aws-lambda';
import { ReviewService } from '../services/review-service';

const reviewService = new ReviewService();

export const getMovieReviews = async (event: APIGatewayEvent) => {
    const movieId = Number(event.pathParameters?.movieId);
    if (!movieId) return { statusCode: 400, body: 'Movie ID is required' };

    const reviews = await reviewService.getReviewsByMovieId(movieId);
    return { statusCode: 200, body: JSON.stringify(reviews) };
};

export const addReview = async (event: APIGatewayEvent) => {
    
    const { movieId, review, email } = JSON.parse(event.body || '{}');
    if (!movieId || !review || !email) return { statusCode: 400, body: 'Missing required fields' };

    const newReview = await reviewService.addReview(movieId, review, email);
    return { statusCode: 201, body: JSON.stringify(newReview) };
};

export const deleteReview = async (event: APIGatewayEvent) => {
    const movieId = Number(event.pathParameters?.movieId);
    const reviewId = event.pathParameters?.reviewId;
    if (!movieId || !reviewId) return { statusCode: 400, body: 'Missing parameters' };

    const response = await reviewService.deleteReview(movieId, reviewId);
    return { statusCode: 200, body: JSON.stringify(response) };
};

export const updateReview = async (event: APIGatewayEvent) => {
    const movieId = Number(event.pathParameters?.movieId);
    const reviewId = event.pathParameters?.reviewId;
    const { newContent } = JSON.parse(event.body || '{}');
    if (!movieId || !reviewId || !newContent) return { statusCode: 400, body: 'Missing fields' };

    const updatedReview = await reviewService.updateReview(movieId, reviewId, newContent);
    return { statusCode: 200, body: JSON.stringify(updatedReview) };
};
