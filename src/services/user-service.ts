import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as dotenv from 'dotenv';
import { User } from '../models/user-model';

dotenv.config();

const cognito = new CognitoIdentityServiceProvider();

export class AuthService {
  private userPoolClientId = process.env.USER_POOL_CLIENT_ID || '';

  // Sign up a new user
  async signUp(user: User) {
    const params = {
      ClientId: this.userPoolClientId,
      Username: user.email,
      Password: user.password,
      UserAttributes: [{ Name: 'email', Value: user.email }],
    };

    try {
      const response = await cognito.signUp(params).promise();
      return response;
    } catch (error) {
      throw new Error(`Sign up failed: ${(error as Error).message}`);
    }
  }

  // Sign in user and get JWT token
  async signIn(user: User) {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.userPoolClientId,
      AuthParameters: {
        USERNAME: user.email,
        PASSWORD: user.password,
      },
    };

    try {
      const response = await cognito.initiateAuth(params).promise();
      return response.AuthenticationResult?.IdToken; // Return JWT Token
    } catch (error) {
      throw new Error(`Sign in failed: ${(error as Error).message}`);
    }
  }
}
