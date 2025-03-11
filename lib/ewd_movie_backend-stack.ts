// Filename: /lib/ewd_movie_backend-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class EwdMovieBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CREATE THE LAMBDA FUNCTION FOR API REQUESTS
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X, // NODE.JS 20y
      //  RUNTIME
      handler: 'index.handler', // ENTRY POINT FUNCTION
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')), // SOURCE CODE DIRECTORY
      environment: {
        TABLE_NAME: 'MovieReviews', // DYNAMODB TABLE NAME
      },
    });

    // GRANT LAMBDA PERMISSIONS TO ACCESS DYNAMODB
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:*'],
        resources: ['*'], // RESTRICT THIS TO THE SPECIFIC TABLE LATER
      })
    );

    // SET UP API GATEWAY TO ROUTE REQUESTS TO LAMBDA
    new apigateway.LambdaRestApi(this, 'MovieReviewAPI', {
      handler: apiLambda, // CONNECT API GATEWAY TO LAMBDA FUNCTION
      proxy: true, // ALLOW ALL ROUTES TO BE HANDLED BY LAMBDA
    });
  }
}
