import { APIGatewayEvent } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  GlobalSignOutCommand,

} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});
const userPoolId = process.env.USER_POOL_ID;
const clientId = process.env.USER_POOL_CLIENT_ID;

export const signUp = async (event: APIGatewayEvent) => {
  const { email, password } = JSON.parse(event.body || '{}');

  const command = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }]
  });

  try {
    await cognitoClient.send(command);
    return { statusCode: 200, body: JSON.stringify({ message: 'User registered successfully' }) };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error }) };
  }
};

export const signIn = async (event: APIGatewayEvent) => {
  const { email, password } = JSON.parse(event.body || '{}');

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  try {
    const response = await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully logged in...',
        token: response.AuthenticationResult?.IdToken,
        accessToken: response.AuthenticationResult?.AccessToken,
        refreshToken: response.AuthenticationResult?.RefreshToken
      })
    };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error }) };
  }
};

export const signOut = async (event: APIGatewayEvent) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Authorization header is missing' })
      };
    }

    const accessToken = authHeader.split(' ')[1];

    if (!accessToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid authorization token format' })
      };
    }

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken
    });

    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully logged out' })
    };
  } catch (error) {
    console.error('SignOut error:', error);

    if (error && typeof error === 'object' && '__type' in error &&
      error.__type === 'NotAuthorizedException') {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Invalid or expired token'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred during sign out',
        error
      })
    };
  }
};
