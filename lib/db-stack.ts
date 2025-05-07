import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class DbStack extends cdk.Stack {
  public readonly movieReviewsTable: dynamodb.Table;
  public readonly translationsTable: dynamodb.Table;
  public readonly favoritesTable: dynamodb.Table;
  public readonly fantasyMoviesTable: dynamodb.Table;
  uploadsBucket: any;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.movieReviewsTable = new dynamodb.Table(this, 'MovieReviewsTable', {
      tableName: 'MovieReviews',
      partitionKey: { name: 'MovieId', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'ReviewId', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.translationsTable = new dynamodb.Table(this, 'ReviewTranslationsTable', {
      tableName: 'ReviewTranslations',
      partitionKey: { name: 'ReviewId', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'Language', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.favoritesTable = new dynamodb.Table(this, 'UserFavoritesTable', {
      tableName: 'UserFavorites',
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'MovieId', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Add this to your DbStack class
    this.fantasyMoviesTable = new dynamodb.Table(this, 'FantasyMoviesTable', {
      tableName: 'FantasyMovies',
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Add a Global Secondary Index for querying by UserId
    this.fantasyMoviesTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Add this to your DbStack class
    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // Restrict this in production
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ]
    });


    new cdk.CfnOutput(this, 'TableName', { value: this.movieReviewsTable.tableName });
    new cdk.CfnOutput(this, 'FavoritesTableName', { value: this.favoritesTable.tableName });
  }
}
