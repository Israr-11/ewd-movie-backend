# EWD Movie Backend - AWS CDK TypeScript Project

Welcome to the **EWD Movie Backend** project, an API built using **AWS CDK**, **TypeScript**, and **Lambda**. This backend provides a serverless API to manage movie reviews with Lambda functions and API Gateway.

### The project leverages AWS services to provide a scalable, cost-efficient, serverless backend:

- **AWS Lambda** for the backend logic.
- **API Gateway** for routing HTTP requests to Lambda.
- **DynamoDB** to store movie review data.

## Project Structure

- **src/**: Contains the TypeScript source code for the backend logic (Lambda functions).
- **lib/**: Contains the AWS CDK stack definition.
- **bin/**: Contains entry point for deploying the stack.

## Prerequisites

Make sure you have the following installed:

- **Node.js** (v20 or higher recommended)
- **npm** (Node Package Manager)
- **AWS CLI** (configured with appropriate AWS credentials)
- **AWS CDK** (v2.x)

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repo_url>
   cd ewd_movie_backend

2. **Install dependencies:**

   ```bash
   npm install

3. **Build the TypeScript files:**
   Before deploying, you need to build the TypeScript files into JavaScript:

   ```bash
   npm run build

4. **Configure AWS credentials**  
  Ensure that AWS CLI is configured with your AWS account credentials. If not, configure it using:

   ```bash
   aws configure

5. **Deploy on AWS**  
To deploy the code, run the command given below:

   ```bash
   npm run deploy  
  
