import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class DbStack extends cdk.Stack {
  public readonly movieReviewsTable: dynamodb.Table;
  public readonly translationsTable: dynamodb.Table;
  public readonly favoritesTable: dynamodb.Table;
  public readonly fantasyMoviesTable: dynamodb.Table;
  public readonly playlistsTable: dynamodb.Table;
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

    this.fantasyMoviesTable = new dynamodb.Table(this, 'FantasyMoviesTable', {
      tableName: 'FantasyMovies',
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.fantasyMoviesTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });


    this.playlistsTable = new dynamodb.Table(this, 'PlaylistsTable', {
      tableName: 'Playlists',
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.playlistsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ]
    });

    new cdk.CfnOutput(this, 'TableName', { value: this.movieReviewsTable.tableName });
    new cdk.CfnOutput(this, 'FavoritesTableName', { value: this.favoritesTable.tableName });
  }
}
