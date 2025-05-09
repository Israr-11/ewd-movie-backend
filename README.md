---
## Enterprise Web Development module - Serverless REST Assignment.
---

**Name:** Israr Ahmed

**Demo:** [View Demo](https://drive.google.com/file/d/1zBtpBMvAtRDfT8diadD1rCjNLs9FUCYt/view?usp=sharing)

---

## Overview

A serverless movie backend API built with AWS CDK and TypeScript, enabling users to register, log in, create, update, retrieve, and translate movie reviews. The application also includes features for managing favorite movies, creating fantasy movies with custom casts, organizing movies into playlists, and uploading media to S3.


### **Movie Review Management**
- Get reviews by user ID
- Add new reviews with authorization
- Update existing reviews with authorization
- Translate reviews to different languages

### **User Features**
- Manage favorite movies with custom ordering
- Create fantasy movies with custom cast members
- Upload movie posters to S3 using presigned URLs
- Create and manage movie playlists

### **Security & Authorization**
- Cognito-based user authentication
- User-specific content management
- Protected routes with JWT validation
- S3 presigned URLs for secure file uploads

### **Architecture**
The project leverages several AWS services:
- **AWS Lambda** - Serverless compute for review operations.
- **API Gateway** - RESTful API endpoints.
- **DynamoDB** - Review and translation data persistence.
- **Amazon S3** - Storage for movie posters and other media.
- **Cognito** - User authentication and authorization.

---

## App API Endpoints

### **Authentication Endpoints**
- `POST /auth/register` - User registration.
- `POST /auth/login` - User login.
- `POST /auth/logout` - User logout.

### **Movie Review Endpoints**
- `GET /movies/reviews/?userId=123` - Get reviews filtered by user ID
- `POST /movies/reviews` - Add new review (authenticated).
- `PUT /movies/{movieId}/reviews/{reviewId}` - Update review (authenticated).
- `GET /reviews/{reviewId}/{movieId}/translation?language=es` - Get translated review.


### **Favorites Endpoints**

- `POST /api/favorites`  
  Add a movie to favorites (**Authenticated**)

- `GET /api/favorites`  
  Get the authenticated user's favorite movies (**Authenticated**)

- `DELETE /api/favorites/{movieId}`  
  Remove a movie from favorites (**Authenticated**)

- `PUT /api/favorites/reorder`  
  Reorder favorite movies (**Authenticated**)


### **Fantasy Movies Endpoints**

- `POST /api/fantasy-movies`  
  Create a new fantasy movie (**Authenticated**)

- `GET /api/fantasy-movies`  
  Retrieve all fantasy movies created by the authenticated user (**Authenticated**)

- `DELETE /api/fantasy-movies/{id}`  
  Delete a fantasy movie (**Authenticated**)

- `POST /api/fantasy-movies/{id}/cast`  
  Add a cast member to a fantasy movie (**Authenticated**)

- `POST /api/uploads/presigned-url`  
  Get a pre-signed URL to securely upload a movie poster to S3 (**Authenticated**)

### **Playlist Endpoints**

- `POST /api/playlists`  
  Create a new movie playlist (**Authenticated**)

- `GET /api/playlists`  
  Get the authenticated user's playlists (**Authenticated**)

- `DELETE /api/playlists/{id}`  
  Delete a playlist (**Authenticated**)

- `POST /api/playlists/{id}/movies`  
  Add a movie to a specific playlist (**Authenticated**)

- `DELETE /api/playlists/{id}/movies/{movieId}`  
  Remove a movie from a playlist (**Authenticated**)

---


## Features

### **Translation Persistence**

I have implemented translation persistence, which caches translations to avoid repeated AWS translation requests. Translations are stored in the database in a new Table named ReviewTranslations containing the movie and review IDs of the Review Table. This way, future translation requests are served directly from the database instead of making repeated API calls to AWS.

### **Media Upload with S3**

The application supports uploading movie posters and other media to Amazon S3. I've implemented a secure upload mechanism using presigned URLs, which allows users to upload files directly to S3 without exposing AWS credentials. The S3 bucket is configured with CORS to allow uploads from the frontend application.

### **Fantasy Movies with Custom Cast**

Users can create their own fantasy movies with custom titles, descriptions, and cast members. This feature demonstrates complex data modeling with DynamoDB, including handling nested attributes and reserved keywords.

### **Movie Playlists**

Users can create and manage movie playlists, adding and removing movies as desired. This feature showcases many-to-many relationships in a NoSQL database context.

### **Favorites with auto Ordering**
The favorites feature allows users to maintain a personalized list of favorite movies with auto ordering. Users can add, remove, and it reorder their favorites, demonstrating advanced DynamoDB operations.



**Example of stored translation in the database:**

![image](https://github.com/user-attachments/assets/b77fb3ca-8ee7-45e5-a7d3-b71b3b779e67)

### **Custom L2 Construct**

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
In the **EwdMovieBackendStack**, the **AuthStack** is instantiated, and its resources are used to:

- Configure the Lambda function environment variables
- Set up a Cognito authorizer for protected API endpoints
- Secure specific routes that require authenticatio
---

### **Restricted Review Updates** 

I implemented authorization in the review update route to ensure only the review creator with a valid token can update it. The token is checked in the request headers and verified against the review creator's email. If they match, the review is updated otherwise, an error message is returned.

---

### **API Gateway Validators**

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
