// /lib/db-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DbStack extends cdk.Stack {
  public readonly movieReviewsTable: dynamodb.Table;
  public readonly translationsTable: dynamodb.Table;

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
    })
    

    new cdk.CfnOutput(this, 'TableName', { value: this.movieReviewsTable.tableName });
  }
}
