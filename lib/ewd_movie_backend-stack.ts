import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { DbStack } from './db-stack';
import { AuthStack, AuthStackProps } from './auth-stack';

export class EwdMovieBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dbStack = new DbStack(this, 'DbStack');
    const authStack = new AuthStack(this, 'AuthStack', {
      env: props?.env
    });

    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')),
      environment: {
        REVIEWS_TABLE: dbStack.movieReviewsTable.tableName,
        TRANSLATIONS_TABLE: dbStack.translationsTable.tableName,
        USER_POOL_ID: authStack.userPool.userPoolId,
        USER_POOL_CLIENT_ID: authStack.userPoolClient.userPoolClientId,
        UPLOADS_BUCKET_NAME: dbStack.uploadsBucket.bucketName,
        FANTASY_MOVIES_TABLE: dbStack.fantasyMoviesTable.tableName,
        FAVORITES_TABLE: dbStack.favoritesTable.tableName,
        PLAYLISTS_TABLE: dbStack.playlistsTable.tableName,
      },
    });

    dbStack.movieReviewsTable.grantReadWriteData(apiLambda);
    dbStack.translationsTable.grantReadWriteData(apiLambda);
    dbStack.favoritesTable.grantReadWriteData(apiLambda);
    dbStack.fantasyMoviesTable.grantReadWriteData(apiLambda);
    dbStack.uploadsBucket.grantReadWrite(apiLambda);
    dbStack.playlistsTable.grantReadWriteData(apiLambda);

    apiLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'translate:TranslateText',
        'comprehend:DetectDominantLanguage',
        'cognito-idp:InitiateAuth',
        'cognito-idp:SignUp',
        'cognito-idp:GlobalSignOut'
      ],
      resources: ['*']
    }));

    const api = new apigateway.RestApi(this, 'MovieReviewAPI', {
      restApiName: 'MovieReviewAPI',
      // Add CORS configuration here
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
        allowCredentials: true
      }
    });



    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'MovieReviewAuthorizer', {
      cognitoUserPools: [authStack.userPool]
    });

    const reviewModel = new apigateway.Model(this, 'ReviewModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'ReviewModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['review'],
        properties: {
          review: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 1000
          }
        }
      }
    });


    const authModel = new apigateway.Model(this, 'AuthModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'AuthModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['email', 'password'],
        properties: {
          email: {
            type: apigateway.JsonSchemaType.STRING,
            format: 'email'
          },
          password: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 8
          }
        }
      }
    });

    const getReviewsIntegration = new apigateway.LambdaIntegration(apiLambda);
    const moviesResource = api.root.addResource('movies');
    const movieReviewsResource = moviesResource.addResource('reviews');
    const movieIdResource = movieReviewsResource.addResource('{movieId}');
    //API Gateway resources for the favourites
    const apiResource = api.root.addResource('api');
    const favoritesResource = apiResource.addResource('favorites');
    const favIdResource = favoritesResource.addResource('{movieId}');
    const reorderResource = favoritesResource.addResource('reorder');
    //API Gateway resources for the fantasy movies
    const fantasyMoviesResource = api.root.addResource('api').addResource('fantasy-movies');
    const fantasyMovieIdResource = fantasyMoviesResource.addResource('{id}');
    const castResource = fantasyMovieIdResource.addResource('cast');
    //API Gateway resources for the uploads bucket
    const uploadsResource = api.root.addResource('api').addResource('uploads');
    const presignedUrlResource = uploadsResource.addResource('presigned-url');
    //API Gateway resources for the playlists
    const playlistsResource = api.root.addResource('api').addResource('playlists');
    const playlistIdResource = playlistsResource.addResource('{id}');
    const playlistMoviesResource = playlistIdResource.addResource('movies');
    const playlistMovieIdResource = playlistMoviesResource.addResource('{movieId}');


    // GET /movies/reviews/[movieId]
    movieIdResource.addMethod('GET', getReviewsIntegration);

    // POST /movies/reviews
    movieReviewsResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestValidator: new apigateway.RequestValidator(this, 'ReviewValidator', {
        restApi: api,
        validateRequestBody: true
      }),
      requestModels: {
        'application/json': reviewModel
      }
    });

    // PUT /movies/{movieId}/reviews/{reviewId}
    const movieResource = moviesResource.addResource('{movieId}');
    const reviewsResource = movieResource.addResource('reviews');
    const reviewIdResource = reviewsResource.addResource('{reviewId}');
    reviewIdResource.addMethod('PUT', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // GET /reviews/{reviewId}/{movieId}/translation
    const directReviewsResource = api.root.addResource('reviews');
    const translationPath = directReviewsResource
      .addResource('{reviewId}')
      .addResource('{movieId}')
      .addResource('translation');

    translationPath.addMethod('GET', getReviewsIntegration, {
      requestValidator: new apigateway.RequestValidator(this, 'TranslationValidator', {
        restApi: api,
        validateRequestParameters: true
      })
    });



    //Favorites endpoints

    // POST /api/favorites - Add a movie to favorites
    favoritesResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // GET /api/favorites - Get user's favorite movies
    favoritesResource.addMethod('GET', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // DELETE /api/favorites/{movieId} - Remove a movie from favorites
    favIdResource.addMethod('DELETE', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // PUT /api/favorites/reorder - Reorder favorites
    reorderResource.addMethod('PUT', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });


    //Fantasy Movies endpoints

    // POST /api/fantasy-movies - Create a fantasy movie
    fantasyMoviesResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // GET /api/fantasy-movies - Get user's fantasy movies
    fantasyMoviesResource.addMethod('GET', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // DELETE /api/fantasy-movies/{id} - Delete a fantasy movie
    fantasyMovieIdResource.addMethod('DELETE', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // POST /api/fantasy-movies/{id}/cast - Add cast member to fantasy movie
    castResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // POST /api/uploads/presigned-url - Get a presigned URL for uploading
    presignedUrlResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });


    // Playlists endpoints
    // POST /api/playlists - Create a movie playlist
    playlistsResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // GET /api/playlists - Get user's playlists
    playlistsResource.addMethod('GET', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // DELETE /api/playlists/{id} - Delete a playlist
    playlistIdResource.addMethod('DELETE', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // POST /api/playlists/{id}/movies - Add movie to playlist
    playlistMoviesResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // DELETE /api/playlists/{id}/movies/{movieId} - Remove movie from playlist
    playlistMovieIdResource.addMethod('DELETE', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });


    // Auth endpoints
    const authResource = api.root.addResource('auth');
    const registerResource = authResource.addResource('register');
    const loginResource = authResource.addResource('login');
    const logoutResource = authResource.addResource('logout');

    registerResource.addMethod('POST', getReviewsIntegration, {
      requestValidator: new apigateway.RequestValidator(this, 'RegisterValidator', {
        restApi: api,
        validateRequestBody: true
      }),
      requestModels: {
        'application/json': authModel
      }
    });

    loginResource.addMethod('POST', getReviewsIntegration, {
      requestValidator: new apigateway.RequestValidator(this, 'LoginValidator', {
        restApi: api,
        validateRequestBody: true
      }),
      requestModels: {
        'application/json': authModel
      }
    });

    logoutResource.addMethod('POST', getReviewsIntegration);

    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }

}
