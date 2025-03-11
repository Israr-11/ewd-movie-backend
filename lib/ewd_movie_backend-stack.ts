// /lib/ewd_movie_backend-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { AuthStack } from './auth-stack';
import { DbStack } from './db-stack';

export class EwdMovieBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Initialize Auth and Database Stacks
    const authStack = new AuthStack(this, 'AuthStack');
    const dbStack = new DbStack(this, 'DbStack');

    // Create the Lambda Function
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      environment: {
        TABLE_NAME: dbStack.movieReviewsTable.tableName,
        USER_POOL_ID: authStack.userPool.userPoolId,
        CLIENT_ID: authStack.userPoolClient.userPoolClientId,
      },
    });

    // Grant Lambda Permissions to Access DynamoDB
    dbStack.movieReviewsTable.grantReadWriteData(apiLambda);

    // Create API Gateway Authorizer for Cognito
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'MovieReviewAPIAuthorizer', {
      cognitoUserPools: [authStack.userPool],
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'MovieReviewAPI', {
      restApiName: 'MovieReviewAPI',
    });

    // Define API Resources

    // /movies
    const moviesResource = api.root.addResource('movies');

    // /movies/{movieId}
    const movieResource = moviesResource.addResource('{movieId}');

    // /movies/{movieId}/reviews
    const movieReviewsResource = movieResource.addResource('reviews');

    // /movies/{movieId}/reviews/{reviewId}
    const reviewResource = movieReviewsResource.addResource('{reviewId}');

    // /reviews
    const reviewsResource = api.root.addResource('reviews');

    // /reviews/{reviewId}/{movieId}/translation
    const translationResource = reviewsResource
      .addResource('{reviewId}')
      .addResource('{movieId}')
      .addResource('translation');

    // Define API Methods

    // GET /movies/{movieId}/reviews - Get all reviews for a movie (Public)
    const getReviewsIntegration = new apigateway.LambdaIntegration(apiLambda);
    movieReviewsResource.addMethod('GET', getReviewsIntegration);

    // POST /movies/reviews - Add a movie review (Requires Authentication)
    reviewsResource.addMethod('POST', getReviewsIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // PUT /movies/{movieId}/reviews/{reviewId} - Update a review (Requires Authentication)
    reviewResource.addMethod('PUT', getReviewsIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /reviews/{reviewId}/{movieId}/translation?language=code - Get translated review
    translationResource.addMethod('GET', getReviewsIntegration);

    // Output API Endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }
}
