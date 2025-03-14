import * as cdk from 'aws-cdk-lib';
import { EwdMovieBackendStack } from '../lib/ewd_movie_backend-stack';

const app = new cdk.App();
new EwdMovieBackendStack(app, 'EwdMovieBackendStack', {
});