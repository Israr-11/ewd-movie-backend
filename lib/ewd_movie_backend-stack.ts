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
        USER_POOL_CLIENT_ID: authStack.userPoolClient.userPoolClientId
      },
    });

    dbStack.movieReviewsTable.grantReadWriteData(apiLambda);
    dbStack.translationsTable.grantReadWriteData(apiLambda);
    apiLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'translate:TranslateText',
        'comprehend:DetectDominantLanguage'
      ],
      resources: ['*']
    }));

    const api = new apigateway.RestApi(this, 'MovieReviewAPI', {
      restApiName: 'MovieReviewAPI',
    });

    //



    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'MovieReviewAuthorizer', {
      cognitoUserPools: [authStack.userPool]
    });

    const reviewModel = new apigateway.Model(this, 'ReviewModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'ReviewModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['review', 'email'],
        properties: {
          review: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 1000
          },
          email: {
            type: apigateway.JsonSchemaType.STRING,
            format: 'email'
          }
        }
      }
    });

    const getReviewsIntegration = new apigateway.LambdaIntegration(apiLambda);

    const moviesResource = api.root.addResource('movies');
    const movieReviewsResource = moviesResource.addResource('reviews');
    const movieIdResource = movieReviewsResource.addResource('{movieId}');

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


    // Add auth endpoints
    const authResource = api.root.addResource('auth');
    const registerResource = authResource.addResource('register');
    const loginResource = authResource.addResource('login');
    const logoutResource = authResource.addResource('logout');

    registerResource.addMethod('POST', getReviewsIntegration);
    loginResource.addMethod('POST', getReviewsIntegration);
    logoutResource.addMethod('POST', getReviewsIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });


    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }

}
