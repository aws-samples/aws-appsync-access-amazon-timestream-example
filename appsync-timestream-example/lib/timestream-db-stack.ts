
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_timestream as timestream } from 'aws-cdk-lib';
import { DATABASE_NAME } from './constant';

export class TimestreamDBStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const cfnDatabase = new timestream.CfnDatabase(this, 'MyCfnDatabase', {
            databaseName: DATABASE_NAME
        });

        new CfnOutput(this, "Timestream Database ARN", { value: cfnDatabase.attrArn });
    }
}