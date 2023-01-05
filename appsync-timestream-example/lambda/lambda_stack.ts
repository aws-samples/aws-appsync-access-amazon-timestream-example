import { Duration } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs';
const path = require("path");

export class LambdaResolver extends Construct {

    public readonly lambdaIoTEventsHandlerFn: Function

    constructor(scope: Construct, id: string) {
        super(scope, id)

        this.lambdaIoTEventsHandlerFn = new Function(this, 'AppSyncIoTEventsHandler', {
            code: Code.fromAsset(path.join(__dirname, 'src/lambdaDataSource'), { exclude: ['*.ts'] }),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_14_X,
            memorySize: 1024,
            timeout: Duration.seconds(5)
        })
    }
}