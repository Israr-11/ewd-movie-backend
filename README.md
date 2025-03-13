# EWD Movie Backend - AWS Serverless Movie Review API

A robust, serverless movie review management system built with AWS CDK and TypeScript, enabling users to create, retrieve, and translate movie reviews.

## 🚀 Key Features
### Movie Review Management
- Get movie reviews with filtering by reviewer or review ID
- Add new reviews
- Update existing reviews with authorization
- Translate reviews to different languages

### Security & Authorization
- Cognito-based user authentication
- User-specific review management
- Protected review updates

## 🏗 Architecture
The project leverages several AWS services:
- **AWS Lambda** - Serverless compute for review operations
- **API Gateway** - RESTful API endpoints
- **DynamoDB** - Review data persistence
- **Amazon Translate** - Review translation capabilities
- **Cognito** - User authentication and authorization

## 📚 API Endpoints
```http
GET /movies/{movieId}/reviews              // Get all reviews for a movie
GET /movies/{movieId}/reviews?reviewId=1   // Filter by review ID
GET /movies/{movieId}/reviews?reviewerName=email@example.com  // Filter by reviewer
POST /movies/reviews                       // Add new review
PUT /movies/{movieId}/reviews/{reviewId}   // Update review (authenticated)
GET /movies/{movieId}/reviews/{reviewId}/translate?language=es  // Get translated review
```

## 🛠 Prerequisites
- Node.js (v20+)
- AWS CLI (configured)
- AWS CDK v2
- TypeScript knowledge

## 🚦 Getting Started
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

## 🏗 Project Structure
```
ewd-movie-backend/
├── src/
│   ├── controllers/
│   │   └── review-controller.ts    # Review management logic
│   ├── services/
│   │   ├── review-service.ts       # Review business logic
│   │   └── translate-service.ts    # Translation handling
├── lib/
│   └── stack-definition.ts         # CDK infrastructure
└── bin/
    └── app.ts                      # CDK app entry point
```

## 💡 Usage Examples
### Get Movie Reviews
```http
// Get all reviews for movie ID 123
GET /movies/123/reviews

// Get specific review
GET /movies/123/reviews?reviewId=456

// Get reviews by reviewer
GET /movies/123/reviews?reviewerName=user@example.com
```

### Add Review
```http
POST /movies/reviews
{
  "review": "Great movie!",
  "email": "reviewer@example.com"
}
```

### Translate Review
```http
// Translate review 456 for movie 123 to Spanish
GET /movies/123/reviews/456/translate?language=es
```

## 🔐 Security
- Review updates are protected with Cognito authentication
- Users can only modify their own reviews
- API endpoints are secured with proper authorization

## 📝 License
MIT
