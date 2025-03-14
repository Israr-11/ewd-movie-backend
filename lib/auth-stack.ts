import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export interface AuthStackProps extends cdk.StackProps {
  env?: cdk.Environment;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'MovieReviewUserPool', {
      userPoolName: 'movie-review-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true }
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      },

    });

    this.userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, new lambda.Function(this, 'AutoConfirmFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          event.response.autoConfirmUser = true;
          return event;
        };
      `)
    }));

    this.userPoolClient = new cognito.UserPoolClient(this, 'MovieReviewUserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
        custom: true
      },
      generateSecret: false,
      oAuth: {
        flows: {
          implicitCodeGrant: true,
          authorizationCodeGrant: true
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE
        ]
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO
      ],
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true  
    });
    

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'The ID of the Cognito User Pool'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'The ID of the Cognito User Pool Client'
    });
  }
}
