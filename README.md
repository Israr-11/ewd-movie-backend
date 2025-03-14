# EWD Movie Backend - AWS Serverless Movie Review API

A serverless movie backend API built with AWS CDK and TypeScript, enabling users to register, login, create, update, retrieve, and translate movie reviews.

## Key Features
### Movie Review Management
- Get movie reviews by filtering by movie ID and reviewer's email.
- Add new reviews with authorization
- Update existing reviews with authorization
- Translate reviews to different languages

### Security & Authorization
- Cognito-based user authentication
- User-specific review management
- Protected review updates

## Architecture
The project leverages several AWS services:
- **AWS Lambda** - Serverless compute for review operations
- **API Gateway** - RESTful API endpoints
- **DynamoDB** - Review and translation data persistence
- **Amazon Translate** - Review translation capabilities
- **Cognito** - User authentication and authorization

## Authentication Endpoints
```http
POST /auth/register   // Registration endpoint
POST /auth/login     // Login endpoint
POST /auth/logout   // Logout endpoint
```

## Movie review Endpoints
```http
GET /movies/{movieId}/reviews?reviewerName=email@example.com  // Filter by reviewer email and movie ID
POST /movies/reviews                       // Add new review (authenticated)
PUT /movies/{movieId}/reviews/{reviewId}   // Update review (authenticated)
GET /movies/{movieId}/reviews/{reviewId}/translate?language=es  // Get translated review
```

## Prerequisites
- Node.js (v20+)
- AWS CLI (configured)
- AWS CDK v2
- TypeScript knowledge

## Getting Started
### Clone & Install
```sh
git clone <repository-url>
cd ewd-movie-backend
npm install
```

### Build
```sh
npm run build
```

### Deploy
```sh
cdk deploy
```

## Project Structure
```
ewd-movie-backend/
├── src/
│   ├── controllers/
│   │   ├── auth-controller.ts         # Handles authentication
│   │   └── review-controller.ts       # Review management logic
│   ├── models/                        # Interfaces and data model
│   │   ├── review-model.ts
│   │   
│   ├── services/
│   │   ├── review-service.ts          # Review business logic
│   │   ├── translate-service.ts       # Translation handling
│   │   
│   └── index.ts                        # Entry point for the backend
├── lib/
│   ├── auth-stack.ts                  # Authentication infrastructure
│   ├── db-stack.ts                    # Database infrastructure
│   └── ewd_movie_backend-stack.ts     # Main CDK stack
├── bin/
│   └── ewd_movie_backend.ts           # CDK app entry point
├── .gitignore                         # Ignored files
├── .npmignore                         # Ignored npm files
├── cdk.context.json                   # AWS CDK configuration
├── cdk.json                           # CDK deployment configuration
├── jest.config.js                     # Jest testing configuration
├── LICENSE                            # License file
├── package-lock.json                   # Lock file for dependencies
├── package.json                        # Dependencies and scripts
├── README.md                           # Project documentation
├── tsconfig.json                       # TypeScript configuration

```
## Usage Examples

### Registration
```http
POST auth/register

{
  "email": "dummy@user.com",
  "password": "Hello@123"
}
```

### Login
```http
POST auth/login

{
  "email": "dummy@user.com",
  "password": "Hello@123"
}
```

### Logout
```http
POST auth/logout
```

### Get Movie Reviews
```http
# Get reviews by reviewer email and or movie ID

GET /movies/2/reviews?reviewerName=user@example.com
```

### Add Review
```http
POST /movies/reviews

{
  "review": "Great movie!",
  "email": "reviewer@example.com"
}
```

### Update Review
```http
PUT movies/2/reviews/1741885172

{
  "newContent": " movie was not good"
}
```

### Translate Review
```http
GET reviews/1741885172/2/translation?language=es
```


## Security
- Review updates are protected with Cognito authentication
- Users can only modify their reviews
- API endpoints are secured with proper authorization
