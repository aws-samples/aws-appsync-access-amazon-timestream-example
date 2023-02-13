import { util } from '@aws-appsync/utils'

function request(ctx) {
    const { durationInMinutes } = ctx.args;
    const QUERY_1 = `SELECT * FROM iotstream.sensorevents where time > ago(${durationInMinutes}m)`;

    return {
        method: 'POST',
        params: {
            headers: {
                'content-type': 'application/x-amz-json-1.0',
                'x-amz-target': 'Timestream_20181101.Query',
            },
            body: {
                "ClientToken": util.autoId(),
                "QueryString": QUERY_1
            }
        },
        "resourcePath": '/'
    };
}

/**
 * Returns the result
 * @param ctx the context object holds contextual information about the function invocation.
 */
function response(ctx) {
    if (ctx.result.statusCode !== 200) {
        return util.appendError('none 200 error');
    } else if (ctx.error) {
        return util.appendError(ctx.error.message, ctx.error.type, ctx.result);
    }

    const queryResult = JSON.parse(ctx.result.body)
    return parseQueryResult(queryResult);
}

function parseQueryResult(data) {
    const cols = data.ColumnInfo;
    return data.Rows.map((r) => parseDatum(cols, r));
}
function parseDatum(cols, row) {
    return row.Data.reduce((obj, datum, i) => {
        const key = cols[i].Name.replace('::', '_');
        const colType = cols[i].Type;
        console.log(key, colType, datum.ScalarValue);
        if (datum.NullValue) {
            const _key = cols[i].Name.split('::')[0];
            obj[_key] = null;
            return obj;
        }
        obj[key] = datum.ScalarValue;
        return obj;
    }, {});
} export { request, response };