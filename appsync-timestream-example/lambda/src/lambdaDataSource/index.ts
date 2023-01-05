import { string } from 'yargs';
import getSensorData from './../Resolvers/getSensorData';

type AppSyncEvent = {
    info: {
        fieldName: string
    }
}


exports.handler = async (event: AppSyncEvent) => {
    switch (event.info.fieldName) {
        case "listIoTEvents":
            return await getSensorData('tst', 'stst');
        default:
            return null;
    }
}