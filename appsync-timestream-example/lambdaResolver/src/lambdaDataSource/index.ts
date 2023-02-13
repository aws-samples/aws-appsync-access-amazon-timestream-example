import { string } from 'yargs';
import getSensorDataUsingLambdaResolver from './getSensorDataUsingLambdaResolver';

type AppSyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        durationInMinutes: number
    }
}

exports.handler = async (event: AppSyncEvent) => {
    switch (event.info.fieldName) {
        case "getSensorDataUsingLambdaResolver":
            return await getSensorDataUsingLambdaResolver(event.arguments.durationInMinutes);
        default:
            return null;
    }
}