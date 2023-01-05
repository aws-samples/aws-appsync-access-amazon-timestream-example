import { string } from 'yargs';
import getSensorData from './../Resolvers/getSensorData';

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
        case "getSensorData":
            return await getSensorData(event.arguments.durationInMinutes);
        default:
            return null;
    }
}