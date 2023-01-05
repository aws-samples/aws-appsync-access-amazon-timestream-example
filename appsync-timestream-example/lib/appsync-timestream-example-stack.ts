import { Stack, StackProps, Expiration, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GraphqlApi, SchemaFile, AuthorizationType } from '@aws-cdk/aws-appsync-alpha';
import { LambdaResolver } from '../lambda/lambda_stack';
import { aws_timestream as timestream } from 'aws-cdk-lib';

import { DATABASE_NAME, TABLE_NAME } from './constant';



export class AppsyncTimestreamExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const gqlApi = new GraphqlApi(this, 'Api', {
      name: 'iot-timestream-appsync-api',
      schema: SchemaFile.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            name: 'API Key for AppSyncTimestreamDemo',
            description: 'Public access',
            expires: Expiration.after(Duration.days(365))
          }
        },
      },
      xrayEnabled: true,
    });

    new CfnOutput(this, "GraphQLAPIURL", { value: gqlApi.graphqlUrl });
    new CfnOutput(this, "GraphQLAPIKey", { value: gqlApi.apiKey || '' });
    new CfnOutput(this, "Stack Region", { value: this.region });

    const { lambdaIoTEventsHandlerFn } = new LambdaResolver(this, 'lambdaResolver');

    lambdaIoTEventsHandlerFn.addEnvironment('TIMESTREAM_DB_NAME', DATABASE_NAME)
    lambdaIoTEventsHandlerFn.addEnvironment('TIMESTREAM_TABLE_NAME', TABLE_NAME)

    const lambdaTimestreamDs = gqlApi.addLambdaDataSource('lambdaDatasource', lambdaIoTEventsHandlerFn);

    lambdaTimestreamDs.createResolver('Query', {
      typeName: "Query",
      fieldName: "getSensorData"
    });

    const cfnDatabase = new timestream.CfnDatabase(this, 'MyCfnDatabase', {
      databaseName: DATABASE_NAME
    });

    const cfnTable = new timestream.CfnTable(this, 'MyCfnTable', {
      databaseName: 'wastestream',
      tableName: TABLE_NAME
    })

  }
}
