import { Duration } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
const path = require("path");

export class LambdaResolver extends Construct {

    public readonly lambdaResolverFn: Function
    public readonly lambdaTimestreamDataSimulatorFn: Function

    constructor(scope: Construct, id: string) {
        super(scope, id)


        const appsync_simulator_role = new iam.Role(this, 'appsync-ts-lambda-simulator-iam-role', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'IAM role for writing to DB'
        });


        const tb_stmt = `arn:aws:timestream:*:${process.env.CDK_DEFAULT_ACCOUNT}:database/*/table/*`

        appsync_simulator_role.attachInlinePolicy(
            new iam.Policy(this, 'lambda-logs', {
                statements: [
                    new iam.PolicyStatement({
                        actions: ['logs:CreateLogGroup', 'logs:PutLogEvents', 'logs:CreateLogStream'],
                        resources: ['*'],
                    }),
                    new iam.PolicyStatement({
                        actions: ['timestream:WriteRecords', 'timestream:Select'],
                        resources: [tb_stmt],
                    }),
                    new iam.PolicyStatement({
                        actions: ['timestream:DescribeEndpoints'],
                        resources: ['*']
                    })
                ],
            }),
        );

        appsync_simulator_role.assumeRolePolicy?.addStatements(
            new iam.PolicyStatement({
                actions: ['sts:AssumeRole'],
                effect: iam.Effect.ALLOW,
                principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
            }),
        );


        this.lambdaResolverFn = new Function(this, 'AppSyncIoTEventsHandler', {
            code: Code.fromAsset(path.join(__dirname, 'src/lambdaDataSource'), { exclude: ['*.ts'] }),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_14_X,
            memorySize: 1024,
            role: appsync_simulator_role,
            timeout: Duration.seconds(2)
        })


        this.lambdaTimestreamDataSimulatorFn = new Function(this, 'IoTEventsSimulatorHandler', {
            code: Code.fromAsset(path.join(__dirname, 'src/timestream_data_simulator')),
            handler: 'lambda_function.lambda_handler',
            runtime: Runtime.PYTHON_3_9,
            role: appsync_simulator_role,
            memorySize: 1024,
            timeout: Duration.seconds(5)
        })
    }
}