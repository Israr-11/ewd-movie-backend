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

    const authStack = new AuthStack(this, 'AuthStack');
    const dbStack = new DbStack(this, 'DbStack');

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

    dbStack.movieReviewsTable.grantReadWriteData(apiLambda);

    const api = new apigateway.RestApi(this, 'MovieReviewAPI', {
      restApiName: 'MovieReviewAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    const getReviewsIntegration = new apigateway.LambdaIntegration(apiLambda);

    // Clear route structure
    const moviesResource = api.root.addResource('movies');
    const reviewsResource = moviesResource.addResource('reviews');
    
    // POST /movies/reviews
    reviewsResource.addMethod('POST', getReviewsIntegration);

    // GET /movies/reviews/{movieId}
    const movieIdResource = reviewsResource.addResource('{movieId}');
    movieIdResource.addMethod('GET', getReviewsIntegration);

    // PUT /movies/reviews/{movieId}/{reviewId}
    const reviewIdResource = movieIdResource.addResource('{reviewId}');
    reviewIdResource.addMethod('PUT', getReviewsIntegration);

    // Translation endpoint
    const translationResource = reviewIdResource.addResource('translation');
    translationResource.addMethod('GET', getReviewsIntegration);

    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }
}
