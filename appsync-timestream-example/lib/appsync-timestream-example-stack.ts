import { Stack, StackProps, Expiration, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GraphqlApi, SchemaFile, AuthorizationType } from '@aws-cdk/aws-appsync-alpha';
import { LambdaResolver } from '../lambda/lambda_stack';
import { aws_timestream as timestream } from 'aws-cdk-lib';
import { Schedule, Rule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { DATABASE_NAME, TABLE_NAME } from './constant';
import { NagSuppressions } from 'cdk-nag';


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

    const { lambdaIoTEventsHandlerFn, lambdaTimestreamDataSimulatorFn } = new LambdaResolver(this, 'lambdaResolver');
    const lambdaTimestreamDs = gqlApi.addLambdaDataSource('lambdaDatasource', lambdaIoTEventsHandlerFn);

    lambdaIoTEventsHandlerFn.addEnvironment('TIMESTREAM_DB_NAME', DATABASE_NAME)
    lambdaIoTEventsHandlerFn.addEnvironment('TIMESTREAM_TABLE_NAME', TABLE_NAME)

    lambdaTimestreamDataSimulatorFn.addEnvironment('TIMESTREAM_DB_NAME', DATABASE_NAME)
    lambdaTimestreamDataSimulatorFn.addEnvironment('TIMESTREAM_TABLE_NAME', TABLE_NAME)



    lambdaTimestreamDs.createResolver('Query', {
      typeName: "Query",
      fieldName: "getSensorData"
    });

    new Rule(this, 'addIoTEventRule', {
      schedule: Schedule.rate(Duration.minutes(5)),
      targets: [new LambdaFunction(lambdaTimestreamDataSimulatorFn)],
    })

    const cfnTable = new timestream.CfnTable(this, 'MyCfnTable', {
      databaseName: DATABASE_NAME,
      tableName: TABLE_NAME
    })


    new CfnOutput(this, "Table ARN", { value: cfnTable.attrArn });

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-ASC3',
        reason: 'The GraphQL API does not have request level logging enabled.'
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'The IAM entity contains wildcard permissions and does not have a cdk-nag rule suppression with evidence for those permission.'
      },
      {
        id: 'AwsSolutions-L1',
        reason: 'The non-container Lambda function is not configured to use the latest runtime version.'
      }
    ])


  }
}
