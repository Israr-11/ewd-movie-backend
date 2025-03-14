import { APIGatewayEvent } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  GlobalSignOutCommand
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
        token: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken
      })
    };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error }) };
  }
};

export const signOut = async (event: APIGatewayEvent) => {
  const accessToken = event.headers.Authorization?.split(' ')[1];

  const command = new GlobalSignOutCommand({
    AccessToken: accessToken
  });

  try {
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully logged out' })
    };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error }) };
  }
};
