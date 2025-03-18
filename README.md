---
title: Enterprise Web Development Module - Serverless REST Assignment
---

## Enterprise Web Development Module - Serverless REST Assignment

**Name:** Israr Ahmed

**Demo:** [View Demo](https://drive.google.com/file/d/1lQp4gf_Zq_mOhvR0ZU3Xdr6PiuGAzSlW/view?usp=sharing)

---

## Overview

A serverless movie backend API built with AWS CDK and TypeScript, enabling users to register, log in, create, update, retrieve, and translate movie reviews.

### **Movie Review Management**
- Get movie reviews by filtering by movie ID and reviewer's email.
- Add new reviews with authorization.
- Update existing reviews with authorization.
- Translate reviews to different languages.

### **Security & Authorization**
- Cognito-based user authentication.
- User-specific review management.
- Protected review updates.

### **Architecture**
The project leverages several AWS services:
- **AWS Lambda** - Serverless compute for review operations.
- **API Gateway** - RESTful API endpoints.
- **DynamoDB** - Review and translation data persistence.
- **Amazon Translate** - Review translation capabilities.
- **Cognito** - User authentication and authorization.

---

## App API Endpoints

### **Authentication Endpoints**
- `POST /auth/register` - User registration.
- `POST /auth/login` - User login.
- `POST /auth/logout` - User logout.

### **Movie Review Endpoints**
- `GET /movies/{movieId}/reviews?reviewerName=email@example.com` - Get reviews filtered by reviewer email and movie ID.
- `POST /movies/reviews` - Add new review (authenticated).
- `PUT /movies/{movieId}/reviews/{reviewId}` - Update review (authenticated).
- `GET /movies/{movieId}/reviews/{reviewId}/translate?language=es` - Get translated review.

---

## Features

### **Translation Persistence** (if completed)

I have implemented translation persistence, which caches translations to avoid repeated AWS translation requests. Translations are stored in the database alongside movie and review IDs. This way, future translation requests are served directly from the database instead of making repeated API calls to AWS.

**Example of stored translation in the database:**

![image](https://github.com/user-attachments/assets/b77fb3ca-8ee7-45e5-a7d3-b71b3b779e67)

### **Custom L2 Construct** (if completed)

I implemented a **Custom L2 Construct** called `AuthStack`, which provisions and configures AWS Cognito for user authentication. This construct creates a Cognito User Pool with email sign-in, auto-verification, and a pre-signup Lambda trigger for auto-confirmation. It also sets up a User Pool Client with authentication flows.

#### **AuthStack L2 Construct** provisions the following AWS resources:
- **Amazon Cognito User Pool** - Manages user authentication.
- **Amazon Cognito User Pool Client** - Configured with token validity, OAuth flow, and authentication flows.
- **AWS Lambda Function** - A pre-sign-up Lambda trigger to auto-confirm new users.

#### **Construct Input Props Object**
```typescript
export interface AuthStackProps extends cdk.StackProps {
  env?: cdk.Environment;
}
```

#### **AuthStack Implementation**
```typescript
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
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true
      }
    });

    this.userPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP, 
      new lambda.Function(this, 'AutoConfirmFunction', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            event.response.autoConfirmUser = true;
            return event;
          };
        `)
      })
    );

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true
      }
    });
  }
}
```

---

### **Restricted Review Updates** (if completed)

I implemented authorization in the review update route to ensure only the review creator with a valid token can update it. The token is checked in the request headers and verified against the review creator's email. If they match, the review is updated; otherwise, an error message is returned.

---

### **API Gateway Validators** (if completed)

#### **Implemented API Gateway validators in key endpoints:**

#### **1. `POST /movies/reviews` - Request Body Validation**
Ensures review submissions contain valid data according to a JSON schema.
```typescript
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
```

#### **2. `GET /reviews/{reviewId}/{movieId}/translation` - Request Parameter Validation**
Ensures required path parameters are present when requesting translations.
```typescript
translationPath.addMethod('GET', getReviewsIntegration, {
  requestValidator: new apigateway.RequestValidator(this, 'TranslationValidator', {
    restApi: api,
    validateRequestParameters: true
  })
});
```

#### **3. `POST /auth/register` - Authentication Request Validation**
Ensures registration requests contain a valid email and password.
```typescript
registerResource.addMethod('POST', getReviewsIntegration, {
  requestValidator: new apigateway.RequestValidator(this, 'RegisterValidator', {
    restApi: api,
    validateRequestBody: true
  }),
  requestModels: {
    'application/json': authModel
  }
});
```

#### **4. `POST /auth/login` - Authentication Request Validation**
Ensures login requests contain a valid email and password.
```typescript
loginResource.addMethod('POST', getReviewsIntegration, {
  requestValidator: new apigateway.RequestValidator(this, 'LoginValidator', {
    restApi: api,
    validateRequestBody: true
  }),
  requestModels: {
    'application/json': authModel
  }
});
```
