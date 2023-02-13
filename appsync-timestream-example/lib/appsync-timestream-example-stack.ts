import { Stack, StackProps, Duration, CfnOutput, aws_timestream } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Schedule, Rule } from 'aws-cdk-lib/aws-events'
import { GraphqlApi, HttpDataSource, SchemaFile, AppsyncFunction, Resolver, FunctionRuntime, Code } from 'aws-cdk-lib/aws-appsync';
import { Grant } from 'aws-cdk-lib/aws-iam';
import { join } from 'path';
import { DATABASE_NAME, TABLE_NAME } from './constant';
import { LambdaResolver } from '../lambdaResolver/lambda_stack';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'



export class AppsyncTimestreamExampleStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const region = Stack.of(this).region;
        const cell = 'cell1';
        const api = new GraphqlApi(this, 'timestream', {
            name: 'appsync-timestream-api',
            schema: SchemaFile.fromAsset(join(__dirname + '/../graphql/', 'schema.graphql')),
        });

        const { lambdaTimestreamDataSimulatorFn, lambdaResolverFn } = new LambdaResolver(this, 'appsync');

        const endpoint = `https://query-${cell}.timestream.${region}.amazonaws.com`;
        const ds = new HttpDataSource(api, 'timestream', {
            api,
            description: 'timestream',
            endpoint,
            authorizationConfig: {
                signingRegion: this.region,
                signingServiceName: 'timestream',
            },
        });


        // // AppSync Lambda resolver
        lambdaResolverFn.addEnvironment('TIMESTREAM_DB_NAME', DATABASE_NAME)
        lambdaResolverFn.addEnvironment('TIMESTREAM_TABLE_NAME', TABLE_NAME)

        lambdaTimestreamDataSimulatorFn.addEnvironment('TIMESTREAM_DB_NAME', DATABASE_NAME)
        lambdaTimestreamDataSimulatorFn.addEnvironment('TIMESTREAM_TABLE_NAME', TABLE_NAME)

        Grant.addToPrincipal({ actions: ['timestream:*'], resourceArns: ['*'], grantee: ds });

        const lambdaTimestreamDs = api.addLambdaDataSource('lambdaDatasource', lambdaResolverFn);

        new Resolver(api, 'getSensorDataUsingLambdaResolver', {
            api,
            dataSource: lambdaTimestreamDs,
            typeName: 'Query',
            fieldName: 'getSensorDataUsingLambdaResolver'
        });

        // AppSync JS resolver
        const fn = new AppsyncFunction(api, 'tstimestreamQuery', {
            api,
            name: 'timestreamQuery',
            dataSource: ds,
            runtime: FunctionRuntime.JS_1_0_0,
            code: Code.fromAsset(join(__dirname + '/../jsResolver/src', 'queryTimestream.js')),
        });

        new Resolver(api, 'getSensorDataUsingJsResolver', {
            api,
            typeName: 'Query',
            fieldName: 'getSensorDataUsingJsResolver',
            pipelineConfig: [fn],
            runtime: FunctionRuntime.JS_1_0_0,
            code: Code.fromInline(`
    export function request(){}
    export function response(ctx){return ctx.prev.result}
    `),
        });

        // Schedule lambda function to simulate iot data in timestream table

        new Rule(this, 'addIoTEventRule', {
            schedule: Schedule.rate(Duration.minutes(2)),
            targets: [new LambdaFunction(lambdaTimestreamDataSimulatorFn)],
        })

        // create timestream table

        const cfnTable = new aws_timestream.CfnTable(this, 'MyCfnTable', {
            databaseName: DATABASE_NAME,
            tableName: TABLE_NAME
        })

        new CfnOutput(this, "GraphQLAPIURL", { value: api.graphqlUrl });
        new CfnOutput(this, "GraphQLAPIKey", { value: api.apiKey || '' });
        new CfnOutput(this, "Stack Region", { value: this.region });
        new CfnOutput(this, "Table ARN", { value: cfnTable.attrArn })
    }
}