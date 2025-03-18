## Enterprise Web Development module - Serverless REST Assignment.

__Name:__ Israr Ahmed

__Demo:__ [... ](https://drive.google.com/file/d/1lQp4gf_Zq_mOhvR0ZU3Xdr6PiuGAzSlW/view?usp=sharing)

### Overview.

A serverless movie backend API built with AWS CDK and TypeScript, enabling users to register, login, create, update, retrieve, and translate movie reviews.

#### Movie Review Management
- Get movie reviews by filtering by movie ID and reviewer's email.
- Add new reviews with authorization
- Update existing reviews with authorization
- Translate reviews to different languages

#### Security & Authorization
- Cognito-based user authentication
- User-specific review management
- Protected review updates

#### Architecture
The project leverages several AWS services:
- **AWS Lambda** - Serverless compute for review operations
- **API Gateway** - RESTful API endpoints
- **DynamoDB** - Review and translation data persistence
- **Amazon Translate** - Review translation capabilities
- **Cognito** - User authentication and authorization

### App API endpoints.

#### Authentication Endpoints
+ POST /auth/register   // Registration endpoint
+ POST /auth/login     // Login endpoint
+ POST /auth/logout   // Logout endpoint

#### Movie review Endpoints
+ GET /movies/{movieId}/reviews?reviewerName=email@example.com  // Filter by reviewer email and movie ID
+ POST /movies/reviews                       // Add new review (authenticated)
+ PUT /movies/{movieId}/reviews/{reviewId}   // Update review (authenticated)
+ GET /movies/{movieId}/reviews/{reviewId}/translate?language=es  // Get translated 

### Features.

#### Translation persistence (if completed)


I have completed the feature of translation persistence which is actually the sort of caching of translation so, we don't have to request AWS again and again for translation. So, I am translating, and storing it into the database against the movie and review id. This way next time when there will be request made to translate the review it will not request this from the AWS rather will serve the translation diretly from my Database. Below is the image of translation in my database table.

![alt text](translation_stored_in_database.png)

#### Custom L2 Construct (if completed)

I implemented a Custom L2 Construct called `AuthStack` that provisions and configures AWS Cognito infrastructure for user authentication. This construct creates a Cognito User Pool with email sign-in, auto-verification, and a pre-signup Lambda trigger for auto-confirmation. It also sets up a User Pool Client with various authentication flows.This construct is defined in auth-stack.ts and is integrated into your main stack in ewd_movie_backend-stack.ts.

The custom AuthStack L2 construct provisions the following AWS resources:

+ Amazon Cognito User Pool – A managed authentication service for user sign-in, email auto verification, password policy with minimum length and sign-up.
+ Amazon Cognito User Pool Client – A client app that interacts with the User Pool for authentication. A client app is configured with token validity, OAuth flow, allowed OAuth scopes, and authentication flows.
+ AWS Lambda Function – A pre-sign-up Lambda trigger to auto-confirm new users.

Construct Input Props Object
The construct takes an input props object that extends the standard CDK StackProps
~~~
export interface AuthStackProps extends cdk.StackProps {
  env?: cdk.Environment;
}

~~~
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: AuthStackProps) {
    super(scope, id, props);

    // Create Cognito User Pool with essential security features
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

    // Add auto-confirm Lambda trigger
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

    // Configure User Pool Client with essential settings
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true
      }
    });
    
    // Output resource IDs
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
  }
}

~~~
 

Integration with Main Stack

In the EwdMovieBackendStack, the AuthStack is instantiated and its resources are used to:

+ Configure the Lambda function environment variables
+ Set up a Cognito authorizer for protected API endpoints
+ Secure specific routes that require authentication

#### Restricted review updates (if completed)

I implemented the authorization in the review update route that ensures only those who created, and have token can update the review. This is done by checking the token in the request headers and verifying it against the user's email which is found from the reviews table using the movie or review id. If the email in the token matches the email in the review, the review is updated. If not, an error is returned saying "You are not authorized to update this review.". This ensures that only the user who created the review can update it.

#### API Gateway validators. (if completed)

I have used the API gateway validators to validate the POST, GET,SIGNUP and SIGNIN routes.

   <h2>I implemented API Gateway validators in four key endpoints of my application:</h2>

    <h3>1. <code>POST /movies/reviews</code> - Request Body Validation</h3>
    <p>This validator ensures that review submissions contain valid data according to a JSON schema model.</p>

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

    <p>The validator uses a schema model that requires:</p>
    <ul>
      <li>A <code>review</code> field (string between 1-1000 characters)</li>
      <li>An <code>email</code> field (valid email format)</li>
    </ul>

    ```typescript
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
    ```

    <h3>2. <code>GET /reviews/{reviewId}/{movieId}/translation</code> - Request Parameter Validation</h3>
    <p>This validator ensures that required path parameters are present when requesting translations.</p>

    ```typescript
    translationPath.addMethod('GET', getReviewsIntegration, {
      requestValidator: new apigateway.RequestValidator(this, 'TranslationValidator', {
        restApi: api,
        validateRequestParameters: true
      })
    });
    ```

    <h3>3. <code>POST /auth/register</code> - Authentication Request Validation</h3>
    <p>This validator ensures that registration requests contain a valid email and password.</p>

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

    <h3>4. <code>POST /auth/login</code> - Authentication Request Validation</h3>
    <p>This validator ensures that login requests contain a valid email and password.</p>

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

    <p>Both authentication endpoints use this schema model:</p>

    ```typescript
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
    ```

    <p>These validators help ensure data integrity and improve error handling by rejecting invalid requests before they reach the Lambda function.</p>
  </>



